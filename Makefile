install:
	npm install

db-setup:
	npm run sequelize db:migrate

db-flush:
	npm run sequelize db:migrate:undo:all

setup: install db-setup
	npm run flow-typed install

run:
	DEBUG="application:*" npm run nodemon -- --watch . --ext '.js' --exec npm run gulp -- server

start:
	npm run start

heroku-start:
	npm run sequelize db:migrate
	npm run start

console:
	npm run gulp -- console

build:
	npm run build

lint:
	npm run eslint .

test:
	npm test

test-debug:
	DEBUG="application:*" npm test

check-types:
	npm run flow

.PHONY: test