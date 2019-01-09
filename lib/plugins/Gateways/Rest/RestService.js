'use strict';

const DEFAULT_SERVICE_NAME = 'rest';

const Express = require('express');
const http = require('http');

const bodyParser = require('body-parser');
const cors = require('cors');

const OblakWire = require('../../shared/OblakWire');
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

	preLink() {
		this.registerHook('onRoute');
		this.registerHook('rest:beforeLink');
		this.registerHook('rest:afterLink');
		this.registerHook('rest:beforeRoutes', true);
		this.registerHook('rest:afterRoutes', true);
	}

	link(app, oblak) {
		super.link(app, oblak);
	}

	linkService(app, oblak) {
		// setup wires
		super.linkService(app, oblak);

		this._setConfig(oblak);
		return this._link(app, oblak.config.rest[this.type]);
	}

	_getAccessDefintions(oblak) {
		return oblak.rest[this.type].setup.path;
	}

	_getSetup(oblak) {
		return require(oblak.rest[this.type].setup.path); // eslint-disable-line
	}

	_setConfig(oblak) {
		this.config = oblak.config.rest[this.type];
	}

	_getDefinitions(oblak) {
		return oblak.rest[this.type];
	}

	_link() {
		this.triggerHook('rest:beforeLink');
		// setup express
		this.express = new Express();
		this.http = new http.Server(this.express);

		const corsMiddleware = cors({
			methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
			origin: '*',
			optionsSuccessStatus: 200,
		});
		this.express.options('*', corsMiddleware);
		this.express.use(corsMiddleware);
		this.express.use(bodyParser.urlencoded({ extended: true }));
		this.express.use(bodyParser.json());

		this.triggerHook('rest:afterLink');

		// important
		return this;
	}

	async _attachRestRoutes(oblak) {
		await this.triggerHook('rest:beforeRoutes');

		const router = builder(this._getDefinitions(oblak), Express, this.app, oblak, this);

		await this.triggerHook('rest:afterRoutes', { router, oblak });

		// init express
		this.express.use(oblakMiddleware(this.wireApi), router);
	}

	async init(oblak) {
		await super.init(oblak, oblak);
		await this._attachRestRoutes(oblak);

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

	shouldRun({ rest }) {
		return rest && (rest.includes('.') || rest.includes(this.type));
	}
}

module.exports = RestService;
