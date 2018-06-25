'use strict';

const { metadataSymbol } = require('./symbols');

const buildTypeClass = ({ wire, type, models }) => {
	function CrudmodelType(metadata) {
		this[metadataSymbol] = metadata;
	}

	Object.keys(models.collections).forEach((modelName) => {
		CrudmodelType.prototype[modelName] = function query(id) {
			return wire.crudmodelStore.model(type, modelName, this[metadataSymbol], id);
		};
	});

	return CrudmodelType;
};

const buildModelsClass = ({ wire, crud }) => {
	function Crudmodels(metadata = {}) {
		this[metadataSymbol] = metadata;
	}
	Object.entries(crud).forEach(([type, models]) => {
		const CrudmodelType = buildTypeClass({ wire, type, models });
		Object.defineProperty(Crudmodels.prototype, type, {
			get() {
				return new CrudmodelType(this[metadataSymbol]);
			},
		});
	});
	return Crudmodels;
};

module.exports = buildModelsClass;
