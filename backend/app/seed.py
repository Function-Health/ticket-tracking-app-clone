"""Seed the database with demo users and issues.

Usage:
    python -m app.seed
"""

import random

from app.auth import hash_password
from app.db import SessionLocal, init_db
from app.models import Issue, User, Workspace


TITLES = [
    "Login fails on Safari with non-ASCII email",
    "Dark mode flicker on first paint",
    "Issue list scroll restoration",
    "Add cycle field to issues",
    "Pagination off by one in API",
    "Markdown table support in descriptions",
    "Improve drag affordance on board",
    "Telemetry: slow queries on /issues",
    "Empty state for board columns",
    "Keyboard shortcut hints in UI",
    "Search ignores assignee filter",
    "Stale data after edit",
    "Audit log for status changes",
    "Webhook on issue create",
    "Bulk move issues across statuses",
    "Inline comment on description lines",
    "Color blind palette for priorities",
    "Allow setting due date",
    "Mobile layout for board",
    "Onboarding checklist",
]
STATUSES = ["backlog", "todo", "in_progress", "done", "cancelled"]
PRIORITIES = ["none", "low", "medium", "high", "urgent"]


def seed():
    init_db()
    db = SessionLocal()
    try:
        if db.query(User).count() > 0:
            print("Database already seeded; skipping.")
            return

        acme = Workspace(name="Acme", slug="acme")
        beta = Workspace(name="Beta Corp", slug="beta")
        db.add_all([acme, beta])
        db.flush()

        alice = User(
            email="alice@acme.com",
            password_hash=hash_password("password"),
            name="Alice",
            workspace_id=acme.id,
        )
        bob = User(
            email="bob@acme.com",
            password_hash=hash_password("password"),
            name="Bob",
            workspace_id=acme.id,
        )
        carol = User(
            email="carol@beta.com",
            password_hash=hash_password("password"),
            name="Carol",
            workspace_id=beta.id,
        )
        db.add_all([alice, bob, carol])
        db.flush()

        rng = random.Random(42)
        for n, title in enumerate(TITLES, start=1):
            db.add(
                Issue(
                    workspace_id=acme.id,
                    number=n,
                    title=title,
                    description=f"## Context\n\nDetails for **{title}**.\n\n- repro step 1\n- repro step 2\n",
                    status=rng.choice(STATUSES),
                    priority=rng.choice(PRIORITIES),
                    assignee_id=rng.choice([alice.id, bob.id, None]),
                    creator_id=alice.id,
                )
            )

        db.add(
            Issue(
                workspace_id=beta.id,
                number=1,
                title="Carol's private issue",
                description="Should not be visible to Acme.",
                status="todo",
                priority="medium",
                assignee_id=carol.id,
                creator_id=carol.id,
            )
        )

        db.commit()
        print("Seeded: alice@acme.com / bob@acme.com / carol@beta.com (password: 'password')")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
