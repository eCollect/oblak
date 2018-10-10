'use strict';

const path = require('path');
const fs = require('fs');

const JSON5 = require('json5');

const clone = obj => JSON.parse(JSON.stringify(obj));

const safeParseFile = (filePath) => {
	if (!filePath || !fs.existsSync(filePath))
		return {};

	try {
		return JSON5.parse(fs.readFileSync(filePath, 'utf8'));
	} catch (e) {
		return {};
	}
};

const load = (env, configDir, base = {}, override = {}) => ({
	...clone(base),
	...safeParseFile(path.join(configDir, 'config.json5')),
	...safeParseFile(path.join(configDir, `config.${env}.json5`)),
	...clone(override),
});

const mergeSection = (configDir, section, main) => {
	main[section] = load({}, configDir, main[section]);
	return main;
}

const merge = (configDir, section, main, subdirs = false) => {
	if (!subdirs)
		return mergeSection(configDir, section, main);

	main[section] = fs.readdirSync(configDir).reduce((sectioncConfig, subsection) => {
		const subsectionDir = path.join(configDir, subsection);
		return mergeSection(subsectionDir, subsection, sectioncConfig);
	}, main[section] || {});

	return main;
}

module.exports = {
	load,
	merge,
};
