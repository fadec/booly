
booly.zip: dist
	cd dist && zip ../booly.zip ./*

dist: build/Game.min.js
	mkdir -p dist
	sed -e 's/Game.js/Game.min.js/g' index.html > dist/index.html
	cp three.min.js dist
	cp Black_Ops_One_Regular.json dist
	cp droid_sans_mono_regular.typeface.json dist
	cp build/Game.min.js dist

build/Game.es2015.js: build Game.js
	babel Game.js > build/Game.es2015.js

build/Game.min.js: build build/Game.es2015.js
	uglifyjs --compress='' --mangle='' build/Game.es2015.js > build/Game.min.js

build:
	mkdir -p build

clean:
	rm -rf build dist
	rm booly.zip
