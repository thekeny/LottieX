from contextlib import asynccontextmanager
import os

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

import auth
from db import connect, migrate
import notes


@asynccontextmanager
async def lifespan(_app):
    if len(os.environ.get("DEMO_PASSWORD", "")) < 16:
        raise RuntimeError("DEMO_PASSWORD must contain at least 16 characters")
    migrate()
    yield


app = FastAPI(lifespan=lifespan, docs_url=None, redoc_url=None, openapi_url=None)
app.include_router(auth.router)
app.include_router(notes.router)


@app.middleware("http")
async def protect_requests(request: Request, call_next):
    if request.method in {"POST", "PUT", "DELETE"}:
        scheme = request.headers.get("x-forwarded-proto", "http")
        host = request.headers.get("x-forwarded-host", request.headers.get("host"))
        if request.headers.get("origin") != f"{scheme}://{host}":
            return JSONResponse({"detail": "Origin mismatch"}, status_code=403)

    response = await call_next(request)
    response.headers["Cache-Control"] = "no-store"
    return response


@app.get("/health")
def health():
    with connect() as db:
        db.execute("SELECT 1")
    return {"status": "ready"}
