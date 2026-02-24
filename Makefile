install:
	npm ci

db-migrate:
	npx knex migrate:latest

build:
	npm ci
	npx knex migrate:latest
	npm run build

start:
	npm start

lint:
	npx eslint .

test:
	npm test
