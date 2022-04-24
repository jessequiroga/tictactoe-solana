export FLASK_APP=flaskr
export FLASK_ENV=development

.PHONY: test
test:
	. venv/bin/activate; pytest -s

.PHONY: run
run: venv
	. venv/bin/activate; flask run	

.PHONY: db-init
db-init: venv
	. venv/bin/activate; flask init-db