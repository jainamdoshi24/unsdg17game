/**
 * Seeded pseudo-random number generator utility.
 * Uses the `seedrandom` package to produce reproducible random numbers.
 *
 * Usage:
 *   const { createRNG } = require('../utils/seededRandom');
 *   const rng = createRNG('abc123seed');
 *   rng()         // → 0.12345... (deterministic for same seed)
 *   rng.int(1,6)  // → random int between 1 and 6 inclusive
 *   rng.pick(arr) // → random element from array
 */
const seedrandom = require('seedrandom');

/**
 * @param {string} seed
 * @returns {Function} rng — seeded PRNG with helper methods
 */
function createRNG(seed) {
    const rng = seedrandom(seed);

    /** Random float [0, 1) — replacement for Math.random() */
    const random = () => rng();

    /** Random integer [min, max] inclusive */
    random.int = (min, max) => Math.floor(rng() * (max - min + 1)) + min;

    /** Random element from array */
    random.pick = (arr) => arr[Math.floor(rng() * arr.length)];

    /** Shuffle array in-place using Fisher-Yates */
    random.shuffle = (arr) => {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    };

    /** Boolean with probability p (default 0.5) */
    random.bool = (p = 0.5) => rng() < p;

    /** Gaussian noise (Box-Muller transform) */
    random.gaussian = (mean = 0, std = 1) => {
        const u1 = rng(), u2 = rng();
        const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        return mean + z0 * std;
    };

    return random;
}

module.exports = { createRNG };
