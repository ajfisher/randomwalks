.PHONY: help

help:
	@echo "DEV actions:"
	@echo "------------"
	@echo "build:                Builds all of the files if needed"
	@echo "clean:                Cleans all the old files out"
	@echo "install:              Installs all dependencies"
	@echo "lint:                 Lint the code"
	@echo "run:                  Runs the dev server"

build: clean
	npm run build

clean:
	rm -rf ./dist/assets/

install: clean
	rm -rf ./node_modules/
	npm install

lint:
	npm run lint

run:
	npm run dev

