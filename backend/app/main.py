"""
BioLens AI - FastAPI Main Application Entrypoint
Configures middlewares, registers global exception handlers, and mounts all v1 routers.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.api.auth import router as auth_router
from app.api.reports import router as reports_router
from app.api.analytics import router as analytics_router
from app.api.risks import router as risks_router
from app.api.chat import router as chat_router
from app.api.notifications import router as notifications_router
from app.api.admin import router as admin_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="BioLens AI is an enterprise-grade AI-powered health intelligence platform that extracts and analyzes laboratory medical reports.",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
)

# CORS configuration
# Allowing all origins in development; configure restrictively in production using environment variables.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register global exception handlers
register_exception_handlers(app)

# Include v1 routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(reports_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)
app.include_router(risks_router, prefix=settings.API_V1_STR)
app.include_router(chat_router, prefix=settings.API_V1_STR)
app.include_router(notifications_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Health Check"])
def root():
    """Root health check endpoint."""
    return {
        "status": "healthy",
        "service": "BioLens AI API",
        "version": "1.0.0"
    }
