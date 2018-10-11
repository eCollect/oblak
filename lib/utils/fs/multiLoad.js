'use strict';

const fs = require('fs');
const path = require('path');
const requireUncached = require('require-uncached');

const yaml = (file) => {
	// lazy load YAML to improve performance when not used
	const YAML = require('js-yaml'); // eslint-disable-line global-require
	return YAML.safeLoad(fs.readFileSync(file, 'utf8'));
};

const resolvers = {
	js(file, { cache = false }) {
		if (cache)
			return require(file); // eslint-disable-line
		return requireUncached(file);
	},
	json(file) {
		return JSON.parse(fs.readFileSync(file, 'utf8'));
	},
	yaml,
	yml: yaml,
	json5(file) {
		// lazy load JSON5 to improve performance when not used
		const JSON5 = require('json5'); // eslint-disable-line global-require
		return JSON5.parse(fs.readFileSync(file, 'utf8'));
	},
};

const safeParseFile = (filePath, resolver, options = {}) => {
	if (!options.strict && (!filePath || !fs.existsSync(filePath)))
		return null;

	try {
		return resolver(filePath, options);
	} catch (e) {
		e.message = `Cannot read file: ${filePath}\nError: ${e.message}`;
		throw e;
	}
};

const loadMulti = (configDir, filename = 'config', options) => {
	if (!filename)
		throw new Error('No config filename provided.');

	for (const [ext, resolver] of Object.entries(resolvers)) {
		const config = safeParseFile(path.join(configDir, `${filename}.${ext}`), resolver, options);
		if (config)
			return config;
	}

	return {};
};

const load = (fileDir, extension, options) => {
	const resolver = resolvers[extension];
	if (!resolver)
		throw new Error(`File type ${extension} not supported: ${fileDir}.`);
	return safeParseFile(fileDir, resolver, options);
};

const isExtensionSupported = (ext) => {
	if (!ext)
		return null;
	if (ext.startsWith('.'))
		ext = ext.substr(1);
	return !!resolvers[ext];
};

module.exports = {
	isExtensionSupported,
	load,
	loadMulti,
};
