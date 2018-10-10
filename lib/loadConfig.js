'use strict';

const fs = require('fs');
const path = require('path');

const { multiLoad } = require('./utils/fs');

const clone = obj => JSON.parse(JSON.stringify(obj));

const load = (env, configDir, base = {}, override = {}) => ({
	...clone(base),
	...multiLoad(configDir, 'config'),
	...multiLoad(configDir, `config.${env}`),
	...clone(override),
});

const mergeSection = (configDir, section, main) => {
	main[section] = load({}, configDir, main[section]);
	return main;
};

const merge = (configDir, section, main, subdirs = false) => {
	if (!subdirs)
		return mergeSection(configDir, section, main);

	main[section] = fs.readdirSync(configDir).reduce((sectioncConfig, subsection) => {
		const subsectionDir = path.join(configDir, subsection);
		return mergeSection(subsectionDir, subsection, sectioncConfig);
	}, main[section] || {});

	return main;
};

module.exports = {
	load,
	merge,
};
