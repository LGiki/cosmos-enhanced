DIST := ./dist
OBJECTS := icons *.js *.css manifest.json

PACKAGE_NAME := cosmos-enhanced
PACKAGE_VERSION := $(shell cat ./manifest.json | jq -r '.version')

all: clean build

clean:
	rm -rf ${DIST}

build:
	rm -rf ${DIST}; \
	mkdir -p ${DIST}; \
	cp -R ${OBJECTS} ${DIST}; \
	cd ${DIST}; \
	zip -r ${PACKAGE_NAME}-${PACKAGE_VERSION}.zip .; \
