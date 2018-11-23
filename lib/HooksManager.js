'use strict';

module.exports = class Hooks {
	constructor() {
		this._hooks = {};
	}

	registerHook(name, async = true) {
		const hooks = this._hooks[name] ? this._hooks[name].hooks || new Set() : new Set();
		this._hooks[name] = {
			async,
			hooks,
		};
		return this;
	}

	addHook(name, handler) {
		if (!this._hooks[name])
			this.registerHook(name);
		if (typeof handler !== 'function')
			throw new Error('Invalid hook handler');
		this._hooks[name].hooks.add(handler);

		return () => this._hooks[name].hooks.delete(handler);
	}

	triggerHook(wire, name, data) {
		if (!this._hooks[name])
			throw new Error(`Unknown hook ${name}, have you registered your hook ?`);

		if (this._hooks[name].async)
			return this.triggerAsyncHook(wire, name, data);
		return this.triggerSyncHook(wire, name, data);
	}

	triggerSyncHook(wire, name, data) {
		for (const handler of this._hooks[name].hooks)
			handler.call(wire, data);
	}

	async triggerAsyncHook(wire, name, data) {
		for (const handler of this._hooks[name].hooks)
			await handler.call(wire, data);
	}
};
