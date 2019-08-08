'use strict';

const { Worker } = require('worker_threads');
const path = require('path');
const os = require('os');

const { default: PQueue } = require('p-queue');

const loadBootstrap = require('../loadBootstrap');

function pad(v, length = 2, char = ' ') {
	if (v === undefined || v === null)
		return '';

	const val = `${  v}`;
	return val.length >= length ? val : `${new Array(length - val.length + 1).join(char)}${val}`;
}
/*
const loadOblak = (konzola) => {
	const stop = konzola.wait({ text: 'Loading Oblak Bootstrap...' });
	const oblak = loadBootstrap();
	oblak._load();
	stop();
	process.stdout.clearLine();
	konzola.success('Oblak Bootstrap Loaded');
	return oblak;
};

const splitArray = (array, chunks = 0) => {
	if (!chunks)
		return array;

	let i;
	let j;
	const result = [];

	for (i = 0, j = array.length; i < j; i += chunks)
		result.push(array.slice(i, i + chunks));
	return result;
};
*/

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
};

const info = {
	description: 'Export Oblak Data ( database )',

	async getOptionDefinitions() {
		return [
			{
				name: 'parallel',
				alias: 'p',
				type: Number,
				typeLabel: 'parallel',
				description: 'number of parallel processes',
			},
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

		const now = Date.now();

		let concurrency = arg.parallel || os.cpus().length; // get number of cpus
		if (concurrency < 1)
			concurrency = 1;

		const workerScript = path.join(__dirname, './workers/rebuilder.js');

		const bars = {};
		const padded = {};
		const getPadded = (type) => {
			if (!padded[type])
				padded[type] = pad(type, 15);
			return padded[type];
		};

		const multi = konzola.multiBar;

		const eventHandlers = {
			start(workerId = 0, { total, type }) {
				bars[workerId] = multi.newBar(`${getPadded(type)} |${konzola.chalk.green(':bar')}|${konzola.chalk.grey(' :percent | :current/:total | :etas | :elapsed')}`, {
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
			done() {},
		};

		const queue = new PQueue({
			concurrency,
		});


		const allModels = await getModels(konzola, arg);

		konzola.info(`Rebuilding ${allModels.length} readmodel gorup(s) with using ${concurrency} core(s).`);

		for (const model of allModels)
			queue.add(() => new Promise((resolve) => {
				const worker = new Worker(workerScript, { workerData: 'rebuilder' });

				const handleMessage = ({ event, payload }) => eventHandlers[event](worker.threadId, payload);

				// await new Promise((resolve, reject) => {
				worker.on('message', handleMessage);
				worker.on('error', error => console.log('Thread has thrown', error));
				worker.once('exit', resolve);
				// worker.once('error', reject);
				// worker.postMessage({ data: i++ });
				worker.postMessage({ command: 'rebuild', data: { models: [model] } });
			}));
		await queue.onIdle();
		konzola.success(`${allModels.length} readmodel gorup(s) rebuilt in ${Date.now() - now}ms.`);
	},
};

module.exports = info;
