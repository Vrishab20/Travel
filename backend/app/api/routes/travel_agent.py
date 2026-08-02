"""Travel-agent message and SSE streaming routes."""
import json
from collections.abc import AsyncIterator

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from langchain_core.messages import AIMessage, HumanMessage
from sse_starlette.sse import EventSourceResponse

from app.api.schemas.requests import AgentMessageRequest

router = APIRouter(tags=["travel-agent"])

NODE_STAGE_LABELS = {
    "extract_trip_preferences": ("collecting_requirements", "Understanding your trip"),
    "validate_trip_requirements": ("classifying_request", "Checking required details"),
    "ask_for_missing_information": ("awaiting_user_input", "Asking for missing details"),
    "classify_user_intent": ("classifying_request", "Understanding your request"),
    "dispatch_searches": ("searching_flights", "Starting provider searches"),
    "search_flights": ("searching_flights", "Searching flights"),
    "search_hotels": ("searching_hotels", "Comparing hotels"),
    "search_activities": ("searching_activities", "Finding activities"),
    "search_flights_only": ("searching_flights", "Searching flights"),
    "search_hotels_only": ("searching_hotels", "Comparing hotels"),
    "search_activities_only": ("searching_activities", "Finding activities"),
    "join_searches": ("assembling_plan", "Combining search results"),
    "generate_itinerary": ("building_itinerary", "Building your itinerary"),
    "calculate_budget": ("calculating_budget", "Estimating your budget"),
    "assemble_trip_plan": ("assembling_plan", "Finalizing your trip"),
    "summarize_results": ("ready", "Summarizing recommendations"),
    "answer_trip_question": ("ready", "Answering from your trip"),
    "reset_trip": ("collecting_requirements", "Resetting your trip"),
}


def _app_state(request: Request):
    return request.app.state.app_state


async def _ensure_trip(request: Request, trip_id: str, thread_id: str) -> dict:
    state = _app_state(request)
    trip = await state.trip_repo.get_trip(trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    if trip["thread_id"] != thread_id:
        raise HTTPException(status_code=400, detail="thread_id does not match trip")
    return trip


@router.post("/api/travel-agent/messages")
async def post_message(payload: AgentMessageRequest, request: Request):
    await _ensure_trip(request, payload.trip_id, payload.thread_id)
    state = _app_state(request)
    config = {"configurable": {"thread_id": payload.thread_id}}
    result = await state.graph.ainvoke(
        {"messages": [HumanMessage(content=payload.message)]},
        config=config,
    )
    if result.get("trip_plan"):
        await state.trip_repo.update_trip_plan(payload.trip_id, result["trip_plan"])

    summary = result.get("assistant_summary") or ""
    if not summary:
        for message in reversed(result.get("messages", [])):
            if isinstance(message, AIMessage):
                summary = str(message.content)
                break

    return JSONResponse(
        {
            "trip_id": payload.trip_id,
            "thread_id": payload.thread_id,
            "stage": result.get("current_stage"),
            "assistant_summary": summary,
            "trip_plan": result["trip_plan"].model_dump() if result.get("trip_plan") else None,
        }
    )


@router.post("/api/travel-agent/stream")
async def stream_message(payload: AgentMessageRequest, request: Request):
    await _ensure_trip(request, payload.trip_id, payload.thread_id)
    state = _app_state(request)
    config = {"configurable": {"thread_id": payload.thread_id}}

    async def event_generator() -> AsyncIterator[dict]:
        final_stage = "ready"
        try:
            async for update in state.graph.astream(
                {"messages": [HumanMessage(content=payload.message)]},
                config=config,
                stream_mode="updates",
            ):
                if not isinstance(update, dict):
                    continue
                for node_name, node_update in update.items():
                    if not isinstance(node_update, dict):
                        continue

                    stage_info = NODE_STAGE_LABELS.get(node_name)
                    if stage_info:
                        stage, label = stage_info
                        final_stage = node_update.get("current_stage", stage)
                        yield {
                            "event": "stage_changed",
                            "data": json.dumps(
                                {
                                    "type": "stage_changed",
                                    "stage": final_stage,
                                    "label": label,
                                }
                            ),
                        }

                    if node_name in {
                        "search_flights",
                        "search_flights_only",
                        "search_hotels",
                        "search_hotels_only",
                        "search_activities",
                        "search_activities_only",
                    }:
                        provider = (
                            "flights"
                            if "flight" in node_name
                            else "hotels"
                            if "hotel" in node_name
                            else "activities"
                        )
                        yield {
                            "event": "provider_started",
                            "data": json.dumps(
                                {"type": "provider_started", "provider": provider}
                            ),
                        }
                        statuses = node_update.get("provider_statuses") or {}
                        status = statuses.get(provider)
                        if status == "failed":
                            errors = node_update.get("errors") or []
                            message = "Provider failed"
                            if errors:
                                err = errors[-1]
                                message = getattr(err, "message", None) or (
                                    err.get("message") if isinstance(err, dict) else message
                                )
                            yield {
                                "event": "provider_failed",
                                "data": json.dumps(
                                    {
                                        "type": "provider_failed",
                                        "provider": provider,
                                        "recoverable": True,
                                        "message": message,
                                    }
                                ),
                            }
                        else:
                            count_key = {
                                "flights": "flight_results",
                                "hotels": "hotel_results",
                                "activities": "activity_results",
                            }[provider]
                            count = len(node_update.get(count_key) or [])
                            yield {
                                "event": "provider_completed",
                                "data": json.dumps(
                                    {
                                        "type": "provider_completed",
                                        "provider": provider,
                                        "result_count": count,
                                    }
                                ),
                            }

                    if node_update.get("trip_plan") is not None:
                        trip_plan = node_update["trip_plan"]
                        await state.trip_repo.update_trip_plan(payload.trip_id, trip_plan)
                        yield {
                            "event": "trip_plan_updated",
                            "data": json.dumps(
                                {
                                    "type": "trip_plan_updated",
                                    "trip_plan": trip_plan.model_dump(),
                                }
                            ),
                        }

                    for message in node_update.get("messages") or []:
                        if isinstance(message, AIMessage):
                            yield {
                                "event": "assistant_token",
                                "data": json.dumps(
                                    {
                                        "type": "assistant_token",
                                        "content": str(message.content),
                                    }
                                ),
                            }

            snapshot = await state.graph.aget_state(config)
            values = snapshot.values if snapshot else {}
            final_stage = values.get("current_stage", final_stage)
            yield {
                "event": "graph_completed",
                "data": json.dumps(
                    {"type": "graph_completed", "stage": final_stage}
                ),
            }
        except Exception as exc:  # noqa: BLE001
            yield {
                "event": "error",
                "data": json.dumps({"type": "error", "message": str(exc)}),
            }

    return EventSourceResponse(event_generator())
