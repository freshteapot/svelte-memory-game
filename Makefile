run-server:
	cp -r data public/
	npm run dev

build-example:
	cp -r data public/
	npm run build
	git subtree push --prefix public origin gh-pages
