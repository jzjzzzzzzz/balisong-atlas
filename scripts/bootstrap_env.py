import secrets
from pathlib import Path

path = Path(".env")
if path.exists():
    print("Keeping existing .env")
else:
    text = Path(".env.example").read_text()
    text = text.replace("APP_SECRET=\n", f"APP_SECRET={secrets.token_urlsafe(48)}\n", 1)
    text = text.replace("S3_SECRET_KEY=\n", f"S3_SECRET_KEY={secrets.token_urlsafe(32)}\n", 1)
    path.write_text(text)
    print("Created .env with random local-only secrets")
