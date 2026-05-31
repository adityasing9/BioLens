from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger("biolens_logger")

class APIException(Exception):
    def __init__(self, status_code: int, message: str, details: dict = None):
        super().__init__(message)
        self.status_code = status_code
        self.message = message
        self.details = details or {}

def register_exception_handlers(app):
    """Registers standard handlers globally onto the FastAPI instance."""
    
    @app.exception_handler(APIException)
    async def api_exception_handler(request: Request, exc: APIException):
        logger.warning(f"API Warning: {exc.message} on {request.url.path}")
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "status": "error",
                "message": exc.message,
                "details": exc.details
            }
        )

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "status": "error",
                "message": exc.detail,
                "details": {}
            }
        )

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled System Error: {str(exc)} on {request.url.path}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": "An internal system error occurred. Please contact support.",
                "details": {}
            }
        )
