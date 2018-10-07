install:
	npm install

db-setup:
	npm run sequelize db:migrate

setup: install db-setup
	npm run flow-typed install -- -s

run:
	DEBUG="application:*" npm run nodemon -- --watch .  --ext '.js' --exec npm run gulp -- server

start:
	npm run start

production:
	NODE_ENV=production npm run start

console:
	npm run gulp -- console

install:
	npm install		

build: debug
	npm run build

lint:
	npm run eslint .

test:
	npm test

check-types:
	npm run flow

.PHONY: test