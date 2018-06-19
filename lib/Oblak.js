'use strict';

const path = require('path');
const appRoot = require('app-root-path');

const cqrsSwissknifeDomain = require('cqrs-swissknife/domain');
const cqrsSwissknifeDenormalizerLoader = require('cqrs-swissknife/denormalizer/loader');
const cqrsSwissknifeSagaLoader = require('cqrs-swissknife/saga/loader');

const serviceLoader = require('./plugins/shared/ServicesStore/loader');

const debug = require('./debug');
const tools = require('./tools');

const { doForEachDir } = require('./utils/fs');

const restLoader = require('./plugins/Rest/builder/loader');
const crudLoader = require('./plugins/Crud/loader');

const errors = require('./tools/errors');

const Kellner = require('kellner');

require('json5/lib/register');

class Oblak {
	constructor(config) {
		// config
		this.rootPath = config.rootPath || appRoot.path;
		const { name, version } = require(path.join(this.rootPath, 'package.json')); // eslint-disable-line
		const configFile = require(path.join(this.rootPath, 'config/config.json5')); // eslint-disable-line
		this.config = Object.assign({}, configFile, config);
		this.name = name;
		this.version = version;

		this.paths = {
			domain: path.join(this.rootPath, 'app', 'domain'),
			readmodels: path.join(this.rootPath, 'app', 'readmodels'),
			rest: path.join(this.rootPath, 'app', 'gateways', 'rest'),
			crud: path.join(this.rootPath, 'app', 'crud'),
			sagas: path.join(this.rootPath, 'app', 'sagas'),
			services: path.join(this.rootPath, 'app', 'services'),
		};

		this._domain = cqrsSwissknifeDomain.loader(this.paths.domain);
		this._readmodels = doForEachDir(this.paths.readmodels, rmp => cqrsSwissknifeDenormalizerLoader(rmp));
		this._rest = restLoader(this.paths.rest, this.config.rest);
		this._crud = crudLoader(this.paths.crud, this.config);
		this._sagas = cqrsSwissknifeSagaLoader(this.paths.sagas);
		this._services = serviceLoader(this.paths.services);

		this._kellner = new Kellner({
			name: this.name,
			version: this.version,
			config: this.config,
		});

		this._kellner.connections.use(Kellner.protocols.Amqp);
		this._kellner.connections.use(Kellner.protocols.Mongodb);
		this._kellner.connections.use(Kellner.protocols.Mongoose);

		this.errors = errors;

		this.processes = [];
		this._processes = new Map();
	}


	use(processes) {
		if (!processes)
			return;

		if (!Array.isArray(processes))
			processes = [processes];

		processes.forEach((process) => {
			if (typeof process.processes === 'function')
				this.use(process.processes(this));

			if (Array.isArray(process.processes))
				this.use(process.processes(this));

			this._processes.set(process.name, process);
		});
	}

	run({ options, services }) {
		this._kellner.options(options);
		const servicesToRun = Array.from(this._processes.values());
		if (services.all)
			return this._start(servicesToRun);
		return this._start(servicesToRun.filter(p => !p.shouldRun || p.shouldRun(services)));
	}

	async _start(servicesToRun) {
		this._processes.clear();

		await servicesToRun.reduce(async (promise, service) => {
			await promise;

			if (typeof service.link === 'function')
				service.link(this._kellner, this);

			if (typeof service.init === 'function')
				await service.init(this);
		}, Promise.resolve());

		await this._kellner.init();
	}

	async init() {
		return this._start(Array.from(this._processes.values()));
	}

	get domain() {
		if (!this._domain)
			this._domain = cqrsSwissknifeDomain.loader(this.paths.domain);
		return this._domain;
	}

	get readmodels() {
		if (!this._readmodels)
			this._readmodels = cqrsSwissknifeDenormalizerLoader(this.paths.readmodels);
		return this._readmodels;
	}

	get rest() {
		if (!this._rest)
			this._rest = restLoader(this.paths.rest);
		return this._rest;
	}

	get crud() {
		if (!this._crud)
			this._crud = restLoader(this.paths.rest);
		return this._crud;
	}

	get sagas() {
		return this._sagas;
	}

	get services() {
		return this._services;
	}

	static get debug() {
		return debug;
	}

	static get tools() {
		return tools;
	}
}

module.exports = Oblak;
