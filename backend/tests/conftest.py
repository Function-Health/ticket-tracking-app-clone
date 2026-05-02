import os
import tempfile

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Point the app at a fresh SQLite file before importing app modules.
_tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
_tmp.close()
os.environ["DATABASE_URL"] = f"sqlite:///{_tmp.name}"

from app import db as app_db  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def _init_schema():
    test_engine = create_engine(
        os.environ["DATABASE_URL"], connect_args={"check_same_thread": False}
    )
    app_db.engine = test_engine
    app_db.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    app_db.Base.metadata.create_all(bind=test_engine)
    yield


@pytest.fixture()
def client():
    return TestClient(app)


@pytest.fixture()
def auth_headers(client):
    import uuid
    email = f"u{uuid.uuid4().hex[:8]}@example.com"
    r = client.post(
        "/api/auth/signup",
        json={"email": email, "password": "hunter22", "name": "User", "workspace_name": "Acme"},
    )
    assert r.status_code == 200, r.text
    token = r.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
