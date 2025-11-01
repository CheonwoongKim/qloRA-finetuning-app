from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from pathlib import Path
import logging

from app.core.storage import (
    load_json_file,
    save_json_file,
    ensure_directory,
    delete_file_safe,
    find_by_id,
    remove_by_id
)

logger = logging.getLogger(__name__)
router = APIRouter()

# 데이터셋 저장 디렉토리
DATASETS_DIR = Path("./uploaded_datasets")
DATASETS_META_FILE = DATASETS_DIR / "datasets_meta.json"

# 디렉토리 초기화
ensure_directory(DATASETS_DIR)


def load_datasets_metadata() -> List[Dict[str, Any]]:
    """Load datasets metadata from file"""
    return load_json_file(DATASETS_META_FILE, default=[])


def save_datasets_metadata(datasets: List[Dict[str, Any]]) -> bool:
    """Save datasets metadata to file"""
    return save_json_file(DATASETS_META_FILE, datasets)


@router.get("")
async def list_datasets():
    """
    List all uploaded datasets
    """
    datasets = load_datasets_metadata()

    return {
        "datasets": datasets,
        "total": len(datasets)
    }


@router.get("/{dataset_id}")
async def get_dataset(dataset_id: str):
    """
    Get detailed information about a specific dataset
    """
    datasets = load_datasets_metadata()
    dataset = find_by_id(datasets, dataset_id)

    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    return dataset


@router.post("")
async def create_dataset(dataset_data: Dict[str, Any]):
    """
    Create a new dataset (called when user creates/uploads a dataset)
    """
    datasets = load_datasets_metadata()

    # Add new dataset
    datasets.append(dataset_data)
    save_datasets_metadata(datasets)

    return {
        "status": "success",
        "message": "Dataset created successfully",
        "dataset": dataset_data
    }


@router.delete("/{dataset_id}")
async def delete_dataset(dataset_id: str):
    """
    Delete a dataset
    """
    datasets = load_datasets_metadata()
    dataset = find_by_id(datasets, dataset_id)

    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    # Remove from list
    datasets = remove_by_id(datasets, dataset_id)
    save_datasets_metadata(datasets)

    # Delete actual file if exists
    if "file_path" in dataset and dataset["file_path"]:
        delete_file_safe(Path(dataset["file_path"]))

    return {
        "status": "success",
        "message": "Dataset deleted successfully"
    }
