"""Custom reducers for state management."""
from typing import Any


def replace_list(_existing: list, new: list) -> list:
    """Replace the entire list (parallel nodes own their keys)."""
    return new


def merge_provider_statuses(existing: dict, new: dict) -> dict:
    """Merge provider status dictionaries."""
    merged = existing.copy() if existing else {}
    if new:
        merged.update(new)
    return merged


def append_errors(existing: list, new: list) -> list:
    """Append new errors to existing list."""
    result = existing.copy() if existing else []
    if new:
        result.extend(new)
    return result


def append_assumptions(existing: list, new: list) -> list:
    """Append new assumptions to existing list."""
    result = existing.copy() if existing else []
    if new:
        result.extend(new)
    return result


def append_sections(existing: list, new: list) -> list:
    """Append affected sections without duplicates."""
    result = existing.copy() if existing else []
    if new:
        for section in new:
            if section not in result:
                result.append(section)
    return result


def last_value(existing, new):
    """Keep the latest write (safe for parallel nodes)."""
    return new if new is not None else existing
