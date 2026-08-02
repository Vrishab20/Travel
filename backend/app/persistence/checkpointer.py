"""LangGraph checkpointer configuration."""
from langgraph.checkpoint.memory import MemorySaver

from app.config import settings


_checkpointer: MemorySaver | None = None


def get_checkpointer() -> MemorySaver:
    """Get or create the singleton checkpointer instance."""
    global _checkpointer
    
    if _checkpointer is None:
        if settings.langgraph_checkpointer == "memory":
            _checkpointer = MemorySaver()
        else:
            raise ValueError(f"Unknown checkpointer: {settings.langgraph_checkpointer}")
    
    return _checkpointer
