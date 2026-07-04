from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.database.session import get_db
from app.schemas.note import (
    NoteCreate,
    NoteUpdate,
    NoteResponse
)
from app.services.note_service import (
    create_note,
    get_notes,
    get_note,
    update_note,
    delete_note
)

router = APIRouter(
    prefix="/notes",
    tags=["Notes"]
)


@router.post(
    "/{user_id}",
    response_model=NoteResponse
)
async def create_note_api(
    user_id: int,
    note: NoteCreate,
    db: AsyncSession = Depends(get_db)
):
    return await create_note(
        db,
        user_id,
        note
    )


@router.get(
    "/{user_id}",
    response_model=List[NoteResponse]
)
async def get_notes_api(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    return await get_notes(
        db,
        user_id
    )


@router.get(
    "/{user_id}/{note_id}",
    response_model=NoteResponse
)
async def get_note_api(
    user_id: int,
    note_id: int,
    db: AsyncSession = Depends(get_db)
):
    try:
        return await get_note(
            db,
            user_id,
            note_id
        )

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )


@router.put(
    "/{user_id}/{note_id}",
    response_model=NoteResponse
)
async def update_note_api(
    user_id: int,
    note_id: int,
    note: NoteUpdate,
    db: AsyncSession = Depends(get_db)
):
    try:
        return await update_note(
            db,
            user_id,
            note_id,
            note
        )

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )


@router.delete(
    "/{user_id}/{note_id}"
)
async def delete_note_api(
    user_id: int,
    note_id: int,
    db: AsyncSession = Depends(get_db)
):
    try:
        return await delete_note(
            db,
            user_id,
            note_id
        )

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )