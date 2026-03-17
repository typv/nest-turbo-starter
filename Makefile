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

filter ?= all
get_filter = $(if $(filter all,$(filter)),, --filter=$(filter)$(1))
f_deps  := $(call get_filter,...)
f_exact := $(call get_filter,)

install:
	docker compose exec node pnpm install
installOne:
	docker compose exec node pnpm add $(n) $(f_exact)
buildAll:
	docker compose exec node pnpm build $(f_deps)
buildLibs:
	make buildAll filter="./libs/*"
migrate:
	docker compose exec node pnpm $(f_exact) migration:up
dev:
	docker compose exec node pnpm dev $(f_deps)
prod:
	docker compose exec node pnpm prod $(f_exact)
deckSync:
	docker compose run --rm kong-deck gateway sync /app/kong-dev.yaml

adcSync:
	$(if $(environment),,$(error "ERROR: 'environment' param is required. eg: make adcSync environment=dev"))
	docker compose run --rm adc adc sync -f conf/apisix-$(environment).yaml
adcDump:
	docker compose run --rm adc adc dump -o adc/adc.yaml
