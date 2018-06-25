'use strict';

const { metadataSymbol, wireSymbol } = require('./symbols');

module.exports = (obj) => {
	function Api(metadata, wire) {
		this[metadataSymbol] = metadata;
		this[wireSymbol] = wire;
	}

	Object.entries(obj).forEach(([name, func]) => {
		Api.prototype[name] = function getService() {
			return func(this[metadataSymbol], this[wireSymbol]);
		};
	});
	return Api;
};
