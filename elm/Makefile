all:
	elm make --output=map.js src/Map.elm

debug:
	elm make --output=map.js src/Map.elm --debug

deploy:
	elm make --output=map.js src/Map.elm --optimize
	cp *.js *.html *.css ../elm-deploy/

test:
	elm-test