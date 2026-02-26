/**
 * SDG 6 — Clean Water: Water Grid Resource Manager
 * Build pipelines, treatment plants, fight contamination for clean water access.
 * Win: waterAccess > 90 AND contamination < 5 (or score>=58 at turn 25)
 */
class SDG06Engine {
    init(difficulty, seed) {
        const d = difficulty;
        return {
            waterAccess: 40 - d * 8,
            contamination: 45 + d * 10,
            infrastructure: 30 - d * 5,
            populationHealth: 55 - d * 10,
            budget: 6_000_000,
            reservoirLevel: 60 - d * 10,
            treatmentPlants: 1,
            monitoringStations: 0,
            pipelinesBuilt: 0,
            turn: 0,
        };
    }

    availableActions(state) {
        const actions = [
            { id: 'build_pipes', label: '🔩 Lay Pipeline Network', cost: 600_000, effect: '+15% access, +infra' },
            { id: 'treatment_plant', label: '🏭 Build Treatment Plant', cost: 900_000, effect: '-25 contam, +health' },
            { id: 'close_well', label: '🚫 Close Contaminated Wells', cost: 50_000, effect: '-8 contamination' },
            { id: 'desalination', label: '🌊 Desalination Unit', cost: 1_200_000, effect: '+30% reservoir, +10% access' },
            { id: 'monitoring', label: '📡 Water Quality Monitors', cost: 200_000, effect: '-5 contam, early warnings' },
            { id: 'community_filters', label: '🔬 Community Filters', cost: 250_000, effect: '-10 contam, +health' },
            { id: 'rainwater_harvest', label: '🌧️ Rainwater Harvesting', cost: 180_000, effect: '+10% reservoir, +5% access' },
            { id: 'borehole_drilling', label: '⛏️ Drill Boreholes (villages)', cost: 400_000, effect: '+10% access, +health' },
        ].filter(a => a.cost <= state.budget);
        if (actions.length === 0) actions.push({ id: 'close_well', label: '🚫 Emergency Well Closure (Free)', cost: 0, effect: '-5 contamination' });
        return actions;
    }

    applyAction(state, action, params = {}) {
        const s = structuredClone(state);
        const cons = [], events = [];

        switch (action) {
            case 'build_pipes':
                s.budget -= 600_000;
                s.waterAccess = Math.min(100, s.waterAccess + 15);
                s.infrastructure = Math.min(100, s.infrastructure + 12);
                s.pipelinesBuilt += 1;
                cons.push(`🔩 Pipeline #${s.pipelinesBuilt} complete — 15% more population has clean water!`);
                break;
            case 'treatment_plant':
                s.budget -= 900_000;
                s.contamination = Math.max(0, s.contamination - 25);
                s.populationHealth = Math.min(100, s.populationHealth + 10);
                s.treatmentPlants += 1;
                cons.push(`🏭 Treatment plant #${s.treatmentPlants} operational — water quality dramatically improved!`);
                break;
            case 'close_well':
                s.budget -= 50_000;
                s.contamination = Math.max(0, s.contamination - 8);
                cons.push('🚫 Contaminated wells sealed — cholera risk reduced in 3 villages!');
                break;
            case 'desalination':
                s.budget -= 1_200_000;
                s.reservoirLevel = Math.min(100, s.reservoirLevel + 30);
                s.waterAccess = Math.min(100, s.waterAccess + 10);
                cons.push('🌊 Desalination online — freshwater supply now independent of rainfall!');
                break;
            case 'monitoring':
                s.budget -= 200_000;
                s.monitoringStations += 1;
                s.contamination = Math.max(0, s.contamination - 5);
                cons.push(`📡 Monitor station #${s.monitoringStations} live — catching contamination early!`);
                break;
            case 'community_filters':
                s.budget -= 250_000;
                s.contamination = Math.max(0, s.contamination - 10);
                s.populationHealth = Math.min(100, s.populationHealth + 6);
                cons.push('🔬 Community filters reducing waterborne disease incidence!');
                break;
            case 'rainwater_harvest':
                s.budget -= 180_000;
                s.reservoirLevel = Math.min(100, s.reservoirLevel + 10);
                s.waterAccess = Math.min(100, s.waterAccess + 5);
                cons.push('🌧️ Rainwater harvesting adds supplemental supply — reservoir stable!');
                break;
            case 'borehole_drilling':
                s.budget -= 400_000;
                s.waterAccess = Math.min(100, s.waterAccess + 10);
                s.populationHealth = Math.min(100, s.populationHealth + 8);
                cons.push('⛏️ Boreholes drilled in 5 villages — clean groundwater now accessible!');
                break;
        }

        // Recompute population health
        const healthGain = (100 - s.contamination) / 100 * s.waterAccess / 100;
        s.populationHealth = Math.round(Math.max(s.populationHealth, Math.min(100, healthGain * 100)));

        // Emergency budget
        if (s.budget <= 0) {
            s.budget = 1_000_000;
            events.push('🆘 UNICEF emergency water fund of ₹1M disbursed!');
        }

        // Random events
        const r = Math.random();
        if (r < 0.12) {
            s.contamination = Math.min(100, s.contamination + 12);
            events.push('☠️ Industrial spill detected upstream — contamination surged +12!');
        } else if (r < 0.22) {
            s.reservoirLevel = Math.max(10, s.reservoirLevel - 12);
            events.push('🌵 Drought hit — reservoir dropped 12%!');
        } else if (r < 0.30) {
            s.budget += 1_000_000;
            events.push('💧 World Bank water infrastructure grant of ₹1M received!');
        } else if (r < 0.38) {
            s.waterAccess = Math.min(100, s.waterAccess + 5);
            events.push('🌍 NGO partner drilled 2 boreholes — water access +5%!');
        }

        s.turn += 1;
        return { newState: s, consequences: cons, events };
    }

    tick(state) {
        const s = structuredClone(state);
        s.reservoirLevel = Math.max(5, s.reservoirLevel - 3);
        if (s.reservoirLevel < 20) {
            s.waterAccess = Math.max(10, s.waterAccess - 3);
        }
        s.turn += 1;
        return { newState: s, events: ['💧 Reservoir depleted 3% (daily usage). Build more supply!'] };
    }

    computeScore(state) {
        return Math.round(
            state.waterAccess * 0.40 +
            Math.max(0, 100 - state.contamination) * 0.35 +
            state.populationHealth * 0.15 +
            state.infrastructure * 0.10
        );
    }

    isTerminal(state) {
        if (state.waterAccess > 90 && state.contamination < 5) return { done: true, outcome: 'won' };
        if (state.turn >= 25) {
            return { done: true, outcome: this.computeScore(state) >= 58 ? 'won' : 'lost' };
        }
        return { done: false };
    }
}

module.exports = SDG06Engine;
