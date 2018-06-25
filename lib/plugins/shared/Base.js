'use strict';

const ServicesStore = require('../shared/ServicesStore');

const ReadModelStore = require('../shared/ReadmodelsStore');
const CrudModelStore = require('../shared/CrudModelStore');
const WireApi = require('../shared/WireApi/ReadApi');


class Base {
	constructor(name, description) {
		if (!name)
			throw new Error('OblakApp must have a name');

		this.name = name;
		this.description = description;
	}

	link(app, oblak) {
		this.app = app.getProcess(this.name);
		// services should be accessasable system wide
		this.servicesStore = new ServicesStore(this.app);

		this.readmodelStore = new ReadModelStore(this.app);
		this.crudmodelStore = new CrudModelStore(this.app);

		this.wireApi = new WireApi({
			app: this.app,
			wire: this,
			crud: oblak.crud,
			domain: oblak.domain,
			readmodels: oblak.readmodels,
			services: oblak.services,
			errors: oblak.errors,
		});
	}

	async init(oblak) {
		await this.servicesStore.init(oblak, this);
		await this.readmodelStore.init(oblak, this);
		await this.crudmodelStore.init(oblak, this);
	}
}

module.exports = Base;
