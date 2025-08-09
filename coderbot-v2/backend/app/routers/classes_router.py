from fastapi import APIRouter, HTTPException, status, Header
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from app.services.pocketbase_service import pb_service

router = APIRouter(
    prefix="/classes",
    tags=["classes"],
    responses={404: {"description": "Not found"}},
)

# --------- Models ---------

class CreateClassRequest(BaseModel):
    title: str
    description: Optional[str] = None
    code: Optional[str] = None

class UpdateClassRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    archived: Optional[bool] = None

class InviteCreateRequest(BaseModel):
    class_id: str
    email: Optional[str] = None
    user_id: Optional[str] = None
    ttl_hours: int = 72

class InviteAcceptRequest(BaseModel):
    token: str

class EventCreateRequest(BaseModel):
    type: str = Field(pattern="^(exam|exercise|lecture|assignment)$")
    title: str
    description: Optional[str] = ""
    starts_at: str
    ends_at: Optional[str] = None
    visibility: str = Field(default="class", pattern="^(class|teachers|public)$")

class EventUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    starts_at: Optional[str] = None
    ends_at: Optional[str] = None
    visibility: Optional[str] = Field(default=None, pattern="^(class|teachers|public)$")
    type: Optional[str] = Field(default=None, pattern="^(exam|exercise|lecture|assignment)$")

class ClassApiKeySetRequest(BaseModel):
    provider: str = Field(pattern="^(openai|claude|deepseek|other)$")
    api_key: str
    active: bool = True

# --------- Helpers ---------

def ensure_teacher_or_admin(user_id: Optional[str], role: Optional[str]):
    if not user_id:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Missing X-User-Id header")
    if role not in ("teacher", "admin"):
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Only teacher/admin allowed")

# --------- Routes ---------

@router.post("/", status_code=201)
async def create_class(req: CreateClassRequest, x_user_id: Optional[str] = Header(default=None, convert_underscores=False), x_user_role: Optional[str] = Header(default=None, convert_underscores=False)):
    ensure_teacher_or_admin(x_user_id, x_user_role)
    created = pb_service.create_class(teacher_user_id=x_user_id, title=req.title, description=req.description, code=req.code)
    if not created:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Could not create class")
    return created

@router.get("/teaching")
async def list_my_teaching_classes(x_user_id: Optional[str] = Header(default=None, convert_underscores=False), x_user_role: Optional[str] = Header(default=None, convert_underscores=False)):
    ensure_teacher_or_admin(x_user_id, x_user_role)
    items = pb_service.list_classes_for_teacher(x_user_id)
    return {"items": items}

@router.get("/mine")
async def list_my_classes(x_user_id: Optional[str] = Header(default=None, convert_underscores=False)):
    if not x_user_id:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Missing X-User-Id header")
    memberships = pb_service.list_classes_for_user(x_user_id)
    return {"items": memberships}

@router.get("/{class_id}")
async def get_class_details(class_id: str, x_user_id: Optional[str] = Header(default=None, convert_underscores=False), x_user_role: Optional[str] = Header(default=None, convert_underscores=False)):
    c = pb_service.get_class(class_id)
    if not c:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Class not found")
    if not (x_user_role == "admin" or pb_service.is_user_class_teacher(class_id, x_user_id) or pb_service.is_user_class_member(class_id, x_user_id)):
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Forbidden")
    return c

# Members
@router.get("/{class_id}/members")
async def list_members(class_id: str, x_user_id: Optional[str] = Header(default=None, convert_underscores=False), x_user_role: Optional[str] = Header(default=None, convert_underscores=False)):
    if not (x_user_role == "admin" or pb_service.is_user_class_teacher(class_id, x_user_id) or pb_service.is_user_class_member(class_id, x_user_id)):
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Forbidden")
    return {"items": pb_service.list_members(class_id)}

@router.post("/{class_id}/members", status_code=201)
async def add_member(class_id: str, user_id: str, role: str = "student", x_user_id: Optional[str] = Header(default=None, convert_underscores=False), x_user_role: Optional[str] = Header(default=None, convert_underscores=False)):
    ensure_teacher_or_admin(x_user_id, x_user_role)
    if not pb_service.is_user_class_teacher(class_id, x_user_id) and x_user_role != "admin":
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Only class teacher/admin can add members")
    ok = pb_service.add_member(class_id, user_id, role)
    if not ok:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Could not add member")
    return {"ok": True}

@router.delete("/{class_id}/members/{member_user_id}", status_code=204)
async def remove_member(class_id: str, member_user_id: str, x_user_id: Optional[str] = Header(default=None, convert_underscores=False), x_user_role: Optional[str] = Header(default=None, convert_underscores=False)):
    ensure_teacher_or_admin(x_user_id, x_user_role)
    if not pb_service.is_user_class_teacher(class_id, x_user_id) and x_user_role != "admin":
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Only class teacher/admin can remove members")
    ok = pb_service.remove_member(class_id, member_user_id)
    if not ok:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Could not remove member")
    return {"ok": True}

# Invites
@router.post("/invites", status_code=201)
async def create_invite(req: InviteCreateRequest, x_user_id: Optional[str] = Header(default=None, convert_underscores=False), x_user_role: Optional[str] = Header(default=None, convert_underscores=False)):
    ensure_teacher_or_admin(x_user_id, x_user_role)
    if not pb_service.is_user_class_teacher(req.class_id, x_user_id) and x_user_role != "admin":
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Only class teacher/admin can invite")
    inv = pb_service.create_invite(req.class_id, invited_by=x_user_id, email=req.email, user_id=req.user_id, ttl_hours=req.ttl_hours)
    if not inv:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Could not create invite")
    return inv

@router.post("/invites/accept")
async def accept_invite(req: InviteAcceptRequest, x_user_id: Optional[str] = Header(default=None, convert_underscores=False)):
    if not x_user_id:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Missing X-User-Id header")
    ok = pb_service.accept_invite(req.token, x_user_id)
    if not ok:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Invalid or expired token")
    return {"ok": True}

# Events
@router.get("/{class_id}/events")
async def list_events(class_id: str, since: Optional[str] = None, until: Optional[str] = None, x_user_id: Optional[str] = Header(default=None, convert_underscores=False), x_user_role: Optional[str] = Header(default=None, convert_underscores=False)):
    if not (x_user_role == "admin" or pb_service.is_user_class_teacher(class_id, x_user_id) or pb_service.is_user_class_member(class_id, x_user_id)):
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Forbidden")
    return {"items": pb_service.list_events(class_id, since, until)}

@router.post("/{class_id}/events", status_code=201)
async def create_event(class_id: str, req: EventCreateRequest, x_user_id: Optional[str] = Header(default=None, convert_underscores=False), x_user_role: Optional[str] = Header(default=None, convert_underscores=False)):
    ensure_teacher_or_admin(x_user_id, x_user_role)
    if not pb_service.is_user_class_teacher(class_id, x_user_id) and x_user_role != "admin":
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Only class teacher/admin can create events")
    ev = pb_service.create_event(class_id, req.type, req.title, req.description or "", req.starts_at, req.ends_at, req.visibility)
    if not ev:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Could not create event")
    return ev

@router.put("/{class_id}/events/{event_id}")
async def update_event(class_id: str, event_id: str, req: EventUpdateRequest, x_user_id: Optional[str] = Header(default=None, convert_underscores=False), x_user_role: Optional[str] = Header(default=None, convert_underscores=False)):
    ensure_teacher_or_admin(x_user_id, x_user_role)
    if not pb_service.is_user_class_teacher(class_id, x_user_id) and x_user_role != "admin":
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Only class teacher/admin can update events")
    ok = pb_service.update_event(event_id, {k: v for k, v in req.dict().items() if v is not None})
    if not ok:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Could not update event")
    return {"ok": True}

@router.delete("/{class_id}/events/{event_id}", status_code=204)
async def delete_event(class_id: str, event_id: str, x_user_id: Optional[str] = Header(default=None, convert_underscores=False), x_user_role: Optional[str] = Header(default=None, convert_underscores=False)):
    ensure_teacher_or_admin(x_user_id, x_user_role)
    if not pb_service.is_user_class_teacher(class_id, x_user_id) and x_user_role != "admin":
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Only class teacher/admin can delete events")
    ok = pb_service.delete_event(event_id)
    if not ok:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Could not delete event")
    return {"ok": True}

# Class API Keys
@router.post("/{class_id}/api-keys", status_code=201)
async def set_class_api_key(class_id: str, req: ClassApiKeySetRequest, x_user_id: Optional[str] = Header(default=None, convert_underscores=False), x_user_role: Optional[str] = Header(default=None, convert_underscores=False)):
    ensure_teacher_or_admin(x_user_id, x_user_role)
    if not pb_service.is_user_class_teacher(class_id, x_user_id) and x_user_role != "admin":
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Only class teacher/admin can set API keys")
    ok = pb_service.set_class_api_key(class_id, req.provider, req.api_key, created_by=x_user_id, active=req.active)
    if not ok:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Could not set API key")
    return {"ok": True}

@router.get("/{class_id}/api-keys/{provider}")
async def has_class_api_key(class_id: str, provider: str, x_user_id: Optional[str] = Header(default=None, convert_underscores=False), x_user_role: Optional[str] = Header(default=None, convert_underscores=False)):
    # Only teacher/admin can see masked presence
    if not (x_user_role in ("teacher", "admin") and (pb_service.is_user_class_teacher(class_id, x_user_id) or x_user_role == "admin")):
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Forbidden")
    key = pb_service.get_class_api_key(class_id, provider)
    if not key:
        return {"hasKey": False}
    masked = f"****{key[-4:]}" if len(key) >= 4 else "****"
    return {"hasKey": True, "masked": masked}