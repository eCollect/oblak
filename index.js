'use strict';

const moduleAlias = require('module-alias');
const path = require('path');

const Oblak = require('./lib/Oblak');

moduleAlias.addAlias('lib', path.join(process.cwd(), 'lib'));
moduleAlias.addAlias('oblak-data', path.join(process.cwd(), 'oblak-data.js'));

module.exports = Oblak;
