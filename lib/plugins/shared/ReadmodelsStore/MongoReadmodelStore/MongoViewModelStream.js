'use strict';

const { Transform } = require('stream');

class MongoViewModelStream extends Transform {
	constructor(ViewModel) {
		super({ objectMode: true });
		this.ViewModel = ViewModel;
	}

	_transform(model, _, next) { // eslint-disable-line
		next(null, new this.ViewModel({
			id: model._id,
			attributes: model,
			exists: true,
			version: null,
		}));
	}
}

module.exports = MongoViewModelStream;
