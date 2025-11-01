#!/usr/bin/env python3
"""
Direct test script for training functionality
"""
import sys
import os

# Add the app directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.trainer import start_training_job

# Test configuration
config = {
    "model": "LGAI-EXAONE/EXAONE-4.0-1.2B",
    "dataset": "Profile_Data",
    "epochs": 1,
    "batch_size": 4,
    "learning_rate": 2e-4,
    "lora_r": 8,
    "lora_alpha": 16,
}

job_id = "test-job-001"

print(f"Starting training job {job_id}...")
print(f"Configuration: {config}")
print("-" * 80)

try:
    success = start_training_job(job_id, config)
    print("-" * 80)
    if success:
        print(f"✅ Training completed successfully!")
    else:
        print(f"❌ Training failed!")
        sys.exit(1)
except Exception as e:
    print("-" * 80)
    print(f"❌ Training crashed with error:")
    print(f"Error type: {type(e).__name__}")
    print(f"Error message: {str(e)}")
    import traceback
    print("\nFull traceback:")
    traceback.print_exc()
    sys.exit(1)
