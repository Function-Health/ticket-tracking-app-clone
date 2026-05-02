def test_create_issue(client, auth_headers):
    r = client.post(
        "/api/issues",
        headers=auth_headers,
        json={"title": "Fix login bug", "description": "Steps to reproduce..."},
    )
    assert r.status_code == 201
    body = r.json()
    assert body["title"] == "Fix login bug"
    assert body["status"] == "backlog"
    assert body["number"] >= 1


def test_list_issues_default(client, auth_headers):
    client.post("/api/issues", headers=auth_headers, json={"title": "A"})
    client.post("/api/issues", headers=auth_headers, json={"title": "B"})
    r = client.get("/api/issues", headers=auth_headers)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_get_own_issue(client, auth_headers):
    created = client.post("/api/issues", headers=auth_headers, json={"title": "Mine"}).json()
    r = client.get(f"/api/issues/{created['id']}", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["title"] == "Mine"


def test_patch_own_issue(client, auth_headers):
    created = client.post("/api/issues", headers=auth_headers, json={"title": "Old"}).json()
    r = client.patch(
        f"/api/issues/{created['id']}",
        headers=auth_headers,
        json={"title": "New", "status": "in_progress"},
    )
    assert r.status_code == 200
    assert r.json()["title"] == "New"
    assert r.json()["status"] == "in_progress"


def test_delete_own_issue(client, auth_headers):
    created = client.post("/api/issues", headers=auth_headers, json={"title": "Doomed"}).json()
    r = client.delete(f"/api/issues/{created['id']}", headers=auth_headers)
    assert r.status_code == 204


def test_filter_by_status(client, auth_headers):
    client.post("/api/issues", headers=auth_headers, json={"title": "T1", "status": "todo"})
    client.post("/api/issues", headers=auth_headers, json={"title": "T2", "status": "done"})
    r = client.get("/api/issues?status=todo", headers=auth_headers)
    assert r.status_code == 200
    assert all(i["status"] == "todo" for i in r.json())


def test_unauth_list(client):
    r = client.get("/api/issues")
    assert r.status_code == 401
