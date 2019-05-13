'use strict';

const AccessRightsManager = require('../shared/AccessRightsManager');
const ReadModelStore = require('../shared/ReadmodelsStore');
const CrudModelStore = require('../shared/CrudModelStore');
const Eventstore = require('../shared/Eventstore');

const ReadApi = require('../shared/WireApi/ReadApi');


class Base {
	constructor(name, description) {
		if (!name)
			throw new Error('OblakApp must have a name');

		this.name = name;
		this.description = description;
	}

	baseLink(app, oblak) {
		this.hooksManager = oblak.hooksManager;
		this.preLink(app, oblak);
	}

	// eslint-disable-next-line
	preLink(app, oblak) {}

	triggerHook(name, data) {
		this.hooksManager.triggerHook(this, name, data);
		return this;
	}

	registerHook(name) {
		this.hooksManager.registerHook(name);
		return this;
	}

	link(app, oblak, ApiConstructor = ReadApi) {
		this.accessRightsManager = new AccessRightsManager(oblak, this._getAccessDefintions(oblak));
		oblak = this.accessRightsManager.filterOblak(oblak);

		this.app = app.getProcess(this.name);
		// mutate kellner for now - a spesialized kellner method for such things should be added
		this.app.canAccess = this.accessRightsManager.canAccess;

		this.servicesStore = oblak.servicesStore;
		this.readmodelStore = new ReadModelStore(this.app, this);
		this.crudmodelStore = new CrudModelStore(this.app, this);
		this.eventstore = new Eventstore(this.app, this);

		this.wireApi = new ApiConstructor({
			app: this.app,
			wire: this,
			crud: oblak.crud,
			domain: oblak.domain,
			readmodels: oblak.readmodels,
			services: oblak.services,
			errors: oblak.errors,
		});

		this.linkService(app, oblak);
		return oblak;
	}

	linkService() {} // eslint-disable-line

	_getAccessDefintions() { // eslint-disable-line
		return { '*': true };
	}

	async init(oblak) {
		// await this.servicesStore.init(oblak, this);
		await this.readmodelStore.init(oblak, this);
		await this.crudmodelStore.init(oblak, this);
		await this.eventstore.init(oblak, this);
	}
}

module.exports = Base;
