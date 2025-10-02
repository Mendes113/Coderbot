from fastapi import APIRouter, HTTPException, status, Header
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from app.services.pocketbase_service import pb_service

router = APIRouter(
    prefix="/notifications",
    tags=["notifications"],
    responses={404: {"description": "Not found"}},
)

# --------- Models ---------

class CreateNotificationRequest(BaseModel):
    recipient_id: str
    sender_id: str
    title: str
    content: str
    type: str = Field(pattern="^(mention|forum_reply|class_invite|system|achievement)$")
    metadata: Optional[Dict[str, Any]] = None

class UpdateNotificationRequest(BaseModel):
    read: Optional[bool] = None

class NotificationResponse(BaseModel):
    id: str
    recipient: str
    sender: str
    title: str
    content: str
    type: str
    read: bool
    metadata: Optional[Dict[str, Any]] = None
    created: str
    updated: str

# --------- Helper Functions ---------

def ensure_authenticated(x_user_id: Optional[str]):
    if not x_user_id:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Missing X-User-Id header")

def ensure_admin_or_self(x_user_id: Optional[str], recipient_id: str, x_user_role: Optional[str] = None):
    if not x_user_id:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Missing X-User-Id header")
    if x_user_role != "admin" and x_user_id != recipient_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Can only access own notifications")

# --------- Routes ---------

@router.get("/", response_model=List[NotificationResponse])
async def list_notifications(
    limit: int = 50,
    offset: int = 0,
    unread_only: bool = False,
    x_user_id: Optional[str] = Header(default=None)
):
    ensure_authenticated(x_user_id)

    try:
        notifications = pb_service.list_notifications_for_user(
            user_id=x_user_id,
            limit=limit,
            offset=offset,
            unread_only=unread_only
        )
        return notifications
    except Exception as e:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/unread-count")
async def get_unread_count(x_user_id: Optional[str] = Header(default=None)):
    ensure_authenticated(x_user_id)

    try:
        count = pb_service.get_unread_notifications_count(user_id=x_user_id)
        return {"count": count}
    except Exception as e:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/{notification_id}", response_model=NotificationResponse)
async def get_notification(
    notification_id: str,
    x_user_id: Optional[str] = Header(default=None),
    x_user_role: Optional[str] = Header(default=None)
):
    ensure_authenticated(x_user_id)

    try:
        notification = pb_service.get_notification(notification_id)
        if not notification:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Notification not found")

        ensure_admin_or_self(x_user_id, notification.get("recipient"), x_user_role)

        return notification
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/", status_code=201, response_model=NotificationResponse)
async def create_notification(
    req: CreateNotificationRequest,
    x_user_id: Optional[str] = Header(default=None),
    x_user_role: Optional[str] = Header(default=None)
):
    ensure_authenticated(x_user_id)

    # Only admins can create notifications for others
    if x_user_role != "admin" and x_user_id != req.sender_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Can only create notifications as yourself")

    try:
        notification = pb_service.create_notification(
            recipient_id=req.recipient_id,
            sender_id=req.sender_id,
            title=req.title,
            content=req.content,
            type=req.type,
            metadata=req.metadata or {}
        )
        return notification
    except Exception as e:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.patch("/{notification_id}", response_model=NotificationResponse)
async def update_notification(
    notification_id: str,
    req: UpdateNotificationRequest,
    x_user_id: Optional[str] = Header(default=None),
    x_user_role: Optional[str] = Header(default=None)
):
    ensure_authenticated(x_user_id)

    try:
        notification = pb_service.get_notification(notification_id)
        if not notification:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Notification not found")

        ensure_admin_or_self(x_user_id, notification.get("recipient"), x_user_role)

        updated_notification = pb_service.update_notification(
            notification_id=notification_id,
            read=req.read
        )
        return updated_notification
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.patch("/{notification_id}/read", response_model=NotificationResponse)
async def mark_as_read(
    notification_id: str,
    x_user_id: Optional[str] = Header(default=None),
    x_user_role: Optional[str] = Header(default=None)
):
    ensure_authenticated(x_user_id)

    try:
        notification = pb_service.get_notification(notification_id)
        if not notification:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Notification not found")

        ensure_admin_or_self(x_user_id, notification.get("recipient"), x_user_role)

        updated_notification = pb_service.mark_notification_as_read(notification_id)
        return updated_notification
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.delete("/{notification_id}", status_code=204)
async def delete_notification(
    notification_id: str,
    x_user_id: Optional[str] = Header(default=None),
    x_user_role: Optional[str] = Header(default=None)
):
    ensure_authenticated(x_user_id)

    try:
        notification = pb_service.get_notification(notification_id)
        if not notification:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Notification not found")

        ensure_admin_or_self(x_user_id, notification.get("recipient"), x_user_role)

        pb_service.delete_notification(notification_id)
        return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/mark-all-read", status_code=200)
async def mark_all_as_read(x_user_id: Optional[str] = Header(default=None)):
    ensure_authenticated(x_user_id)

    try:
        count = pb_service.mark_all_notifications_as_read(user_id=x_user_id)
        return {"marked_count": count}
    except Exception as e:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
