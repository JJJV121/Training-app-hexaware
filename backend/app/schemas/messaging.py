from datetime import datetime
from pydantic import BaseModel, Field


# --- User Info for Messaging ---
class UserMessagingInfo(BaseModel):
    id: int
    name: str | None = None
    email: str
    role: str | None = None
    avatar: str | None = None
    is_online: bool = False

    class Config:
        from_attributes = True


# --- Messages ---
class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)


class MessageRead(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    sender_name: str
    sender_role: str | None = None
    content: str
    created_at: datetime
    updated_at: datetime
    is_deleted: bool = False
    is_read: bool = False

    class Config:
        from_attributes = True


# --- Conversations ---
class ConversationParticipantRead(BaseModel):
    user_id: int
    name: str | None = None
    email: str
    role: str | None = None
    joined_at: datetime
    last_read_at: datetime | None = None
    is_online: bool = False

    class Config:
        from_attributes = True


class DirectConversationCreate(BaseModel):
    target_user_id: int


class ConversationRead(BaseModel):
    id: int
    conversation_type: str  # "DIRECT" or "COMMUNITY"
    community_id: int | None = None
    name: str | None = None  # Direct partner name OR Community name
    description: str | None = None
    created_at: datetime
    updated_at: datetime
    unread_count: int = 0
    last_message: MessageRead | None = None
    participants: list[ConversationParticipantRead] = []
    is_online: bool = False

    class Config:
        from_attributes = True


# --- Communities ---
class CommunityCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    description: str | None = Field(None, max_length=1000)


class CommunityRead(BaseModel):
    id: int
    name: str
    description: str | None = None
    created_by: int | None = None
    created_at: datetime
    updated_at: datetime
    member_count: int = 0
    is_member: bool = False
    conversation_id: int | None = None

    class Config:
        from_attributes = True


class CommunityMemberRead(BaseModel):
    user_id: int
    name: str | None = None
    email: str
    role: str | None = None
    joined_at: datetime
    is_online: bool = False

    class Config:
        from_attributes = True
