from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from pathlib import Path
import random
import json
import logging
import threading

from app.core.storage import (
    load_json_file,
    save_json_file,
    ensure_directory,
    delete_file_safe,
    find_by_id,
    remove_by_id
)
from app.core.trainer import start_training_job
from app.core.exceptions import ResourceNotFoundError, ResourceAlreadyExistsError, OperationError

logger = logging.getLogger(__name__)
router = APIRouter()

# Track running training jobs
running_jobs: Dict[str, threading.Thread] = {}

# 데이터 저장 디렉토리
JOBS_DIR = Path("./training_jobs")
JOBS_META_FILE = JOBS_DIR / "jobs_meta.json"
LOGS_DIR = JOBS_DIR / "logs"
CHECKPOINTS_DIR = JOBS_DIR / "checkpoints"

# 디렉토리 초기화
ensure_directory(JOBS_DIR)
ensure_directory(LOGS_DIR)
ensure_directory(CHECKPOINTS_DIR)

# 실시간 메트릭을 위한 메모리 캐시
training_jobs: Dict[str, Dict[str, Any]] = {}


def load_jobs_metadata() -> List[Dict[str, Any]]:
    """Load jobs metadata from file"""
    return load_json_file(JOBS_META_FILE, default=[])


def save_jobs_metadata(jobs: List[Dict[str, Any]]) -> bool:
    """Save jobs metadata to file"""
    return save_json_file(JOBS_META_FILE, jobs)


def load_job_logs(job_id: str) -> List[Dict[str, Any]]:
    """Load logs for a specific job"""
    log_file = LOGS_DIR / f"{job_id}.json"
    return load_json_file(log_file, default=[])


def save_job_logs(job_id: str, logs: List[Dict[str, Any]]) -> bool:
    """Save logs for a specific job"""
    log_file = LOGS_DIR / f"{job_id}.json"
    return save_json_file(log_file, logs)


def load_job_checkpoints(job_id: str) -> List[Dict[str, Any]]:
    """Load checkpoints for a specific job"""
    ckpt_file = CHECKPOINTS_DIR / f"{job_id}.json"
    return load_json_file(ckpt_file, default=[])


def save_job_checkpoints(job_id: str, checkpoints: List[Dict[str, Any]]) -> bool:
    """Save checkpoints for a specific job"""
    ckpt_file = CHECKPOINTS_DIR / f"{job_id}.json"
    return save_json_file(ckpt_file, checkpoints)

def _generate_loss_point(step: int, previous_loss: float) -> Dict[str, Any]:
    """Generate a single loss data point"""
    decay_rate = 0.98
    noise = random.uniform(-0.05, 0.05)
    current_loss = max(0.1, previous_loss * decay_rate + noise)
    timestamp = datetime.now() - timedelta(minutes=50 - (step // 10))

    return {
        "step": (step + 1) * 10,
        "epoch": (step // 10) + 1,
        "loss": round(current_loss, 4),
        "timestamp": timestamp.isoformat(),
        "time_display": timestamp.strftime("%H:%M:%S")
    }


def initialize_demo_loss_history(job_id: str) -> List[Dict[str, Any]]:
    """Initialize demo loss history for visualization (only if no data exists)"""
    start_loss = 2.5
    current_loss = start_loss
    history = []

    for i in range(50):
        point = _generate_loss_point(i, current_loss)
        current_loss = point["loss"]
        history.append(point)

    return history


def _create_demo_job_data(job_id: str) -> Dict[str, Any]:
    """Create demo job data for visualization"""
    return {
        "id": job_id,
        "loss_history": initialize_demo_loss_history(job_id),
        "current_step": 500,
        "total_steps": 1000,
        "current_epoch": 3,
        "total_epochs": 5
    }


def _create_demo_logs(job_id: str) -> List[Dict[str, Any]]:
    """Create demo logs for visualization"""
    current_time = datetime.now()
    return [
        {"timestamp": (current_time - timedelta(seconds=40)).strftime("%H:%M:%S"), "level": "INFO", "message": "Initializing QLoRA training..."},
        {"timestamp": (current_time - timedelta(seconds=39)).strftime("%H:%M:%S"), "level": "INFO", "message": f"Loading model for job {job_id}"},
        {"timestamp": (current_time - timedelta(seconds=38)).strftime("%H:%M:%S"), "level": "INFO", "message": "Applying 4-bit quantization..."},
        {"timestamp": (current_time - timedelta(seconds=37)).strftime("%H:%M:%S"), "level": "INFO", "message": "LoRA rank: 8, alpha: 16"},
        {"timestamp": (current_time - timedelta(seconds=36)).strftime("%H:%M:%S"), "level": "INFO", "message": "Training started - Epoch 1/3"},
        {"timestamp": (current_time - timedelta(seconds=26)).strftime("%H:%M:%S"), "level": "INFO", "message": "Step 10/300 - Loss: 0.6234"},
        {"timestamp": (current_time - timedelta(seconds=16)).strftime("%H:%M:%S"), "level": "INFO", "message": "Step 20/300 - Loss: 0.5891"},
        {"timestamp": (current_time - timedelta(seconds=6)).strftime("%H:%M:%S"), "level": "INFO", "message": "Step 30/300 - Loss: 0.5567"},
    ]


def _create_demo_checkpoints(job_id: str) -> List[Dict[str, Any]]:
    """Create demo checkpoints for visualization"""
    current_time = datetime.now()
    return [
        {
            "id": f"ckpt-{job_id}-1",
            "epoch": 1,
            "step": 100,
            "loss": 0.6234,
            "timestamp": (current_time - timedelta(minutes=20)).strftime("%H:%M:%S"),
            "file_path": f"/checkpoints/{job_id}/checkpoint-100.pt",
            "file_size_mb": 245.3
        },
        {
            "id": f"ckpt-{job_id}-2",
            "epoch": 1,
            "step": 200,
            "loss": 0.5567,
            "timestamp": (current_time - timedelta(minutes=15)).strftime("%H:%M:%S"),
            "file_path": f"/checkpoints/{job_id}/checkpoint-200.pt",
            "file_size_mb": 245.3
        },
        {
            "id": f"ckpt-{job_id}-3",
            "epoch": 2,
            "step": 100,
            "loss": 0.4891,
            "timestamp": (current_time - timedelta(minutes=10)).strftime("%H:%M:%S"),
            "file_path": f"/checkpoints/{job_id}/checkpoint-300.pt",
            "file_size_mb": 245.3
        },
    ]


def _get_or_create_job_data(job_id: str, job: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """Get job data from cache or create new demo data"""
    if job_id not in training_jobs:
        if job:
            # Create from existing job metadata
            training_jobs[job_id] = {
                "id": job_id,
                "loss_history": job.get("loss_history", []),
                "current_step": job.get("current_step", 0),
                "total_steps": job.get("total_steps", 1000),
                "current_epoch": job.get("current_epoch", 1),
                "total_epochs": job.get("total_epochs", 3)
            }
        else:
            # Create demo data
            training_jobs[job_id] = _create_demo_job_data(job_id)

    return training_jobs[job_id]


def _simulate_real_time_update(job_data: Dict[str, Any]):
    """Simulate real-time loss updates for demo"""
    if len(job_data["loss_history"]) < 100:
        last_point = job_data["loss_history"][-1]
        new_step = last_point["step"] + 10
        new_loss = max(0.1, last_point["loss"] * 0.98 + random.uniform(-0.03, 0.03))
        new_timestamp = datetime.now()

        job_data["loss_history"].append({
            "step": new_step,
            "epoch": (new_step // 100) + 1,
            "loss": round(new_loss, 4),
            "timestamp": new_timestamp.isoformat(),
            "time_display": new_timestamp.strftime("%H:%M:%S")
        })


@router.get("/{job_id}/metrics")
async def get_job_metrics(job_id: str):
    """Get training metrics for a specific job"""
    # Check if job exists in metadata
    jobs = load_jobs_metadata()
    job = find_by_id(jobs, job_id)

    # Get or create job data
    job_data = _get_or_create_job_data(job_id, job)

    # Simulate real-time updates for demo (only if no actual job exists)
    if not job:
        _simulate_real_time_update(job_data)

    # Return empty metrics if no loss history
    if not job_data["loss_history"]:
        return {
            "job_id": job_id,
            "loss_history": [],
            "current_metrics": {
                "current_loss": 0,
                "current_step": 0,
                "current_epoch": 0,
                "total_steps": job_data.get("total_steps", 1000),
                "total_epochs": job_data.get("total_epochs", 3)
            }
        }

    # Return metrics with loss history
    latest_loss = job_data["loss_history"][-1]
    return {
        "job_id": job_id,
        "loss_history": job_data["loss_history"],
        "current_metrics": {
            "current_loss": latest_loss["loss"],
            "current_step": latest_loss["step"],
            "current_epoch": latest_loss["epoch"],
            "total_steps": job_data.get("total_steps", 1000),
            "total_epochs": job_data.get("total_epochs", 3)
        }
    }


@router.get("/{job_id}/info")
async def get_job_info(job_id: str):
    """Get general information about a training job"""

    jobs = load_jobs_metadata()
    job = find_by_id(jobs, job_id)

    if not job:
        # Return demo data for visualization if job doesn't exist
        return {
            "id": job_id,
            "name": "Demo Training Job",
            "model": "TinyLlama 1.1B",
            "dataset": "Demo Dataset",
            "status": "running",
            "started_at": (datetime.now() - timedelta(hours=1)).isoformat(),
            "progress": 50.0,
            "estimated_completion": (datetime.now() + timedelta(hours=1)).isoformat()
        }

    return job


@router.post("")
async def create_job(job_data: Dict[str, Any]):
    """Create a new training job"""

    jobs = load_jobs_metadata()

    # Add default fields if not provided
    if "id" not in job_data:
        job_data["id"] = f"ft-{len(jobs) + 1:03d}"
    if "status" not in job_data:
        job_data["status"] = "pending"
    if "progress" not in job_data:
        job_data["progress"] = 0
    if "createdAt" not in job_data:
        job_data["createdAt"] = datetime.now().strftime("%Y-%m-%d")
    if "duration" not in job_data:
        job_data["duration"] = "-"

    jobs.append(job_data)
    save_jobs_metadata(jobs)

    return {
        "status": "success",
        "message": "Training job created successfully",
        "job": job_data
    }


@router.get("")
async def list_jobs():
    """List all training jobs"""

    jobs = load_jobs_metadata()

    return {
        "jobs": jobs,
        "total": len(jobs)
    }


@router.post("/{job_id}/start")
async def start_job(job_id: str):
    """Start a training job"""

    # Check if job exists
    jobs = load_jobs_metadata()
    job = find_by_id(jobs, job_id)

    if not job:
        raise ResourceNotFoundError("Job", job_id)

    # Check if job is already running
    if job_id in running_jobs and running_jobs[job_id].is_alive():
        raise ResourceAlreadyExistsError("Running job", job_id)

    # Update job status to running
    job["status"] = "running"
    job["started_at"] = datetime.now().isoformat()
    save_jobs_metadata(jobs)

    # Start training in background thread
    def run_training():
        try:
            logger.info(f"Starting training for job {job_id}")

            # Load job metadata to get configuration
            jobs = load_jobs_metadata()
            job = find_by_id(jobs, job_id)

            if not job:
                logger.error(f"Job {job_id} not found in metadata")
                return

            # Get job configuration
            config = {
                "model": job.get("model", "TinyLlama/TinyLlama-1.1B-Chat-v1.0"),
                "dataset": job.get("dataset", "timdettmers/openassistant-guanaco"),
                "epochs": job.get("epochs", 3),
                "batch_size": job.get("batch_size", 4),
                "learning_rate": job.get("learning_rate", 2e-4),
            }

            # Start training
            success = start_training_job(job_id, config)

            # Update job status
            jobs = load_jobs_metadata()
            job = find_by_id(jobs, job_id)
            if job:
                if success:
                    job["status"] = "completed"
                    job["progress"] = 100
                    job["completed_at"] = datetime.now().isoformat()
                else:
                    job["status"] = "failed"

                save_jobs_metadata(jobs)

        except Exception as e:
            logger.exception(f"Training failed for job {job_id}")
            # Update job status to failed
            jobs = load_jobs_metadata()
            job = find_by_id(jobs, job_id)
            if job:
                job["status"] = "failed"
                save_jobs_metadata(jobs)

    # Create and start training thread
    training_thread = threading.Thread(target=run_training, daemon=True)
    training_thread.start()
    running_jobs[job_id] = training_thread

    return {
        "job_id": job_id,
        "status": "running",
        "message": "Training started successfully"
    }


@router.post("/{job_id}/pause")
async def pause_job(job_id: str):
    """Pause a training job"""

    return {
        "job_id": job_id,
        "status": "paused",
        "message": "Job paused successfully"
    }


@router.post("/{job_id}/resume")
async def resume_job(job_id: str):
    """Resume a paused training job"""

    return {
        "job_id": job_id,
        "status": "running",
        "message": "Job resumed successfully"
    }


@router.post("/{job_id}/stop")
async def stop_job(job_id: str):
    """Stop a training job"""

    return {
        "job_id": job_id,
        "status": "stopped",
        "message": "Job stopped successfully"
    }


@router.delete("/{job_id}")
async def delete_job(job_id: str):
    """Delete a training job"""

    jobs = load_jobs_metadata()
    job = find_by_id(jobs, job_id)

    if not job:
        raise ResourceNotFoundError("Job", job_id)

    # Remove from metadata
    jobs = remove_by_id(jobs, job_id)
    save_jobs_metadata(jobs)

    # Clean up associated files
    delete_file_safe(LOGS_DIR / f"{job_id}.json")
    delete_file_safe(CHECKPOINTS_DIR / f"{job_id}.json")

    # Remove from memory cache
    if job_id in training_jobs:
        del training_jobs[job_id]

    return {
        "status": "success",
        "message": "Job deleted successfully"
    }


@router.get("/{job_id}/logs")
async def get_job_logs(job_id: str):
    """Get training logs for a specific job"""
    logs = load_job_logs(job_id)

    # If no logs exist, initialize with demo logs for visualization
    if not logs:
        logs = _create_demo_logs(job_id)
        save_job_logs(job_id, logs)

    return {
        "job_id": job_id,
        "logs": logs,
        "total": len(logs)
    }


@router.get("/{job_id}/checkpoints")
async def get_job_checkpoints(job_id: str):
    """Get saved checkpoints for a specific job"""
    checkpoints = load_job_checkpoints(job_id)

    # If no checkpoints exist, initialize with demo checkpoints for visualization
    if not checkpoints:
        checkpoints = _create_demo_checkpoints(job_id)
        save_job_checkpoints(job_id, checkpoints)

    return {
        "job_id": job_id,
        "checkpoints": checkpoints,
        "total": len(checkpoints)
    }


@router.get("/{job_id}/checkpoints/{checkpoint_id}/download")
async def download_checkpoint(job_id: str, checkpoint_id: str):
    """Download a specific checkpoint file"""

    checkpoints = load_job_checkpoints(job_id)
    checkpoint = find_by_id(checkpoints, checkpoint_id)

    if not checkpoint:
        raise ResourceNotFoundError("Checkpoint", checkpoint_id)

    # In a real implementation, this would return the actual checkpoint file
    # For demo purposes, we'll create a dummy file or return a message
    file_path = Path(checkpoint["file_path"])

    # Since we don't have actual checkpoint files in demo mode,
    # we'll return a JSON file with checkpoint metadata instead
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
