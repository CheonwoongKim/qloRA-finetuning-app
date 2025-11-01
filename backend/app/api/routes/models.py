from fastapi import APIRouter, HTTPException, Query
from huggingface_hub import HfApi, ModelCard
from app.models.schemas import ModelInfo, ModelSearchResponse, ModelDetailResponse
from typing import Optional
import logging

router = APIRouter()
hf_api = HfApi()

logger = logging.getLogger(__name__)

@router.get("/recommended/small-language-models")
async def get_recommended_slms(token: Optional[str] = Query(None, description="Hugging Face API token")):
    """
    Get recommended Small Language Models suitable for fine-tuning
    """
    # Create API instance with token if provided
    api = HfApi(token=token) if token else hf_api
    recommended_models = [
        "TinyLlama/TinyLlama-1.1B-Chat-v1.0",
        "microsoft/phi-2",
        "google/gemma-2b",
        "Qwen/Qwen1.5-1.8B",
        "meta-llama/Llama-3.2-1B",
        "mistralai/Mistral-7B-v0.1"
    ]

    try:
        model_list = []
        for model_id in recommended_models:
            try:
                model_info = api.model_info(model_id)
                model_list.append(ModelInfo(
                    id=model_info.id,
                    name=model_info.id.split("/")[-1] if "/" in model_info.id else model_info.id,
                    author=model_info.author or model_info.id.split("/")[0] if "/" in model_info.id else "unknown",
                    downloads=model_info.downloads or 0,
                    likes=model_info.likes or 0,
                    tags=model_info.tags or [],
                    pipeline_tag=model_info.pipeline_tag,
                    last_modified=model_info.lastModified,
                ))
            except Exception as e:
                logger.warning(f"Failed to get info for {model_id}: {e}")
                continue

        return ModelSearchResponse(
            models=model_list,
            total=len(model_list)
        )

    except Exception as e:
        logger.error(f"Error getting recommended models: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get recommended models: {str(e)}")

@router.get("/search", response_model=ModelSearchResponse)
async def search_models(
    query: Optional[str] = Query(None, description="Search query"),
    task: Optional[str] = Query(None, description="Filter by task (e.g., text-generation)"),
    sort: str = Query("downloads", description="Sort by: downloads, likes, trending"),
    limit: int = Query(20, ge=1, le=100, description="Number of results"),
    token: Optional[str] = Query(None, description="Hugging Face API token"),
):
    """
    Search for models on Hugging Face Hub
    """
    try:
        # Create API instance with token if provided
        api = HfApi(token=token) if token else hf_api

        # 허깅페이스 허브에서 모델 검색
        models = api.list_models(
            search=query,
            task=task or "text-generation",
            sort=sort,
            direction=-1,
            limit=limit,
            cardData=True
        )

        model_list = []
        for model in models:
            try:
                model_info = ModelInfo(
                    id=model.id,
                    name=model.id.split("/")[-1] if "/" in model.id else model.id,
                    author=model.author or model.id.split("/")[0] if "/" in model.id else "unknown",
                    downloads=model.downloads or 0,
                    likes=model.likes or 0,
                    tags=model.tags or [],
                    pipeline_tag=model.pipeline_tag,
                    last_modified=model.lastModified,
                    description=getattr(model.cardData, "model-index", None) if hasattr(model, "cardData") else None,
                    size_gb=None  # 실제 구현시 model config에서 가져오기
                )
                model_list.append(model_info)
            except Exception as e:
                logger.warning(f"Failed to process model {model.id}: {e}")
                continue

        return ModelSearchResponse(
            models=model_list,
            total=len(model_list)
        )

    except Exception as e:
        logger.error(f"Error searching models: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to search models: {str(e)}")

@router.get("/{model_id:path}", response_model=ModelDetailResponse)
async def get_model_detail(model_id: str, token: Optional[str] = Query(None, description="Hugging Face API token")):
    """
    Get detailed information about a specific model
    """
    try:
        # Create API instance with token if provided
        api = HfApi(token=token) if token else hf_api

        # 모델 정보 가져오기
        model_info = api.model_info(model_id, files_metadata=True)

        # 모델 카드 가져오기
        try:
            model_card = ModelCard.load(model_id)
            card_text = model_card.text if model_card else None
        except:
            card_text = None

        # 모델 config 가져오기
        config = None
        try:
            # config.json이 있으면 가져오기
            config_info = next((f for f in model_info.siblings if f.rfilename == "config.json"), None)
            if config_info:
                config = {"available": True}
        except:
            pass

        return ModelDetailResponse(
            id=model_info.id,
            name=model_info.id.split("/")[-1] if "/" in model_info.id else model_info.id,
            author=model_info.author or model_info.id.split("/")[0] if "/" in model_info.id else "unknown",
            downloads=model_info.downloads or 0,
            likes=model_info.likes or 0,
            tags=model_info.tags or [],
            pipeline_tag=model_info.pipeline_tag,
            last_modified=model_info.lastModified,
            description=None,
            model_card=card_text,
            config=config,
            size_gb=None
        )

    except Exception as e:
        logger.error(f"Error getting model detail for {model_id}: {e}")
        raise HTTPException(status_code=404, detail=f"Model not found: {str(e)}")
