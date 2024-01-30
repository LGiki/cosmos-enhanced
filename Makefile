DIST := ./dist
CHROME_DIST := ${DIST}/chrome
FIREFOX_DIST := ${DIST}/firefox

COMMON_OBJECTS := icons *.js *.css
CHROME_MANIFEST := manifest.json
FIREFOX_MANIFEST := manifest_firefox.json

PACKAGE_NAME := cosmos-enhanced
CHROME_PACKAGE_VERSION := $(shell cat ${CHROME_MANIFEST} | jq -r '.version')
FIREFOX_PACKAGE_VERSION := $(shell cat ${FIREFOX_MANIFEST} | jq -r '.version')

all: clean build_chrome build_firefox

clean:
	rm -rf ${DIST}

build_chrome:
	mkdir -p ${CHROME_DIST}; \
	cp -R ${COMMON_OBJECTS} ${CHROME_DIST}; \
	cp -R ${CHROME_MANIFEST} ${CHROME_DIST}/manifest.json; \
	cd ${CHROME_DIST}; \
	zip -r -0 ${PACKAGE_NAME}-${CHROME_PACKAGE_VERSION}.zip .; \

build_firefox:
	mkdir -p ${FIREFOX_DIST}; \
	cp -R ${COMMON_OBJECTS} ${FIREFOX_DIST}; \
	cp -R ${FIREFOX_MANIFEST} ${FIREFOX_DIST}/manifest.json; \
	cd ${FIREFOX_DIST}; \
	zip -r -0 ${PACKAGE_NAME}-${FIREFOX_PACKAGE_VERSION}.zip .; \