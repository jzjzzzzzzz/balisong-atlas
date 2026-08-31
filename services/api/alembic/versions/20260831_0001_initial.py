"""Initial evidence-first data model.

Revision ID: 20260831_0001
Revises: None
"""
from collections.abc import Sequence

from alembic import op

from app.db.base import Base
from app.models import domain  # noqa: F401

revision: str = "20260831_0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    Base.metadata.create_all(bind=bind)
    if bind.dialect.name == "postgresql":
        op.execute("CREATE INDEX IF NOT EXISTS ix_source_chunks_fts ON source_chunks USING gin (to_tsvector('simple', public_safe_text))")


def downgrade() -> None:
    Base.metadata.drop_all(bind=op.get_bind())
