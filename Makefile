SHELL := /bin/sh

.PHONY: help backend-setup backend-run backend-test backend-build frontend-setup frontend-run frontend-lint frontend-build dev

help:
	@printf "%s\n" \
	"Targets:" \
	"  backend-setup   Install backend dependencies" \
	"  backend-run     Run backend dev server" \
	"  backend-test    Run backend tests" \
	"  backend-build   Build backend jar" \
	"  frontend-setup  Install frontend dependencies" \
	"  frontend-run    Run frontend dev server" \
	"  frontend-lint   Lint frontend" \
	"  frontend-build  Build frontend" \
	"  dev             Run backend and frontend concurrently"

backend-setup:
	cd backend && mvn clean install

backend-run:
	cd backend && SPRING_PROFILES_ACTIVE=dev mvn spring-boot:run

backend-test:
	cd backend && mvn test

backend-build:
	cd backend && mvn clean package

frontend-setup:
	cd frontend && npm install

frontend-run:
	cd frontend && npm run dev

frontend-lint:
	cd frontend && npm run lint

frontend-build:
	cd frontend && npm run build

dev:
	@printf "%s\n" "Use two terminals:" \
	"  make backend-run" \
	"  make frontend-run"
