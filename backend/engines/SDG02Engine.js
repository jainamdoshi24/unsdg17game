/**
 * SDG 2 — Zero Hunger: Farming & Food Supply Strategy
 * Farming sim — manage crops, water, waste, market trade through 6 seasons.
 * Win: foodSecurityIndex > 80 (or score >=55 at turn 25)
 */
class SDG02Engine {
    init(difficulty, seed) {
        const d = difficulty;
        return {
            cropYield: 60 - d * 10,
            waterSupply: 70 - d * 15,
            marketPrice: 100,
            wasteRatio: 25 + d * 5,
            foodSecurityIndex: 50 - d * 10,
            budget: 8000000,
            season: 1,
            fieldsIrrigated: 0,
            coldStorageBuilt: false,
            turn: 0,
        };
    }

    availableActions(state) {
        const actions = [
            { id: 'irrigate', label: '💧 Expand Irrigation', cost: 80_000, effect: '+15% water, +10% yield' },
            { id: 'plant_drought', label: '🌱 Drought-Resistant Crops', cost: 50_000, effect: '+8% yield' },
            { id: 'cold_storage', label: '🧊 Build Cold Storage', cost: 120_000, effect: '-15% waste' },
            { id: 'market_trade', label: '📦 Export Surplus to Market', cost: 0, effect: '+income if yield>70%' },
            { id: 'aid_distribution', label: '🎁 Distribute Food Aid', cost: 60_000, effect: '+10 food security' },
            { id: 'composting', label: '♻️ Composting Programme', cost: 30_000, effect: '-8% waste, +soil' },
            { id: 'hire_agronomist', label: '🧑‍🔬 Hire Agronomist', cost: 40_000, effect: '+5% yield every turn' },
        ].filter(a => a.cost <= state.budget);
        if (actions.length === 0) actions.push({ id: 'market_trade', label: '📦 Emergency Market Trade', cost: 0, effect: 'sell surplus' });
        return actions;
    }

    applyAction(state, action, params = {}) {
        const s = structuredClone(state);
        const cons = [], events = [];

        switch (action) {
            case 'irrigate':
                s.budget -= 80_000;
                s.waterSupply = Math.min(100, s.waterSupply + 15);
                s.cropYield = Math.min(100, s.cropYield + 10);
                s.fieldsIrrigated += 10;
                cons.push(`💧 ${s.fieldsIrrigated} fields now irrigated — water stable, yield up 10%!`);
                break;
            case 'plant_drought':
                s.budget -= 50_000;
                s.cropYield = Math.min(100, s.cropYield + 8);
                cons.push('🌱 Drought-resistant crops planted — yield secured even in dry spells.');
                break;
            case 'cold_storage':
                s.budget -= 120_000;
                s.wasteRatio = Math.max(0, s.wasteRatio - 15);
                s.coldStorageBuilt = true;
                cons.push('🧊 Cold storage operational — post-harvest losses slashed by 15%!');
                break;
            case 'market_trade':
                if (s.cropYield > 70) {
                    const surplus = Math.round((s.cropYield - 70) * 1200);
                    s.budget += surplus;
                    s.marketPrice = Math.max(70, s.marketPrice - 5);
                    cons.push(`📦 Surplus sold — earned ₹${surplus.toLocaleString()} from export!`);
                } else {
                    cons.push('📦 Crop yield too low to export — need to grow more first.');
                }
                break;
            case 'aid_distribution':
                s.budget -= 60_000;
                s.foodSecurityIndex = Math.min(100, s.foodSecurityIndex + 10);
                cons.push('🎁 Food aid reached 20,000 families — acute hunger reduced!');
                break;
            case 'composting':
                s.budget -= 30_000;
                s.wasteRatio = Math.max(0, s.wasteRatio - 8);
                cons.push('♻️ Composting reduced waste 8% and improved soil fertility.');
                break;
            case 'hire_agronomist':
                s.budget -= 40_000;
                s.cropYield = Math.min(100, s.cropYield + 5);
                cons.push('🧑‍🔬 Expert agronomist hired — crop efficiency improving every season!');
                break;
        }

        // Recompute food security
        const yf = s.cropYield / 100;
        const wf = 1 - s.wasteRatio / 100;
        const waterF = s.waterSupply / 100;
        s.foodSecurityIndex = Math.round(Math.min(100, yf * wf * waterF * 100));

        // Emergency budget
        if (s.budget <= 0) {
            s.budget = 200_000;
            events.push('🆘 Emergency WFP grant of ₹200K received to keep operations going!');
        }

        // Random events
        const r = Math.random();
        if (r < 0.12) {
            s.waterSupply = Math.max(10, s.waterSupply - 20);
            events.push('🌵 Drought hit! Water reservoir dropped 20%. Irrigate fast!');
        } else if (r < 0.22) {
            s.cropYield = Math.max(10, s.cropYield - 12);
            events.push('🐛 Pest outbreak destroyed crops! Yield down 12%!');
        } else if (r < 0.30) {
            s.budget += 250_000;
            events.push('🌍 WFP emergency grant of ₹250K received!');
        } else if (r < 0.38) {
            s.waterSupply = Math.min(100, s.waterSupply + 10);
            events.push('🌧️ Unexpected rains refilled the reservoir by 10%!');
        }

        s.turn += 1;
        s.season = Math.min(25, Math.floor(s.turn / 4) + 1);
        s.budget = (s.budget || 0) + 500000;
        return { newState: s, consequences: cons, events };
    }

    tick(state) {
        const s = structuredClone(state);
        s.waterSupply = Math.max(5, s.waterSupply - 3);
        s.wasteRatio = Math.min(60, s.wasteRatio + 1);
        s.turn += 1;
        s.season = Math.min(25, Math.floor(s.turn / 4) + 1);
        s.budget = (s.budget || 0) + 500000;
        return { newState: s, events: ['🌾 Season progresses — water level fell slightly.'] };
    }

    computeScore(state) {
        return Math.round(
            state.foodSecurityIndex * 0.50 +
            Math.max(0, 100 - state.wasteRatio) * 0.25 +
            state.waterSupply * 0.15 +
            Math.min(100, state.cropYield) * 0.10
        );
    }

    isTerminal(state) {
        if (state.foodSecurityIndex > 80) return { done: true, outcome: 'won' };
        if (state.turn >= 25) {
            return { done: true, outcome: this.computeScore(state) >= 55 ? 'won' : 'lost' };
        }
        return { done: false };
    }
}

module.exports = SDG02Engine;
