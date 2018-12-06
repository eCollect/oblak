'use strict';

/* eslint-disable no-plusplus */

/*!
 * Code adapted to this library needs from :
 *
 * get-value <https://github.com/jonschlinkert/get-value>
 *
 */

const is = require('../is');
const { split } = require('./shared');

function result(target, path, value) {
	if (is.Object(target[path]) && is.Object(value)) {
		Object.assign(target[path], value);
		return target;
	}
	target[path] = value;
	return target;
}

function set(target, path, value) {
	if (!is.ValidObject(target))
		return target;

	if (!path)
		return target;

	const keys = is.Array(path) ? path : split(path);
	const len = keys.length;
	const orig = target;

	if (keys.length === 1)
		return result(target, keys[0], value);

	for (let i = 0; i < len; i++) {
		const prop = keys[i];

		if (target[prop] === null || !is.ValidObject(target[prop]))
			target[prop] = {};

		if (i === len - 1) {
			result(target, prop, value);
			break;
		}

		target = target[prop];
	}

	return orig;
}

module.exports = set;
