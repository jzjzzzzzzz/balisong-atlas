from fastapi import APIRouter, HTTPException, Request, Response
from sqlalchemy import select

from app.core.config import get_settings
from app.core.dependencies import CurrentUser, SessionDep
from app.core.security import create_session_token, new_csrf_token, verify_password
from app.models.domain import User
from app.schemas.domain import LoginRequest, UserRead
from app.services.audit import record_audit

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/login", response_model=UserRead)
async def login(payload: LoginRequest, request: Request, response: Response, session: SessionDep) -> UserRead:
    user = await session.scalar(select(User).where(User.email == payload.email.lower()))
    if user is None or not user.is_active or not verify_password(user.password_hash, payload.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    settings = get_settings()
    csrf = new_csrf_token()
    response.set_cookie(
        settings.session_cookie_name,
        create_session_token(user.id),
        httponly=True,
        secure=settings.production,
        samesite="lax",
        max_age=settings.session_max_age_seconds,
        path="/",
    )
    response.set_cookie(
        settings.csrf_cookie_name,
        csrf,
        httponly=False,
        secure=settings.production,
        samesite="lax",
        max_age=settings.session_max_age_seconds,
        path="/",
    )
    await record_audit(session, event_type="login", entity_type="user", entity_id=user.id, actor_id=user.id, request_id=request.state.request_id)
    await session.commit()
    return UserRead.model_validate(user)


@router.post("/logout")
async def logout(request: Request, response: Response, user: CurrentUser, session: SessionDep) -> dict[str, bool]:
    settings = get_settings()
    response.delete_cookie(settings.session_cookie_name, path="/")
    response.delete_cookie(settings.csrf_cookie_name, path="/")
    await record_audit(session, event_type="logout", entity_type="user", entity_id=user.id, actor_id=user.id, request_id=request.state.request_id)
    await session.commit()
    return {"ok": True}


@router.get("/me", response_model=UserRead)
async def me(user: CurrentUser) -> UserRead:
    return UserRead.model_validate(user)
