'use strict';

const buildDomain = require('./buildDomain');
const buildReadmodel = require('./buildReadmodel');

module.exports = (app, oblak, wire) => ({
	domain: buildDomain(app, oblak, wire),
	readmodel: buildReadmodel(app, oblak, wire),
});
