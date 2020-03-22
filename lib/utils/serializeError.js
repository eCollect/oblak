'use strict';

const commonProperties = [
	'name',
	'message',
	'stack',
	'code',
];

const destroyCircular = (from, seen, to_) => {
	const to = to_ || (Array.isArray(from) ? [] : {});

	seen.push(from);

	for (const [key, value] of Object.entries(from)) {
		if (typeof value === 'function')
			continue;


		if (!value || typeof value !== 'object') {
			to[key] = value;
			continue;
		}

		if (!seen.includes(from[key])) {
			to[key] = destroyCircular(from[key], seen.slice());
			continue;
		}

		to[key] = '[Circular]';
	}

	for (const property of commonProperties)
		if (typeof from[property] === 'string')
			to[property] = from[property];


	return to;
};

module.exports = (value) => {
	if (typeof value === 'object' && value !== null)
		return destroyCircular(value, []);


	// People sometimes throw things besides Error objects…
	if (typeof value === 'function')
		// `JSON.stringify()` discards functions. We do too, unless a function is thrown directly.
		return `[Function: ${(value.name || 'anonymous')}]`;


	return value;
};
