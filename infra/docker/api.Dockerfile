FROM python:3.12.11-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PYTHONPATH=/workspace/services/api:/workspace/services/worker
WORKDIR /workspace
RUN apt-get update && apt-get install -y --no-install-recommends libgl1 libglib2.0-0 curl && rm -rf /var/lib/apt/lists/*
COPY pyproject.toml README.md LICENSE alembic.ini ./
COPY services ./services
COPY packages ./packages
COPY scripts ./scripts
COPY data ./data
RUN PIP_DEFAULT_TIMEOUT=300 pip install --retries 10 --no-cache-dir .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
