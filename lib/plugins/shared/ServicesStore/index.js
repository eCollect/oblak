'use strict';

const builder = require('./builder');


const getNamespacedService = (collectionName, service, currentNameSpace = {}) => {
	const [namespace, serviceName] = collectionName.split(/:(.+)/);
	currentNameSpace[namespace] = (!serviceName) ? service : getNamespacedService(serviceName, service, currentNameSpace[namespace]);
	return currentNameSpace;
};

module.exports = class ServicesStore {
	constructor(app) {
		this.app = app;
		this.services = {};
		this.onClose = [];
	}

	async init({ services }) {
		Object.entries(builder({ services })).forEach(([key, service]) => this.add(key, service));
	}

	add(name, service) {
		if (name in this.services)
			throw new Error(`Service ${name} already exists.`);

		this.services[name] = (typeof service.init === 'function') ? service.init(this, this.app) : service;
		if (typeof service.close === 'function')
			this.onClose.push(() => service.close());
	}

	buildBaseApi({ services }) {
		return Object.keys(services).reduce((api, name) => getNamespacedService(name, () => this.service(name), api), {});
	}

	service(name) {
		if (!(name in this.services))
			throw new Error(`No service ${name} initialized.`);
		return this.services[name];
	}

	// alias
	get(name) {
		return this.service(name);
	}

	async close() {
		for (const onClose of this.onClose)
			await onClose();
	}
};
