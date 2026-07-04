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
        topic=note.topic,
        note_text=note.note_text,
        note_date=note.note_date
    )

    db.add(new_note)
    await db.commit()
    await db.refresh(new_note)

    return new_note


async def get_notes(
    db: AsyncSession,
    user_id: int
):
    result = await db.execute(
        select(Note)
        .where(Note.user_id == user_id)
        .order_by(Note.note_date.desc(), Note.created_at.desc())
    )

    return result.scalars().all()


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

    note.topic = note_data.topic
    note.note_text = note_data.note_text
    note.note_date = note_data.note_date

    await db.commit()
    await db.refresh(note)

    return note


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