SHELL := /bin/bash
PNPM := corepack pnpm
PY := uv run

.PHONY: bootstrap dev down logs migrate seed test lint typecheck create-admin process-demo render-demo reset-db
bootstrap:
	cp -n .env.example .env || true
	$(PNPM) install --frozen-lockfile
	uv sync --all-groups --frozen

dev:
	docker compose up --build

down:
	docker compose down

logs:
	docker compose logs -f --tail=200

migrate:
	$(PY) alembic upgrade head

seed:
	PYTHONPATH=services/api:services/worker:. $(PY) python scripts/seed.py

test:
	$(PNPM) test
	PYTHONPATH=services/api:services/worker:. $(PY) pytest

lint:
	$(PNPM) lint
	$(PY) ruff check .

typecheck:
	$(PNPM) typecheck
	$(PY) mypy

create-admin:
	@test -n "$(EMAIL)" || (echo "Usage: make create-admin EMAIL=example@example.com" && exit 2)
	PYTHONPATH=services/api:. $(PY) python scripts/create_admin.py "$(EMAIL)"

process-demo:
	PYTHONPATH=services/api:services/worker:. $(PY) python scripts/process_demo.py

render-demo:
	PYTHONPATH=services/api:. $(PY) python scripts/render_demo.py

reset-db:
	@read -p "Delete local volumes and database? [y/N] " answer; [ "$$answer" = "y" ]
	docker compose down -v
	rm -f data/atlas.db
