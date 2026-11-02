import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from database import get_db
from utils.auth import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])


class NotificationCreate(BaseModel):
    recipient_id: str
    title: str
    message: str
    category: Optional[str] = "info"  # application, interview, match, system
    link: Optional[str] = None


@router.get("")
async def list_notifications(current_user: dict = Depends(get_current_user)):
    """
    Retrieves in-app notifications for current authenticated user.
    """
    db = get_db()
    user_id = current_user.get("id") or current_user.get("email")
    cursor = db["notifications"].find({"$or": [{"recipient_id": user_id}, {"recipient_id": "all"}]})
    notifs = []
    async for n in cursor:
        notifs.append({
            "id": str(n.get("_id")),
            "title": n.get("title", "Notification"),
            "message": n.get("message", ""),
            "category": n.get("category", "info"),
            "link": n.get("link"),
            "read": n.get("read", False),
            "created_at": n.get("created_at")
        })

    # If no notifications exist yet, generate friendly initial onboarding notifications
    if not notifs:
        notifs = [
            {
                "id": "notif-welcome",
                "title": "Welcome to AI Recruitment Portal V2",
                "message": "Your profile is active. Try out our new ATS Resume Scanner and Mock Interview Simulator!",
                "category": "system",
                "link": "/matcher",
                "read": False,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": "notif-job-match",
                "title": "High Match Job Recommendation",
                "message": "New openings matching your Python & React skills were detected with 90%+ compatibility.",
                "category": "match",
                "link": "/jobs",
                "read": False,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]

    notifs.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return {
        "unread_count": sum(1 for n in notifs if not n.get("read", False)),
        "notifications": notifs
    }


@router.patch("/{notif_id}/read")
async def mark_notification_read(notif_id: str, current_user: dict = Depends(get_current_user)):
    """
    Marks a notification as read.
    """
    db = get_db()
    await db["notifications"].update_one({"_id": notif_id}, {"$set": {"read": True}})
    return {"message": "Notification marked as read", "id": notif_id}


@router.patch("/read-all")
async def mark_all_notifications_read(current_user: dict = Depends(get_current_user)):
    """
    Marks all notifications for current user as read.
    """
    db = get_db()
    user_id = current_user.get("id") or current_user.get("email")
    await db["notifications"].update_many(
        {"$or": [{"recipient_id": user_id}, {"recipient_id": "all"}]},
        {"$set": {"read": True}}
    )
    return {"message": "All notifications marked as read"}
