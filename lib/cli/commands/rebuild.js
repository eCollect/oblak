'use strict';

const { Worker } = require('worker_threads');
const path = require('path');

const MultiProgress = require('multi-progress');

const loadBootstrap = require('../loadBootstrap');

const loadOblak = (konzola) => {
	const stop = konzola.wait({ text: 'Loading Oblak Bootstrap...' });
	const oblak = loadBootstrap();
	oblak._load();
	stop();
	process.stdout.clearLine();
	konzola.success('Oblak Bootstrap Loaded');
	return oblak;
};

const info = {
	description: 'Export Oblak Data ( database )',

	async getOptionDefinitions() {
		return [
			{
				name: 'models',
				alias: 'r',
				type: String,
				multiple: true,
				defaultOption: true,
				typeLabel: 'readmodels[]',
				description: 'readmodel service name',
			},
		];
	},

	async run({ konzola }, arg) {
		const workerScript = path.join(__dirname, './workers/rebuilder.js');
		const worker = new Worker(workerScript, { workerData: 'rebuilder' });

		const bars = {};
		const multi = new MultiProgress(process.stderr);

		const eventHandlers = {
			start(workerId = 0, { total }) {
				console.log(total);
				bars[workerId] = multi.newBar('|:bar| :percent | :current/:total | :etas', {
					complete: '=',
					incomplete: ' ',
					width: 30,
					total,
				  });
			},
			progress(workerId = 0, { progress }) {
				bars[workerId].tick(progress - bars[workerId].curr);
			},
			done(workerId = 0) {
				bars[]
			}
		}

		const handleMessage = ({ event, payload}) => eventHandlers[event](0, payload);


		// await new Promise((resolve, reject) => {
		worker.on('message', handleMessage);
		worker.on('online', () => console.log('Thread is started'));
		worker.on('exit', code => console.log(`Thread has exited ${code}`));
		worker.on('error', error => console.log('Thread has thrown', error));
		// worker.once('exit', resolve);
		// worker.once('error', reject);
		const i = 0;
		// worker.postMessage({ data: i++ });
		worker.postMessage({ command: 'rebuild', data: { arg } });
		// });

		/*
		const oblak = loadOblak(konzola, arg);

		if (arg.readmodels.includes('.'))
			arg.readmodels = true;
		await oblak.exec(konzola, 'rebuild', arg);


		await oblak._kellner.connections.close();

		const stop = konzola.wait({ text: 'Closing connection...' });
		await oblak.close();
		stop();
		process.stdout.clearLine();
		konzola.success('Done!');
		*/
	},
};

module.exports = info;
