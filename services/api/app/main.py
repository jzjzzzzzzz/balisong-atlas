import logging
import time
from collections import defaultdict, deque
from collections.abc import Awaitable, Callable
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from app.ai.providers.factory import get_ai_provider
from app.api.routes import (
    artifacts,
    assets,
    auth,
    claims,
    evidence,
    jobs,
    projects,
    public,
    reconstruction,
    search,
    sources,
)
from app.core.config import get_settings
from app.core.errors import AtlasError, atlas_error_handler
from app.core.logging import configure_logging
from app.core.security import csrf_matches

configure_logging()
logger = logging.getLogger(__name__)
settings = get_settings()


class SecurityMiddleware(BaseHTTPMiddleware):
    requests: dict[str, deque[float]] = defaultdict(deque)

    async def dispatch(self, request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
        request_id = request.headers.get("x-request-id", str(uuid4()))[:100]
        request.state.request_id = request_id
        client = request.client.host if request.client else "unknown"
        now = time.monotonic()
        bucket = self.requests[client]
        while bucket and bucket[0] < now - 60:
            bucket.popleft()
        if len(bucket) >= 120:
            return JSONResponse(status_code=429, content={"error": {"code": "rate_limited", "message": "Too many requests", "request_id": request_id}})
        bucket.append(now)
        unsafe = request.method not in {"GET", "HEAD", "OPTIONS"}
        authenticated = bool(request.cookies.get(settings.session_cookie_name))
        exempt = request.url.path.endswith("/auth/login") or "/public/" in request.url.path
        if unsafe and authenticated and not exempt and not csrf_matches(request.cookies.get(settings.csrf_cookie_name), request.headers.get("x-csrf-token")):
            return JSONResponse(status_code=403, content={"error": {"code": "csrf_failed", "message": "CSRF token validation failed", "request_id": request_id}})
        response = await call_next(request)
        response.headers["x-request-id"] = request_id
        response.headers["x-content-type-options"] = "nosniff"
        response.headers["x-frame-options"] = "DENY"
        response.headers["referrer-policy"] = "strict-origin-when-cross-origin"
        logger.info("request_completed", extra={"request_id": request_id, "method": request.method, "path": request.url.path, "status": response.status_code})
        return response


app = FastAPI(
    title="Balisong Atlas API",
    version="0.1.0",
    description="Evidence-first archive, review, and nonfunctional museum visualization API",
    docs_url="/docs" if not settings.production else None,
    redoc_url="/redoc" if not settings.production else None,
)
app.add_middleware(SecurityMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.public_base_url],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
    allow_headers=["content-type", "x-csrf-token", "x-request-id"],
)
app.add_exception_handler(AtlasError, atlas_error_handler)  # type: ignore[arg-type]


@app.exception_handler(StarletteHTTPException)
async def http_error(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    detail = exc.detail
    message = detail if isinstance(detail, str) else "Request could not be completed"
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {
            "code": "http_error", "message": message, "details": detail,
            "request_id": getattr(request.state, "request_id", ""),
        }},
    )


@app.exception_handler(RequestValidationError)
async def validation_error(request: Request, exc: RequestValidationError) -> JSONResponse:
    details = [
        {key: value for key, value in error.items() if key not in {"input", "ctx", "url"}}
        for error in exc.errors()
    ]
    return JSONResponse(status_code=422, content={"error": {"code": "validation_error", "message": "Request validation failed", "details": details, "request_id": getattr(request.state, "request_id", "")}})


@app.exception_handler(Exception)
async def unexpected_error(request: Request, exc: Exception) -> JSONResponse:
    request_id = getattr(request.state, "request_id", "")
    logger.error(
        "unhandled_request_error",
        extra={"request_id": request_id, "error_type": type(exc).__name__},
    )
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "internal_error",
                "message": "The request could not be completed",
                "request_id": request_id,
            }
        },
    )


@app.get("/health")
async def health() -> dict[str, object]:
    ai = await get_ai_provider().health_check()
    from app.services.reconstruction.backend import SafeProxyBackend

    return {"status": "ok", "service": "balisong-atlas-api", "ai": ai, "safe_proxy": SafeProxyBackend().capability()}


for router in (auth.router, projects.router, artifacts.router, sources.router, assets.router, claims.router, evidence.router, search.router, reconstruction.router, jobs.router, public.router):
    app.include_router(router, prefix="/api/v1")
