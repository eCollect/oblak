'use strict';

const getUsage = require('command-line-usage');

module.exports = {
	description: 'Usage help',

	getOptionDefinitions() {
		return [{
			name: 'version',
			alias: 'v',
			type: Boolean,
		}];
	},

	run({ konzola, version, commands }, args) {
		if (args.version)
			return konzola.info(konzola.chalk.bold(version));

		konzola.info(getUsage([
			{ header: 'Synopsis', content: 'oblak <command> [options]' },
			{
				header: 'Commands',
				content: Object.keys(commands)
					.map(command => ({
						name: command,
						description: commands[command].description,
					}))
					.filter(command => command.description),
			}]));
		return null;
	},
};
