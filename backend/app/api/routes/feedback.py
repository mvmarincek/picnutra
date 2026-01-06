from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from app.db.database import get_db
from app.core.security import get_current_user
from app.models.models import User
from app.services.email_service import send_suggestion_email

router = APIRouter(prefix="/feedback", tags=["feedback"])

class FeedbackRequest(BaseModel):
    mensagem: str

@router.post("")
async def send_feedback(
    feedback: FeedbackRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    send_suggestion_email(current_user.email, current_user.id, feedback.mensagem)
    return {"success": True, "message": "Sugestão enviada com sucesso!"}

