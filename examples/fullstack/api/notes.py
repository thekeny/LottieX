from typing import Annotated
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException, Path, Response, UploadFile
from pydantic import BaseModel, Field

from auth import require_session
from db import connect

router = APIRouter(prefix="/notes", dependencies=[Depends(require_session)])
NoteId = Annotated[int, Path(gt=0, le=2_147_483_647)]
MAX_ATTACHMENT = 1024 * 1024


class NoteInput(BaseModel):
    title: str = Field(min_length=1, max_length=100, pattern=r"^[^\x00]*\S[^\x00]*$")
    body: str = Field(max_length=10_000, pattern=r"^[^\x00]*$")


def found(row):
    if row is None:
        raise HTTPException(404, "Note not found")
    return row


@router.get("")
def list_notes():
    with connect() as db:
        return db.execute("SELECT id, title, body, filename FROM notes ORDER BY id").fetchall()


@router.post("", status_code=201)
def create_note(note: NoteInput):
    with connect() as db:
        return db.execute(
            "INSERT INTO notes (title, body) VALUES (%s, %s) RETURNING id, title, body, filename",
            (note.title, note.body)
        ).fetchone()


@router.get("/{note_id}")
def read_note(note_id: NoteId):
    with connect() as db:
        return found(db.execute(
            "SELECT id, title, body, filename FROM notes WHERE id = %s", (note_id,)
        ).fetchone())


@router.put("/{note_id}")
def update_note(note_id: NoteId, note: NoteInput):
    with connect() as db:
        return found(db.execute(
            "UPDATE notes SET title = %s, body = %s WHERE id = %s RETURNING id, title, body, filename",
            (note.title, note.body, note_id)
        ).fetchone())


@router.delete("/{note_id}", status_code=204)
def delete_note(note_id: NoteId):
    with connect() as db:
        found(db.execute("DELETE FROM notes WHERE id = %s RETURNING id", (note_id,)).fetchone())


@router.put("/{note_id}/attachment")
def upload_attachment(note_id: NoteId, file: UploadFile):
    filename = (file.filename or "attachment").replace("\x00", "").replace("\\", "/").split("/")[-1]
    filename = filename[:200] or "attachment"
    content = file.file.read(MAX_ATTACHMENT + 1)
    if len(content) > MAX_ATTACHMENT:
        raise HTTPException(413, "Attachment exceeds 1 MiB")

    with connect() as db:
        return found(db.execute(
            "UPDATE notes SET filename = %s, attachment = %s WHERE id = %s RETURNING filename",
            (filename, content, note_id)
        ).fetchone())


@router.get("/{note_id}/attachment")
def download_attachment(note_id: NoteId):
    with connect() as db:
        row = found(db.execute(
            "SELECT filename, attachment FROM notes WHERE id = %s AND attachment IS NOT NULL",
            (note_id,)
        ).fetchone())

    filename = quote(row["filename"], safe="")
    return Response(
        row["attachment"], media_type="application/octet-stream",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{filename}"}
    )
