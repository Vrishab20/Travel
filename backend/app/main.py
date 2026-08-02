"""FastAPI application entrypoint."""
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import api_router
from app.config import settings
from app.core.errors import AppError, NotFoundError, ValidationError
from app.core.logging import configure_logging
from app.dependencies import create_app_state


configure_logging(settings.log_level)


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.app_state = create_app_state()
    yield
    await app.state.app_state.http_client.aclose()


app = FastAPI(
    title="Atlas Travel Agent API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.exception_handler(AppError)
async def app_error_handler(_request: Request, exc: AppError):
    status = 400
    if isinstance(exc, NotFoundError):
        status = 404
    elif isinstance(exc, ValidationError):
        status = 422
    return JSONResponse(
        status_code=status,
        content={"error": exc.message, "details": exc.details},
    )
