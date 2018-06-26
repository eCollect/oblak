'use strict';

const builder = require('./builder');


const getNamespacedService = (collectionName, service, currentNameSpace = {}) => {
	const [namespace, serviceName] = collectionName.split(/:(.+)/);
	currentNameSpace[namespace] = (!serviceName) ? service : getNamespacedService(serviceName, service, currentNameSpace[namespace]);
	return currentNameSpace;
};
/*
		const [ namespace, service ] = collectionName.split(/:(.+)/);
		if (service) {
			repository[namespace] = buildServices
			return repository;
		}
		*/

module.exports = class ServicesStore {
	constructor(app) {
		this.app = app;
		this.services = {};
	}

	async init({ services }) {
		this.services = Object.entries(builder({ services })).reduce((res, [key, service]) => {
			res[key] = (typeof service.init === 'function') ? service.init(this, this.app) : service;
			return res;
		}, {});
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
};
