from pydantic import BaseModel, ConfigDict, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class JobStatus(str, Enum):
    """Valid job statuses"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    PAUSED = "paused"
    STOPPED = "stopped"


class CreateJobRequest(BaseModel):
    """Request model for creating a new training job"""
    name: str = Field(..., min_length=1, max_length=200, description="Job name")
    model: str = Field(..., min_length=1, description="Base model identifier")
    dataset: str = Field(..., min_length=1, description="Dataset identifier")
    total_steps: int = Field(default=1000, ge=1, le=100000, description="Total training steps")
    total_epochs: int = Field(default=3, ge=1, le=100, description="Total epochs")

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "name": "Customer Support Model",
            "model": "meta-llama/Llama-2-7b-hf",
            "dataset": "customer-support-qa.jsonl",
            "total_steps": 1000,
            "total_epochs": 3
        }
    })


class CreateDatasetRequest(BaseModel):
    """Request model for creating a new dataset"""
    name: str = Field(..., min_length=1, max_length=200, description="Dataset name")
    description: Optional[str] = Field(None, max_length=1000, description="Dataset description")
    file_path: Optional[str] = Field(None, description="Path to dataset file")
    format: str = Field(default="jsonl", description="Dataset format")
    size: Optional[int] = Field(None, ge=0, description="Number of samples")

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "name": "Customer Support QA",
            "description": "Customer support question-answer pairs",
            "file_path": "./uploaded_datasets/customer-support.jsonl",
            "format": "jsonl",
            "size": 1000
        }
    })


class ChatRequest(BaseModel):
    """Request model for playground chat"""
    model_id: str = Field(..., description="Model ID (base: or ft: prefix)")
    message: str = Field(..., min_length=1, max_length=10000, description="User message")
    history: List[Dict[str, str]] = Field(default=[], description="Conversation history")
    max_new_tokens: int = Field(default=256, ge=1, le=2048, description="Max tokens to generate")

    @validator('model_id')
    def validate_model_id(cls, v):
        """Ensure model_id has correct prefix"""
        if not (v.startswith('base:') or v.startswith('ft:')):
            raise ValueError('model_id must start with "base:" or "ft:" prefix')
        return v

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "model_id": "base:TinyLlama/TinyLlama-1.1B-Chat-v1.0",
            "message": "Hello, how are you?",
            "history": [],
            "max_new_tokens": 256
        }
    })


class ModelInfo(BaseModel):
    id: str
    name: str
    author: str
    downloads: int
    likes: int
    tags: List[str]
    pipeline_tag: Optional[str] = None
    last_modified: Optional[datetime] = None
    description: Optional[str] = None
    size_gb: Optional[float] = None

class ModelSearchResponse(BaseModel):
    models: List[ModelInfo]
    total: int

class ModelDetailResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    id: str
    name: str
    author: str
    downloads: int
    likes: int
    tags: List[str]
    pipeline_tag: Optional[str] = None
    last_modified: Optional[datetime] = None
    description: Optional[str] = None
    size_gb: Optional[float] = None
    model_card: Optional[str] = None
    config: Optional[dict] = None
