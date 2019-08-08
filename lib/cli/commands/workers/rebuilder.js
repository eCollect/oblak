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

parentPort.on('message', async ({ data }) => {
	const { arg } = data;
	const oblak = loadOblak();
	if (arg.readmodels.includes('.'))
		arg.readmodels = true;

	await oblak.exec(konzola, 'rebuild', arg);


	await oblak._kellner.connections.close();
	await oblak.close();
	process.exit();
});
