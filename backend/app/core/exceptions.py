"""
Custom exceptions and error handlers for the API
"""
from typing import Optional, Any, Dict
from fastapi import HTTPException, status


class AppException(HTTPException):
    """Base application exception"""

    def __init__(
        self,
        status_code: int,
        detail: str,
        error_code: Optional[str] = None,
        data: Optional[Dict[str, Any]] = None
    ):
        super().__init__(status_code=status_code, detail=detail)
        self.error_code = error_code
        self.data = data


class ResourceNotFoundError(AppException):
    """Resource not found exception"""

    def __init__(self, resource_type: str, resource_id: str):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{resource_type} not found: {resource_id}",
            error_code="RESOURCE_NOT_FOUND",
            data={"resource_type": resource_type, "resource_id": resource_id}
        )


class ResourceAlreadyExistsError(AppException):
    """Resource already exists exception"""

    def __init__(self, resource_type: str, resource_id: str):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"{resource_type} already exists: {resource_id}",
            error_code="RESOURCE_ALREADY_EXISTS",
            data={"resource_type": resource_type, "resource_id": resource_id}
        )


class ValidationError(AppException):
    """Validation error exception"""

    def __init__(self, detail: str, field: Optional[str] = None):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail,
            error_code="VALIDATION_ERROR",
            data={"field": field} if field else None
        )


class OperationError(AppException):
    """Operation failed exception"""

    def __init__(self, operation: str, reason: str):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Operation '{operation}' failed: {reason}",
            error_code="OPERATION_ERROR",
            data={"operation": operation, "reason": reason}
        )
