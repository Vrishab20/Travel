"""Trip initialization and retrieval routes."""
import uuid

from fastapi import APIRouter, HTTPException, Request
from langchain_core.messages import AIMessage

from app.api.schemas.requests import CreateTripRequest
from app.api.schemas.responses import CreateTripResponse, TripResponse
from app.models.trip_preferences import TripPreferences

router = APIRouter(tags=["trips"])


def _app_state(request: Request):
    return request.app.state.app_state


@router.post("/api/trips", response_model=CreateTripResponse)
async def create_trip(payload: CreateTripRequest, request: Request) -> CreateTripResponse:
    state = _app_state(request)
    trip_id = f"trip_{uuid.uuid4().hex[:12]}"
    thread_id = f"thread_{uuid.uuid4().hex[:12]}"

    preferences = TripPreferences(
        origin_country=payload.origin_country,
        destination_country=payload.destination_country,
    )

    await state.trip_repo.create_trip(
        trip_id=trip_id,
        thread_id=thread_id,
        origin_country=payload.origin_country,
        destination_country=payload.destination_country,
    )

    config = {"configurable": {"thread_id": thread_id}}
    greeting = (
        f"Planning {payload.origin_country} → {payload.destination_country}. "
        "Share your departure city, destination cities, dates, and traveller count to begin."
    )
    await state.graph.aupdate_state(
        config,
        {
            "trip_id": trip_id,
            "thread_id": thread_id,
            "preferences": preferences,
            "missing_required_fields": [
                "origin_city",
                "destination_cities",
                "departure_date",
                "return_date",
            ],
            "flight_results": [],
            "hotel_results": [],
            "activity_results": [],
            "selected_flight_id": None,
            "selected_hotel_ids": [],
            "itinerary": [],
            "budget": None,
            "trip_plan": None,
            "user_intent": None,
            "affected_sections": [],
            "provider_statuses": {},
            "errors": [],
            "assumptions": [],
            "current_stage": "collecting_requirements",
            "should_ask_user": True,
            "should_search": False,
            "should_rebuild_itinerary": False,
            "should_recalculate_budget": False,
            "assistant_summary": greeting,
            "messages": [AIMessage(content=greeting)],
        },
    )

    return CreateTripResponse(trip_id=trip_id, thread_id=thread_id, status="created")


@router.get("/api/trips/{trip_id}", response_model=TripResponse)
async def get_trip(trip_id: str, request: Request) -> TripResponse:
    state = _app_state(request)
    trip = await state.trip_repo.get_trip(trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    thread_id = trip["thread_id"]
    snapshot = await state.graph.aget_state({"configurable": {"thread_id": thread_id}})
    values = snapshot.values if snapshot else {}
    trip_plan = values.get("trip_plan") or trip.get("trip_plan")

    return TripResponse(
        trip_id=trip_id,
        thread_id=thread_id,
        trip_plan=trip_plan,
        status=trip_plan.status if trip_plan else trip.get("status", "created"),
        current_stage=values.get("current_stage"),
        assistant_summary=values.get("assistant_summary"),
    )


@router.post("/api/trips/{trip_id}/reset", response_model=TripResponse)
async def reset_trip(trip_id: str, request: Request) -> TripResponse:
    state = _app_state(request)
    trip = await state.trip_repo.get_trip(trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    await state.trip_repo.reset_trip(trip_id)
    thread_id = trip["thread_id"]
    preferences = TripPreferences(
        origin_country=trip["origin_country"],
        destination_country=trip["destination_country"],
    )
    config = {"configurable": {"thread_id": thread_id}}
    await state.graph.aupdate_state(
        config,
        {
            "preferences": preferences,
            "trip_plan": None,
            "flight_results": [],
            "hotel_results": [],
            "activity_results": [],
            "itinerary": [],
            "budget": None,
            "selected_flight_id": None,
            "selected_hotel_ids": [],
            "errors": [],
            "assumptions": [],
            "current_stage": "collecting_requirements",
            "missing_required_fields": [
                "origin_city",
                "destination_cities",
                "departure_date",
                "return_date",
            ],
        },
    )
    return TripResponse(
        trip_id=trip_id,
        thread_id=thread_id,
        trip_plan=None,
        status="reset",
        current_stage="collecting_requirements",
    )
