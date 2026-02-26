/**
 * SDG 1 — No Poverty: Economic Budget & Microloan Simulation
 * City-building economics sim — manage budget, grow employment, reduce inequality.
 * Win: povertyRate < 10 (or score >= 55 at turn 25)
 */
class SDG01Engine {
    init(difficulty, seed) {
        const d = difficulty;
        return {
            budget: 25_000_000 - d * 1_000_000,
            employmentRate: 45 - d * 5,
            giniIndex: 0.55 + d * 0.05,
            povertyRate: 40 + d * 5,
            population: 100_000,
            microloansActive: 0,
            housingUnits: 0,
            turn: 0,
        };
    }

    availableActions(state) {
        const actions = [
            { id: 'fund_microloans', label: '💳 Issue Microloans', emoji: '💳', cost: 1_000_000, effect: '+6% employment, -6% poverty' },
            { id: 'build_jobs_scheme', label: '🏗️ Public Jobs Scheme', emoji: '🏗️', cost: 2_000_000, effect: '+10% employment, -8% poverty' },
            { id: 'food_program', label: '🍽️ Food Subsidy Programme', emoji: '🍽️', cost: 800_000, effect: '-10% poverty' },
            { id: 'build_housing', label: '🏠 Build Affordable Housing', emoji: '🏠', cost: 2_500_000, effect: '-6% poverty' },
            { id: 'skill_training', label: '🎓 Vocational Training Centre', emoji: '🎓', cost: 1_200_000, effect: '+5% employment, -inequality' },
            { id: 'tax_reform', label: '⚖️ Progressive Tax Reform', emoji: '⚖️', cost: 0, effect: '+1.5M revenue, -inequality' },
            { id: 'community_center', label: '🏛️ Community Centre', emoji: '🏛️', cost: 600_000, effect: '-3% poverty, -inequality' },
        ].filter(a => a.cost <= state.budget);
        // Always keep at least tax_reform available (it costs 0)
        if (actions.length === 0) actions.push({ id: 'tax_reform', label: '⚖️ Emergency Tax Reform', emoji: '⚖️', cost: 0, effect: '+500K, -inequality' });
        return actions;
    }

    applyAction(state, action, params = {}) {
        const s = structuredClone(state);
        const cons = [], events = [];

        switch (action) {
            case 'fund_microloans':
                s.budget -= 1_000_000;
                s.employmentRate = Math.min(100, s.employmentRate + 6);
                s.povertyRate = Math.max(0, s.povertyRate - 6);
                s.giniIndex = Math.max(0.2, s.giniIndex - 0.02);
                s.microloansActive += 500;
                cons.push(`💳 ${s.microloansActive} microloans active — employment rose 6%, poverty fell 6%.`);
                break;
            case 'build_jobs_scheme':
                s.budget -= 2_000_000;
                s.employmentRate = Math.min(100, s.employmentRate + 10);
                s.povertyRate = Math.max(0, s.povertyRate - 8);
                cons.push('🏗️ Public jobs scheme employed 10,000 citizens — poverty dropped rapidly!');
                break;
            case 'food_program':
                s.budget -= 800_000;
                s.povertyRate = Math.max(0, s.povertyRate - 10);
                cons.push('🍽️ Subsidised food reached families instantly — hunger and poverty reduced.');
                break;
            case 'build_housing':
                s.budget -= 2_500_000;
                s.povertyRate = Math.max(0, s.povertyRate - 6);
                s.housingUnits += 500;
                cons.push(`🏠 ${s.housingUnits} affordable units built — homelessness dropping, poverty -6%!`);
                break;
            case 'skill_training':
                s.budget -= 1_200_000;
                s.employmentRate = Math.min(100, s.employmentRate + 8);
                s.povertyRate = Math.max(0, s.povertyRate - 4);
                s.giniIndex = Math.max(0.2, s.giniIndex - 0.03);
                cons.push('🎓 Training centre opened — wages rising, poverty and inequality narrowing.');
                break;
            case 'tax_reform':
                s.budget += 1_500_000;
                s.giniIndex = Math.max(0.2, s.giniIndex - 0.04);
                cons.push('⚖️ Progressive tax raised ₹1.5M in revenue and reduced inequality.');
                break;
            case 'community_center':
                s.budget -= 600_000;
                s.povertyRate = Math.max(0, s.povertyRate - 3);
                s.giniIndex = Math.max(0.2, s.giniIndex - 0.01);
                cons.push('🏛️ Community centre opened — residents report higher wellbeing!');
                break;
            default:
                cons.push('Unknown action.');
        }

        // Emergency budget if broke
        if (s.budget <= 0) {
            s.budget = 1_000_000;
            events.push('🆘 Emergency IMF loan of ₹1M secured to prevent economic collapse!');
        }

        // Fun random events
        const r = Math.random();
        if (r < 0.12) {
            s.employmentRate = Math.max(0, s.employmentRate - 5);
            events.push('⚠️ Factory closure spiked unemployment — keep creating jobs!');
        } else if (r < 0.22) {
            s.budget += 600_000;
            events.push('💰 International aid package of ₹600K received!');
        } else if (r < 0.30) {
            s.employmentRate = Math.min(100, s.employmentRate + 3);
            events.push('🚀 New private investment created 3,000 local jobs!');
        } else if (r < 0.36) {
            s.povertyRate = Math.max(0, s.povertyRate - 3);
            events.push('📊 Grassroots NGO reduced poverty by 3% in rural areas!');
        }

        s.turn += 1;
        return { newState: s, consequences: cons, events };
    }

    tick(state) {
        const s = structuredClone(state);
        s.povertyRate = Math.min(100, s.povertyRate + 1);
        s.budget = Math.max(500_000, s.budget + 200_000); // passive income
        s.turn += 1;
        return { newState: s, events: ['⌛ The clock is ticking! Take action to reduce poverty!'] };
    }

    computeScore(state) {
        const empScore = Math.min(100, state.employmentRate) * 0.40;
        const giniScore = Math.max(0, (1 - state.giniIndex) * 100) * 0.20;
        const povScore = Math.max(0, 100 - state.povertyRate) * 0.40;
        return Math.round(empScore + giniScore + povScore);
    }

    isTerminal(state) {
        if (state.povertyRate < 10) return { done: true, outcome: 'won' };
        if (state.turn >= 25) {
            const score = this.computeScore(state);
            return { done: true, outcome: score >= 55 ? 'won' : 'lost' };
        }
        return { done: false };
    }
}

module.exports = SDG01Engine;
