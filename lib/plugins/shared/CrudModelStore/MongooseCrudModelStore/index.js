'use strict';

const { Schema } = require('mongoose');

const builder = require('./builder');
const { DocumentsImportStream } = require('../../../../utils/stream');


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
		this.collections = builder(crud, { mongoose, Schema, api });
		return this;
	}

	collection(modelName) {
		if (!this.collections[modelName])
			throw new Error(`Readmodel mongo.${modelName} not found.`);
		return this.collections[modelName];
	}

	getExportStream(modelName) {
		const collection = this.collection(modelName);
		return collection.collection.find({});
	}

	getImportStream(modelName) {
		const collection = this.collection(modelName);
		return new DocumentsImportStream(collection.collection);
	}

	// use with care
	async clear(modelName) {
		const collection = this.collection(modelName);
		try {
			await collection.collection.drop();
		} catch (err) {
			if (err.message !== 'ns not found')
				throw err;
		}
	}

	model(modelName) {
		return this.collection(modelName);
	}
};
