"""
QLoRA Fine-tuning Trainer Module
"""
import os
import json
import torch
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional
from dataclasses import dataclass

from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    TrainingArguments,
    Trainer,
    DataCollatorForLanguageModeling,
)
from peft import (
    LoraConfig,
    get_peft_model,
)

try:
    from peft import prepare_model_for_kbit_training
    KBIT_TRAINING_AVAILABLE = True
except ImportError:
    KBIT_TRAINING_AVAILABLE = False
from datasets import load_dataset
import transformers

logger = logging.getLogger(__name__)


@dataclass
class TrainingConfig:
    """Training configuration"""
    model_name: str
    dataset_path: str
    output_dir: str
    num_epochs: int = 3
    batch_size: int = 4
    learning_rate: float = 2e-4
    lora_r: int = 8
    lora_alpha: int = 16
    lora_dropout: float = 0.05
    max_seq_length: int = 512
    gradient_accumulation_steps: int = 4
    warmup_steps: int = 100
    logging_steps: int = 10
    save_steps: int = 100


class QLoRATrainer:
    """QLoRA Fine-tuning Trainer"""

    def __init__(self, config: TrainingConfig, job_id: str):
        self.config = config
        self.job_id = job_id
        self.model = None
        self.tokenizer = None
        self.trainer = None
        self.logs_dir = Path("./training_jobs/logs")
        self.checkpoints_dir = Path("./training_jobs/checkpoints")
        self.logs_dir.mkdir(parents=True, exist_ok=True)
        self.checkpoints_dir.mkdir(parents=True, exist_ok=True)

    def log_message(self, level: str, message: str):
        """Log a training message"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        log_entry = {
            "timestamp": timestamp,
            "level": level,
            "message": message
        }

        # Append to job log file
        log_file = self.logs_dir / f"{self.job_id}.json"
        logs = []
        if log_file.exists():
            with open(log_file, 'r') as f:
                logs = json.load(f)
        logs.append(log_entry)
        with open(log_file, 'w') as f:
            json.dump(logs, f, indent=2)

        # Also log to Python logger
        if level == "INFO":
            logger.info(f"[{self.job_id}] {message}")
        elif level == "ERROR":
            logger.error(f"[{self.job_id}] {message}")
        elif level == "WARNING":
            logger.warning(f"[{self.job_id}] {message}")

    def prepare_model(self):
        """Prepare model with QLoRA (if CUDA available) or regular LoRA"""
        self.log_message("INFO", "Loading tokenizer...")
        self.tokenizer = AutoTokenizer.from_pretrained(
            self.config.model_name,
            trust_remote_code=True
        )
        self.tokenizer.pad_token = self.tokenizer.eos_token
        self.tokenizer.padding_side = "right"

        # Check if CUDA is available
        use_quantization = torch.cuda.is_available()

        if use_quantization:
            self.log_message("INFO", "CUDA detected - Loading model with 4-bit quantization (QLoRA)...")
            # Load model with 4-bit quantization for GPU
            model = AutoModelForCausalLM.from_pretrained(
                self.config.model_name,
                load_in_4bit=True,
                torch_dtype=torch.float16,
                device_map="auto",
                trust_remote_code=True,
            )
            self.log_message("INFO", "Preparing model for k-bit training...")
            model = prepare_model_for_kbit_training(model)
        else:
            self.log_message("INFO", "No CUDA detected - Loading model without quantization (regular LoRA)...")
            # Load model without quantization for CPU/MPS (Mac)
            device = "mps" if torch.backends.mps.is_available() else "cpu"
            self.log_message("INFO", f"Using device: {device}")

            model = AutoModelForCausalLM.from_pretrained(
                self.config.model_name,
                torch_dtype=torch.float32,  # Use float32 for CPU/MPS
                device_map=device,
                trust_remote_code=True,
            )

        self.log_message("INFO", f"Applying LoRA with r={self.config.lora_r}, alpha={self.config.lora_alpha}")
        # Configure LoRA
        lora_config = LoraConfig(
            r=self.config.lora_r,
            lora_alpha=self.config.lora_alpha,
            target_modules=["q_proj", "v_proj", "k_proj", "o_proj"],
            lora_dropout=self.config.lora_dropout,
            bias="none",
            task_type="CAUSAL_LM"
        )

        self.model = get_peft_model(model, lora_config)
        self.model.print_trainable_parameters()
        self.log_message("INFO", "Model prepared successfully")

    def prepare_dataset(self):
        """Load and prepare dataset"""
        self.log_message("INFO", f"Loading dataset from {self.config.dataset_path}")

        # Check if dataset_path is a local dataset name (from uploaded datasets)
        datasets_meta_file = Path("./uploaded_datasets/datasets_meta.json")
        if datasets_meta_file.exists():
            with open(datasets_meta_file, 'r') as f:
                datasets_meta = json.load(f)

            # Find dataset by name
            local_dataset = None
            for ds in datasets_meta:
                if ds.get("name") == self.config.dataset_path:
                    local_dataset = ds
                    break

            if local_dataset:
                # Dataset found in local datasets - extract content and save to temp file
                self.log_message("INFO", f"Found local dataset: {local_dataset['name']}")
                dataset_content = json.loads(local_dataset["content"])

                # Save to temporary file
                temp_dataset_path = Path(f"./uploaded_datasets/{local_dataset['id']}.json")
                with open(temp_dataset_path, 'w') as f:
                    json.dump(dataset_content, f, ensure_ascii=False, indent=2)

                self.log_message("INFO", f"Created temporary dataset file: {temp_dataset_path}")
                dataset = load_dataset('json', data_files=str(temp_dataset_path))
            else:
                # Not a local dataset, continue with normal flow
                dataset_path = Path(self.config.dataset_path)

                if dataset_path.is_file():
                    # Load from file
                    if dataset_path.suffix == '.json':
                        dataset = load_dataset('json', data_files=str(dataset_path))
                    elif dataset_path.suffix == '.csv':
                        dataset = load_dataset('csv', data_files=str(dataset_path))
                    else:
                        raise ValueError(f"Unsupported file format: {dataset_path.suffix}")
                else:
                    # Try loading as HuggingFace dataset name
                    dataset = load_dataset(self.config.dataset_path)
        else:
            # datasets_meta.json doesn't exist, use original logic
            dataset_path = Path(self.config.dataset_path)

            if dataset_path.is_file():
                # Load from file
                if dataset_path.suffix == '.json':
                    dataset = load_dataset('json', data_files=str(dataset_path))
                elif dataset_path.suffix == '.csv':
                    dataset = load_dataset('csv', data_files=str(dataset_path))
                else:
                    raise ValueError(f"Unsupported file format: {dataset_path.suffix}")
            else:
                # Try loading as HuggingFace dataset name
                dataset = load_dataset(self.config.dataset_path)

        self.log_message("INFO", f"Dataset loaded: {len(dataset['train'])} examples")

        # Tokenize dataset
        def tokenize_function(examples):
            # Check what fields are available in the dataset
            if 'text' in examples:
                # Dataset has a 'text' field - use it directly
                texts = examples['text']
            elif 'instruction' in examples:
                # Dataset has instruction format - combine fields
                texts = []
                for i in range(len(examples['instruction'])):
                    instruction = examples['instruction'][i]
                    input_text = examples.get('input', [''] * len(examples['instruction']))[i]
                    output = examples.get('output', [''] * len(examples['instruction']))[i]

                    # Format as instruction-following format
                    if input_text:
                        text = f"### Instruction:\n{instruction}\n\n### Input:\n{input_text}\n\n### Response:\n{output}"
                    else:
                        text = f"### Instruction:\n{instruction}\n\n### Response:\n{output}"
                    texts.append(text)
            else:
                # Use first available field
                first_field = list(examples.keys())[0]
                texts = examples[first_field]

            return self.tokenizer(
                texts,
                truncation=True,
                max_length=self.config.max_seq_length,
                padding="max_length"
            )

        self.log_message("INFO", "Tokenizing dataset...")
        tokenized_dataset = dataset.map(
            tokenize_function,
            batched=True,
            remove_columns=dataset["train"].column_names
        )

        return tokenized_dataset["train"]

    def train(self):
        """Start training"""
        try:
            self.log_message("INFO", "Initializing QLoRA training...")

            # Prepare model
            self.prepare_model()

            # Prepare dataset
            train_dataset = self.prepare_dataset()

            # Training arguments - adaptive based on available hardware
            use_cuda = torch.cuda.is_available()

            # Configure training args based on hardware
            if use_cuda:
                # GPU training with fp16 and 8-bit optimizer
                training_args = TrainingArguments(
                    output_dir=self.config.output_dir,
                    num_train_epochs=self.config.num_epochs,
                    per_device_train_batch_size=self.config.batch_size,
                    gradient_accumulation_steps=self.config.gradient_accumulation_steps,
                    learning_rate=self.config.learning_rate,
                    warmup_steps=self.config.warmup_steps,
                    logging_steps=self.config.logging_steps,
                    save_steps=self.config.save_steps,
                    save_total_limit=3,
                    fp16=True,
                    optim="paged_adamw_8bit",
                    logging_dir=f"{self.config.output_dir}/logs",
                    report_to=["none"],  # Disable wandb/tensorboard
                )
            else:
                # CPU/MPS training without fp16 and with standard AdamW
                self.log_message("INFO", "Using CPU/MPS training configuration (no fp16, standard AdamW)")
                training_args = TrainingArguments(
                    output_dir=self.config.output_dir,
                    num_train_epochs=self.config.num_epochs,
                    per_device_train_batch_size=self.config.batch_size,
                    gradient_accumulation_steps=self.config.gradient_accumulation_steps,
                    learning_rate=self.config.learning_rate,
                    warmup_steps=self.config.warmup_steps,
                    logging_steps=self.config.logging_steps,
                    save_steps=self.config.save_steps,
                    save_total_limit=3,
                    fp16=False,  # Disable fp16 for CPU/MPS
                    optim="adamw_torch",  # Use standard AdamW for CPU/MPS
                    logging_dir=f"{self.config.output_dir}/logs",
                    report_to=["none"],  # Disable wandb/tensorboard
                )

            # Data collator
            data_collator = DataCollatorForLanguageModeling(
                tokenizer=self.tokenizer,
                mlm=False
            )

            # Create trainer
            self.trainer = Trainer(
                model=self.model,
                args=training_args,
                train_dataset=train_dataset,
                data_collator=data_collator,
            )

            self.log_message("INFO", f"Starting training - Epochs: {self.config.num_epochs}")

            # Train
            self.trainer.train()

            self.log_message("INFO", "Training completed successfully")

            # Save final model
            final_output_dir = Path(self.config.output_dir) / "final_model"
            self.log_message("INFO", f"Saving final model to {final_output_dir}")
            self.trainer.save_model(str(final_output_dir))

            return True

        except Exception as e:
            self.log_message("ERROR", f"Training failed: {str(e)}")
            logger.exception(f"Training error for job {self.job_id}")
            return False


def start_training_job(job_id: str, config: Dict[str, Any]) -> bool:
    """
    Start a training job

    Args:
        job_id: Job identifier
        config: Training configuration dictionary

    Returns:
        True if training started successfully, False otherwise
    """
    try:
        # Create training config
        training_config = TrainingConfig(
            model_name=config.get("model", "TinyLlama/TinyLlama-1.1B-Chat-v1.0"),
            dataset_path=config.get("dataset", "timdettmers/openassistant-guanaco"),
            output_dir=f"./training_jobs/{job_id}",
            num_epochs=config.get("epochs", 3),
            batch_size=config.get("batch_size", 4),
            learning_rate=config.get("learning_rate", 2e-4),
            lora_r=config.get("lora_r", 8),
            lora_alpha=config.get("lora_alpha", 16),
        )

        # Create trainer
        trainer = QLoRATrainer(training_config, job_id)

        # Start training
        success = trainer.train()

        return success

    except Exception as e:
        logger.exception(f"Failed to start training job {job_id}")
        return False
