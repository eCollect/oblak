'use strict';

const { Schema } = require('mongoose');

const builder = require('./builder');
const oblakNotifier = require('./oblakNotifier');

module.exports = class MongooseCrudModelstore {
	constructor(app, repository, name) {
		this.app = app;
		this.repository = repository;
		this.db = null;
		this.collections = {};
		this.name = name;
	}

	async init(crud, api) {
		const mongoose = await this.app.connections.get('mongoose', this.repository.dbName);
		this.collections = builder(crud, {
			mongoose, Schema, defaultPlugins: [oblakNotifier(this.name, this.app.eventbus)], api,
		});
		return this;
	}

	collection(modelName) {
		if (!this.collections[modelName])
			throw new Error(`Readmodel mongo.${modelName} not found.`);
		return this.collections[modelName];
	}

	model(modelName, metadata, id) {
		const Model = this.collection(modelName);
		if (id)
			return Model.findOne({ _id: id });
		return new Model(metadata);
	}
};
