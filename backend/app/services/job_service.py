"""
Job service for managing training jobs.
Handles job lifecycle, state management, and background execution.
"""

from typing import Dict, Any, Optional
from datetime import datetime
from pathlib import Path
import threading
import logging

from app.core.storage import MetadataManager
from app.core.trainer import start_training_job
from app.services.metrics_service import get_metrics_cache

logger = logging.getLogger(__name__)


class RunningJobsManager:
    """
    Thread-safe manager for tracking running training jobs.
    """

    def __init__(self):
        self._running_jobs: Dict[str, threading.Thread] = {}
        self._lock = threading.Lock()

    def add(self, job_id: str, thread: threading.Thread) -> None:
        """
        Add a running job.

        Args:
            job_id: ID of the training job
            thread: Thread running the training
        """
        with self._lock:
            self._running_jobs[job_id] = thread

    def get(self, job_id: str) -> Optional[threading.Thread]:
        """
        Get the thread for a running job.

        Args:
            job_id: ID of the training job

        Returns:
            Thread if found, None otherwise
        """
        with self._lock:
            return self._running_jobs.get(job_id)

    def is_running(self, job_id: str) -> bool:
        """
        Check if a job is currently running.

        Args:
            job_id: ID of the training job

        Returns:
            True if job is running, False otherwise
        """
        with self._lock:
            thread = self._running_jobs.get(job_id)
            return thread is not None and thread.is_alive()

    def remove(self, job_id: str) -> None:
        """
        Remove a job from the running jobs list.

        Args:
            job_id: ID of the training job
        """
        with self._lock:
            self._running_jobs.pop(job_id, None)


# Global running jobs manager
_running_jobs_manager = RunningJobsManager()


def get_running_jobs_manager() -> RunningJobsManager:
    """Get the global running jobs manager instance."""
    return _running_jobs_manager


def create_training_job(
    jobs_manager: MetadataManager,
    job_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Create a new training job with default fields.

    Args:
        jobs_manager: MetadataManager for jobs
        job_data: Job data provided by user

    Returns:
        Complete job data with defaults
    """
    jobs = jobs_manager.load()

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

    jobs_manager.add(job_data)

    return job_data


def start_job_training(
    job_id: str,
    jobs_manager: MetadataManager,
    logs_manager: Optional[MetadataManager] = None
) -> Dict[str, Any]:
    """
    Start training for a job in a background thread.

    Args:
        job_id: ID of the training job
        jobs_manager: MetadataManager for jobs
        logs_manager: Optional MetadataManager for logs

    Returns:
        Response dictionary with status

    Raises:
        ValueError: If job not found or already running
    """
    job = jobs_manager.find_by_id(job_id)
    if not job:
        raise ValueError("Job not found")

    running_jobs = get_running_jobs_manager()
    if running_jobs.is_running(job_id):
        raise ValueError("Job is already running")

    # Update job status to running
    jobs_manager.update_by_id(job_id, {
        "status": "running",
        "started_at": datetime.now().isoformat()
    })

    # Start training in background thread
    def run_training():
        try:
            logger.info(f"Starting training for job {job_id}")

            # Reload job metadata to get latest configuration
            job = jobs_manager.find_by_id(job_id)
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
            if success:
                jobs_manager.update_by_id(job_id, {
                    "status": "completed",
                    "progress": 100,
                    "completed_at": datetime.now().isoformat()
                })
            else:
                jobs_manager.update_by_id(job_id, {
                    "status": "failed"
                })

        except Exception as e:
            logger.exception(f"Training failed for job {job_id}")
            jobs_manager.update_by_id(job_id, {
                "status": "failed"
            })
        finally:
            # Cleanup
            running_jobs.remove(job_id)

    # Create and start training thread
    training_thread = threading.Thread(target=run_training, daemon=True)
    training_thread.start()
    running_jobs.add(job_id, training_thread)

    return {
        "job_id": job_id,
        "status": "running",
        "message": "Training started successfully"
    }


def delete_job(
    job_id: str,
    jobs_manager: MetadataManager,
    logs_manager: Optional[MetadataManager] = None,
    checkpoints_manager: Optional[MetadataManager] = None
) -> bool:
    """
    Delete a job and its associated data.

    Args:
        job_id: ID of the training job
        jobs_manager: MetadataManager for jobs
        logs_manager: Optional MetadataManager for logs
        checkpoints_manager: Optional MetadataManager for checkpoints

    Returns:
        True if successful, False otherwise
    """
    # Remove from metadata
    if not jobs_manager.remove_by_id(job_id):
        return False

    # Clean up logs
    if logs_manager:
        logs_file = logs_manager.file_path.parent / f"{job_id}.json"
        if logs_file.exists():
            logs_file.unlink()

    # Clean up checkpoints
    if checkpoints_manager:
        ckpt_file = checkpoints_manager.file_path.parent / f"{job_id}.json"
        if ckpt_file.exists():
            ckpt_file.unlink()

    # Remove from metrics cache
    metrics_cache = get_metrics_cache()
    metrics_cache.remove(job_id)

    return True
