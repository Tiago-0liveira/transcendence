IMAGE_NAME=transcendence-frontend

all: prod

dev:
	docker build --target dev -t ${IMAGE_NAME}:dev .
	docker run -p 3000:3000 ${IMAGE_NAME}:dev

prod:
	docker build -t ${IMAGE_NAME}:prod .
	docker run -p 80:80 -p 443:443 ${IMAGE_NAME}:prod

.PHONY: all dev prod