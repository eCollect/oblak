'use strict';

class SingleSemaphore {
	constructor() {
		this._sharedPromise = Promise.resolve();
		this._resolver = () => {};
	}

	async acquire() {
		await this.wait();
		this._sharedPromise = new Promise((resolver) => {
			this._resolver = resolver;
		});
	}

	free() {
		this._resolver();
	}

	async wait() {
		return this._sharedPromise;
	}
}

module.exports = SingleSemaphore;
