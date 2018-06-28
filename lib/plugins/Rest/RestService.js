'use strict';

const DEFAULT_SERVICE_NAME = 'rest';

const Express = require('express');
const http = require('http');

const bodyParser = require('body-parser');
const cors = require('cors');

const OblakWire = require('../shared/OblakWire');
const builder = require('./builder/builder');
const oblakMiddleware = require('./oblakMiddleware');
const oblakErrorMiddleware = require('./oblakErrorMiddleware');

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

		this._setConfig(oblak);
		return this._link(app, oblak.config.rest[this.type]);
	}

	_setConfig(oblak) {
		this.config = oblak.config.rest[this.type];
	}

	_getDefinitions(oblak) {
		return oblak.rest[this.type];
	}

	_link() {
		// setup express
		this.express = new Express();
		this.http = new http.Server(this.express);

		this.express.use(cors({ exposedHeaders: 'x-total-count' }));
		this.express.use(bodyParser.urlencoded({ extended: true }));
		this.express.use(bodyParser.json());

		// important
		return this;
	}

	_attachRestRoutes(oblak) {
		// init express
		this.express.use(oblakMiddleware(this.wireApi), builder(this._getDefinitions(oblak), Express, this.app, oblak, this));
	}

	async init(oblak) {
		await super.init(oblak, oblak);

		this._attachRestRoutes(oblak);
		// init express
		// this.express.use(oblakMiddleware(this.wireApi), builder(oblak.rest[this.type], Express, this.app, oblak, this));
		this.express.use((req, res) => res.status(404).send('Not Found.'));
		this.express.use(oblakErrorMiddleware);

		return new Promise((resolve, reject) => {
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
