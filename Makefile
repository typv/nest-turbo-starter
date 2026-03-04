ps:
	docker compose ps
build:
	docker compose up -d --build
up:
	docker compose up -d
down:
	docker compose down
stop:
	docker compose stop
node:
	docker compose exec node sh
db:
	docker compose exec db bash
buildCleanApp:
	docker compose exec node pnpm build:clean
install:
	docker compose exec node pnpm install

filter ?= all
filter_arg := $(if $(filter all,$(filter)),, --filter=$(filter))

buildAll:
	docker compose exec node pnpm build $(filter_arg)
buildLibs:
	make buildAll filter="./libs/*"
migrate:
	docker compose exec node pnpm $(filter_arg) migration:up
dev:
	docker compose exec node pnpm dev $(filter_arg)
prod:
	docker compose exec node pnpm prod $(filter_arg)
deckSync:
	docker compose run --rm kong-deck gateway sync /app/kong-dev.yaml

adcSync:
	$(if $(environment),,$(error "ERROR: 'environment' param is required. eg: make adcSync environment=dev"))
	docker compose run --rm adc adc sync -f conf/apisix-$(environment).yaml
adcDump:
	docker compose run --rm adc adc dump -o adc/adc.yaml
