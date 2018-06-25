'use strict';

const { metadataSymbol } = require('./symbols');

const buildTypeClass = ({ wire, type, models }) => {
	function ReadmodelType(metadata) {
		this[metadataSymbol] = metadata;
	}

	Object.keys(models).forEach((modelName) => {
		ReadmodelType.prototype[modelName] = function query(id) {
			return wire.readmodelStore.query(type, modelName, this[metadataSymbol], id);
		};
	});

	return ReadmodelType;
};

const buildModelsClass = ({ wire, readmodels }) => {
	function Readmodels(metadata = {}) {
		this[metadataSymbol] = metadata;
	}
	Object.entries(readmodels).forEach(([type, models]) => {
		const ReadmodelType = buildTypeClass({ wire, type, models });
		Object.defineProperty(Readmodels.prototype, type, {
			get() {
				return new ReadmodelType(this[metadataSymbol]);
			},
		});
	});
	return Readmodels;
};

module.exports = buildModelsClass;
