/**
 * SDG 13 — Climate Action: Emission Balancing & Policy Strategy
 * Crisis response sim — cut CO2 emissions 45% before climate tipping point.
 * Win: co2Level reduced by 45% from baseline (or score >=50 at turn 25)
 */
class SDG13Engine {
    init(difficulty, seed) {
        const d = difficulty;
        const baselineCO2 = 100;
        return {
            co2Level: baselineCO2,
            baselineCO2,
            renewableInvestment: 15 - d * 3,
            carbonPrice: 0,
            publicOpinion: 55 - d * 10,
            gdpImpact: 0,
            forestCover: 40 - d * 5,
            electricVehicleShare: 5,
            coalShare: 50 + d * 10,
            budget: 250000000,
            treesPlanted: 0,
            turn: 0,
        };
    }

    availableActions(state) {
        const actions = [
            { id: 'carbon_tax', label: '💸 Carbon Pricing ($30/t)', cost: 0, effect: '-5 CO2, +revenue, -opinion' },
            { id: 'coal_phase_out', label: '⛏️ Phase Out Coal (-10%)', cost: 2_000_000, effect: '-10 CO2, +5% renewable' },
            { id: 'renewable_invest', label: '☀️ Renewable Energy (+15%)', cost: 4_000_000, effect: '-8 CO2, +15% solar/wind' },
            { id: 'electrify_transport', label: '🚗 Subsidise EVs', cost: 2_500_000, effect: '+15% EVs, -6 CO2' },
            { id: 'reforestation', label: '🌳 Plant a Million Trees', cost: 1_500_000, effect: '+8% forests, -5 CO2' },
            { id: 'green_building', label: '🏗️ Green Building Code', cost: 800_000, effect: '-4 CO2, energy savings' },
            { id: 'climate_diplomacy', label: '🌐 International Agreement', cost: 1_000_000, effect: '+opinion, -3 CO2 globally' },
            { id: 'ban_plastic', label: '🚯 Single-Use Plastic Ban', cost: 0, effect: '+opinion, -2 CO2' },
        ].filter(a => a.cost <= state.budget);
        if (actions.length === 0) actions.push({ id: 'ban_plastic', label: '🚯 Plastic Ban (Free)', cost: 0, effect: '+opinion' });
        return actions;
    }

    applyAction(state, action, params = {}) {
        const s = structuredClone(state);
        const cons = [], events = [];

        switch (action) {
            case 'carbon_tax':
                s.carbonPrice = Math.min(150, s.carbonPrice + 30);
                s.co2Level = Math.max(0, s.co2Level - 5);
                s.gdpImpact = Math.max(-10, s.gdpImpact - 0.8);
                s.publicOpinion = Math.max(0, s.publicOpinion - 4);
                s.budget += 1_800_000;
                cons.push(`💸 Carbon price: $${s.carbonPrice}/tonne — revenue raised, emissions fell 5 points!`);
                break;
            case 'coal_phase_out':
                s.budget -= 2_000_000;
                s.coalShare = Math.max(0, s.coalShare - 10);
                s.co2Level = Math.max(0, s.co2Level - 10);
                s.renewableInvestment = Math.min(100, s.renewableInvestment + 5);
                cons.push(`⛏️ Coal share at ${s.coalShare}% — CO2 dropped 10 index points!`);
                break;
            case 'renewable_invest':
                s.budget -= 4_000_000;
                s.renewableInvestment = Math.min(100, s.renewableInvestment + 15);
                s.co2Level = Math.max(0, s.co2Level - 8);
                s.coalShare = Math.max(0, s.coalShare - 5);
                cons.push(`☀️ ${s.renewableInvestment}% energy now from renewables — clean power surging!`);
                break;
            case 'electrify_transport':
                s.budget -= 2_500_000;
                s.electricVehicleShare = Math.min(100, s.electricVehicleShare + 15);
                s.co2Level = Math.max(0, s.co2Level - 6);
                cons.push(`🚗 ${s.electricVehicleShare}% of vehicles now electric — transport emissions falling!`);
                break;
            case 'reforestation':
                s.budget -= 1_500_000;
                s.forestCover = Math.min(80, s.forestCover + 8);
                s.co2Level = Math.max(0, s.co2Level - 5);
                s.treesPlanted += 1_000_000;
                cons.push(`🌳 ${(s.treesPlanted / 1_000_000).toFixed(0)}M trees planted — forest cover at ${s.forestCover}%!`);
                break;
            case 'green_building':
                s.budget -= 800_000;
                s.co2Level = Math.max(0, s.co2Level - 4);
                s.gdpImpact = Math.min(10, s.gdpImpact + 0.5);
                cons.push('🏗️ Green building code cuts energy use 30% in new construction!');
                break;
            case 'climate_diplomacy':
                s.budget -= 1_000_000;
                s.publicOpinion = Math.min(100, s.publicOpinion + 10);
                s.co2Level = Math.max(0, s.co2Level - 3);
                cons.push('🌐 International partners commit to emission cuts — global CO2 fell 3 points!');
                break;
            case 'ban_plastic':
                s.publicOpinion = Math.min(100, s.publicOpinion + 6);
                s.co2Level = Math.max(0, s.co2Level - 2);
                cons.push('🚯 Plastic ban enacted — public support up, microplastic pollution falling!');
                break;
        }

        // Emergency budget via carbon revenue
        if (s.budget <= 0) {
            s.budget = 3_000_000;
            events.push('🆘 Emergency Green Climate Fund disbursement of ₹3M received!');
        }

        // Random events
        const r = Math.random();
        if (r < 0.12) {
            s.co2Level = Math.min(130, s.co2Level + 7);
            events.push('🔥 Mega-wildfires released stored carbon — CO2 spiked +7!');
        } else if (r < 0.22) {
            s.publicOpinion = Math.min(100, s.publicOpinion + 12);
            events.push('🌍 Extreme weather event shifted public opinion +12%!');
        } else if (r < 0.30) {
            s.renewableInvestment = Math.min(100, s.renewableInvestment + 5);
            events.push('⚡ Solar panel costs crashed — renewable share boosted 5%!');
        } else if (r < 0.38) {
            s.budget += 2_000_000;
            events.push('🌿 Green Bond issuance raised ₹2M for climate projects!');
        }

        s.turn += 1;
        s.budget = (s.budget || 0) + 500000;
        return { newState: s, consequences: cons, events };
    }

    tick(state) {
        const s = structuredClone(state);
        s.co2Level = Math.min(130, s.co2Level + 2);
        s.forestCover = Math.max(0, s.forestCover - 0.5);
        s.turn += 1;
        s.budget = (s.budget || 0) + 500000;
        return { newState: s, events: ['🌡️ Without policy: CO2 keeps rising. Act now!'] };
    }

    computeScore(state) {
        const reduction = ((state.baselineCO2 - state.co2Level) / state.baselineCO2) * 100;
        return Math.round(
            Math.max(0, reduction) * 0.50 +
            state.renewableInvestment * 0.25 +
            state.forestCover * 0.15 +
            Math.max(0, 50 + state.gdpImpact) * 0.10
        );
    }

    isTerminal(state) {
        const reductionPct = ((state.baselineCO2 - state.co2Level) / state.baselineCO2) * 100;
        if (reductionPct >= 45) return { done: true, outcome: 'won' };
        if (state.turn >= 25) {
            return { done: true, outcome: this.computeScore(state) >= 50 ? 'won' : 'lost' };
        }
        return { done: false };
    }
}

module.exports = SDG13Engine;
