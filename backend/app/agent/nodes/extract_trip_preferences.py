"""Extract trip preferences from user message."""
import re
from datetime import datetime, timedelta

from langchain_core.messages import HumanMessage

from app.agent.state import TravelAgentState
from app.models.trip_preferences import TripPreferences


def extract_trip_preferences(state: TravelAgentState) -> dict:
    messages = state.get("messages", [])
    if not messages:
        return {}

    latest_msg = None
    for msg in reversed(messages):
        if isinstance(msg, HumanMessage):
            latest_msg = str(msg.content)
            break
    if not latest_msg:
        return {}

    existing = state.get("preferences")
    if existing:
        prefs_dict = existing.model_dump()
    else:
        prefs_dict = {
            "origin_country": "",
            "destination_country": "",
            "destination_cities": [],
            "travellers": {"adults": 1, "children": 0, "infants": 0},
            "interests": [],
        }

    text = latest_msg
    lower = latest_msg.lower()

    labeled_origin = re.search(r"origin\s*city\s*:\s*([^\n,]+)", text, re.I)
    if labeled_origin:
        prefs_dict["origin_city"] = labeled_origin.group(1).strip()

    labeled_dest = re.search(r"destination\s*cities?\s*:\s*([^\n]+)", text, re.I)
    if labeled_dest:
        cities = [part.strip() for part in labeled_dest.group(1).split(",") if part.strip()]
        if cities:
            prefs_dict["destination_cities"] = cities

    labeled_dep = re.search(r"departure\s*:\s*(\d{4}-\d{2}-\d{2})", text, re.I)
    if labeled_dep:
        prefs_dict["departure_date"] = labeled_dep.group(1)

    labeled_ret = re.search(r"return\s*:\s*(\d{4}-\d{2}-\d{2})", text, re.I)
    if labeled_ret:
        prefs_dict["return_date"] = labeled_ret.group(1)

    labeled_adults = re.search(r"adults?\s*:\s*(\d+)", text, re.I)
    if labeled_adults:
        travellers = dict(prefs_dict.get("travellers") or {})
        travellers["adults"] = int(labeled_adults.group(1))
        travellers.setdefault("children", 0)
        travellers.setdefault("infants", 0)
        prefs_dict["travellers"] = travellers

    labeled_budget = re.search(
        r"budget\s*:\s*([A-Z]{3})?\s*(\d+(?:\.\d+)?)", text, re.I
    )
    if labeled_budget:
        prefs_dict["budget"] = {
            "amount": float(labeled_budget.group(2)),
            "currency": (labeled_budget.group(1) or "USD").upper(),
        }

    labeled_style = re.search(r"style\s*:\s*(\w+)", text, re.I)
    if labeled_style:
        style = labeled_style.group(1).lower()
        if style in {"budget", "balanced", "comfort", "luxury"}:
            prefs_dict["travel_style"] = style

    labeled_interests = re.search(r"interests?\s*:\s*([^\n]+)", text, re.I)
    if labeled_interests:
        prefs_dict["interests"] = [
            part.strip() for part in labeled_interests.group(1).split(",") if part.strip()
        ]

    if not prefs_dict.get("origin_city"):
        city_match = re.search(
            r"(?:from|leaving from|departing from)\s+([A-Za-z][A-Za-z\-]+(?:\s+[A-Za-z][A-Za-z\-]+)?)",
            text,
            re.I,
        )
        if city_match:
            candidate = city_match.group(1).strip()
            if candidate.lower() not in {"a", "the"} and "city" not in candidate.lower():
                # Stop if the second word is a connector (e.g. "Toronto to")
                parts = candidate.split()
                if len(parts) > 1 and parts[1].lower() in {"to", "for", "on", "in"}:
                    candidate = parts[0]
                prefs_dict["origin_city"] = candidate.title()

    if not prefs_dict.get("destination_cities"):
        dest_match = re.search(
            r"(?:\bto\b|\bvisit(?:ing)?\b)\s+([A-Za-z][A-Za-z\-]+(?:\s+[A-Za-z][A-Za-z\-]+)?)",
            text,
            re.I,
        )
        if dest_match:
            city = dest_match.group(1).strip().title()
            if city.lower() not in {"the", "a"}:
                prefs_dict["destination_cities"] = [city]

    dates = re.findall(r"\b(\d{4}-\d{2}-\d{2})\b", text)
    if len(dates) >= 2:
        prefs_dict["departure_date"] = prefs_dict.get("departure_date") or dates[0]
        prefs_dict["return_date"] = prefs_dict.get("return_date") or dates[1]
    elif len(dates) == 1 and not prefs_dict.get("departure_date"):
        prefs_dict["departure_date"] = dates[0]

    days_match = re.search(r"(\d+)\s+days?", lower)
    if days_match and prefs_dict.get("departure_date") and not prefs_dict.get("return_date"):
        days = int(days_match.group(1))
        dep = datetime.fromisoformat(prefs_dict["departure_date"])
        prefs_dict["return_date"] = (dep + timedelta(days=days)).date().isoformat()

    adults_match = re.search(r"(\d+)\s+adults?", lower)
    if adults_match:
        travellers = dict(prefs_dict.get("travellers") or {})
        travellers["adults"] = int(adults_match.group(1))
        travellers.setdefault("children", 0)
        travellers.setdefault("infants", 0)
        prefs_dict["travellers"] = travellers

    budget_match = re.search(r"(?:budget|around)\s+(?:around\s+)?\$?(\d{3,5})\s*(usd|eur|cad)?", lower)
    if budget_match:
        prefs_dict["budget"] = {
            "amount": float(budget_match.group(1)),
            "currency": (budget_match.group(2) or "USD").upper(),
        }

    if "direct" in lower and "flight" in lower:
        flight_pref = dict(prefs_dict.get("flight_preference") or {})
        flight_pref["direct_flights_preferred"] = True
        prefs_dict["flight_preference"] = flight_pref

    if "luxury" in lower:
        prefs_dict["travel_style"] = "luxury"
    elif re.search(r"\bbudget\b", lower):
        prefs_dict["travel_style"] = "budget"
    elif "balanced" in lower:
        prefs_dict["travel_style"] = "balanced"

    if "vegetarian" in lower or "vegan" in lower:
        dietary = list(prefs_dict.get("dietary_preferences") or [])
        value = "vegan" if "vegan" in lower else "vegetarian"
        if value not in dietary:
            dietary.append(value)
        prefs_dict["dietary_preferences"] = dietary

    interests = list(prefs_dict.get("interests") or [])
    for word in ("food", "museums", "walking", "nightlife", "nature"):
        if word in lower and word not in interests:
            interests.append(word)
    prefs_dict["interests"] = interests

    try:
        updated = TripPreferences(**prefs_dict)
        return {"preferences": updated, "current_stage": "collecting_requirements"}
    except Exception:
        return {"current_stage": "collecting_requirements"}
