'use strict';

/* eslint-disable no-console */

const chalk = require('chalk');
const inquirer = require('inquirer');
const Spinner = require('node-spinner');
const readline = require('readline');
const { Bar: Progress } = require('cli-progress');

const MultiBar = require('./MultiBar');
const is = require('./is');
const pad = require('./pad');
const unicode = require('./unicode');

const prettyJson = require('./prettyJson');

let characters = unicode[is.utf() ? 'utf8' : 'ascii'];

let interval;
let stopSpinner;

const progressBarTheme = {
	format: `{text}|${chalk.green('{bar}')}| ${chalk.grey('{percentage}% | ETA: {eta}s | {value}/{total}')}`,
	barCompleteChar: '\u2588',
	barIncompleteChar: ' ',
};

const decorators = {
	pauseSpinner(fn) {
		return (...args) => {
			let spinnerNeedsRestart = false;

			if (stopSpinner) {
				stopSpinner();
				spinnerNeedsRestart = true;
			}

			const result = fn(...args);

			/* eslint-disable no-use-before-define */
			if (spinnerNeedsRestart)
				konzola.wait();
			/* eslint-enable no-use-before-define */


			return result;
		};
	},

	pauseSpinnerAsync(fn) {
		return async (...args) => {
			let spinnerNeedsRestart = false;

			if (stopSpinner) {
				stopSpinner();
				spinnerNeedsRestart = true;
			}

			const result = await fn(...args);

			/* eslint-disable no-use-before-define */
			if (spinnerNeedsRestart)
				konzola.wait();
			/* eslint-enable no-use-before-define */

			return result;
		};
	},

	skipIfQuiet(fn) {
		return (...args) => {
			/* eslint-disable no-use-before-define */
			if (is.quiet())
				return konzola;
			/* eslint-enable no-use-before-define */

			return fn(...args);
		};
	},

	skipIfNotVerbose(fn) {
		return (...args) => {
			/* eslint-disable no-use-before-define */
			if (!is.verbose())
				return konzola;
			/* eslint-enable no-use-before-define */
			return fn(...args);
		};
	},
};

const konzola = {
	forceColor() {
		chalk.enabled = true;
	},

	noColor() {
		chalk.enabled = false;
	},

	forceUtf() {
		characters = unicode.utf8;
	},

	noUtf() {
		characters = unicode.ascii;
	},

	error: decorators.pauseSpinner((message, { prefix = characters.crossMark } = {}) => {
		console.error(chalk.red.bold(`${prefix} ${String(message)}`));

		return konzola;
	}),

	warn: decorators.pauseSpinner((message, { prefix = characters.rightPointingPointer } = {}) => {
		console.error(chalk.yellow.bold(`${prefix} ${String(message)}`));

		return konzola;
	}),

	success: decorators.skipIfQuiet(decorators.pauseSpinner((message, { prefix = characters.checkMark } = {}) => {
		console.log(chalk.green.bold(`${prefix} ${String(message)}`));

		return konzola;
	})),

	info: decorators.skipIfQuiet(decorators.pauseSpinner((message, { prefix = ' ' } = {}) => {
		console.log(chalk.white(`${prefix} ${String(message)}`));

		return konzola;
	})),

	verbose: decorators.skipIfQuiet(decorators.skipIfNotVerbose(decorators.pauseSpinner((message, { prefix = ' ' } = {}) => {
		console.log(chalk.gray(`${prefix} ${String(message)}`));

		return konzola;
	}))),

	line: decorators.skipIfQuiet(decorators.pauseSpinner(() => {
		console.log(chalk.gray('\u2500'.repeat(process.stdout.columns || 80)));

		return konzola;
	})),

	header(headline, { prefix = characters.rightPointingPointer } = {}) {
		konzola.newLine();
		konzola.info(headline, { prefix });
		konzola.line();

		return konzola;
	},

	list(message, { prefix = characters.multiplicationDot, indent = 0 } = {}) {
		const width = indent * (prefix.length + 1);

		prefix = new Array(width + 1).join(' ') + prefix;

		konzola.info(message, { prefix });

		return konzola;
	},

	json(obj, { prefix = '', indent = 0 } = {}) {
		const width = indent * (prefix.length + 1);
		prefix = new Array(width + 1).join(' ') + prefix;
		konzola.info(prettyJson.render(obj, indent, { colors: chalk }), { prefix });
	},

	newLine: decorators.skipIfQuiet(decorators.pauseSpinner(() => {
		console.log();

		return konzola;
	})),

	table(rows) {
		if (!rows)
			throw new Error('Rows are missing.');


		const widths = [];

		rows.forEach((row) => {
			row.forEach((value, columnIndex) => {
				widths[columnIndex] = Math.max(widths[columnIndex] || 0, String(value).length);
			});
		});

		rows.forEach((row) => {
			const line = [];

			if (row.length > 0)
				row.forEach((value, columnIndex) => {
					line.push(pad(value, widths[columnIndex]));
				});
			else
				widths.forEach((width) => {
					line.push(new Array(width + 1).join(characters.boxDrawingsLightHorizontal));
				});


			konzola.info(line.join('  '));
		});

		return konzola;
	},

	passThrough: decorators.pauseSpinner((message, { prefix = ' ', target = 'stdout' } = {}) => {
		if (is.quiet() && target === 'stdout')
			return konzola;


		process[target].write(`${prefix || ' '} ${String(message)}`);

		return konzola;
	}),

	wait({ text = '', prefix = ' ' } = {}) {
		if (is.quiet() || !is.interactiveMode())
			return () => {};

		if (stopSpinner)
			return null;

		if (text)
			text = ` ${text}`;

		const spinner = new Spinner();

		interval = setInterval(() => {
			process.stderr.write(`\r${prefix} ${spinner.next()}${text}`);
		}, 50);

		stopSpinner = () => {
			stopSpinner = undefined;
			// process.stderr.write(`\r${prefix} cha✓${text}\r`);
			process.stderr.write('\r \r');
			clearInterval(interval);
		};

		return stopSpinner;
	},

	progress({ text = '', prefix = '', total = 100 } = {}) {
		const bar = new Progress({}, progressBarTheme);

		if (text)
			text = `${text} `;

		if (prefix)
			text = `${prefix} ${text}`;

		bar.start(total, 0, { text });

		bar.done = (doneText) => {
			bar.stop();

			if (!doneText)
				return;

			readline.cursorTo(process.stdout, 0, null);
			readline.moveCursor(process.stdout, 0, -1);
			readline.clearLine(process.stdout);

			// process.stdout.clearLine();
			konzola.success(doneText);
		};
		return bar;
	},

	ask: decorators.pauseSpinnerAsync(async (question, options = {}) => {
		if (!question)
			throw new Error('Question is missing.');


		let defaultValue;
		let mask;

		if (options instanceof RegExp) {
			defaultValue = undefined;
			mask = options;
		} else if (typeof options === 'string') {
			defaultValue = options;
			mask = undefined;
		} else {
			defaultValue = options.default;
			mask = options.mask; // eslint-disable-line
		}

		const { answer } = await inquirer.prompt([
			{
				type: 'input',
				name: 'answer',
				message: question,
				default: defaultValue,
				validate(value) {
					if (mask && !mask.test(value))
						return 'Malformed input, please retry.';


					return true;
				},
			},
		]);

		return answer;
	}),

	confirm: decorators.pauseSpinnerAsync(async (message, value = true) => {
		if (!message)
			throw new Error('Message is missing.');


		const { isConfirmed } = await inquirer.prompt([
			{
				type: 'confirm',
				name: 'isConfirmed',
				message,
				default: value,
			},
		]);

		return isConfirmed;
	}),

	select: decorators.pauseSpinnerAsync(async (question, choices) => {
		if (!question)
			throw new Error('Question is missing.');

		if (!choices)
			throw new Error('Choices are missing.');


		const { selection } = await inquirer.prompt([
			{
				type: 'list',
				name: 'selection',
				message: question,
				choices,
			},
		]);

		return selection;
	}),

	chalk,
	characters,

	multiBar: new MultiBar(),

	exit(code = 0) {
		if (stopSpinner)
			stopSpinner();


		/* eslint-disable no-process-exit */
		process.exit(code);
		/* eslint-enable no-process-exit */
	},
};

module.exports = konzola;
