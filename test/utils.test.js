const assert = require('assert');
const { ChaosToExalted } = require('../components/utils');

// Basic behavior
assert.strictEqual(ChaosToExalted(100, 50), 0.5, '50 chaos => 0.5 exalted when exalted value is 100');

// Zero ExaltedValue should return 0
assert.strictEqual(ChaosToExalted(0, 50), 0, 'ExaltedValue 0 should return 0');

// Zero chaos value should return 0
assert.strictEqual(ChaosToExalted(100, 0), 0, 'Zero chaos should return 0');

console.log('All tests passed');
