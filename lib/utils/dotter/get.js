'use strict';

/* eslint-disable no-plusplus */

/*!
 * Code adapted to this library needs from :
 *
 * get-value <https://github.com/jonschlinkert/get-value>
 *
 */

const is = require('../is');
const { split, SPLIT_CHAR } = require('./shared');

const join = (seg1, seg2) => seg1 + SPLIT_CHAR + seg2;

module.exports = function get(target, path, defaultValue) {
	const options = { default: defaultValue };

	if (!path)
		return target;

	if (path in target)
		return target[path];

	if (typeof path === 'number')
		path = String(path);

	const segs = is.Array(path) ? path : split(path);
	const len = segs.length;
	let idx = 0;

	do {
		let prop = segs[idx];
		if (typeof prop === 'number')
			prop = String(prop);


		while (prop && prop.slice(-1) === '\\')
			prop = join(prop.slice(0, -1), segs[++idx] || '');


		if (prop in target) {
			target = target[prop];
		} else {
			let hasProp = false;
			let n = idx + 1;

			while (n < len) {
				prop = join(prop, segs[n++]);

				hasProp = prop in target;

				if (hasProp) {
					target = target[prop];
					idx = n - 1;
					break;
				}
			}

			if (!hasProp)
				return options.default;
		}
	} while (++idx < len && is.ValidObject(target));

	if (idx === len)
		return target;

	return options.default;
};
