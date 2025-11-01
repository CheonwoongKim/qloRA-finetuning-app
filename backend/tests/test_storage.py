"""
Tests for storage utility functions
"""

import pytest
import json
import tempfile
from pathlib import Path
from app.core.storage import (
    load_json_file,
    save_json_file,
    ensure_directory,
    delete_file_safe,
    find_by_id,
    remove_by_id
)


class TestLoadJsonFile:
    """Test load_json_file function"""

    def test_load_existing_file(self, tmp_path):
        """Test loading an existing JSON file"""
        test_file = tmp_path / "test.json"
        test_data = {"key": "value", "number": 42}

        with open(test_file, "w") as f:
            json.dump(test_data, f)

        result = load_json_file(test_file)
        assert result == test_data

    def test_load_nonexistent_file(self, tmp_path):
        """Test loading a file that doesn't exist"""
        test_file = tmp_path / "nonexistent.json"
        result = load_json_file(test_file, default=[])
        assert result == []

    def test_load_invalid_json(self, tmp_path):
        """Test loading a file with invalid JSON"""
        test_file = tmp_path / "invalid.json"

        with open(test_file, "w") as f:
            f.write("{invalid json")

        result = load_json_file(test_file, default={})
        assert result == {}

    def test_load_with_custom_default(self, tmp_path):
        """Test loading with custom default value"""
        test_file = tmp_path / "nonexistent.json"
        default_value = {"default": True}
        result = load_json_file(test_file, default=default_value)
        assert result == default_value


class TestSaveJsonFile:
    """Test save_json_file function"""

    def test_save_to_existing_directory(self, tmp_path):
        """Test saving to an existing directory"""
        test_file = tmp_path / "test.json"
        test_data = {"key": "value", "list": [1, 2, 3]}

        result = save_json_file(test_file, test_data)
        assert result is True

        # Verify file contents
        with open(test_file, "r") as f:
            loaded_data = json.load(f)
        assert loaded_data == test_data

    def test_save_creates_directories(self, tmp_path):
        """Test that save_json_file creates parent directories"""
        test_file = tmp_path / "nested" / "dir" / "test.json"
        test_data = {"created": True}

        result = save_json_file(test_file, test_data, create_dirs=True)
        assert result is True
        assert test_file.exists()

    def test_save_unicode_data(self, tmp_path):
        """Test saving data with Unicode characters"""
        test_file = tmp_path / "unicode.json"
        test_data = {"name": "테스트", "emoji": "🎉"}

        result = save_json_file(test_file, test_data)
        assert result is True

        # Verify Unicode is preserved
        with open(test_file, "r", encoding="utf-8") as f:
            loaded_data = json.load(f)
        assert loaded_data == test_data


class TestEnsureDirectory:
    """Test ensure_directory function"""

    def test_create_new_directory(self, tmp_path):
        """Test creating a new directory"""
        test_dir = tmp_path / "new_dir"
        ensure_directory(test_dir)
        assert test_dir.exists()
        assert test_dir.is_dir()

    def test_create_nested_directories(self, tmp_path):
        """Test creating nested directories"""
        test_dir = tmp_path / "level1" / "level2" / "level3"
        ensure_directory(test_dir)
        assert test_dir.exists()
        assert test_dir.is_dir()

    def test_existing_directory(self, tmp_path):
        """Test ensuring an already existing directory"""
        test_dir = tmp_path / "existing"
        test_dir.mkdir()

        # Should not raise error
        ensure_directory(test_dir)
        assert test_dir.exists()


class TestDeleteFileSafe:
    """Test delete_file_safe function"""

    def test_delete_existing_file(self, tmp_path):
        """Test deleting an existing file"""
        test_file = tmp_path / "to_delete.txt"
        test_file.write_text("delete me")

        result = delete_file_safe(test_file)
        assert result is True
        assert not test_file.exists()

    def test_delete_nonexistent_file(self, tmp_path):
        """Test deleting a file that doesn't exist"""
        test_file = tmp_path / "nonexistent.txt"
        result = delete_file_safe(test_file)
        assert result is True  # Should return True for non-existent files


class TestFindById:
    """Test find_by_id function"""

    def test_find_existing_item(self):
        """Test finding an existing item"""
        items = [
            {"id": "1", "name": "Item 1"},
            {"id": "2", "name": "Item 2"},
            {"id": "3", "name": "Item 3"},
        ]

        result = find_by_id(items, "2")
        assert result == {"id": "2", "name": "Item 2"}

    def test_find_nonexistent_item(self):
        """Test finding an item that doesn't exist"""
        items = [
            {"id": "1", "name": "Item 1"},
            {"id": "2", "name": "Item 2"},
        ]

        result = find_by_id(items, "999")
        assert result is None

    def test_find_with_custom_id_field(self):
        """Test finding with custom ID field name"""
        items = [
            {"user_id": "alice", "name": "Alice"},
            {"user_id": "bob", "name": "Bob"},
        ]

        result = find_by_id(items, "bob", id_field="user_id")
        assert result == {"user_id": "bob", "name": "Bob"}

    def test_find_in_empty_list(self):
        """Test finding in an empty list"""
        items = []
        result = find_by_id(items, "any")
        assert result is None


class TestRemoveById:
    """Test remove_by_id function"""

    def test_remove_existing_item(self):
        """Test removing an existing item"""
        items = [
            {"id": "1", "name": "Item 1"},
            {"id": "2", "name": "Item 2"},
            {"id": "3", "name": "Item 3"},
        ]

        result = remove_by_id(items, "2")
        assert len(result) == 2
        assert {"id": "2", "name": "Item 2"} not in result

    def test_remove_nonexistent_item(self):
        """Test removing an item that doesn't exist"""
        items = [
            {"id": "1", "name": "Item 1"},
            {"id": "2", "name": "Item 2"},
        ]

        result = remove_by_id(items, "999")
        assert len(result) == 2
        assert result == items

    def test_remove_with_custom_id_field(self):
        """Test removing with custom ID field"""
        items = [
            {"user_id": "alice", "name": "Alice"},
            {"user_id": "bob", "name": "Bob"},
            {"user_id": "charlie", "name": "Charlie"},
        ]

        result = remove_by_id(items, "bob", id_field="user_id")
        assert len(result) == 2
        assert not any(item["user_id"] == "bob" for item in result)

    def test_remove_from_empty_list(self):
        """Test removing from an empty list"""
        items = []
        result = remove_by_id(items, "any")
        assert result == []
