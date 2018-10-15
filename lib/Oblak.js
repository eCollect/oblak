'use strict';

const path = require('path');
const appRoot = require('app-root-path');
const Kellner = require('kellner');

const cqrsSwissknifeDomain = require('cqrs-swissknife/domain');
const cqrsSwissknifeDenormalizerLoader = require('cqrs-swissknife/denormalizer/loader');
const cqrsSwissknifeSagaLoader = require('cqrs-swissknife/saga/loader');

const HooksManager = require('./HooksManager');

const serviceLoader = require('./plugins/shared/ServicesStore/loader');
const ValidationService = require('./ValidationService');
const queryParser = require('./queryParser');

const debug = require('./debug');
const tools = require('./tools');

const { doForEachDir } = require('./utils/fs');
const processEnv = require('./utils/processEnv');

const restLoader = require('./plugins/Gateways/Rest/builder/loader');
const spaLoader = require('./plugins/Gateways/Spa/builder/loader');

const crudLoader = require('./plugins/Crud/loader');

const errors = require('./tools/errors');

const loadConfig = require('./loadConfig');

const OBLAK_ENV_NAME = 'OBLAK_ENV';

class Oblak {
	constructor(config = {}) {
		// enviroment
		this.env = config.env || processEnv(OBLAK_ENV_NAME) || 'debug';

		this.hooksManager = new HooksManager();
		this.hooksManager.registerHook('beforeLoad');
		this.hooksManager.registerHook('beforeModuleLoad');
		this.hooksManager.registerHook('afterModuleLoad');
		this.hooksManager.registerHook('afterLoad');

		this.hooksManager.registerHook('beforeInit');
		this.hooksManager.registerHook('afterInit');

		// config
		this.rootPath = config.rootPath || appRoot.path;
		const { name, version } = require(path.join(this.rootPath, 'package.json')); // eslint-disable-line

		this.config = loadConfig.load(this.env, path.join(this.rootPath, 'config'), {}, config);

		this.name = name;
		this.version = version;

		this.paths = {
			domain: path.join(this.rootPath, 'app', 'domain'),
			readmodels: path.join(this.rootPath, 'app', 'readmodels'),
			rest: path.join(this.rootPath, 'app', 'gateways', 'rest'),
			spa: path.join(this.rootPath, 'app', 'gateways', 'spa'),
			crud: path.join(this.rootPath, 'app', 'crud'),
			sagas: path.join(this.rootPath, 'app', 'sagas'),
			services: path.join(this.rootPath, 'app', 'services'),
			validation: path.join(this.rootPath, 'app', 'validation'),
		};

		// extend config with local config
		this.config = loadConfig.merge(this.paths.rest, 'rest', this.config, true);
		this.config = loadConfig.merge(this.paths.spa, 'spa', this.config, true);
		this.config = loadConfig.merge(this.paths.spa, 'sagas', this.config, true);

		this.queryParser = queryParser;

		this._kellner = new Kellner({
			name: this.name,
			version: this.version,
			config: this.config,
		});

		this._kellner.connections.use(Kellner.protocols.Amqp);
		this._kellner.connections.use(Kellner.protocols.Mongodb);
		this._kellner.connections.use(Kellner.protocols.Mongoose);
		this._kellner.connections.use(Kellner.protocols.Elasticsearch);

		this.errors = errors;

		this.processes = [];
		this._processes = new Map();
	}

	_load() {
		this.hooksManager.triggerHook(this, 'beforeLoad');

		this._loadModule('domain', () => cqrsSwissknifeDomain.loader(this.paths.domain));
		this._loadModule('readmodels', () => doForEachDir(this.paths.readmodels, (rmp, type) => {
			if (!this.config.denormalizers[type])
				return null;
			return cqrsSwissknifeDenormalizerLoader(rmp);
		}));
		this._loadModule('sagas', () => doForEachDir(this.paths.sagas, (rmp, type) => {
			const sagasConfig = this.config.sagas[type];
			if (!sagasConfig)
				return null;

			return {
				sagas: cqrsSwissknifeSagaLoader(rmp),
			};
		}));
		this._loadModule('rest', () => restLoader(this.paths.rest, this.config.rest));
		this._loadModule('crud', () => crudLoader(this.paths.crud, this.config));

		this.services = serviceLoader(this.paths.services);

		this.spa = spaLoader(this.paths.spa, this.config.spa);

		this.validation = ValidationService.loader(this.paths.validation);
		this.validationService = new ValidationService(this);

		this.hooksManager.triggerHook(this, 'afterLoad');
	}

	_linkProcesses(processes = this.processes) {
		if (!processes)
			return;

		if (!Array.isArray(processes))
			processes = [processes];

		processes.forEach((process) => {
			if (typeof process.processes === 'function')
				this._linkProcesses(process.processes(this));

			if (Array.isArray(process.processes))
				this._linkProcesses(process.processes(this));

			if (typeof process.baseLink === 'function')
				process.baseLink(this._kellner, this);

			this._processes.set(process.name, process);
		});
	}

	_loadModule(name, loader) {
		this.hooksManager.triggerHook(this, 'beforeModuleLoad', { name });
		this[name] = loader();
		this.hooksManager.triggerHook(this, 'afterModuleLoad', { name });
	}

	use(processes) {
		this.processes.push(processes);
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

		this.hooksManager.triggerHook(this, 'beforeInit', this);

		await servicesToRun.reduce(async (promise, service) => {
			await promise;
			let customizedOblak = this;

			if (typeof service.link === 'function')
				customizedOblak = service.link(this._kellner, this) || this;

			if (typeof service.init === 'function')
				await service.init(customizedOblak);
		}, Promise.resolve());

		this.hooksManager.triggerHook(this, 'afterInit', this);

		await this._kellner.init();
	}

	async _clear(servicesToClean) {
		this._processes.clear();

		await servicesToClean.reduce(async (promise, service) => {
			await promise;
			let customizedOblak = this;

			if (typeof service.link === 'function')
				customizedOblak = service.link(this._kellner, this) || this;

			if (typeof service.clear === 'function')
				await service.clear(customizedOblak);
		}, Promise.resolve());

		// await this._kellner.init();
	}

	async init() {
		this._load();
		this._linkProcesses();
		return this._start(Array.from(this._processes.values()));
	}

	async clear() {
		return this._clear(Array.from(this._processes.values()));
	}

	addHook(name, handler) {
		this.hooksManager.addHook(name, handler);
	}
}

// static stuff
Oblak.tools = tools;
Oblak.debug = () => debug(Oblak);

module.exports = Oblak;
