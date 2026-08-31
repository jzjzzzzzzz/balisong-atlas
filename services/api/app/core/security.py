import hmac
import secrets
from uuid import UUID

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

from app.core.config import get_settings

_password_hasher = PasswordHasher()


def hash_password(password: str) -> str:
    if len(password) < 12:
        raise ValueError("Password must contain at least 12 characters")
    return _password_hasher.hash(password)


def verify_password(password_hash: str, password: str) -> bool:
    try:
        return _password_hasher.verify(password_hash, password)
    except VerifyMismatchError:
        return False


def create_session_token(user_id: UUID) -> str:
    serializer = URLSafeTimedSerializer(get_settings().app_secret, salt="atlas-session-v1")
    return serializer.dumps({"user_id": str(user_id)})


def read_session_token(token: str) -> UUID | None:
    settings = get_settings()
    serializer = URLSafeTimedSerializer(settings.app_secret, salt="atlas-session-v1")
    try:
        payload = serializer.loads(token, max_age=settings.session_max_age_seconds)
        return UUID(payload["user_id"])
    except (BadSignature, SignatureExpired, KeyError, ValueError, TypeError):
        return None


def new_csrf_token() -> str:
    return secrets.token_urlsafe(32)


def csrf_matches(cookie_value: str | None, header_value: str | None) -> bool:
    return bool(cookie_value and header_value and hmac.compare_digest(cookie_value, header_value))
