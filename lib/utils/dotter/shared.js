'use strict';

/* eslint-disable no-plusplus */

const SPLIT_CHAR = '.';

let memo = {};

function split(path) {
	const id = path;
	if (memo[id])
		return memo[id];

	let keys = [];
	const res = [];

	keys = path.split(SPLIT_CHAR);


	for (let i = 0; i < keys.length; i++) {
		let prop = keys[i];
		while (prop && prop.slice(-1) === '\\' && keys[i + 1])
			prop = prop.slice(0, -1) + SPLIT_CHAR + keys[++i];

		res.push(prop);
	}

	memo[id] = res;
	return res;
}

function clear() {
	memo = {};
}

module.exports = {
	split,
	clear,
	SPLIT_CHAR,
};
