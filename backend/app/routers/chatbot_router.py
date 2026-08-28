from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.chatbot_service import process_chatbot_query, get_initial_suggestions

router = APIRouter(
    prefix="/chatbot",
    tags=["AI Chatbot"]
)


class ChatbotQueryRequest(BaseModel):
    query: str
    role: Optional[str] = None


@router.post("/query")
async def handle_chatbot_query(
    body: ChatbotQueryRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Handles user queries sent to the AI Chatbot Assistant.
    Determines user role and returns context-aware guidance with quick actions.
    """
    user_role = body.role or (current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role))
    response = process_chatbot_query(body.query, user_role=user_role)
    return response


@router.get("/suggestions")
async def handle_get_suggestions(
    role: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """
    Returns initial greeting and recommended prompts for the specified or authenticated user role.
    """
    user_role = role or (current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role))
    return get_initial_suggestions(user_role=user_role)
