'use strict';

const DEFAULT_SERVICE_NAME = 'rest';

const Express = require('express');
const http = require('http');

const bodyParser = require('body-parser');
const cors = require('cors');

const OblakWire = require('../shared/OblakWire');
const builder = require('./builder/builder');
const oblakMiddleware = require('./oblakMiddleware');

class RestService extends OblakWire {
	constructor({
		type,
		name = `${DEFAULT_SERVICE_NAME}:${type}`,
	} = {}) {
		super(name);
		this.express = null;
		this.http = null;
		this.config = null;
		this.name = name;
		this.type = type;
	}

	link(app, oblak) {
		// setup wires
		super.link(app, oblak);

		// setup express
		this.express = new Express();
		this.config = oblak.config.rest[this.type];

		this.express.use(cors({ exposedHeaders: 'x-total-count' }));
		this.express.use(bodyParser.urlencoded({ extended: true }));
		this.express.use(bodyParser.json());

		// important
		return this;
	}

	async init(oblak) {
		await this.servicesStore.init(oblak, this);
		await this.readmodelStore.init(oblak, this);
		await this.crudmodelStore.init(oblak, this);

		// init express
		this.express.use(oblakMiddleware(this.wireApi), builder(oblak.rest[this.type], Express, this.app, oblak, this));

		return new Promise((resolve, reject) => {
			this.http = new http.Server(this.express);
			this.http.listen(this.config.port, (err) => {
				if (err)
					return reject(err);
				return resolve();
			});
		});
	}

	get serviceName() { // eslint-disable-line
		return DEFAULT_SERVICE_NAME;
	}
}

module.exports = RestService;
