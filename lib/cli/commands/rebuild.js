'use strict';

const { Worker } = require('worker_threads');
const path = require('path');

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

const getModels = async (konzola, { models = [] }) => {
	const stop = konzola.wait({ text: 'Validating readmodels...' });

	if (!models.includes('.')) {
		stop();
		return models;
	}

	const oblak = loadBootstrap();
	oblak._load();
	models = Object.keys(oblak.readmodels);
	await oblak.close();
	stop();
	return models;
}

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
		arg.readmodels = true;

		const workerScript = path.join(__dirname, './workers/rebuilder.js');

		const models = await getModels(konzola, arg);

		for (const model of models) {
			const worker = new Worker(workerScript, { workerData: 'rebuilder' });

			const bars = {};
			const multi = konzola.multiBar;

			const eventHandlers = {
				start(workerId = 0, { total, type }) {
					bars[workerId] = multi.newBar(`${type} |${konzola.chalk.green(':bar')}|${konzola.chalk.grey(' :percent | :current/:total | :etas | :elapsed')}`, {
						complete: '█',
						incomplete: ' ',
						width: 30,
						total,
						type,
					});
				},
				progress(workerId = 0, { progress }) {
					bars[workerId].tick(progress - bars[workerId].curr);
				},
				done(workerId = 0) {
					// bars[]
				}
			}

			const handleMessage = ({ event, payload}) => eventHandlers[event](worker.threadId, payload);

			// await new Promise((resolve, reject) => {
			worker.on('message', handleMessage);
			worker.on('error', error => console.log('Thread has thrown', error));
			// worker.once('exit', resolve);
			// worker.once('error', reject);
			// worker.postMessage({ data: i++ });
			worker.postMessage({ command: 'rebuild', data: { models: [model]} });
		}
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
