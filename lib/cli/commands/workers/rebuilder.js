'use strict';

const { parentPort, workerData, isMainThread } = require("worker_threads");

const loadBootstrap = require('../../loadBootstrap');

const konzola = require('../../../konzola');

const loadOblak = () => {
	// const stop = konzola.wait({ text: 'Loading Oblak Bootstrap...' });
	const oblak = loadBootstrap();
	oblak._load();
	// stop();
	// process.stdout.clearLine();
	// konzola.success('Oblak Bootstrap Loaded');
	return oblak;
};

const emitter = {
	done() {
		parentPort.postMessage({ event: 'done' });
	},

	progress(progress) {
		parentPort.postMessage({ event: 'progress', payload: { progress } });
	},

	start(total) {
		parentPort.postMessage({ event: 'start', payload: { total } });
	},
};

const rebuild = async ({ data }) => {
	const { arg } = data;
	const oblak = loadOblak();

	arg.readmodels = true;

	if (arg.models.includes('.'))
		arg.models = true;

	await oblak.exec(emitter, 'rebuild', arg);

	await oblak._kellner.connections.close();
	await oblak.close();
	process.exit();
}

parentPort.on('error', console.error);
parentPort.on('message', ({ data }) => {
	rebuild({ data});
	/*
	try {
		const { arg } = data;
		const oblak = loadOblak();

		arg.readmodels = true;

		if (arg.models.includes('.'))
			arg.models = true;

		await oblak.exec(emitter, 'rebuild', arg);

		await oblak._kellner.connections.close();
		await oblak.close();
		process.exit();
	} catch (e) {
		console.log(e);
		throw e;
	}
	*/
});
