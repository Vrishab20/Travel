"""API route package."""
from fastapi import APIRouter

from app.api.routes import health, travel_agent, trips

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(trips.router)
api_router.include_router(travel_agent.router)
