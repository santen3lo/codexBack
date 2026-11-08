.PHONY: install test build run run-dev docker-up

# Установка всех зависимостей
install:
	cd backend && python3 -m venv venv && venv/bin/pip install -r requirements.txt
	cd frontend && npm install

# Запуск тестов бэкенда
test:
	cd backend && venv/bin/pytest tests/

# Сборка фронтенда
build:
	cd frontend && npm run build

# Запуск единого сервера (бэкенд API + встроенный фронтенд)
run: build
	cd backend && venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Запуск фронтенда в режиме разработки (HMR)
run-dev:
	cd frontend && npm run dev

# Запуск в Docker контейнере
docker-up:
	docker compose up --build
