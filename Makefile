run-server:
	npm run dev

build-site:
	npm run build
	git subtree push --prefix public origin gh-pages
