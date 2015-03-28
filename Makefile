
test: test-unit test-integration

test-unit:
	@NODE_ENV=test mocha test
	
test-integration:
	npm link
	mkdir test_integration
	cd test_integration; \
		wget https://github.com/balderdashy/waterline/archive/master.zip; \
		unzip -q master.zip
	cd test_integration/waterline-master; \
		npm link waterline-schema; \
		npm install; \
		npm test
	rm -rf test_integration
