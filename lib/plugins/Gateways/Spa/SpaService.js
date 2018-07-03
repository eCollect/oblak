'use strict';

const path = require('path');
const AccessRightsManager = require('../../shared/AccessRightsManager');

const RestService = require('../Rest/RestService');
const wsServer = require('./wsServer');

const DEFAULT_SERVICE_NAME = 'spa';
const WS_SERVER_PATH = '/oblak';

class SpaService extends RestService {
	constructor({
		type,
		name = `${DEFAULT_SERVICE_NAME}:${type}`,
	}) {
		super({ type, name });
	}

	_getDefinitions(oblak) {
		return oblak.spa[this.type];
	}

	_setConfig(oblak) {
		this.config = oblak.config.spa[this.type];
	}

	_getAccessDefintions(oblak) {
		return oblak.spa[this.type].setup.path;
	}

	linkService(app, oblak) {
		super.linkService(app, oblak);
		this.wsServer = wsServer(this.http, app, this, oblak);
	}

	_attachRestRoutes(oblak) {
		super._attachRestRoutes(oblak);
		const { readmodels, domain, crud } = oblak;
		this.express.get('/oblak/app.json', (req, res) => { res.json({ readmodels, domain, crud })})
	}

	async init(oblak) {
		const logger = this.app.services.getLogger();
		await super.init(oblak);
		logger.info(this.config, 'Started...');
	}
}

module.exports = SpaService;
