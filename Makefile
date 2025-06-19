all: prod


prod:
	docker-compose --profile prod up --build -d
dev:
	docker-compose --profile dev up --build -d

prod-down:
	docker-compose --profile prod down
dev-down:
	docker-compose --profile dev down


.PHONY: all prod dev prod-down dev-down