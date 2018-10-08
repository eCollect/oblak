'use strict';

module.exports = class Hooks {
	constructor(oblak) {
		this._hooks = {};
	}

	registerHook(name) {
		if (!this._hooks[name])
			this._hooks[name] = [];
		return this;
	}

	addHook(name, handler) {
		if (!this._hooks[name])
			throw new Error(`Unknown hook ${name}`);
		if (typeof handler !== 'function')
			throw new Error('Invalid hook handler');
		this._hooks[name].push(handler);
	}

	triggerHook(wire, name, data) {
		if (!this._hooks[name])
			throw new Error(`Unknown hook ${name}, have you registered your hook ?`);

		for (const handler of this._hooks[name])
			handler.call(wire, data);
	}
}
