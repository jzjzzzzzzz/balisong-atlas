from typing import Any
from uuid import UUID

from fastapi.encoders import jsonable_encoder
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.domain import AuditEvent


async def record_audit(
    session: AsyncSession,
    *,
    event_type: str,
    entity_type: str,
    entity_id: UUID | None,
    request_id: str,
    actor_id: UUID | None = None,
    before: dict[str, Any] | None = None,
    after: dict[str, Any] | None = None,
) -> AuditEvent:
    event = AuditEvent(
        actor_id=actor_id,
        event_type=event_type,
        entity_type=entity_type,
        entity_id=entity_id,
        before_json=jsonable_encoder(before or {}),
        after_json=jsonable_encoder(after or {}),
        request_id=request_id,
    )
    session.add(event)
    return event
