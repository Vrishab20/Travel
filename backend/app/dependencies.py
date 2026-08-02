"""Application dependency container."""
from dataclasses import dataclass
from typing import Any

import httpx

from app.agent.graph import build_travel_graph
from app.persistence.checkpointer import get_checkpointer
from app.persistence.in_memory_trip_repository import InMemoryTripRepository
from app.providers.flights.factory import create_flight_provider
from app.providers.hotels.factory import create_hotel_provider
from app.providers.places.factory import create_places_provider


@dataclass
class AppState:
    graph: Any
    checkpointer: Any
    trip_repo: InMemoryTripRepository
    http_client: httpx.AsyncClient
    flight_provider: Any
    hotel_provider: Any
    places_provider: Any


def create_app_state() -> AppState:
    checkpointer = get_checkpointer()
    flight_provider = create_flight_provider()
    hotel_provider = create_hotel_provider()
    places_provider = create_places_provider()
    graph = build_travel_graph(
        checkpointer=checkpointer,
        flight_provider=flight_provider,
        hotel_provider=hotel_provider,
        places_provider=places_provider,
    )
    return AppState(
        graph=graph,
        checkpointer=checkpointer,
        trip_repo=InMemoryTripRepository(),
        http_client=httpx.AsyncClient(timeout=30.0),
        flight_provider=flight_provider,
        hotel_provider=hotel_provider,
        places_provider=places_provider,
    )
