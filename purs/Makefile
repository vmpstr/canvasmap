compile:
	spago bundle-app --main Main --to output/app.js

watch:
	spago build --watch

deploy: compile
	parcel build --public-url . index.html --target "browser"

