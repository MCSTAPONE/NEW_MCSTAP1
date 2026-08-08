import os
from urllib.parse import urlparse

import psycopg2


def get_connection():
    database_url = os.getenv("DATABASE_URL")

    if database_url:
        parsed = urlparse(database_url)
        return psycopg2.connect(
            host=parsed.hostname,
            port=parsed.port or 5432,
            database=parsed.path.lstrip("/"),
            user=parsed.username,
            password=parsed.password,
        )

    # Default to mcstap database (used by docker-compose)
    return psycopg2.connect(
        host=os.getenv("POSTGRES_HOST", "localhost"),
        port=int(os.getenv("POSTGRES_PORT", "5432")),
        database=os.getenv("POSTGRES_DB", "mcstap"),
        user=os.getenv("POSTGRES_USER", "mcstap"),
        password=os.getenv("POSTGRES_PASSWORD", "mcstap_password"),
    )
