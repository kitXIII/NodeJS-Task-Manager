install:
	npm install

db-setup:
	npx sequelize db:migrate

db-flush:
	npx sequelize db:migrate:undo:all

db-fill:
	npx sequelize db:seed:all

setup: install db-setup db-fill
	npx flow-typed install

run:
	npx nodemon --watch . --ext '.js .pug' --exec npx gulp server

run-debug:
	DEBUG="application:*" npx nodemon --watch . --ext '.js' --exec npx gulp server

start:
	npm run start

heroku-start: db-setup
	npm run start

console:
	npx gulp -- console

build:
	rm -rf dist
	npm run build

lint:
	npx eslint .

test:
	npm run test

watch:
	npm run test-watch

test-debug:
	DEBUG="application:*" npm test

check-types:
	npx flow

.PHONY: test