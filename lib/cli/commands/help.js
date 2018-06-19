'use strict';

module.exports = {
	description: 'Usage help',

	getOptionDefinitions() {
		return [{
			name: 'version',
			alias: 'v',
			type: Boolean,
		}];
	},

	run({ konzola, version }, args) {
		if (args.version)
			konzola.info(konzola.chalk.bold(version));
	},
};
