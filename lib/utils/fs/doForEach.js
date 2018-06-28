'use strict';

const fs = require('fs');
const sPath = require('path');

const doForEach = ({
	path,
	dir = null,
	file = null,
}) => {
	const result = {};

	if (!fs.existsSync(path))
		return result;

	if (!fs.statSync(path).isDirectory())
		return result;

	fs.readdirSync(path).forEach((item) => {
		const itemPath = sPath.join(path, item);
		const isFile = !fs.statSync(itemPath).isDirectory();
		let value;
		if (isFile && file)
			value = file(itemPath, item);
		if (!isFile && dir)
			value = dir(itemPath, item);

		if (value)
			result[item] = value;
	});

	return result;
};

const doForEachFile = (path, operation) => doForEach({ path, file: operation });
const doForEachDir = (path, operation) => doForEach({ path, dir: operation });

module.exports = {
	doForEach,
	doForEachFile,
	doForEachDir,
};
