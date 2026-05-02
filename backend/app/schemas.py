from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    workspace_name: str = "My Workspace"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: str
    name: str
    workspace_id: int


class WorkspaceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    slug: str


class IssueCreate(BaseModel):
    title: str
    description: str = ""
    status: str = "backlog"
    priority: str = "none"
    assignee_id: int | None = None


class IssueUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None
    priority: str | None = None
    assignee_id: int | None = None


class IssueOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    workspace_id: int
    number: int
    title: str
    description: str
    status: str
    priority: str
    assignee_id: int | None
    creator_id: int
    created_at: datetime
    updated_at: datetime


class CommentCreate(BaseModel):
    body: str


class CommentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    issue_id: int
    author_id: int
    body: str
    created_at: datetime
