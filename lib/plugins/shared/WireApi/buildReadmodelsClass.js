'use strict';

const { metadataSymbol } = require('./symbols');

const buildTypeClass = ({ wire, type, models }) => {
	function ReadmodelType(metadata, options) {
		this[metadataSymbol] = metadata;
		this.options = options;
	}

	Object.keys(models).forEach((modelName) => {
		ReadmodelType.prototype[modelName] = function query(id) {
			return wire.readmodelStore.query(type, modelName, this[metadataSymbol], id, this.options);
		};
	});

	return ReadmodelType;
};

const buildModelsClass = ({ wire, readmodels }) => {
	function Readmodels(metadata = {}, options = {}) {
		this[metadataSymbol] = metadata;
		this.options = options;
	}
	Object.entries(readmodels).forEach(([type, models]) => {
		const ReadmodelType = buildTypeClass({ wire, type, models });
		Object.defineProperty(Readmodels.prototype, type, {
			get() {
				return new ReadmodelType(this[metadataSymbol], this.options);
			},
		});
	});
	return Readmodels;
};

module.exports = buildModelsClass;
