from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.note import Note
from app.schemas.note import NoteCreate, NoteUpdate


async def create_note(
    db: AsyncSession,
    user_id: int,
    note: NoteCreate
):
    new_note = Note(
        user_id=user_id,
        title=note.title,
        content=note.content,
        tag=note.tag,
        pinned=note.pinned,
        color=note.color
    )

    db.add(new_note)
    await db.commit()
    await db.refresh(new_note)

    return {
        "message": "Note created successfully",
        "note": new_note
    }


async def get_notes(
    db: AsyncSession,
    user_id: int
):
    result = await db.execute(
        select(Note)
        .where(Note.user_id == user_id)
        .order_by(Note.created_at.desc())
    )

    notes = result.scalars().all()

    return {
        "user_id": user_id,
        "notes": notes
    }


async def get_note(
    db: AsyncSession,
    user_id: int,
    note_id: int
):
    result = await db.execute(
        select(Note).where(
            Note.id == note_id,
            Note.user_id == user_id
        )
    )

    note = result.scalar_one_or_none()

    if not note:
        raise ValueError("Note not found")

    return note


async def update_note(
    db: AsyncSession,
    user_id: int,
    note_id: int,
    note_data: NoteUpdate
):
    result = await db.execute(
        select(Note).where(
            Note.id == note_id,
            Note.user_id == user_id
        )
    )

    note = result.scalar_one_or_none()

    if not note:
        raise ValueError("Note not found")

    note.title = note_data.title
    note.content = note_data.content
    note.tag = note_data.tag
    note.pinned = note_data.pinned
    note.color = note_data.color


    await db.commit()
    await db.refresh(note)

    return {
        "message": "Note updated successfully",
        "note": note
    }


async def delete_note(
    db: AsyncSession,
    user_id: int,
    note_id: int
):
    result = await db.execute(
        select(Note).where(
            Note.id == note_id,
            Note.user_id == user_id
        )
    )

    note = result.scalar_one_or_none()

    if not note:
        raise ValueError("Note not found")

    await db.delete(note)
    await db.commit()

    return {
        "message": "Note deleted successfully"
    }