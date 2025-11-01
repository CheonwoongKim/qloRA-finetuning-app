"""
Shared storage utilities for JSON file operations.
Eliminates duplicate code across multiple route files.
"""

from pathlib import Path
from typing import Any, List, Dict, TypeVar, Optional
import json
import logging

logger = logging.getLogger(__name__)

T = TypeVar('T')


def load_json_file(
    file_path: Path,
    default: Any = None
) -> Any:
    """
    Load data from a JSON file.

    Args:
        file_path: Path to the JSON file
        default: Default value to return if file doesn't exist or on error

    Returns:
        Parsed JSON data or default value
    """
    if default is None:
        default = []

    if not file_path.exists():
        return default

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error in {file_path}: {e}")
        return default
    except Exception as e:
        logger.error(f"Error loading {file_path}: {e}")
        return default


def save_json_file(
    file_path: Path,
    data: Any,
    create_dirs: bool = True
) -> bool:
    """
    Save data to a JSON file.

    Args:
        file_path: Path to the JSON file
        data: Data to save (must be JSON serializable)
        create_dirs: Whether to create parent directories if they don't exist

    Returns:
        True if successful, False otherwise
    """
    try:
        if create_dirs:
            file_path.parent.mkdir(parents=True, exist_ok=True)

        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        logger.error(f"Error saving {file_path}: {e}")
        return False


def ensure_directory(directory: Path) -> None:
    """
    Ensure a directory exists, creating it if necessary.

    Args:
        directory: Path to the directory
    """
    try:
        directory.mkdir(parents=True, exist_ok=True)
    except Exception as e:
        logger.error(f"Error creating directory {directory}: {e}")
        raise


def delete_file_safe(file_path: Path) -> bool:
    """
    Safely delete a file, handling errors gracefully.

    Args:
        file_path: Path to the file to delete

    Returns:
        True if file was deleted or didn't exist, False on error
    """
    if not file_path.exists():
        return True

    try:
        file_path.unlink()
        return True
    except Exception as e:
        logger.error(f"Error deleting {file_path}: {e}")
        return False


def find_by_id(
    items: List[Dict[str, Any]],
    item_id: str,
    id_field: str = "id"
) -> Optional[Dict[str, Any]]:
    """
    Find an item in a list by its ID field.

    Args:
        items: List of items (dictionaries)
        item_id: ID to search for
        id_field: Name of the ID field (default: "id")

    Returns:
        Found item or None
    """
    return next((item for item in items if item.get(id_field) == item_id), None)


def remove_by_id(
    items: List[Dict[str, Any]],
    item_id: str,
    id_field: str = "id"
) -> List[Dict[str, Any]]:
    """
    Remove an item from a list by its ID field.

    Args:
        items: List of items (dictionaries)
        item_id: ID to remove
        id_field: Name of the ID field (default: "id")

    Returns:
        New list without the item
    """
    return [item for item in items if item.get(id_field) != item_id]
