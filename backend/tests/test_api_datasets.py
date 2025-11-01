"""
Tests for datasets API endpoints
"""

import pytest
from fastapi.testclient import TestClient
from pathlib import Path
import json
import tempfile
import shutil

from app.main import app
from app.core.storage import ensure_directory, save_json_file

client = TestClient(app)


@pytest.fixture
def temp_datasets_dir(tmp_path, monkeypatch):
    """Create temporary datasets directory for testing"""
    datasets_dir = tmp_path / "uploaded_datasets"
    ensure_directory(datasets_dir)

    # Patch the DATASETS_DIR in the datasets module
    from app.api.routes import datasets as datasets_module
    monkeypatch.setattr(datasets_module, "DATASETS_DIR", datasets_dir)
    monkeypatch.setattr(datasets_module, "DATASETS_META_FILE", datasets_dir / "datasets_meta.json")

    # Initialize empty metadata file
    save_json_file(datasets_dir / "datasets_meta.json", [])

    yield datasets_dir

    # Cleanup
    if datasets_dir.exists():
        shutil.rmtree(datasets_dir)


class TestListDatasets:
    """Test GET /datasets endpoint"""

    def test_list_empty_datasets(self, temp_datasets_dir):
        """Test listing datasets when none exist"""
        response = client.get("/api/datasets")

        assert response.status_code == 200
        data = response.json()
        assert "datasets" in data
        assert "total" in data
        assert data["total"] == 0
        assert data["datasets"] == []

    def test_list_multiple_datasets(self, temp_datasets_dir):
        """Test listing multiple datasets"""
        # Create test datasets
        test_datasets = [
            {
                "id": "dataset-1",
                "name": "Test Dataset 1",
                "description": "First test dataset",
                "file_path": str(temp_datasets_dir / "test1.jsonl"),
                "format": "jsonl",
                "size": 100
            },
            {
                "id": "dataset-2",
                "name": "Test Dataset 2",
                "description": "Second test dataset",
                "file_path": str(temp_datasets_dir / "test2.jsonl"),
                "format": "jsonl",
                "size": 200
            }
        ]

        # Save to metadata file
        from app.api.routes import datasets as datasets_module
        save_json_file(datasets_module.DATASETS_META_FILE, test_datasets)

        response = client.get("/api/datasets")

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2
        assert len(data["datasets"]) == 2
        assert data["datasets"][0]["id"] == "dataset-1"
        assert data["datasets"][1]["id"] == "dataset-2"


class TestGetDataset:
    """Test GET /datasets/{dataset_id} endpoint"""

    def test_get_existing_dataset(self, temp_datasets_dir):
        """Test getting a dataset that exists"""
        test_dataset = {
            "id": "test-dataset",
            "name": "Test Dataset",
            "description": "A test dataset",
            "file_path": str(temp_datasets_dir / "test.jsonl"),
            "format": "jsonl",
            "size": 150
        }

        # Save to metadata file
        from app.api.routes import datasets as datasets_module
        save_json_file(datasets_module.DATASETS_META_FILE, [test_dataset])

        response = client.get("/api/datasets/test-dataset")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "test-dataset"
        assert data["name"] == "Test Dataset"
        assert data["description"] == "A test dataset"
        assert data["size"] == 150

    def test_get_nonexistent_dataset(self, temp_datasets_dir):
        """Test getting a dataset that doesn't exist"""
        response = client.get("/api/datasets/nonexistent-id")

        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        assert data["detail"] == "Dataset not found"


class TestCreateDataset:
    """Test POST /datasets endpoint"""

    def test_create_new_dataset(self, temp_datasets_dir):
        """Test creating a new dataset"""
        new_dataset = {
            "id": "new-dataset",
            "name": "New Dataset",
            "description": "Newly created dataset",
            "file_path": str(temp_datasets_dir / "new.jsonl"),
            "format": "jsonl",
            "size": 300
        }

        response = client.post("/api/datasets", json=new_dataset)

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["message"] == "Dataset created successfully"
        assert data["dataset"]["id"] == "new-dataset"

        # Verify dataset was added to metadata
        from app.api.routes import datasets as datasets_module
        from app.core.storage import load_json_file
        datasets = load_json_file(datasets_module.DATASETS_META_FILE, default=[])
        assert len(datasets) == 1
        assert datasets[0]["id"] == "new-dataset"

    def test_create_multiple_datasets(self, temp_datasets_dir):
        """Test creating multiple datasets"""
        dataset1 = {
            "id": "dataset-1",
            "name": "Dataset 1",
            "description": "First dataset",
            "file_path": str(temp_datasets_dir / "data1.jsonl"),
            "format": "jsonl",
            "size": 100
        }

        dataset2 = {
            "id": "dataset-2",
            "name": "Dataset 2",
            "description": "Second dataset",
            "file_path": str(temp_datasets_dir / "data2.jsonl"),
            "format": "jsonl",
            "size": 200
        }

        response1 = client.post("/api/datasets", json=dataset1)
        response2 = client.post("/api/datasets", json=dataset2)

        assert response1.status_code == 200
        assert response2.status_code == 200

        # Verify both datasets exist
        list_response = client.get("/api/datasets")
        data = list_response.json()
        assert data["total"] == 2


class TestDeleteDataset:
    """Test DELETE /datasets/{dataset_id} endpoint"""

    def test_delete_existing_dataset(self, temp_datasets_dir):
        """Test deleting an existing dataset"""
        # Create test file
        test_file = temp_datasets_dir / "to_delete.jsonl"
        test_file.write_text('{"text": "sample data"}\n')

        test_dataset = {
            "id": "delete-me",
            "name": "Dataset to Delete",
            "description": "This will be deleted",
            "file_path": str(test_file),
            "format": "jsonl",
            "size": 1
        }

        # Save to metadata file
        from app.api.routes import datasets as datasets_module
        save_json_file(datasets_module.DATASETS_META_FILE, [test_dataset])

        # Verify file exists
        assert test_file.exists()

        response = client.delete("/api/datasets/delete-me")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["message"] == "Dataset deleted successfully"

        # Verify dataset was removed from metadata
        from app.core.storage import load_json_file
        datasets = load_json_file(datasets_module.DATASETS_META_FILE, default=[])
        assert len(datasets) == 0

        # Verify file was deleted
        assert not test_file.exists()

    def test_delete_nonexistent_dataset(self, temp_datasets_dir):
        """Test deleting a dataset that doesn't exist"""
        response = client.delete("/api/datasets/nonexistent-id")

        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        assert data["detail"] == "Dataset not found"

    def test_delete_dataset_without_file(self, temp_datasets_dir):
        """Test deleting a dataset that has no associated file"""
        test_dataset = {
            "id": "no-file-dataset",
            "name": "Dataset Without File",
            "description": "No file associated",
            "format": "jsonl"
        }

        # Save to metadata file
        from app.api.routes import datasets as datasets_module
        save_json_file(datasets_module.DATASETS_META_FILE, [test_dataset])

        response = client.delete("/api/datasets/no-file-dataset")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"

        # Verify dataset was removed
        from app.core.storage import load_json_file
        datasets = load_json_file(datasets_module.DATASETS_META_FILE, default=[])
        assert len(datasets) == 0


class TestDatasetIntegration:
    """Integration tests for dataset workflows"""

    def test_create_get_delete_workflow(self, temp_datasets_dir):
        """Test complete workflow: create -> get -> delete"""
        # Create dataset
        new_dataset = {
            "id": "workflow-dataset",
            "name": "Workflow Dataset",
            "description": "Testing complete workflow",
            "file_path": str(temp_datasets_dir / "workflow.jsonl"),
            "format": "jsonl",
            "size": 50
        }

        create_response = client.post("/api/datasets", json=new_dataset)
        assert create_response.status_code == 200

        # Get dataset
        get_response = client.get("/api/datasets/workflow-dataset")
        assert get_response.status_code == 200
        data = get_response.json()
        assert data["id"] == "workflow-dataset"
        assert data["name"] == "Workflow Dataset"

        # Delete dataset
        delete_response = client.delete("/api/datasets/workflow-dataset")
        assert delete_response.status_code == 200

        # Verify deletion
        get_after_delete = client.get("/api/datasets/workflow-dataset")
        assert get_after_delete.status_code == 404

    def test_list_after_multiple_operations(self, temp_datasets_dir):
        """Test listing datasets after multiple create/delete operations"""
        # Create 3 datasets
        for i in range(1, 4):
            dataset = {
                "id": f"dataset-{i}",
                "name": f"Dataset {i}",
                "description": f"Dataset number {i}",
                "file_path": str(temp_datasets_dir / f"data{i}.jsonl"),
                "format": "jsonl",
                "size": i * 100
            }
            client.post("/api/datasets", json=dataset)

        # Verify 3 datasets exist
        list_response = client.get("/api/datasets")
        assert list_response.json()["total"] == 3

        # Delete one dataset
        client.delete("/api/datasets/dataset-2")

        # Verify 2 datasets remain
        list_response = client.get("/api/datasets")
        data = list_response.json()
        assert data["total"] == 2

        # Verify correct datasets remain
        dataset_ids = [d["id"] for d in data["datasets"]]
        assert "dataset-1" in dataset_ids
        assert "dataset-2" not in dataset_ids
        assert "dataset-3" in dataset_ids
