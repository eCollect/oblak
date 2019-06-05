'use strict';

const DEFAULT_SERVICE_NAME = 'task';

const OblakWire = require('../shared/OblakWire');

class TaskRunner extends OblakWire {
	constructor({
		type,
		taskPath,
		name = `${DEFAULT_SERVICE_NAME}:${type}`,
	} = {}) {
		super(name);
		this.name = name;
		this.type = type;
		this.taskPath = taskPath;
	}

	link(app, oblak) {
		super.link(app, oblak);
	}

	linkService(app, oblak) {
		// setup wires
		return super.linkService(app, oblak);
		// return this;
	}

	async init(oblak) {
		await super.init(oblak, oblak);
	}

	get serviceName() { // eslint-disable-line
		return DEFAULT_SERVICE_NAME;
	}

	async execute(args) {
		// eslint-disable-next-line
		await require(this.taskPath)(
			{
				args,
			},
			this.wireApi.get({}),
		);
	}

	// eslint-disable-next-line class-methods-use-this
	shouldRun() {
		return false;
	}
}

module.exports = TaskRunner;
