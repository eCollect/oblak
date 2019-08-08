#!/usr/bin/env node

'use strict';

const commandLineArgs = require('command-line-args');
const commandLineCommands = require('command-line-commands');
const getUsage = require('command-line-usage');


const konzola = require('../lib/konzola');
const packageJson = require('../package.json');
const optionDefinitions = require('../lib/cli/optionDefinitons');

const {
	name,
	version,
} = packageJson;

const commands = require('../lib/cli/commands');

(async () => {
	konzola.header(`${name} ${version}`, {
		prefix: konzola.chalk.blue('\u2601'),
	});

	// #region Exception handling
	const handleException = (ex) => {
		if (ex.message)
			konzola.info(ex.message);
		if (ex.stack)
			konzola.info(ex.stack);
		konzola.exit(ex.code || 1);
	};

	process.on('uncaughtException', handleException);
	process.on('unhandledRejection', handleException);
	// #endregion

	const validCommands = Object.keys(commands);

	let parsed;

	try {
		parsed = commandLineCommands([null, ...validCommands]);
	} catch (ex) {
		konzola.error(`Unknown command '${ex.command}`);
		konzola.exit(1);
	}

	if (!parsed.command)
		parsed.command = 'help';

	const command = commands[parsed.command];

	const validOptionDefinitions = [...(await command.getOptionDefinitions()), ...optionDefinitions];
	const args = commandLineArgs(validOptionDefinitions, { argv: parsed.argv, partial: true });


	try {
		if (parsed.command !== 'help' && args.help) {
			konzola.info(getUsage([
				{ header: 'Options', optionList: validOptionDefinitions.filter(i => !i.doNotShowInfo) },
			]));
			return;
		}

		await command.run({
			name, version, konzola, optionDefinitions, commands,
		}, args);
	} catch (e) {
		console.log('error');
		handleException(e);
	}
})();
