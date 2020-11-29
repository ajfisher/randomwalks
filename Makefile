.PHONY: help

help:
	@echo "DEV actions:"
	@echo "------------"
	@echo "build:                Builds all of the files if needed"
	@echo "clean:                Cleans all the old files out"
	@echo "coverage:             Generates a test code coverage report"
	@echo "docs:                 Generates the documentation"
	@echo "install:              Installs all dependencies"
	@echo "lint:                 Lint the code"
	@echo "run:                  Runs the dev server"
	@echo "test:                 Tests the core code"
	@echo "snapshot-test:        Does a full round of snapshot testing"

build: clean
	npm run build

clean:
	rm -rf ./dist/assets/

coverage: lint
	npm run coverage

docs: lint
	npm run docs

install: clean
	rm -rf ./node_modules/
	npm install

lint:
	npm run lint

run:
	npm run dev

test: lint
	npm run test

snapshot-test: test
	npm run snapshot-test
