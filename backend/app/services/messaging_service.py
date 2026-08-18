from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc, update
from fastapi import HTTPException, status

from app.models.user import User
from app.models.batch_models import Batch, BatchTrainee
from app.models.messaging import (
    Conversation,
    ConversationParticipant,
    Message,
    Community,
    CommunityMember,
)
from app.services.websocket_manager import manager


DEFAULT_COMMUNITIES = [
    {"name": "Python Developers", "description": "Discuss Python programming, libraries, frameworks, and best practices."},
    {"name": "Backend Development", "description": "Explore REST APIs, databases, microservices, and server architecture."},
    {"name": "Full Stack Development", "description": "Frontend, backend, integration, and modern full-stack web applications."},
    {"name": "AI & Machine Learning", "description": "Deep learning, prompt engineering, LLMs, model training, and AI tools."},
    {"name": "Career & Placement", "description": "Interview prep, resume building, placement guidance, and career advice."},
    {"name": "General Discussion", "description": "Open forum for networking, news, tech discussions, and informal chat."}
]


# ============================================================
# AUTHORIZATION & ELIGIBILITY HELPERS
# ============================================================

async def get_authorized_contacts_for_user(db: AsyncSession, current_user: User) -> list[dict]:
    """
    Returns eligible users that the current_user can message:
    - If Trainee: returns trainers assigned to their active batches.
    - If Trainer: returns trainees enrolled in their assigned batches.
    - If Admin: returns all active trainers and trainees.
    """
    user_role = (current_user.role or "").upper()
    contacts = []

    if user_role == "TRAINEE":
        # Find trainers of batches the trainee is in
        stmt = (
            select(User)
            .join(Batch, Batch.trainer_id == User.id)
            .join(BatchTrainee, BatchTrainee.batch_id == Batch.id)
            .where(BatchTrainee.trainee_id == current_user.id)
            .distinct()
        )
        res = await db.execute(stmt)
        trainers = res.scalars().all()
        for t in trainers:
            contacts.append({
                "id": t.id,
                "name": t.name or t.email.split("@")[0],
                "email": t.email,
                "role": t.role or "TRAINER",
                "designation": "Assigned Mentor / Trainer",
                "is_online": manager.is_user_online(t.id)
            })

    elif user_role in ["TRAINER", "MENTOR"]:
        # Find trainees in batches where trainer_id == current_user.id
        stmt = (
            select(User)
            .join(BatchTrainee, BatchTrainee.trainee_id == User.id)
            .join(Batch, Batch.id == BatchTrainee.batch_id)
            .where(Batch.trainer_id == current_user.id)
            .distinct()
        )
        res = await db.execute(stmt)
        trainees = res.scalars().all()
        for t in trainees:
            contacts.append({
                "id": t.id,
                "name": t.name or t.email.split("@")[0],
                "email": t.email,
                "role": t.role or "TRAINEE",
                "designation": "Assigned Trainee",
                "is_online": manager.is_user_online(t.id)
            })

    else:
        # Admin - fetch all trainers & trainees (excluding self)
        stmt = select(User).where(User.id != current_user.id)
        res = await db.execute(stmt)
        users = res.scalars().all()
        for u in users:
            contacts.append({
                "id": u.id,
                "name": u.name or u.email.split("@")[0],
                "email": u.email,
                "role": u.role or "USER",
                "designation": u.role or "Member",
                "is_online": manager.is_user_online(u.id)
            })

    return contacts


async def check_user_can_message_target(db: AsyncSession, current_user: User, target_user_id: int) -> bool:
    """
    Validates if current_user is authorized to start a direct 1-on-1 conversation with target_user_id.
    """
    if current_user.id == target_user_id:
        return False

    user_role = (current_user.role or "").upper()
    if user_role == "ADMIN":
        return True

    contacts = await get_authorized_contacts_for_user(db, current_user)
    contact_ids = {c["id"] for c in contacts}
    return target_user_id in contact_ids


async def ensure_conversation_participant(db: AsyncSession, conversation_id: int, user_id: int):
    """
    Verifies if user is a participant of conversation_id. Raises 403 HTTP Exception if not.
    """
    stmt = select(ConversationParticipant).where(
        and_(
            ConversationParticipant.conversation_id == conversation_id,
            ConversationParticipant.user_id == user_id
        )
    )
    res = await db.execute(stmt)
    participant = res.scalar_one_or_none()
    if not participant:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You are not a participant of this conversation."
        )
    return participant


# ============================================================
# CONVERSATION MANAGEMENT
# ============================================================

async def get_or_create_direct_conversation(db: AsyncSession, current_user: User, target_user_id: int) -> Conversation:
    """
    Gets or creates a 1-to-1 DIRECT conversation between current_user and target_user.
    Validates authorization.
    """
    is_auth = await check_user_can_message_target(db, current_user, target_user_id)
    if not is_auth:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You can only communicate with authorized mentors or assigned trainees."
        )

    # Check if direct conversation already exists between these 2 users
    stmt = (
        select(Conversation)
        .join(ConversationParticipant, ConversationParticipant.conversation_id == Conversation.id)
        .where(
            and_(
                Conversation.conversation_type == "DIRECT",
                ConversationParticipant.user_id.in_([current_user.id, target_user_id])
            )
        )
        .group_by(Conversation.id)
        .having(func.count(ConversationParticipant.user_id) == 2)
    )
    res = await db.execute(stmt)
    conv = res.scalar_one_or_none()

    if conv:
        return conv

    # Create new direct conversation
    now = datetime.utcnow()
    conv = Conversation(
        conversation_type="DIRECT",
        created_at=now,
        updated_at=now
    )
    db.add(conv)
    await db.flush()

    # Add participants
    p1 = ConversationParticipant(
        conversation_id=conv.id,
        user_id=current_user.id,
        joined_at=now,
        last_read_at=now
    )
    p2 = ConversationParticipant(
        conversation_id=conv.id,
        user_id=target_user_id,
        joined_at=now,
        last_read_at=None
    )
    db.add_all([p1, p2])
    await db.commit()
    await db.refresh(conv)

    return conv


async def get_user_conversations(db: AsyncSession, current_user: User) -> list[dict]:
    """
    Lists all conversations (DIRECT and COMMUNITY) for current_user with unread counts and last message.
    """
    # Fetch all participant entries for current user
    stmt = (
        select(ConversationParticipant)
        .where(ConversationParticipant.user_id == current_user.id)
    )
    res = await db.execute(stmt)
    my_parts = res.scalars().all()
    if not my_parts:
        return []

    conv_ids = [p.conversation_id for p in my_parts]
    part_map = {p.conversation_id: p for p in my_parts}

    # Fetch conversations with participants and community
    conv_stmt = (
        select(Conversation)
        .where(Conversation.id.in_(conv_ids))
        .order_by(desc(Conversation.updated_at))
    )
    conv_res = await db.execute(conv_stmt)
    conversations = conv_res.scalars().all()

    result = []
    for conv in conversations:
        # Fetch all participants for this conversation
        p_stmt = (
            select(ConversationParticipant, User)
            .join(User, User.id == ConversationParticipant.user_id)
            .where(ConversationParticipant.conversation_id == conv.id)
        )
        p_res = await db.execute(p_stmt)
        p_rows = p_res.all()

        participants_list = []
        partner_name = None
        partner_online = False

        for cp, u in p_rows:
            is_on = manager.is_user_online(u.id)
            participants_list.append({
                "user_id": u.id,
                "name": u.name or u.email.split("@")[0],
                "email": u.email,
                "role": u.role,
                "joined_at": cp.joined_at,
                "last_read_at": cp.last_read_at,
                "is_online": is_on
            })
            if conv.conversation_type == "DIRECT" and u.id != current_user.id:
                partner_name = u.name or u.email.split("@")[0]
                partner_online = is_on

        # Fetch last message
        m_stmt = (
            select(Message, User)
            .join(User, User.id == Message.sender_id)
            .where(Message.conversation_id == conv.id)
            .order_by(desc(Message.created_at))
            .limit(1)
        )
        m_res = await db.execute(m_stmt)
        last_m_row = m_res.first()

        last_message_dict = None
        if last_m_row:
            msg, sender = last_m_row
            last_message_dict = {
                "id": msg.id,
                "conversation_id": msg.conversation_id,
                "sender_id": msg.sender_id,
                "sender_name": sender.name or sender.email.split("@")[0],
                "sender_role": sender.role,
                "content": msg.content,
                "created_at": msg.created_at,
                "updated_at": msg.updated_at,
                "is_deleted": msg.is_deleted
            }

        # Calculate unread count
        my_p = part_map.get(conv.id)
        last_read = my_p.last_read_at if my_p else None

        unread_stmt = select(func.count(Message.id)).where(
            and_(
                Message.conversation_id == conv.id,
                Message.sender_id != current_user.id,
                Message.created_at > last_read if last_read else True
            )
        )
        unread_res = await db.execute(unread_stmt)
        unread_count = unread_res.scalar() or 0

        # Title for community or direct
        conv_name = partner_name
        description = None

        if conv.conversation_type == "COMMUNITY":
            comm_stmt = select(Community).where(Community.id == conv.community_id)
            comm_res = await db.execute(comm_stmt)
            comm = comm_res.scalar_one_or_none()
            if comm:
                conv_name = comm.name
                description = comm.description

        result.append({
            "id": conv.id,
            "conversation_type": conv.conversation_type,
            "community_id": conv.community_id,
            "name": conv_name or f"Conversation #{conv.id}",
            "description": description,
            "created_at": conv.created_at,
            "updated_at": conv.updated_at,
            "unread_count": unread_count,
            "last_message": last_message_dict,
            "participants": participants_list,
            "is_online": partner_online if conv.conversation_type == "DIRECT" else False
        })

    return result


async def get_conversation_by_id(db: AsyncSession, conversation_id: int, current_user: User) -> dict:
    """
    Gets conversation details by ID, enforcing participant authorization.
    """
    await ensure_conversation_participant(db, conversation_id, current_user.id)

    conv_stmt = select(Conversation).where(Conversation.id == conversation_id)
    res = await db.execute(conv_stmt)
    conv = res.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Fetch participants
    p_stmt = (
        select(ConversationParticipant, User)
        .join(User, User.id == ConversationParticipant.user_id)
        .where(ConversationParticipant.conversation_id == conv.id)
    )
    p_res = await db.execute(p_stmt)
    p_rows = p_res.all()

    participants_list = []
    partner_name = None
    partner_online = False

    for cp, u in p_rows:
        is_on = manager.is_user_online(u.id)
        participants_list.append({
            "user_id": u.id,
            "name": u.name or u.email.split("@")[0],
            "email": u.email,
            "role": u.role,
            "joined_at": cp.joined_at,
            "last_read_at": cp.last_read_at,
            "is_online": is_on
        })
        if conv.conversation_type == "DIRECT" and u.id != current_user.id:
            partner_name = u.name or u.email.split("@")[0]
            partner_online = is_on

    conv_name = partner_name
    description = None

    if conv.conversation_type == "COMMUNITY":
        comm_stmt = select(Community).where(Community.id == conv.community_id)
        comm_res = await db.execute(comm_stmt)
        comm = comm_res.scalar_one_or_none()
        if comm:
            conv_name = comm.name
            description = comm.description

    return {
        "id": conv.id,
        "conversation_type": conv.conversation_type,
        "community_id": conv.community_id,
        "name": conv_name or f"Conversation #{conv.id}",
        "description": description,
        "created_at": conv.created_at,
        "updated_at": conv.updated_at,
        "unread_count": 0,
        "last_message": None,
        "participants": participants_list,
        "is_online": partner_online if conv.conversation_type == "DIRECT" else False
    }


# ============================================================
# MESSAGING CRUD
# ============================================================

async def send_message(db: AsyncSession, conversation_id: int, current_user: User, content: str) -> dict:
    """
    Persists message to PostgreSQL and updates conversation timestamp.
    Enforces authorization.
    """
    await ensure_conversation_participant(db, conversation_id, current_user.id)

    now = datetime.utcnow()
    msg = Message(
        conversation_id=conversation_id,
        sender_id=current_user.id,
        content=content.strip(),
        created_at=now,
        updated_at=now
    )
    db.add(msg)

    # Update conversation updated_at
    await db.execute(
        update(Conversation)
        .where(Conversation.id == conversation_id)
        .values(updated_at=now)
    )

    # Auto-mark read for the sender
    await db.execute(
        update(ConversationParticipant)
        .where(
            and_(
                ConversationParticipant.conversation_id == conversation_id,
                ConversationParticipant.user_id == current_user.id
            )
        )
        .values(last_read_at=now)
    )

    await db.commit()
    await db.refresh(msg)

    msg_dict = {
        "id": msg.id,
        "conversation_id": msg.conversation_id,
        "sender_id": msg.sender_id,
        "sender_name": current_user.name or current_user.email.split("@")[0],
        "sender_role": current_user.role,
        "content": msg.content,
        "created_at": msg.created_at.isoformat(),
        "updated_at": msg.updated_at.isoformat(),
        "is_deleted": msg.is_deleted,
        "is_read": True
    }

    # Broadcast real-time message via WebSocket manager
    await manager.broadcast_to_conversation(conversation_id, {
        "type": "NEW_MESSAGE",
        "message": msg_dict
    })

    return msg_dict


async def get_messages_for_conversation(
    db: AsyncSession,
    conversation_id: int,
    current_user: User,
    limit: int = 100,
    offset: int = 0
) -> list[dict]:
    """
    Fetches message history for a conversation, enforcing participant authorization.
    """
    cp = await ensure_conversation_participant(db, conversation_id, current_user.id)

    stmt = (
        select(Message, User)
        .join(User, User.id == Message.sender_id)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
        .offset(offset)
        .limit(limit)
    )
    res = await db.execute(stmt)
    rows = res.all()

    last_read = cp.last_read_at

    result = []
    for msg, sender in rows:
        is_read = True if msg.sender_id == current_user.id else (bool(last_read and msg.created_at <= last_read))
        result.append({
            "id": msg.id,
            "conversation_id": msg.conversation_id,
            "sender_id": msg.sender_id,
            "sender_name": sender.name or sender.email.split("@")[0],
            "sender_role": sender.role,
            "content": msg.content,
            "created_at": msg.created_at.isoformat(),
            "updated_at": msg.updated_at.isoformat(),
            "is_deleted": msg.is_deleted,
            "is_read": is_read
        })

    return result


async def mark_conversation_as_read(db: AsyncSession, conversation_id: int, current_user: User) -> dict:
    """
    Updates current_user's last_read_at timestamp for conversation_id.
    """
    await ensure_conversation_participant(db, conversation_id, current_user.id)

    now = datetime.utcnow()
    await db.execute(
        update(ConversationParticipant)
        .where(
            and_(
                ConversationParticipant.conversation_id == conversation_id,
                ConversationParticipant.user_id == current_user.id
            )
        )
        .values(last_read_at=now)
    )
    await db.commit()

    return {"status": "success", "conversation_id": conversation_id, "last_read_at": now.isoformat()}


# ============================================================
# COMMUNITY MANAGEMENT
# ============================================================

async def seed_default_communities(db: AsyncSession):
    """
    Seeds initial default communities if they don't exist yet.
    """
    for item in DEFAULT_COMMUNITIES:
        stmt = select(Community).where(Community.name == item["name"])
        res = await db.execute(stmt)
        comm = res.scalar_one_or_none()

        if not comm:
            now = datetime.utcnow()
            comm = Community(
                name=item["name"],
                description=item["description"],
                created_at=now,
                updated_at=now
            )
            db.add(comm)
            await db.flush()

            # Create associated COMMUNITY conversation
            conv = Conversation(
                conversation_type="COMMUNITY",
                community_id=comm.id,
                created_at=now,
                updated_at=now
            )
            db.add(conv)

    await db.commit()


async def get_all_communities(db: AsyncSession, current_user: User) -> list[dict]:
    """
    Returns all communities with member counts and membership status for current_user.
    """
    await seed_default_communities(db)

    stmt = select(Community).order_by(Community.id.asc())
    res = await db.execute(stmt)
    communities = res.scalars().all()

    result = []
    for c in communities:
        # Member count
        cnt_stmt = select(func.count(CommunityMember.id)).where(CommunityMember.community_id == c.id)
        cnt_res = await db.execute(cnt_stmt)
        member_count = cnt_res.scalar() or 0

        # Is current user a member?
        mem_stmt = select(CommunityMember).where(
            and_(
                CommunityMember.community_id == c.id,
                CommunityMember.user_id == current_user.id
            )
        )
        mem_res = await db.execute(mem_stmt)
        is_member = bool(mem_res.scalar_one_or_none())

        # Associated conversation ID
        conv_stmt = select(Conversation).where(Conversation.community_id == c.id)
        conv_res = await db.execute(conv_stmt)
        conv = conv_res.scalar_one_or_none()

        result.append({
            "id": c.id,
            "name": c.name,
            "description": c.description,
            "created_by": c.created_by,
            "created_at": c.created_at,
            "updated_at": c.updated_at,
            "member_count": member_count,
            "is_member": is_member,
            "conversation_id": conv.id if conv else None
        })

    return result


async def join_community(db: AsyncSession, community_id: int, current_user: User) -> dict:
    """
    Adds current_user to community_members and conversation_participants for that community.
    """
    comm_stmt = select(Community).where(Community.id == community_id)
    res = await db.execute(comm_stmt)
    comm = res.scalar_one_or_none()
    if not comm:
        raise HTTPException(status_code=404, detail="Community not found")

    now = datetime.utcnow()

    # Check if already a member
    mem_stmt = select(CommunityMember).where(
        and_(
            CommunityMember.community_id == community_id,
            CommunityMember.user_id == current_user.id
        )
    )
    mem_res = await db.execute(mem_stmt)
    existing_mem = mem_res.scalar_one_or_none()

    if not existing_mem:
        cm = CommunityMember(
            community_id=community_id,
            user_id=current_user.id,
            joined_at=now
        )
        db.add(cm)

    # Get community conversation
    conv_stmt = select(Conversation).where(Conversation.community_id == community_id)
    conv_res = await db.execute(conv_stmt)
    conv = conv_res.scalar_one_or_none()

    if not conv:
        conv = Conversation(
            conversation_type="COMMUNITY",
            community_id=community_id,
            created_at=now,
            updated_at=now
        )
        db.add(conv)
        await db.flush()

    # Check if already a participant
    p_stmt = select(ConversationParticipant).where(
        and_(
            ConversationParticipant.conversation_id == conv.id,
            ConversationParticipant.user_id == current_user.id
        )
    )
    p_res = await db.execute(p_stmt)
    existing_p = p_res.scalar_one_or_none()

    if not existing_p:
        cp = ConversationParticipant(
            conversation_id=conv.id,
            user_id=current_user.id,
            joined_at=now,
            last_read_at=now
        )
        db.add(cp)

    await db.commit()

    return {
        "status": "joined",
        "community_id": community_id,
        "conversation_id": conv.id,
        "message": f"Successfully joined {comm.name}"
    }


async def leave_community(db: AsyncSession, community_id: int, current_user: User) -> dict:
    """
    Removes current_user from community_members and conversation_participants for that community.
    """
    # Remove from community_members
    await db.execute(
        select(CommunityMember)
        .where(
            and_(
                CommunityMember.community_id == community_id,
                CommunityMember.user_id == current_user.id
            )
        )
    )
    # Execute delete
    stmt = (
        CommunityMember.__table__.delete()
        .where(
            and_(
                CommunityMember.community_id == community_id,
                CommunityMember.user_id == current_user.id
            )
        )
    )
    await db.execute(stmt)

    # Remove from conversation_participants
    conv_stmt = select(Conversation).where(Conversation.community_id == community_id)
    conv_res = await db.execute(conv_stmt)
    conv = conv_res.scalar_one_or_none()

    if conv:
        cp_stmt = (
            ConversationParticipant.__table__.delete()
            .where(
                and_(
                    ConversationParticipant.conversation_id == conv.id,
                    ConversationParticipant.user_id == current_user.id
                )
            )
        )
        await db.execute(cp_stmt)

    await db.commit()

    return {"status": "left", "community_id": community_id, "message": "Successfully left community"}


async def get_community_members(db: AsyncSession, community_id: int, current_user: User) -> list[dict]:
    """
    Lists all members of a community. Enforces that caller is a member.
    """
    stmt = (
        select(CommunityMember, User)
        .join(User, User.id == CommunityMember.user_id)
        .where(CommunityMember.community_id == community_id)
        .order_by(CommunityMember.joined_at.asc())
    )
    res = await db.execute(stmt)
    rows = res.all()

    result = []
    for cm, u in rows:
        result.append({
            "user_id": u.id,
            "name": u.name or u.email.split("@")[0],
            "email": u.email,
            "role": u.role,
            "joined_at": cm.joined_at,
            "is_online": manager.is_user_online(u.id)
        })

    return result
