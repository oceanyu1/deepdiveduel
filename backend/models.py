from typing import List, Optional

from pydantic import BaseModel


class AgentStep(BaseModel):
    type: str = "update"
    node: str
    parent: Optional[str] = None
    status: Optional[str] = None
    path: List[str]
    wikipedia_url: Optional[str] = None
    duration_ms: float = 0
    agent_model: str = "meta-llama/llama-3-70b-instruct"
    agent_type: str
