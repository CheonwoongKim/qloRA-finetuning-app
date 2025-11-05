"""
Training jobs API routes.
Handles CRUD operations, training execution, and metrics retrieval.
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from typing import Dict, Any
from pathlib import Path
import json
import logging

from app.core.storage import MetadataManager, find_by_id, ensure_directory
from app.services.job_service import (
    create_training_job,
    start_job_training,
    delete_job,
    get_running_jobs_manager
)
from app.services.metrics_service import (
    get_job_metrics_data,
    format_metrics_response
)
from app.services.demo_data import (
    generate_demo_logs,
    generate_demo_checkpoints,
    generate_demo_job_info
)

logger = logging.getLogger(__name__)
router = APIRouter()

# Data storage directories
JOBS_DIR = Path("./training_jobs")
LOGS_DIR = JOBS_DIR / "logs"
CHECKPOINTS_DIR = JOBS_DIR / "checkpoints"

# Initialize directories
ensure_directory(JOBS_DIR)
ensure_directory(LOGS_DIR)
ensure_directory(CHECKPOINTS_DIR)

# Metadata managers
jobs_manager = MetadataManager(JOBS_DIR / "jobs_meta.json")


@router.get("/{job_id}/metrics")
async def get_job_metrics(job_id: str):
    """Get training metrics for a specific job."""
    job = jobs_manager.find_by_id(job_id)
    use_demo = job is None

    job_data = get_job_metrics_data(job_id, job, use_demo=use_demo)
    return format_metrics_response(job_data)


@router.get("/{job_id}/info")
async def get_job_info(job_id: str):
    """Get general information about a training job."""
    job = jobs_manager.find_by_id(job_id)

    if not job:
        # Return demo data for visualization if job doesn't exist
        return generate_demo_job_info(job_id)

    return job


@router.post("")
async def create_job(job_data: Dict[str, Any]):
    """Create a new training job."""
    job = create_training_job(jobs_manager, job_data)

    return {
        "status": "success",
        "message": "Training job created successfully",
        "job": job
    }


@router.get("")
async def list_jobs():
    """List all training jobs."""
    jobs = jobs_manager.load()

    return {
        "jobs": jobs,
        "total": len(jobs)
    }


@router.post("/{job_id}/start")
async def start_job(job_id: str):
    """Start a training job."""
    try:
        result = start_job_training(job_id, jobs_manager)
        return result
    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        else:
            raise HTTPException(status_code=400, detail=str(e))


@router.post("/{job_id}/pause")
async def pause_job(job_id: str):
    """Pause a training job."""
    # TODO: Implement actual pause logic
    return {
        "job_id": job_id,
        "status": "paused",
        "message": "Job paused successfully"
    }


@router.post("/{job_id}/resume")
async def resume_job(job_id: str):
    """Resume a paused training job."""
    # TODO: Implement actual resume logic
    return {
        "job_id": job_id,
        "status": "running",
        "message": "Job resumed successfully"
    }


@router.post("/{job_id}/stop")
async def stop_job(job_id: str):
    """Stop a training job."""
    # TODO: Implement actual stop logic
    return {
        "job_id": job_id,
        "status": "stopped",
        "message": "Job stopped successfully"
    }


@router.delete("/{job_id}")
async def delete_job_route(job_id: str):
    """Delete a training job."""
    job = jobs_manager.find_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Create managers for cleanup
    logs_manager = MetadataManager(LOGS_DIR / f"{job_id}.json", auto_init=False)
    checkpoints_manager = MetadataManager(
        CHECKPOINTS_DIR / f"{job_id}.json",
        auto_init=False
    )

    success = delete_job(job_id, jobs_manager, logs_manager, checkpoints_manager)

    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete job")

    return {
        "status": "success",
        "message": "Job deleted successfully"
    }


@router.get("/{job_id}/logs")
async def get_job_logs(job_id: str):
    """Get training logs for a specific job."""
    log_file = LOGS_DIR / f"{job_id}.json"
    logs_manager = MetadataManager(log_file, auto_init=False)
    logs = logs_manager.load()

    # If no logs exist, initialize with demo logs for visualization
    if not logs:
        logs = generate_demo_logs(job_id)
        logs_manager.save(logs)

    return {
        "job_id": job_id,
        "logs": logs,
        "total": len(logs)
    }


@router.get("/{job_id}/checkpoints")
async def get_job_checkpoints(job_id: str):
    """Get saved checkpoints for a specific job."""
    ckpt_file = CHECKPOINTS_DIR / f"{job_id}.json"
    checkpoints_manager = MetadataManager(ckpt_file, auto_init=False)
    checkpoints = checkpoints_manager.load()

    # If no checkpoints exist, initialize with demo checkpoints
    if not checkpoints:
        checkpoints = generate_demo_checkpoints(job_id)
        checkpoints_manager.save(checkpoints)

    return {
        "job_id": job_id,
        "checkpoints": checkpoints,
        "total": len(checkpoints)
    }


@router.get("/{job_id}/checkpoints/{checkpoint_id}/download")
async def download_checkpoint(job_id: str, checkpoint_id: str):
    """Download a specific checkpoint file."""
    ckpt_file = CHECKPOINTS_DIR / f"{job_id}.json"
    checkpoints_manager = MetadataManager(ckpt_file, auto_init=False)
    checkpoints = checkpoints_manager.load()
    checkpoint = find_by_id(checkpoints, checkpoint_id)

    if not checkpoint:
        raise HTTPException(status_code=404, detail="Checkpoint not found")

    # Check if actual checkpoint file exists
    file_path = Path(checkpoint["file_path"])

    if not file_path.exists():
        # Create a temporary metadata file for demo
        import tempfile
        temp_dir = Path(tempfile.gettempdir())
        temp_file = temp_dir / f"{checkpoint_id}.json"

        with open(temp_file, "w") as f:
            json.dump({
                "checkpoint_id": checkpoint_id,
                "job_id": job_id,
                "epoch": checkpoint["epoch"],
                "step": checkpoint["step"],
                "loss": checkpoint["loss"],
                "timestamp": checkpoint["timestamp"],
                "note": "This is a demo checkpoint metadata file. In production, this would be the actual model checkpoint."
            }, f, indent=2)

        return FileResponse(
            path=str(temp_file),
            filename=f"{job_id}-checkpoint-{checkpoint['step']}.json",
            media_type="application/json"
        )

    # If actual file exists, return it
    return FileResponse(
        path=str(file_path),
        filename=file_path.name,
        media_type="application/octet-stream"
    )
