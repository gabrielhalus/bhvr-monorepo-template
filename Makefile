APP_NAME := bunstack
DB_URL := postgres://postgres:admin@localhost:5432/bunstack
DB_COMPOSE := docker compose -f docker-compose.dev.yml

.PHONY: help
help:
	@echo "Available commands:"
	@echo "  make dev        Start development dependencies"
	@echo "  make dev-down   Stop development dependencies"
	@echo "  make dev-clean  Stop development dependencies and remove volumes"
	@echo "  make dev-status Show development dependencies status"

.PHONY: dev
dev:
	@$(DB_COMPOSE) up -d

.PHONY: dev-down
dev-down:
	@$(DB_COMPOSE) down

.PHONY: dev-clean
dev-clean:
	@$(DB_COMPOSE) down -v

.PHONY: dev-status
dev-status:
	@$(DB_COMPOSE) ps
