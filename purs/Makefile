compile:
	spago bundle-app --main Main --to output/app.js

watch:
	spago build --watch

deploy: compile
	parcel build index.html --target "browser"

