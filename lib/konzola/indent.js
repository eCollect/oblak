'use strict';

module.exports = (numSpaces, str = '') => `${new Array(numSpaces + 1).join(' ')}${str}`;
