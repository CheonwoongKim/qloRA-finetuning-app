from fastapi import APIRouter, HTTPException, BackgroundTasks
from huggingface_hub import snapshot_download
from pydantic import BaseModel, ConfigDict
from typing import Optional
import logging
import os
from pathlib import Path
import asyncio
from concurrent.futures import ThreadPoolExecutor

router = APIRouter()
logger = logging.getLogger(__name__)

# 다운로드 디렉토리
MODELS_DIR = Path("./downloaded_models")
MODELS_DIR.mkdir(exist_ok=True)

class DownloadRequest(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    model_id: str
    revision: Optional[str] = "main"
    token: Optional[str] = None

class DownloadResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    status: str
    message: str
    model_id: str
    local_path: Optional[str] = None

download_status = {}
executor = ThreadPoolExecutor(max_workers=3)

@router.post("/start", response_model=DownloadResponse)
async def start_download(request: DownloadRequest, background_tasks: BackgroundTasks):
    """
    Start downloading a model from Hugging Face Hub
    """
    model_id = request.model_id

    if model_id in download_status and download_status[model_id]["status"] == "downloading":
        return DownloadResponse(
            status="already_downloading",
            message=f"Model {model_id} is already being downloaded",
            model_id=model_id
        )

    # 백그라운드에서 다운로드 시작
    download_status[model_id] = {"status": "downloading", "progress": 0}
    background_tasks.add_task(download_model_async, model_id, request.revision, request.token)

    return DownloadResponse(
        status="started",
        message=f"Download started for {model_id}",
        model_id=model_id
    )

def download_model_sync(model_id: str, revision: str = "main", token: Optional[str] = None):
    """
    Synchronous download function to run in thread pool
    """
    try:
        logger.info(f"Starting download for {model_id}")

        # Convert empty string to None for token
        auth_token = token if token and token.strip() else None
        if auth_token:
            logger.info(f"Using authentication token for {model_id}")
        else:
            logger.info(f"Downloading {model_id} without authentication token")

        local_path = snapshot_download(
            repo_id=model_id,
            revision=revision,
            cache_dir=str(MODELS_DIR),
            local_dir=str(MODELS_DIR / model_id.replace("/", "_")),
            local_dir_use_symlinks=False,
            token=auth_token
        )

        download_status[model_id] = {
            "status": "completed",
            "progress": 100,
            "local_path": str(local_path)
        }
        logger.info(f"Download completed for {model_id}")

    except Exception as e:
        error_msg = str(e)
        logger.error(f"Download failed for {model_id}: {error_msg}")

        # Check if it's a gated model error
        if "401" in error_msg or "Cannot access gated repo" in error_msg or "restricted" in error_msg.lower():
            error_msg = "This model requires authentication. Please add your Hugging Face token in Settings."

        download_status[model_id] = {
            "status": "failed",
            "progress": 0,
            "error": error_msg
        }

async def download_model_async(model_id: str, revision: str = "main", token: Optional[str] = None):
    """
    Async wrapper for download_model_sync
    """
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(executor, download_model_sync, model_id, revision, token)

@router.get("/status/{model_id:path}")
async def get_download_status(model_id: str):
    """
    Get download status for a specific model
    """
    status = download_status.get(model_id, {"status": "not_started", "progress": 0})
    return {
        "model_id": model_id,
        **status
    }

@router.get("/list")
async def list_downloaded_models():
    """
    List all downloaded models
    """
    downloaded = []
    if MODELS_DIR.exists():
        for model_dir in MODELS_DIR.iterdir():
            if model_dir.is_dir():
                # Calculate size in MB
                size_mb = sum(f.stat().st_size for f in model_dir.rglob('*') if f.is_file()) / (1024 * 1024)

                # Only include models with size > 1 MB (filter out empty/incomplete downloads)
                if size_mb > 1.0:
                    downloaded.append({
                        "model_id": model_dir.name.replace("_", "/"),
                        "local_path": str(model_dir),
                        "size_mb": size_mb
                    })

    return {
        "models": downloaded,
        "total": len(downloaded)
    }


@router.delete("/delete/{model_id:path}")
async def delete_model(model_id: str):
    """
    Delete a downloaded model
    """
    # Convert model_id from "TinyLlama/TinyLlama-1.1B-Chat-v1.0" to "TinyLlama_TinyLlama-1.1B-Chat-v1.0"
    folder_name = model_id.replace("/", "_")
    model_path = MODELS_DIR / folder_name

    if not model_path.exists():
        raise HTTPException(status_code=404, detail=f"Model not found: {model_id}")

    try:
        # Delete the model directory
        import shutil
        shutil.rmtree(model_path)

        # Clear download status if exists
        if model_id in download_status:
            del download_status[model_id]

        return {
            "status": "success",
            "message": f"Model {model_id} deleted successfully",
            "model_id": model_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete model: {str(e)}")
