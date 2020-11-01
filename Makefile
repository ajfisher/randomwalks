.PHONY: help

help:
	@echo "DEV actions:"
	@echo "------------"
	@echo "clean:                Cleans all the old files out"
	@echo "install:              Installs all dependencies"
	@echo "run:                  Runs the dev server"

clean:
	rm -rf ./node_modules/

install:
	npm install

run:
	npm run dev
