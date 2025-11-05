"""
Demo data generation utilities for training jobs.
Used for visualization and testing purposes.
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any
import random


def initialize_demo_loss_history(job_id: str) -> List[Dict[str, Any]]:
    """
    Initialize demo loss history for visualization (only if no data exists).

    Args:
        job_id: ID of the training job

    Returns:
        List of loss history entries with realistic decay
    """
    start_loss = 2.5
    current_loss = start_loss
    history = []
    base_time = datetime.now() - timedelta(minutes=50)

    for i in range(50):
        decay_rate = 0.98
        noise = random.uniform(-0.05, 0.05)
        current_loss = max(0.1, current_loss * decay_rate + noise)
        timestamp = base_time + timedelta(minutes=i)

        history.append({
            "step": (i + 1) * 10,
            "epoch": (i // 10) + 1,
            "loss": round(current_loss, 4),
            "timestamp": timestamp.isoformat(),
            "time_display": timestamp.strftime("%H:%M:%S")
        })

    return history


def generate_demo_logs(job_id: str) -> List[Dict[str, Any]]:
    """
    Generate demo training logs for visualization.

    Args:
        job_id: ID of the training job

    Returns:
        List of log entries
    """
    current_time = datetime.now()
    logs = [
        {
            "timestamp": (current_time - timedelta(seconds=40)).strftime("%H:%M:%S"),
            "level": "INFO",
            "message": "Initializing QLoRA training..."
        },
        {
            "timestamp": (current_time - timedelta(seconds=39)).strftime("%H:%M:%S"),
            "level": "INFO",
            "message": f"Loading model for job {job_id}"
        },
        {
            "timestamp": (current_time - timedelta(seconds=38)).strftime("%H:%M:%S"),
            "level": "INFO",
            "message": "Applying 4-bit quantization..."
        },
        {
            "timestamp": (current_time - timedelta(seconds=37)).strftime("%H:%M:%S"),
            "level": "INFO",
            "message": "LoRA rank: 8, alpha: 16"
        },
        {
            "timestamp": (current_time - timedelta(seconds=36)).strftime("%H:%M:%S"),
            "level": "INFO",
            "message": "Training started - Epoch 1/3"
        },
        {
            "timestamp": (current_time - timedelta(seconds=26)).strftime("%H:%M:%S"),
            "level": "INFO",
            "message": "Step 10/300 - Loss: 0.6234"
        },
        {
            "timestamp": (current_time - timedelta(seconds=16)).strftime("%H:%M:%S"),
            "level": "INFO",
            "message": "Step 20/300 - Loss: 0.5891"
        },
        {
            "timestamp": (current_time - timedelta(seconds=6)).strftime("%H:%M:%S"),
            "level": "INFO",
            "message": "Step 30/300 - Loss: 0.5567"
        },
    ]
    return logs


def generate_demo_checkpoints(job_id: str) -> List[Dict[str, Any]]:
    """
    Generate demo checkpoint data for visualization.

    Args:
        job_id: ID of the training job

    Returns:
        List of checkpoint entries
    """
    current_time = datetime.now()
    checkpoints = [
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
    return checkpoints


def generate_demo_job_info(job_id: str) -> Dict[str, Any]:
    """
    Generate demo job information for visualization.

    Args:
        job_id: ID of the training job

    Returns:
        Dictionary with demo job info
    """
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
