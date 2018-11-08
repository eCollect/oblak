'use strict';

const commonProperties = ['name', 'message', 'stack', 'code'];

const destroyCircular = (from, seen) => {
	const to = Array.isArray(from) ? [] : {};

	seen.push(from);

	Object.entries(from).forEach(([key, value]) => {
		if (typeof value === 'function')
			return;

		if (!value || typeof value !== 'object') {
			to[key] = value;
			return;
		}

		if (!seen.includes(from[key]))
			to[key] = destroyCircular(from[key], seen.slice());
	});

	for (const property of commonProperties)
		if (typeof from[property] === 'string')
			to[property] = from[property];

	return to;
};

module.exports = (value) => {
	if (typeof value === 'object')
		return destroyCircular(value, []);


	// People sometimes throw things besides Error objects…
	if (typeof value === 'function')
		// JSON.stringify discards functions. We do too, unless a function is thrown directly.
		return `[Function: ${(value.name || 'anonymous')}]`;


	return value;
};
