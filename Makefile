install:
	npm install

db-setup:
	npm run sequelize db:migrate

db-flush:
	npm run sequelize db:migrate:undo:all

db-fill:
	npm run sequelize db:seed:all

setup: install db-setup db-fill
	npm run flow-typed install

run:
	DEBUG="application:*" npm run nodemon -- --watch . --ext '.js' --exec npm run gulp -- server

start:
	npm run start

heroku-start: db-setup
	npm run start

console:
	npm run gulp -- console

build:
	rm -rf dist
	npm run build

lint:
	npm run eslint .

test:
	npm test

watch:
	npm run test-watch

test-debug:
	DEBUG="application:*" npm test

check-types:
	npm run flow

.PHONY: test