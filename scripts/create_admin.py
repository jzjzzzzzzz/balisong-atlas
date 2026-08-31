import asyncio
import getpass
import sys

from sqlalchemy import select

from app.core.security import hash_password
from app.db.session import SessionFactory
from app.models.domain import User


async def create(email: str) -> None:
    first = getpass.getpass("New administrator password (12+ characters): ")
    second = getpass.getpass("Confirm password: ")
    if first != second:
        raise SystemExit("Passwords do not match")
    password_hash = hash_password(first)
    async with SessionFactory() as session:
        if await session.scalar(select(User).where(User.email == email.lower())):
            raise SystemExit("A user with that email already exists")
        session.add(User(email=email.lower(), password_hash=password_hash, role="admin", is_active=True))
        await session.commit()
    print(f"Administrator created: {email.lower()}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: create_admin.py EMAIL")
    asyncio.run(create(sys.argv[1]))
