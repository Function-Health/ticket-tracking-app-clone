import re
from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.auth import (
    create_access_token,
    current_user,
    hash_password,
    verify_password,
)
from app.db import get_db, init_db
from app.models import Comment, Issue, User, Workspace
from app.schemas import (
    CommentCreate,
    CommentOut,
    IssueCreate,
    IssueOut,
    IssueUpdate,
    LoginRequest,
    SignupRequest,
    TokenResponse,
    UserOut,
    WorkspaceOut,
)


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(title="Ticket Tracking API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _slugify(name: str) -> str:
    s = re.sub(r"[^a-zA-Z0-9]+", "-", name).strip("-").lower()
    return s or "workspace"


@app.get("/api/healthz")
async def healthz():
    return {"ok": True}


# -------- Auth --------

@app.post("/api/auth/signup", response_model=TokenResponse)
async def signup(payload: SignupRequest, db: Annotated[Session, Depends(get_db)]):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    base_slug = _slugify(payload.workspace_name)
    slug = base_slug
    n = 1
    while db.query(Workspace).filter(Workspace.slug == slug).first():
        n += 1
        slug = f"{base_slug}-{n}"

    workspace = Workspace(name=payload.workspace_name, slug=slug)
    db.add(workspace)
    db.flush()

    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        name=payload.name,
        workspace_id=workspace.id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return TokenResponse(access_token=create_access_token(user.id))


@app.post("/api/auth/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: Annotated[Session, Depends(get_db)]):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return TokenResponse(access_token=create_access_token(user.id))


@app.get("/api/auth/me", response_model=UserOut)
async def me(user: Annotated[User, Depends(current_user)]):
    return user


@app.get("/api/workspace", response_model=WorkspaceOut)
async def get_workspace(
    user: Annotated[User, Depends(current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    return db.query(Workspace).filter(Workspace.id == user.workspace_id).first()


@app.get("/api/users", response_model=list[UserOut])
async def list_users(
    user: Annotated[User, Depends(current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    return db.query(User).filter(User.workspace_id == user.workspace_id).all()


# -------- Issues --------

@app.get("/api/issues", response_model=list[IssueOut])
async def list_issues(
    user: Annotated[User, Depends(current_user)],
    db: Annotated[Session, Depends(get_db)],
    status: str | None = None,
    assignee_id: int | None = None,
    sort_by: str = "updated_at",
    direction: str = "desc",
    page: int = 0,
    limit: int = 20,
):
    q = db.query(Issue).filter(Issue.workspace_id == user.workspace_id)
    if status:
        q = q.filter(Issue.status == status)
    if assignee_id is not None:
        q = q.filter(Issue.assignee_id == assignee_id)

    q = q.order_by(text(f"{sort_by} {direction}"))
    return q.offset(page * limit).limit(limit).all()


@app.post("/api/issues", response_model=IssueOut, status_code=201)
async def create_issue(
    payload: IssueCreate,
    user: Annotated[User, Depends(current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    last = (
        db.query(Issue)
        .filter(Issue.workspace_id == user.workspace_id)
        .order_by(Issue.number.desc())
        .first()
    )
    next_number = (last.number + 1) if last else 1

    issue = Issue(
        workspace_id=user.workspace_id,
        number=next_number,
        title=payload.title,
        description=payload.description,
        status=payload.status,
        priority=payload.priority,
        assignee_id=payload.assignee_id,
        creator_id=user.id,
    )
    db.add(issue)
    db.commit()
    db.refresh(issue)
    return issue


@app.get("/api/issues/{issue_id}", response_model=IssueOut)
async def get_issue(
    issue_id: int,
    user: Annotated[User, Depends(current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    return issue


@app.patch("/api/issues/{issue_id}", response_model=IssueOut)
async def update_issue(
    issue_id: int,
    payload: IssueUpdate,
    user: Annotated[User, Depends(current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(issue, field, value)
    db.commit()
    db.refresh(issue)
    return issue


@app.delete("/api/issues/{issue_id}", status_code=204)
async def delete_issue(
    issue_id: int,
    user: Annotated[User, Depends(current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    db.delete(issue)
    db.commit()


# -------- Comments --------

@app.get("/api/issues/{issue_id}/comments", response_model=list[CommentOut])
async def list_comments(
    issue_id: int,
    user: Annotated[User, Depends(current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    issue = (
        db.query(Issue)
        .filter(Issue.id == issue_id, Issue.workspace_id == user.workspace_id)
        .first()
    )
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    return (
        db.query(Comment)
        .filter(Comment.issue_id == issue_id)
        .order_by(Comment.created_at.asc())
        .all()
    )


@app.post("/api/issues/{issue_id}/comments", response_model=CommentOut, status_code=201)
async def create_comment(
    issue_id: int,
    payload: CommentCreate,
    user: Annotated[User, Depends(current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    issue = (
        db.query(Issue)
        .filter(Issue.id == issue_id, Issue.workspace_id == user.workspace_id)
        .first()
    )
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    comment = Comment(issue_id=issue_id, author_id=user.id, body=payload.body)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment
