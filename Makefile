SHELL := /bin/bash
PNPM := corepack pnpm
PY := uv run

.PHONY: bootstrap dev down logs migrate seed test lint typecheck create-admin process-demo render-demo collect-literature screen-literature source-thumbnails reset-db
bootstrap:
	python3 scripts/bootstrap_env.py
	$(PNPM) install --frozen-lockfile
	uv sync --all-groups --frozen

dev:
	docker compose up --build

down:
	docker compose down

logs:
	docker compose logs -f --tail=200

migrate:
	docker compose exec api alembic upgrade head

seed:
	docker compose exec api python scripts/seed.py

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
	docker compose exec api python scripts/create_admin.py "$(EMAIL)"

process-demo:
	docker compose exec worker python scripts/process_demo.py

render-demo:
	docker compose exec api python scripts/render_demo.py

collect-literature:
	python3 scripts/collect_literature.py --download --jobs 4 --max-item-mb 140

screen-literature:
	$(PY) python scripts/screen_literature.py

source-thumbnails:
	$(PY) python scripts/generate_source_thumbnails.py

reset-db:
	@read -p "Delete local volumes and database? [y/N] " answer; [ "$$answer" = "y" ]
	docker compose down -v
	rm -f data/atlas.db
