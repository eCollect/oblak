'use strict';

const builder = require('./builder');

module.exports = class ServicesStore {
	constructor(app) {
		this.app = app;
		this.services = {};
	}

	async init({ services }) {
		this.services = Object.entries(builder({ services })).reduce((res, [key, service]) => {
			res[key] = (typeof service.init === 'function') ? service.init(this.app) : service;
			return res;
		}, {});
	}

	buildBaseApi({ services }) {
		return Object.keys(services).reduce((api, name) => {
			api[name] = () => this.service(name);
			return api;
		}, {});
	}

	service(name) {
		if (!(name in this.services))
			throw new Error(`No service ${name} initilized.`);
		return this.services[name];
	}
};

