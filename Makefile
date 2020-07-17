run-server:
	cp -r data public/
	npm run dev

build-example:
	cp -r data public/
	npm run build
	rm -rf /tmp/svelte-memory-game
	mv public /tmp/svelte-memory-game
	git checkout gh-pages
	cp /tmp/svelte-memory-game ./
	git checkout master
