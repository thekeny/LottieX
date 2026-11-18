from pathlib import Path

import psycopg
from psycopg.rows import dict_row


def connect():
    return psycopg.connect(connect_timeout=5, row_factory=dict_row)


def migrate():
    with connect() as db:
        db.execute("SELECT pg_advisory_xact_lock(1)")
        db.execute(Path(__file__).with_name("schema.sql").read_text())
