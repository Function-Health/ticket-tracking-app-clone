def test_add_and_list_comment(client, auth_headers):
    issue = client.post("/api/issues", headers=auth_headers, json={"title": "Bug"}).json()

    r = client.post(
        f"/api/issues/{issue['id']}/comments",
        headers=auth_headers,
        json={"body": "Looks like an off-by-one"},
    )
    assert r.status_code == 201
    assert r.json()["body"] == "Looks like an off-by-one"

    r = client.get(f"/api/issues/{issue['id']}/comments", headers=auth_headers)
    assert r.status_code == 200
    assert len(r.json()) == 1
