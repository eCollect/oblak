'use strict';

const chokidar = require('chokidar');
const debounce = require('lodash.debounce');

const loadBootstrap = require('../loadBootstrap');

const OBLAK_DATA_FILE = 'oblak-data.js';

const loadOblak = (konzola) => {
	const stop = konzola.wait({ text: 'Loading Oblak Bootstrap...' });
	const oblak = loadBootstrap();
	oblak._load();
	konzola.success('Oblak Bootstrap Loaded');
	stop();
};

const watch = (konzola, arg) => {
	const onChange = debounce(() => loadOblak(konzola, arg), 50);

	const watcher = chokidar.watch('./app/**/*.js');

	watcher.on('ready', () => {
		konzola.info('Watching for changes...', { prefix: konzola.characters.eyes });
		watcher
			.on('add', onChange)
			.on('change', onChange)
			.on('unlink', onChange);
	});
};

const info = {
	description: 'Show info about the app components',

	async getOptionDefinitions() {
		return [{
			name: 'watch',
			alias: 'w',
			type: Boolean,
			description: 'watch for changes',
		},
		{
			name: 'raw',
			alias: 'r',
			type: Boolean,
			default: false,
			description: 'Raw output',
		},
		{
			name: 'output',
			alias: 'o',
			type: String,
			defaultValue: OBLAK_DATA_FILE,
			description: 'Raw output',
		},
		];
	},

	async run({ konzola }, arg) {
		loadOblak(konzola, arg);
		if (arg.watch)
			watch(konzola, arg);
	},
};

module.exports = info;
