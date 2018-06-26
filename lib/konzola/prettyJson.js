'use strict';

const indent = require('./indent');

const getMaxIndexLength = (input) => {
	let maxWidth = 0;

	Object.keys(input).forEach((key) => {
		// Skip undefined values.
		if (input[key] === undefined)
			return;
		maxWidth = Math.max(maxWidth, key.length);
	});

	return maxWidth;
};

// Helper function to detect if an object can be directly serializable
const isSerializable = (input, onlyPrimitives, options) => {
	if (
		typeof input === 'boolean'
		|| typeof input === 'number'
		|| typeof input === 'function'
		|| input === null
		|| input instanceof Date
	)
		return true;

	if (typeof input === 'string' && input.indexOf('\n') === -1)
		return true;


	if (options.inlineArrays && !onlyPrimitives)
		if (Array.isArray(input) && isSerializable(input[0], true, options)) {
			return true;
		}


	return false;
};

const addColorToData = (input, {
	colors, stringColor, numberColor,
}) => {
	if (typeof input === 'string')
		// Print strings in regular terminal color
		return stringColor ? colors[stringColor](input) : input;


	const sInput = `${input}`;

	if (input === true)
		return colors.green(sInput);

	if (input === false)
		return colors.red(sInput);

	if (input === null)
		return colors.grey(sInput);

	if (typeof input === 'number')
		return colors[numberColor](sInput);

	if (typeof input === 'function')
		return 'function() {}';


	if (Array.isArray(input))
		return input.join(', ');


	return sInput;
};

const indentLines = (string, spaces) => {
	let lines = string.split('\n');
	lines = lines.map(line => indent(spaces) + line);
	return lines.join('\n');
};

const renderToArray = (data, options, indentation) => {
	if (isSerializable(data, false, options))
		return [indent(indentation) + addColorToData(data, options)];


	// Unserializable string means it's multiline
	if (typeof data === 'string')
		return [
			`${indent(indentation)}"""`,
			indentLines(data, indentation + options.defaultIndentation),
			`${indent(indentation)}"""`,
		];


	if (Array.isArray(data)) {
		// If the array is empty, render the `emptyArrayMsg`
		if (data.length === 0)
			return [indent(indentation) + options.emptyArrayMsg];


		const outputArray = [];

		data.forEach((element) => {
			// Prepend the dash at the beginning of each array's element line
			let line = '- ';
			line = options.colors[options.dashColor](line);

			line = indent(indentation) + line;

			// If the element of the array is a string, bool, number, or null
			// render it in the same line
			if (isSerializable(element, false, options)) {
				line += renderToArray(element, options, 0)[0];
				outputArray.push(line);

				// If the element is an array or object, render it in next line
			} else {
				outputArray.push(line);
				outputArray.push(...renderToArray(element, options, indentation + options.defaultIndentation));
			}
		});

		return outputArray;
	}

	if (data instanceof Error)
		return renderToArray(
			{
				message: data.message,
				stack: data.stack.split('\n'),
			},
			options,
			indentation,
		);


	// If values alignment is enabled, get the size of the longest index
	// to align all the values
	const maxIndexLength = options.noAlign ? 0 : getMaxIndexLength(data);
	let key;
	const output = [];

	Object.keys(data).forEach((i) => {
		// Prepend the index at the beginning of the line
		key = (`${i}: `);
		key = options.colors[options.keysColor](key);

		key = indent(indentation, key);

		// Skip `undefined`, it's not a valid JSON value.
		if (data[i] === undefined)
			return;


		// If the value is serializable, render it in the same line
		if (isSerializable(data[i], false, options)) {
			const nextIndentation = options.noAlign ? 0 : maxIndexLength - i.length;
			key += renderToArray(data[i], options, nextIndentation)[0];
			output.push(key);

			// If the index is an array or object, render it in next line
		} else {
			output.push(key);
			output.push(...renderToArray(
				data[i],
				options,
				indentation + options.defaultIndentation,
			));
		}
	});
	return output;
};

// ### Render function
// *Parameters:*
//
// * **`data`**: Data to render
// * **`options`**: Hash with different options to configure the parser
// * **`indentation`**: Base indentation of the parsed output
//
// *Example of options hash:*
//
//     {
//       emptyArrayMsg: '(empty)', // Rendered message on empty strings
//       keysColor: 'blue',        // Color for keys in hashes
//       dashColor: 'red',         // Color for the dashes in arrays
//       stringColor: 'grey',      // Color for strings
//       defaultIndentation: 2     // Indentation on nested objects
//     }
const render = function render(data, indentation, {
	emptyArrayMsg = '(empty array)',
	keysColor = 'green',
	dashColor = 'green',
	numberColor = 'blue',
	defaultIndentation = 2,
	noAlign = false,
	stringColor = null,
	colors,
}) {
	if (!colors)
		throw new Error('Colors library required');

	// Default values
	indentation = indentation || 0;

	return renderToArray(data, {
		emptyArrayMsg,
		keysColor,
		dashColor,
		numberColor,
		defaultIndentation,
		noAlign,
		stringColor,
		colors,
	}, indentation).join('\n');
};

// ### Render from string function
// *Parameters:*
//
// * **`data`**: Data to render as a string
// * **`options`**: Hash with different options to configure the parser
// * **`indentation`**: Base indentation of the parsed output
//
// *Example of options hash:*
//
//     {
//       emptyArrayMsg: '(empty)', // Rendered message on empty strings
//       keysColor: 'blue',        // Color for keys in hashes
//       dashColor: 'red',         // Color for the dashes in arrays
//       defaultIndentation: 2     // Indentation on nested objects
//     }
const renderString = function renderString(data, options, indentation) {
	let output = '';
	let parsedData;
	// If the input is not a string or if it's empty, just return an empty string
	if (typeof data !== 'string' || data === '')
		return '';


	// Remove non-JSON characters from the beginning string
	if (data[0] !== '{' && data[0] !== '[') {
		let beginningOfJson;
		if (data.indexOf('{') === -1)
			beginningOfJson = data.indexOf('[');
		else if (data.indexOf('[') === -1)
			beginningOfJson = data.indexOf('{');
		else if (data.indexOf('{') < data.indexOf('['))
			beginningOfJson = data.indexOf('{');
		else
			beginningOfJson = data.indexOf('[');

		output += `${data.substr(0, beginningOfJson)}\n`;
		data = data.substr(beginningOfJson);
	}

	try {
		parsedData = JSON.parse(data);
	} catch (e) {
		// Return an error in case of an invalid JSON
		return `${options.colors.red('Error:')} Not valid JSON!`;
	}

	// Call the real render() method
	output += exports.render(parsedData, options, indentation);
	return output;
};

module.exports = {
	render,
	renderString,
};
