from app.api.companies import router as companies_router
from app.api.documents import router as documents_router
from app.api.analysis import router as analysis_router
from app.api.vtuber import router as vtuber_router
from app.api.auth import router as auth_router
from app.api.crawlers import router as crawlers_router
from app.api.public import router as public_router

__all__ = [
    "companies_router",
    "documents_router",
    "analysis_router",
    "vtuber_router",
    "auth_router",
    "crawlers_router",
    "public_router",
] 