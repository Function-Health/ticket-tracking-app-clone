def test_signup_returns_token(client):
    r = client.post(
        "/api/auth/signup",
        json={"email": "alice@example.com", "password": "hunter22", "name": "Alice", "workspace_name": "Alice's"},
    )
    assert r.status_code == 200
    assert "access_token" in r.json()


def test_login_with_valid_credentials(client):
    client.post(
        "/api/auth/signup",
        json={"email": "bob@example.com", "password": "hunter22", "name": "Bob", "workspace_name": "Bob's"},
    )
    r = client.post("/api/auth/login", json={"email": "bob@example.com", "password": "hunter22"})
    assert r.status_code == 200
    assert "access_token" in r.json()


def test_login_with_bad_password(client):
    client.post(
        "/api/auth/signup",
        json={"email": "carol@example.com", "password": "hunter22", "name": "Carol", "workspace_name": "Carol's"},
    )
    r = client.post("/api/auth/login", json={"email": "carol@example.com", "password": "wrong"})
    assert r.status_code == 401


def test_me_requires_token(client):
    r = client.get("/api/auth/me")
    assert r.status_code == 401


def test_me_returns_user(client, auth_headers):
    r = client.get("/api/auth/me", headers=auth_headers)
    assert r.status_code == 200
    body = r.json()
    assert "id" in body and "email" in body and "workspace_id" in body
