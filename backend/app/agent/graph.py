"""Build and compile the travel LangGraph."""
from functools import partial
from typing import Any

from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, StateGraph

from app.agent.nodes.answer_trip_question import answer_trip_question
from app.agent.nodes.ask_for_missing_information import ask_for_missing_information
from app.agent.nodes.assemble_trip_plan import assemble_trip_plan
from app.agent.nodes.calculate_budget import calculate_budget_node
from app.agent.nodes.classify_user_intent import classify_user_intent
from app.agent.nodes.extract_trip_preferences import extract_trip_preferences
from app.agent.nodes.generate_itinerary import generate_itinerary_node
from app.agent.nodes.handle_partial_failure import handle_partial_failure
from app.agent.nodes.reset_trip import reset_trip
from app.agent.nodes.search_activities import search_activities
from app.agent.nodes.search_flights import search_flights
from app.agent.nodes.search_hotels import search_hotels
from app.agent.nodes.summarize_results import summarize_results
from app.agent.nodes.validate_trip_requirements import validate_trip_requirements
from app.agent.routing import (
    route_after_extract,
    route_after_validation,
    route_refinement,
)
from app.agent.state import TravelAgentState
from app.providers.flights.base import FlightProvider
from app.providers.hotels.base import HotelProvider
from app.providers.places.base import PlacesProvider


def _dispatch_searches(state: TravelAgentState) -> dict:
    return {"current_stage": "searching_flights", "should_search": True}


def build_travel_graph(
    *,
    checkpointer: MemorySaver,
    flight_provider: FlightProvider,
    hotel_provider: HotelProvider,
    places_provider: PlacesProvider,
) -> Any:
    graph = StateGraph(TravelAgentState)

    graph.add_node("extract_trip_preferences", extract_trip_preferences)
    graph.add_node("validate_trip_requirements", validate_trip_requirements)
    graph.add_node("ask_for_missing_information", ask_for_missing_information)
    graph.add_node("classify_user_intent", classify_user_intent)
    graph.add_node("dispatch_searches", _dispatch_searches)
    graph.add_node(
        "search_flights",
        partial(search_flights, flight_provider=flight_provider),
    )
    graph.add_node(
        "search_hotels",
        partial(search_hotels, hotel_provider=hotel_provider),
    )
    graph.add_node(
        "search_activities",
        partial(search_activities, places_provider=places_provider),
    )
    graph.add_node("join_searches", handle_partial_failure)
    graph.add_node("generate_itinerary", generate_itinerary_node)
    graph.add_node("calculate_budget", calculate_budget_node)
    graph.add_node("assemble_trip_plan", assemble_trip_plan)
    graph.add_node("summarize_results", summarize_results)
    graph.add_node("answer_trip_question", answer_trip_question)
    graph.add_node("reset_trip", reset_trip)

    graph.add_edge(START, "extract_trip_preferences")
    graph.add_conditional_edges(
        "extract_trip_preferences",
        route_after_extract,
        {
            "classify_user_intent": "classify_user_intent",
            "validate_trip_requirements": "validate_trip_requirements",
        },
    )
    graph.add_conditional_edges(
        "validate_trip_requirements",
        route_after_validation,
        {
            "ask_for_missing_information": "ask_for_missing_information",
            "dispatch_searches": "dispatch_searches",
        },
    )
    graph.add_edge("ask_for_missing_information", END)

    graph.add_edge("dispatch_searches", "search_flights")
    graph.add_edge("dispatch_searches", "search_hotels")
    graph.add_edge("dispatch_searches", "search_activities")
    graph.add_edge("search_flights", "join_searches")
    graph.add_edge("search_hotels", "join_searches")
    graph.add_edge("search_activities", "join_searches")
    graph.add_edge("join_searches", "generate_itinerary")
    graph.add_edge("generate_itinerary", "calculate_budget")
    graph.add_edge("calculate_budget", "assemble_trip_plan")
    graph.add_edge("assemble_trip_plan", "summarize_results")
    graph.add_edge("summarize_results", END)

    graph.add_conditional_edges(
        "classify_user_intent",
        route_refinement,
        {
            "reset_trip": "reset_trip",
            "answer_trip_question": "answer_trip_question",
            "validate_trip_requirements": "validate_trip_requirements",
            "search_flights": "search_flights_only",
            "search_hotels": "search_hotels_only",
            "search_activities": "search_activities_only",
            "generate_itinerary": "generate_itinerary",
            "calculate_budget": "calculate_budget",
        },
    )

    # Dedicated refinement branches (avoid re-joining the full fan-out)
    graph.add_node(
        "search_flights_only",
        partial(search_flights, flight_provider=flight_provider),
    )
    graph.add_node(
        "search_hotels_only",
        partial(search_hotels, hotel_provider=hotel_provider),
    )
    graph.add_node(
        "search_activities_only",
        partial(search_activities, places_provider=places_provider),
    )

    graph.add_edge("search_flights_only", "calculate_budget")
    graph.add_edge("search_hotels_only", "generate_itinerary")
    graph.add_edge("search_activities_only", "generate_itinerary")
    graph.add_edge("answer_trip_question", END)
    graph.add_edge("reset_trip", END)

    return graph.compile(checkpointer=checkpointer)
