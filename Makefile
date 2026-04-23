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
db:
	docker compose exec db bash
buildCleanApp:
	pnpm build:clean

filter ?= all
get_filter = $(if $(filter all,$(filter)),, --filter=$(filter)$(1))
f_deps  := $(call get_filter,...)
f_exact := $(call get_filter,)

install:
	pnpm install
installOne:
	pnpm add $(n) $(f_exact)
buildAll:
	pnpm build $(f_deps)
buildLibs:
	make buildAll filter="./libs/*"
migrate:
	pnpm $(f_exact) migration:up
dev:
	pnpm dev $(f_deps)
prod:
	pnpm prod $(f_exact)
checkTypes:
	pnpm check-types $(f_exact)
deckSync:
	docker compose run --rm kong-deck gateway sync /app/kong-dev.yaml

adcSync:
	$(if $(environment),,$(error "ERROR: 'environment' param is required. eg: make adcSync environment=dev"))
	docker compose run --rm adc adc sync -f conf/apisix-$(environment).yaml
adcDump:
	docker compose run --rm adc adc dump -o adc/adc.yaml

dir ?= apps
clean:
	./clean.sh $(dir)
