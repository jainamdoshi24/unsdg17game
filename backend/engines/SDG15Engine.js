/**
 * SDG 15 — Life on Land: Forest & Land Manager
 * Resources: forestCover, biodiversityIndex, landRevenue, carbonSink, soilHealth
 * Win: forestCover > original level AND biodiversityIndex > 70
 */
class SDG15Engine {
    init(difficulty, seed) {
        const d = difficulty;
        const originalForest = 50 - d * 5;
        return {
            forestCover: originalForest,   // %
            originalForest,
            biodiversityIndex: 45 - d * 8,       // 0–100
            landRevenue: 60,               // economic revenue from land use
            carbonSink: 40 - d * 5,       // % of carbon absorbed
            soilHealth: 50 - d * 8,       // 0–100
            invasiveSpecies: 20 + d * 5,      // threat index
            poachingPressure: 30 + d * 8,      // 0–100 (lower=better)
            budget: 5_000_000,
            turn: 0,
        };
    }

    availableActions(state) {
        return [
            { id: 'protect_zone', label: 'Designate Forest Protection Zone', cost: 400_000 },
            { id: 'restore_forest', label: 'Active Forest Restoration Programme', cost: 800_000 },
            { id: 'rewild', label: 'Rewilding & Habitat Corridors', cost: 700_000 },
            { id: 'logging_permit', label: 'Issue Controlled Logging Permit', cost: 0 },
            { id: 'anti_poaching', label: 'Anti-Poaching Ranger Deployment', cost: 500_000 },
            { id: 'invasive_control', label: 'Invasive Species Control Programme', cost: 400_000 },
            { id: 'soil_restoration', label: 'Soil Restoration & Agroforestry', cost: 350_000 },
        ].filter(a => a.cost <= state.budget);
    }

    applyAction(state, action, params = {}) {
        const s = structuredClone(state);
        const cons = [], events = [];

        switch (action) {
            case 'protect_zone':
                s.budget -= 400_000;
                s.forestCover = Math.min(90, s.forestCover + 3);
                s.biodiversityIndex = Math.min(100, s.biodiversityIndex + 6);
                cons.push('Protection zone established — deforestation halted in designated area.');
                break;
            case 'restore_forest':
                s.budget -= 800_000;
                s.forestCover = Math.min(90, s.forestCover + 8);
                s.carbonSink = Math.min(100, s.carbonSink + 5);
                s.biodiversityIndex = Math.min(100, s.biodiversityIndex + 5);
                cons.push('Forest restoration planted 1M trees — cover grew by 8%, carbon sink strengthened.');
                break;
            case 'rewild':
                s.budget -= 700_000;
                s.biodiversityIndex = Math.min(100, s.biodiversityIndex + 12);
                s.forestCover = Math.min(90, s.forestCover + 4);
                s.invasiveSpecies = Math.max(0, s.invasiveSpecies - 5);
                cons.push('Rewilding programme connected habitat corridors — wildlife populations recovering.');
                break;
            case 'logging_permit':
                // Short-term revenue boost but ecological cost
                s.landRevenue = Math.min(100, s.landRevenue + 15);
                s.forestCover = Math.max(0, s.forestCover - 8);
                s.biodiversityIndex = Math.max(0, s.biodiversityIndex - 10);
                s.carbonSink = Math.max(0, s.carbonSink - 5);
                s.budget += 1_000_000;
                cons.push('Logging permitted — ₹1M revenue, but forest cover and biodiversity declined significantly!');
                break;
            case 'anti_poaching':
                s.budget -= 500_000;
                s.poachingPressure = Math.max(0, s.poachingPressure - 20);
                s.biodiversityIndex = Math.min(100, s.biodiversityIndex + 8);
                cons.push('Anti-poaching rangers deployed — protected species populations stabilising.');
                break;
            case 'invasive_control':
                s.budget -= 400_000;
                s.invasiveSpecies = Math.max(0, s.invasiveSpecies - 15);
                s.biodiversityIndex = Math.min(100, s.biodiversityIndex + 7);
                s.soilHealth = Math.min(100, s.soilHealth + 5);
                cons.push('Invasive species control: native species reclaiming territory — biodiversity up.');
                break;
            case 'soil_restoration':
                s.budget -= 350_000;
                s.soilHealth = Math.min(100, s.soilHealth + 15);
                s.carbonSink = Math.min(100, s.carbonSink + 4);
                cons.push('Agroforestry and soil restoration improved land productivity and carbon storage.');
                break;
        }

        const r = Math.random();
        if (r < 0.12) {
            s.forestCover = Math.max(0, s.forestCover - 8);
            events.push('🔥 Wildfire destroyed 8% of forest cover!');
        } else if (r < 0.22) {
            s.invasiveSpecies = Math.min(100, s.invasiveSpecies + 10);
            events.push('🦟 New invasive species outbreak detected across 3 regions!');
        } else if (r < 0.30) {
            s.biodiversityIndex = Math.min(100, s.biodiversityIndex + 6);
            events.push('🦁 Wildlife census shows rare species recovering — biodiversity +6!');
        }

        // Emergency budget
        if (s.budget <= 0) {
            s.budget = 1_200_000;
            events.push('🆘 UNEP emergency biodiversity fund of ₹1.2M disbursed!');
        }

        s.turn += 1;
        return { newState: s, consequences: cons, events };
    }

    tick(state) {
        const s = structuredClone(state);
        s.forestCover = Math.max(0, s.forestCover - 2);     // deforestation pressure
        s.biodiversityIndex = Math.max(0, s.biodiversityIndex - 2);
        s.soilHealth = Math.max(0, s.soilHealth - 1);
        s.turn += 1;
        return { newState: s, events: ['🌲 Habitat loss continued — forest and biodiversity declining.'] };
    }

    computeScore(state) {
        const forestGain = Math.max(0, state.forestCover - state.originalForest) * 2;
        return Math.round(
            Math.min(100, forestGain + state.forestCover) * 0.30 +
            state.biodiversityIndex * 0.35 +
            state.soilHealth * 0.20 +
            state.carbonSink * 0.15
        );
    }

    isTerminal(state) {
        if (state.forestCover > state.originalForest && state.biodiversityIndex > 70)
            return { done: true, outcome: 'won' };
        if (state.turn >= 25) {
            return { done: true, outcome: this.computeScore(state) >= 55 ? 'won' : 'lost' };
        }
        return { done: false };
    }
}

module.exports = SDG15Engine;
