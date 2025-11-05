"""
Datasets API routes.
Handles dataset CRUD operations.
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from pathlib import Path
import logging

from app.core.storage import MetadataManager, ensure_directory, delete_file_safe

logger = logging.getLogger(__name__)
router = APIRouter()

# Dataset storage directory
DATASETS_DIR = Path("./uploaded_datasets")

# Initialize directory
ensure_directory(DATASETS_DIR)

# Metadata manager
datasets_manager = MetadataManager(DATASETS_DIR / "datasets_meta.json")


@router.get("")
async def list_datasets():
    """List all uploaded datasets."""
    datasets = datasets_manager.load()

    return {
        "datasets": datasets,
        "total": len(datasets)
    }


@router.get("/{dataset_id}")
async def get_dataset(dataset_id: str):
    """Get detailed information about a specific dataset."""
    dataset = datasets_manager.find_by_id(dataset_id)

    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    return dataset


@router.post("")
async def create_dataset(dataset_data: Dict[str, Any]):
    """Create a new dataset (called when user creates/uploads a dataset)."""
    datasets_manager.add(dataset_data)

    return {
        "status": "success",
        "message": "Dataset created successfully",
        "dataset": dataset_data
    }


@router.delete("/{dataset_id}")
async def delete_dataset(dataset_id: str):
    """Delete a dataset."""
    dataset = datasets_manager.find_by_id(dataset_id)

    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    # Delete actual file if exists
    if "file_path" in dataset and dataset["file_path"]:
        delete_file_safe(Path(dataset["file_path"]))

    # Remove from metadata
    datasets_manager.remove_by_id(dataset_id)

    return {
        "status": "success",
        "message": "Dataset deleted successfully"
    }
