from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional
from datetime import datetime
from pathlib import Path
import logging
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

router = APIRouter()
logger = logging.getLogger(__name__)

# Model cache to avoid reloading models
model_cache: Dict[str, tuple] = {}  # {model_id: (model, tokenizer)}

# Downloaded models directory
MODELS_DIR = Path("./downloaded_models")
# Fine-tuned models directory
FINETUNED_MODELS_DIR = Path("./training_jobs")


def load_model(model_id: str, model_type: str):
    """
    Load model and tokenizer from cache or disk
    """
    cache_key = f"{model_type}:{model_id}"

    # Check cache first
    if cache_key in model_cache:
        logger.info(f"Loading model from cache: {cache_key}")
        return model_cache[cache_key]

    try:
        if model_type == "base":
            # For base models, load from downloaded_models directory
            model_path = MODELS_DIR / model_id.replace("/", "_")

            if not model_path.exists():
                raise HTTPException(
                    status_code=404,
                    detail=f"Model not found. Please download the model first: {model_id}"
                )

            logger.info(f"Loading base model from: {model_path}")
            tokenizer = AutoTokenizer.from_pretrained(str(model_path))
            model = AutoModelForCausalLM.from_pretrained(
                str(model_path),
                dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
                device_map="auto" if torch.cuda.is_available() else None,
                low_cpu_mem_usage=True
            )

        elif model_type == "fine-tuned":
            # For fine-tuned models, load from training_jobs/{job_id}/final_model
            model_path = FINETUNED_MODELS_DIR / model_id / "final_model"

            if not model_path.exists():
                raise HTTPException(
                    status_code=404,
                    detail=f"Fine-tuned model not found: {model_id}. Model path: {model_path}"
                )

            logger.info(f"Loading fine-tuned model from: {model_path}")

            # Load tokenizer and model from the fine-tuned model directory
            tokenizer = AutoTokenizer.from_pretrained(str(model_path))
            model = AutoModelForCausalLM.from_pretrained(
                str(model_path),
                dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
                device_map="auto" if torch.cuda.is_available() else None,
                low_cpu_mem_usage=True
            )
        else:
            raise HTTPException(status_code=400, detail=f"Unknown model type: {model_type}")

        # Cache the loaded model
        model_cache[cache_key] = (model, tokenizer)
        logger.info(f"Model loaded and cached: {cache_key}")

        return model, tokenizer

    except Exception as e:
        logger.error(f"Error loading model {cache_key}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to load model: {str(e)}")


def generate_response(model, tokenizer, message: str, history: List[Dict] = None, max_new_tokens: int = 256) -> str:
    """
    Generate response using the loaded model
    """
    try:
        # Build conversation context using proper chat format
        messages = []

        # Add history messages
        if history:
            for msg in history[-5:]:  # Use last 5 messages for context
                role = msg.get("role")
                content = msg.get("content")
                if role and content:
                    messages.append({"role": role, "content": content})

        # Add current user message
        messages.append({"role": "user", "content": message})

        # Use chat template if available, otherwise fall back to simple format
        if hasattr(tokenizer, 'apply_chat_template') and tokenizer.chat_template is not None:
            prompt = tokenizer.apply_chat_template(
                messages,
                tokenize=False,
                add_generation_prompt=True
            )
        else:
            # Fallback for models without chat template
            conversation = []
            for msg in messages:
                conversation.append(f"{msg['role']}: {msg['content']}")
            conversation.append("assistant:")
            prompt = "\n".join(conversation)

        # Tokenize input
        inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=2048)

        # Move to same device as model
        if hasattr(model, 'device'):
            inputs = {k: v.to(model.device) for k, v in inputs.items()}

        # Generate response
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=max_new_tokens,
                do_sample=True,
                temperature=0.7,
                top_p=0.9,
                top_k=50,
                repetition_penalty=1.2,
                no_repeat_ngram_size=3,
                pad_token_id=tokenizer.eos_token_id,
                eos_token_id=tokenizer.eos_token_id
            )

        # Decode only the newly generated tokens
        # Get the input length to extract only new tokens
        input_length = inputs['input_ids'].shape[1]
        generated_tokens = outputs[0][input_length:]
        response_text = tokenizer.decode(generated_tokens, skip_special_tokens=True)

        logger.info(f"[Playground] Input tokens: {input_length}")
        logger.info(f"[Playground] Generated tokens: {len(generated_tokens)}")
        logger.info(f"[Playground] Raw response: {response_text[:200]}...")

        # Clean up special tokens that might not be in skip_special_tokens
        # Remove <think> and </think> tags
        import re
        response_text = re.sub(r'<think>.*?</think>', '', response_text, flags=re.DOTALL)

        # Remove any other common special tokens
        response_text = re.sub(r'<\|.*?\|>', '', response_text)

        # Clean up extra whitespace
        response_text = ' '.join(response_text.split())
        response_text = response_text.strip()

        logger.info(f"[Playground] Cleaned response length: {len(response_text)}")
        logger.info(f"[Playground] Cleaned response: {response_text[:200]}...")

        return response_text

    except Exception as e:
        logger.error(f"Error generating response: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate response: {str(e)}")


@router.post("/chat")
async def chat_with_model(request: Dict[str, Any]):
    """
    Chat with a model (base or fine-tuned)

    Request body:
    - model_id: ID of the model to use
                Format: "base:{model_id}" for base models
                        "ft:{job_id}" for fine-tuned models
    - message: User's message
    - history: Previous conversation history (list of messages)
    """
    model_id = request.get("model_id")
    message = request.get("message")
    history = request.get("history", [])

    logger.info(f"[Playground] Chat request received - model_id: {model_id}, message length: {len(message) if message else 0}")

    if not model_id:
        raise HTTPException(status_code=400, detail="model_id is required")

    if not message:
        raise HTTPException(status_code=400, detail="message is required")

    # Parse model type and ID
    model_type = "unknown"
    actual_model_id = model_id

    if model_id.startswith("base:"):
        model_type = "base"
        actual_model_id = model_id[5:]  # Remove "base:" prefix
    elif model_id.startswith("ft:"):
        model_type = "fine-tuned"
        actual_model_id = model_id[3:]  # Remove "ft:" prefix
    else:
        raise HTTPException(status_code=400, detail="Invalid model_id format. Use 'base:' or 'ft:' prefix")

    logger.info(f"[Playground] Parsed - type: {model_type}, actual_model_id: {actual_model_id}")

    # Load model and tokenizer
    logger.info(f"[Playground] Loading model...")
    model, tokenizer = load_model(actual_model_id, model_type)
    logger.info(f"[Playground] Model loaded successfully")

    # Generate response
    logger.info(f"[Playground] Generating response...")
    response_text = generate_response(model, tokenizer, message, history)
    logger.info(f"[Playground] Response generated: {len(response_text)} characters")

    return {
        "status": "success",
        "response": response_text,
        "model_id": model_id,
        "model_type": model_type,
        "timestamp": datetime.now().isoformat()
    }


@router.get("/models")
async def list_available_models():
    """
    List all available fine-tuned models for inference

    This endpoint returns models with status 'completed'
    """
    # This could be integrated with the jobs endpoint
    # For now, return empty list as models are fetched from /api/jobs
    return {
        "models": [],
        "message": "Use /api/jobs endpoint to get completed models"
    }
