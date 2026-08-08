import os
import uuid

from fastapi import HTTPException, UploadFile

UPLOAD_DIR = "assignment_files"


async def save_uploaded_file(
    file: UploadFile,
    folder: str,
) -> str:
    """
    Save an uploaded PDF file and return its path.
    """

    if not file:
        raise HTTPException(
            status_code=400,
            detail="No file uploaded."
        )

    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed."
        )

    upload_path = os.path.join(
        UPLOAD_DIR,
        folder,
    )

    os.makedirs(
        upload_path,
        exist_ok=True,
    )

    filename = f"{uuid.uuid4()}.pdf"

    file_path = os.path.join(
        upload_path,
        filename,
    )

    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    return file_path