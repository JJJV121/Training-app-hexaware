import json
import logging
from typing import Optional
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    WebSocket,
    WebSocketDisconnect,
    status,
)
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.session import get_db
from app.core.dependencies import get_current_user
from app.core.security import verify_access_token
from app.models.user import User
from app.models.messaging import Conversation
from app.schemas.messaging import (
    CommunityCreate,
    CommunityMemberRead,
    CommunityRead,
    ConversationRead,
    DirectConversationCreate,
    MessageCreate,
    MessageRead,
)
from app.services import messaging_service
from app.services.websocket_manager import manager

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Messaging & Community"])


# ============================================================
# CONTACTS & ELIGIBILITY
# ============================================================

@router.get("/api/messaging/contacts", response_model=list[dict])
async def get_messaging_contacts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns list of contacts authorized for current user to message:
    - Trainee -> Assigned Trainer/Mentors
    - Trainer -> Assigned Trainees
    """
    return await messaging_service.get_authorized_contacts_for_user(db, current_user)


# ============================================================
# CONVERSATIONS (REST APIs)
# ============================================================

@router.get("/api/messaging/conversations", response_model=list[ConversationRead])
async def list_user_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Fetch all conversations (DIRECT and COMMUNITY) for current user with unread counts and last message.
    """
    return await messaging_service.get_user_conversations(db, current_user)


@router.get("/api/messaging/conversations/{conversation_id}", response_model=ConversationRead)
async def get_conversation_details(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Fetch single conversation details by ID with authorization check.
    """
    return await messaging_service.get_conversation_by_id(db, conversation_id, current_user)


@router.post("/api/messaging/conversations", response_model=ConversationRead)
async def start_or_get_direct_conversation(
    payload: DirectConversationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get or create 1-to-1 direct conversation with an authorized mentor/trainee.
    """
    conv = await messaging_service.get_or_create_direct_conversation(
        db=db,
        current_user=current_user,
        target_user_id=payload.target_user_id
    )
    return await messaging_service.get_conversation_by_id(db, conv.id, current_user)


@router.get("/api/messaging/conversations/{conversation_id}/messages", response_model=list[MessageRead])
async def fetch_messages_for_conversation(
    conversation_id: int,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Fetch message history for conversation.
    """
    return await messaging_service.get_messages_for_conversation(
        db=db,
        conversation_id=conversation_id,
        current_user=current_user,
        limit=limit,
        offset=offset
    )


@router.post("/api/messaging/conversations/{conversation_id}/messages", response_model=MessageRead)
async def post_message_to_conversation(
    conversation_id: int,
    payload: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Post message via REST endpoint.
    """
    return await messaging_service.send_message(
        db=db,
        conversation_id=conversation_id,
        current_user=current_user,
        content=payload.content
    )


@router.patch("/api/messaging/conversations/{conversation_id}/read")
async def mark_messages_as_read(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Marks messages in conversation as read for current user.
    """
    return await messaging_service.mark_conversation_as_read(
        db=db,
        conversation_id=conversation_id,
        current_user=current_user
    )


# ============================================================
# COMMUNITIES (REST APIs)
# ============================================================

@router.get("/api/communities", response_model=list[CommunityRead])
async def list_communities(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List all communities with member count and membership status.
    """
    return await messaging_service.get_all_communities(db, current_user)


@router.post("/api/communities", response_model=CommunityRead)
async def create_community(
    payload: CommunityCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new community.
    """
    now = messaging_service.datetime.utcnow()
    from app.models.messaging import Community, Conversation

    comm = Community(
        name=payload.name.strip(),
        description=payload.description.strip() if payload.description else None,
        created_by=current_user.id,
        created_at=now,
        updated_at=now
    )
    db.add(comm)
    await db.flush()

    conv = Conversation(
        conversation_type="COMMUNITY",
        community_id=comm.id,
        created_at=now,
        updated_at=now
    )
    db.add(conv)
    await db.commit()

    # Automatically join creator to community
    await messaging_service.join_community(db, comm.id, current_user)

    all_comms = await messaging_service.get_all_communities(db, current_user)
    target = next((c for c in all_comms if c["id"] == comm.id), None)
    if not target:
        raise HTTPException(status_code=500, detail="Failed to retrieve created community")
    return target


@router.get("/api/communities/{community_id}", response_model=CommunityRead)
async def get_community_by_id(
    community_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get community details.
    """
    all_comms = await messaging_service.get_all_communities(db, current_user)
    target = next((c for c in all_comms if c["id"] == community_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Community not found")
    return target


@router.post("/api/communities/{community_id}/join")
async def join_community_endpoint(
    community_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Join a community.
    """
    return await messaging_service.join_community(db, community_id, current_user)


@router.delete("/api/communities/{community_id}/leave")
async def leave_community_endpoint(
    community_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Leave a community.
    """
    return await messaging_service.leave_community(db, community_id, current_user)


@router.get("/api/communities/{community_id}/members", response_model=list[CommunityMemberRead])
async def get_community_members_endpoint(
    community_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List members of a community.
    """
    return await messaging_service.get_community_members(db, community_id, current_user)


@router.get("/api/communities/{community_id}/messages", response_model=list[MessageRead])
async def get_community_messages(
    community_id: int,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Fetch message history for a community channel.
    """
    conv_stmt = select(Conversation).where(Conversation.community_id == community_id)
    res = await db.execute(conv_stmt)
    conv = res.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Community conversation not found")

    return await messaging_service.get_messages_for_conversation(
        db=db,
        conversation_id=conv.id,
        current_user=current_user,
        limit=limit,
        offset=offset
    )


@router.post("/api/communities/{community_id}/messages", response_model=MessageRead)
async def post_community_message(
    community_id: int,
    payload: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Post message to a community channel.
    """
    conv_stmt = select(Conversation).where(Conversation.community_id == community_id)
    res = await db.execute(conv_stmt)
    conv = res.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Community conversation not found")

    return await messaging_service.send_message(
        db=db,
        conversation_id=conv.id,
        current_user=current_user,
        content=payload.content
    )


# ============================================================
# WEBSOCKET ENDPOINT
# ============================================================

@router.websocket("/ws/messaging/{conversation_id}")
async def websocket_messaging_endpoint(
    websocket: WebSocket,
    conversation_id: int,
    token: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """
    WebSocket endpoint for real-time bi-directional messaging in conversation_id.
    """
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Missing authentication token")
        return

    try:
        payload = verify_access_token(token)
        user_id = int(payload["sub"])
    except Exception as e:
        logger.warning(f"WebSocket auth failed: {e}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid authentication token")
        return

    # Fetch user from DB
    user_stmt = select(User).where(User.id == user_id)
    res = await db.execute(user_stmt)
    user = res.scalar_one_or_none()
    if not user:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="User not found")
        return

    # Verify conversation participant authorization
    try:
        await messaging_service.ensure_conversation_participant(db, conversation_id, user.id)
    except HTTPException:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Access denied to conversation")
        return

    # Accept & register connection
    await manager.connect(websocket, conversation_id, user.id)

    try:
        while True:
            data_str = await websocket.receive_text()
            try:
                data = json.loads(data_str)
            except Exception:
                continue

            msg_type = data.get("type")

            if msg_type == "PING":
                await websocket.send_json({"type": "PONG"})

            elif msg_type == "SEND_MESSAGE":
                content = data.get("content", "").strip()
                if content:
                    await messaging_service.send_message(
                        db=db,
                        conversation_id=conversation_id,
                        current_user=user,
                        content=content
                    )

            elif msg_type == "TYPING":
                # Broadcast typing event to other members of the conversation
                await manager.broadcast_to_conversation(conversation_id, {
                    "type": "TYPING",
                    "user_id": user.id,
                    "user_name": user.name or user.email.split("@")[0],
                    "conversation_id": conversation_id
                })

            elif msg_type == "MARK_READ":
                await messaging_service.mark_conversation_as_read(db, conversation_id, user)

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket exception: {e}")
        manager.disconnect(websocket)
