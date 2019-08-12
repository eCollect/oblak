'use strict';

const { parentPort, workerData, isMainThread } = require('worker_threads');

const loadBootstrap = require('../../loadBootstrap');

const loadOblak = () => {
	const oblak = loadBootstrap();
	oblak._load();
	return oblak;
};


class Emitter {
	constructor(type) {
		this._type = type;
	}

	done() {
		parentPort.postMessage({ type: this._type, event: 'done' });
	}

	progress(progress) {
		parentPort.postMessage({ type: this._type, event: 'progress', payload: { progress } });
	}

	start(type, total) {
		parentPort.postMessage({ type: this._type, event: 'start', payload: { type, total } });
	}

	end(type) {
		parentPort.postMessage({ type: this._type, event: 'end', payload: { type } });
	}
}

const oblak = loadOblak();

const commands = {
	async rebuild({ model }) {
		const emitter =	new Emitter(model);
		await oblak.exec(emitter, 'rebuild', {
			readmodels: true,
			models: [model],
		});
		emitter.end(model);
	},
	async end() {
		await oblak._kellner.connections.close();
		await oblak.close();
		process.exit();
	},
};

parentPort.on('message', ({ command, data = {} }) => commands[command](data));
