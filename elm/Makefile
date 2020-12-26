all:
	elm make --output=map.js src/Map.elm

debug:
	elm make --output=map.js src/Map.elm --debug

deploy:
	elm make --output=map.js src/Map.elm --optimize
	rm -rf ../elm-deploy/*
	cp -r *.js *.html styles js ../elm-deploy/

test:
	elm-test