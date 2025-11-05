"""
Metrics service for managing training job metrics.
Handles real-time metrics updates and loss history tracking.
"""

from typing import Dict, Any, Optional, List
from datetime import datetime
import random
import threading

from app.services.demo_data import initialize_demo_loss_history


class MetricsCache:
    """
    Thread-safe cache for training job metrics.
    Stores real-time metrics data in memory.
    """

    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.Lock()

    def get(self, job_id: str) -> Optional[Dict[str, Any]]:
        """
        Get metrics for a job from cache.

        Args:
            job_id: ID of the training job

        Returns:
            Metrics data or None if not found
        """
        with self._lock:
            return self._cache.get(job_id)

    def set(self, job_id: str, metrics: Dict[str, Any]) -> None:
        """
        Set metrics for a job in cache.

        Args:
            job_id: ID of the training job
            metrics: Metrics data to cache
        """
        with self._lock:
            self._cache[job_id] = metrics

    def remove(self, job_id: str) -> None:
        """
        Remove metrics for a job from cache.

        Args:
            job_id: ID of the training job
        """
        with self._lock:
            self._cache.pop(job_id, None)

    def update_loss_history(
        self,
        job_id: str,
        step: int,
        epoch: int,
        loss: float
    ) -> None:
        """
        Update loss history for a job.

        Args:
            job_id: ID of the training job
            step: Current training step
            epoch: Current epoch
            loss: Current loss value
        """
        with self._lock:
            if job_id not in self._cache:
                self._cache[job_id] = {
                    "id": job_id,
                    "loss_history": [],
                    "current_step": 0,
                    "total_steps": 1000,
                    "current_epoch": 1,
                    "total_epochs": 3
                }

            timestamp = datetime.now()
            self._cache[job_id]["loss_history"].append({
                "step": step,
                "epoch": epoch,
                "loss": round(loss, 4),
                "timestamp": timestamp.isoformat(),
                "time_display": timestamp.strftime("%H:%M:%S")
            })
            self._cache[job_id]["current_step"] = step
            self._cache[job_id]["current_epoch"] = epoch


# Global metrics cache instance
_metrics_cache = MetricsCache()


def get_metrics_cache() -> MetricsCache:
    """Get the global metrics cache instance."""
    return _metrics_cache


def get_job_metrics_data(
    job_id: str,
    job_metadata: Optional[Dict[str, Any]] = None,
    use_demo: bool = False
) -> Dict[str, Any]:
    """
    Get metrics data for a job, either from cache or demo data.

    Args:
        job_id: ID of the training job
        job_metadata: Optional job metadata from database
        use_demo: Whether to use/generate demo data

    Returns:
        Dictionary containing job metrics
    """
    cache = get_metrics_cache()
    job_data = cache.get(job_id)

    # Initialize cache if not present
    if not job_data:
        if use_demo or not job_metadata:
            # Generate demo data
            job_data = {
                "id": job_id,
                "loss_history": initialize_demo_loss_history(job_id),
                "current_step": 500,
                "total_steps": 1000,
                "current_epoch": 3,
                "total_epochs": 5
            }
        else:
            # Load from metadata
            job_data = {
                "id": job_id,
                "loss_history": job_metadata.get("loss_history", []),
                "current_step": job_metadata.get("current_step", 0),
                "total_steps": job_metadata.get("total_steps", 1000),
                "current_epoch": job_metadata.get("current_epoch", 1),
                "total_epochs": job_metadata.get("total_epochs", 3)
            }
        cache.set(job_id, job_data)

    # Simulate real-time updates for demo
    if use_demo and len(job_data["loss_history"]) < 100:
        last_point = job_data["loss_history"][-1]
        new_step = last_point["step"] + 10
        new_loss = max(0.1, last_point["loss"] * 0.98 + random.uniform(-0.03, 0.03))

        cache.update_loss_history(job_id, new_step, (new_step // 100) + 1, new_loss)
        job_data = cache.get(job_id)

    return job_data


def format_metrics_response(job_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Format metrics data for API response.

    Args:
        job_data: Raw job metrics data

    Returns:
        Formatted metrics response
    """
    loss_history = job_data.get("loss_history", [])

    if not loss_history:
        return {
            "job_id": job_data.get("id"),
            "loss_history": [],
            "current_metrics": {
                "current_loss": 0,
                "current_step": 0,
                "current_epoch": 0,
                "total_steps": job_data.get("total_steps", 1000),
                "total_epochs": job_data.get("total_epochs", 3)
            }
        }

    return {
        "job_id": job_data.get("id"),
        "loss_history": loss_history,
        "current_metrics": {
            "current_loss": loss_history[-1]["loss"],
            "current_step": loss_history[-1]["step"],
            "current_epoch": loss_history[-1]["epoch"],
            "total_steps": job_data.get("total_steps", 1000),
            "total_epochs": job_data.get("total_epochs", 3)
        }
    }
