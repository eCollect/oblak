'use strict';

const { Worker } = require('worker_threads');
const path = require('path');
const os = require('os');

const { default: PQueue } = require('p-queue');

const loadBootstrap = require('../loadBootstrap');

function pad(v, length = 2, char = ' ') {
	if (v === undefined || v === null)
		return '';

	const val = `${v}`;
	return val.length >= length ? val : `${new Array(length - val.length + 1).join(char)}${val}`;
}

/*
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
*/
const padded = {};
const getPadded = (type) => {
	if (!padded[type])
		padded[type] = pad(type, 15);
	return padded[type];
};

class WorkerPool {
	constructor({
		parallel = 1,
		workerScript,
		konzola,
	}) {
		this._size = parallel;

		if (this._size < 1)
			this._size = 1;

		this._workerScript = workerScript;
		this._workers = {};
		this._konzola = konzola;
		this._bars = {};
		this._pendingJons = [];
		this._runningJobs = 0;

		this._resolver = null;
		this._done = null;
		this._destroyResolver = null;
		this._destroyDone = null;
	}

	__start(threadId, type, { total }) {
		const konzola = this._konzola;
		this._bars[type] = konzola.multiBar.newBar(`${getPadded(type)} |${konzola.chalk.green(':bar')}|${konzola.chalk.grey(` :percent | :current/:total | :etas | :elapsed (${threadId})`)}`, {
			complete: '█',
			incomplete: ' ',
			width: 30,
			total,
			type,
		});
	}

	__progress(threadId, type, { progress }) {
		this._bars[type].tick(progress - this._bars[type].curr);
	}

	__end(threadId) {
		this._runningJobs -= 1;
		this.executeNextJob(threadId);
	}

	__exit(threadId) {
		this._workers[threadId].running = false;
		if (this._destroyDone && !Object.values(this._workers).some(w => w.running))
			this._destroyDone();
	}

	// eslint-disable-next-line class-methods-use-this
	__done() {}

	_eventHandler(threadId, { event, type, payload }) {
		const methodName = `__${event}`;
		this[methodName](threadId, type, payload);
	}

	init() {
		for (let i = 0; i < this._size; i++) {
			const worker = new Worker(this._workerScript, { workerData: 'rebuilder' });
			const { threadId } = worker;
			worker.on('message', m => this._eventHandler(threadId, m));
			worker.on('error', error => console.log('Thread has thrown', error));
			worker.once('exit', code => this.__exit(threadId, code));

			this._workers[threadId] = {
				work: null,
				running: true,
				worker,
			};
		}
		return this;
	}

	executeNextJob(freeWroker) {
		const job = this._pendingJons.shift();
		if (!job)
			return this._resolve();

		const worker = freeWroker ? this._workers[freeWroker] : Object.values(this._workers).find(({ work }) => !work);
		if (!worker)
			return null;
		this._runningJobs += 1;
		worker.work = true;
		worker.worker.postMessage(job);
		return !freeWroker ? this.executeNextJob() : null;
	}

	addJob(...jobs) {
		this._pendingJons.push(...jobs);
		this.executeNextJob();
		return this;
	}

	async await() {
		if (this._resolver)
			return this._resolver;

		this._resolver = new Promise((resolve) => {
			this._done = resolve;
		});

		this._resolve();

		return this._resolver;
	}

	async destroy() {
		if (this._destroyResolver)
			return this._destroyResolver;

		this._destroyResolver = new Promise((resolve) => {
			this._destroyDone = resolve;
		});

		const workingWorkers = Object.values(this._workers).filter(w => w.running);

		for (const worker of workingWorkers)
			worker.worker.postMessage({ command: 'end' });

		if (!workingWorkers)
			this._destroyDone();

		return this._destroyResolver;
	}

	_resolve() {
		if (this._done && !this._pendingJons.length && !this._runningJobs)
			this._done();
	}
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
	const oblak = loadBootstrap();
	oblak._load();
	const availabaleModels = Object.keys(oblak.readmodels);
	await oblak.close();

	if (models.includes('.'))
		models = availabaleModels;
	const unknownModels = models.filter(m => !availabaleModels.includes(m));
	stop();

	if (unknownModels.length)
		throw new Error(`Model(s) [${unknownModels.join(',')}] are not available in the current application.`);

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

		const allModels = await getModels(konzola, arg);
		const parallel = Math.min(allModels.length, concurrency);

		const preparingThreads = konzola.wait({ text: 'Preparing cores...' });


		const pool = new WorkerPool({
			parallel: Math.min(allModels.length, parallel),
			workerScript,
			konzola,
		});

		pool.init();

		preparingThreads();
		konzola.info(`Rebuilding ${allModels.length} readmodel gorup(s) using ${parallel} core(s).`);

		pool.addJob(...allModels.map(model => ({ command: 'rebuild', data: { model } })));

		await pool.await();
		await pool.destroy();
		/*
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
		*/
		konzola.success(`${allModels.length} readmodel gorup(s) rebuilt in ${Date.now() - now}ms.`);
	},
};

module.exports = info;
