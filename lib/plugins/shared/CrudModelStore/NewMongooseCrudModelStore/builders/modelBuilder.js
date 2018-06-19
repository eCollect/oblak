'use strict';

const mongooseWrapperBuilder = (Model, statics) => {
	function MongooseWrapper(metadata) {
		this.metadata = metadata;
		// this.Model = Model;
	}

	Object.keys(statics).forEach((name) => {
		MongooseWrapper.prototype[name] = function mongooseStatic(data, metadata) {
			return Model[name](data, { ...metadata, ...this.metadata });
		};
	});

	Object.getOwnPropertyNames(Model).forEach((f) => {
		if (f === 'name' || f === 'length' || f === 'prototype' || statics[f])
			return;

		if (!(typeof f === 'function')) {
			MongooseWrapper.prototype[f] = Model[f];
			return;
		}
		MongooseWrapper.prototype[f] = (...params) => Model[f](...params);
	});
	Object.getOwnPropertyNames(Object.getPrototypeOf(Model)).forEach((f) => {
		if (f === 'name' || f === 'length' || f === 'prototype')
			return;

		if (!(typeof Model[f] === 'function')) {
			MongooseWrapper.prototype[f] = Model[f];
			return;
		}
		if (f === 'find')
			MongooseWrapper.prototype[f] = (...params) => Model[f](...params);
	});

	return MongooseWrapper;
};

module.exports = (
	modelName,
	{
		schema = {}, statics = {}, methods = {}, plugins = [],
	},
	{
		mongoose, Schema, defaultPlugins = [], app, api,
	},
) => {
	const mongooseSchema = new Schema(schema);

	Object.entries(statics).forEach(([name, method]) => {
		mongooseSchema.statics[name] = function mngStatic(data) {
			return method(this, data, api);
		};
	});

	Object.entries(methods).forEach(([name, method]) => {
		mongooseSchema.methods[name] = function mngStatic(data) {
			return method(this, data, api);
		};
	});

	// mongooseSchema.plugin(test);
	plugins.forEach((plugin) => {
		mongooseSchema.plugin(plugin);
	});

	defaultPlugins.forEach((plugin) => {
		mongooseSchema.plugin(plugin, app);
	});

	const Model = mongoose.model(modelName, mongooseSchema);

	return mongooseWrapperBuilder(Model, statics); // ) mongoose.model(modelName, mongooseSchema);
};
