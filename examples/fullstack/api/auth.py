from hashlib import sha256
from hmac import compare_digest
import os
from secrets import token_urlsafe

from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import BaseModel, Field

from db import connect

router = APIRouter()
COOKIE = "lottiex_demo"
SESSION_SECONDS = 86_400


class Credentials(BaseModel):
    username: str = Field(max_length=64)
    password: str = Field(max_length=128)


def token_hash(token):
    return sha256(token.encode()).digest()


def require_session(request: Request):
    token = request.cookies.get(COOKIE, "")
    with connect() as db:
        session = db.execute(
            "SELECT 1 FROM sessions WHERE token_hash = %s AND expires_at > now()",
            (token_hash(token),)
        ).fetchone()

    if not session:
        raise HTTPException(401, "Sign in required")


@router.get("/session", status_code=204)
def session(request: Request):
    require_session(request)


@router.post("/session", status_code=204)
def login(credentials: Credentials, request: Request, response: Response):
    password_ok = compare_digest(
        credentials.password.encode(), os.environ["DEMO_PASSWORD"].encode()
    )
    if credentials.username != "demo" or not password_ok:
        raise HTTPException(401, "Invalid credentials")

    token = token_urlsafe(32)
    with connect() as db:
        db.execute("DELETE FROM sessions WHERE expires_at <= now() OR token_hash = %s",
                   (token_hash(request.cookies.get(COOKIE, "")),))
        db.execute("INSERT INTO sessions (token_hash) VALUES (%s)", (token_hash(token),))

    response.set_cookie(
        COOKIE, token, max_age=SESSION_SECONDS, httponly=True, samesite="lax",
        secure=request.headers.get("x-forwarded-proto") == "https"
    )


@router.delete("/session", status_code=204)
def logout(request: Request, response: Response):
    with connect() as db:
        db.execute("DELETE FROM sessions WHERE token_hash = %s",
                   (token_hash(request.cookies.get(COOKIE, "")),))

    response.delete_cookie(
        COOKIE, httponly=True, samesite="lax",
        secure=request.headers.get("x-forwarded-proto") == "https"
    )
