'use strict';

const requireDir = require('require-dir');

const { mapKeys, kebapCase } = require('../../utils');

module.exports = mapKeys(requireDir(__dirname), kebapCase);
