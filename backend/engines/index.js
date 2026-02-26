/**
 * Engine Factory — maps SDG IDs to their simulation engine class.
 * Import this wherever you need to instantiate an engine by SDG ID.
 */
const SDG01Engine = require('./SDG01Engine');
const SDG02Engine = require('./SDG02Engine');
const SDG03Engine = require('./SDG03Engine');
const SDG04Engine = require('./SDG04Engine');
const SDG05Engine = require('./SDG05Engine');
const SDG06Engine = require('./SDG06Engine');
const SDG07Engine = require('./SDG07Engine');
const SDG08Engine = require('./SDG08Engine');
const SDG09Engine = require('./SDG09Engine');
const SDG10Engine = require('./SDG10Engine');
const SDG11Engine = require('./SDG11Engine');
const SDG12Engine = require('./SDG12Engine');
const SDG13Engine = require('./SDG13Engine');
const SDG14Engine = require('./SDG14Engine');
const SDG15Engine = require('./SDG15Engine');
const SDG16Engine = require('./SDG16Engine');
const SDG17Engine = require('./SDG17Engine');

const ENGINES = {
    SDG_01: SDG01Engine,
    SDG_02: SDG02Engine,
    SDG_03: SDG03Engine,
    SDG_04: SDG04Engine,
    SDG_05: SDG05Engine,
    SDG_06: SDG06Engine,
    SDG_07: SDG07Engine,
    SDG_08: SDG08Engine,
    SDG_09: SDG09Engine,
    SDG_10: SDG10Engine,
    SDG_11: SDG11Engine,
    SDG_12: SDG12Engine,
    SDG_13: SDG13Engine,
    SDG_14: SDG14Engine,
    SDG_15: SDG15Engine,
    SDG_16: SDG16Engine,
    SDG_17: SDG17Engine,
};

/**
 * @param {string} sdgId   e.g. "SDG_03"
 * @returns {object}       An instantiated engine, or null if not found.
 */
function getEngine(sdgId) {
    const EngineClass = ENGINES[sdgId];
    if (!EngineClass) return null;
    return new EngineClass();
}

module.exports = { getEngine, SUPPORTED_SDGS: Object.keys(ENGINES) };
