/**
 * SDG 11 — Sustainable Cities: Urban Resilience Planner
 * Resources: floodRisk, airQuality, transitCoverage, greenSpaceRatio, urbanSprawl
 * Win: floodRisk < 20 AND airQuality > 70 AND transitCoverage > 65
 */
class SDG11Engine {
    init(difficulty, seed) {
        const d = difficulty;
        return {
            floodRisk: 55 + d * 10,  // 0–100 (lower=better)
            airQuality: 35 - d * 5,   // 0–100 (higher=better)
            transitCoverage: 25 - d * 3,   // % area covered by public transit
            greenSpaceRatio: 8 - d * 2,    // % city area as parks/green
            urbanSprawl: 60 + d * 10,  // urban sprawl index (lower=better)
            population: 2_000_000,
            budget: 12_000_000,
            turn: 0,
        };
    }

    availableActions(state) {
        return [
            { id: 'build_transit', label: 'Build Transit Network Expansion', cost: 3_000_000 },
            { id: 'plant_trees', label: 'Urban Greening Programme', cost: 800_000 },
            { id: 'flood_barriers', label: 'Install Flood Defence Barriers', cost: 2_500_000 },
            { id: 'mixed_zoning', label: 'Implement Mixed-Use Zoning', cost: 500_000 },
            { id: 'ev_transition', label: 'Subsidise EV Transition', cost: 1_500_000 },
            { id: 'air_monitors', label: 'Deploy Air Quality Monitors + Bans', cost: 600_000 },
            { id: 'stormwater_mgmt', label: 'Build Stormwater Retention Basins', cost: 1_800_000 },
        ].filter(a => a.cost <= state.budget);
    }

    applyAction(state, action, params = {}) {
        const s = structuredClone(state);
        const cons = [], events = [];

        switch (action) {
            case 'build_transit':
                s.budget -= 3_000_000;
                s.transitCoverage = Math.min(100, s.transitCoverage + 18);
                s.airQuality = Math.min(100, s.airQuality + 6);
                s.urbanSprawl = Math.max(0, s.urbanSprawl - 8);
                cons.push('Transit network expanded — 18% more area served, car use dropped, air improved.');
                break;
            case 'plant_trees':
                s.budget -= 800_000;
                s.greenSpaceRatio = Math.min(40, s.greenSpaceRatio + 4);
                s.airQuality = Math.min(100, s.airQuality + 5);
                s.floodRisk = Math.max(0, s.floodRisk - 5);
                cons.push('Urban greening added parks — air quality and flood absorption improved.');
                break;
            case 'flood_barriers':
                s.budget -= 2_500_000;
                s.floodRisk = Math.max(0, s.floodRisk - 20);
                cons.push('Flood barriers engineered — coastal and riverine flood risk sharply reduced.');
                break;
            case 'mixed_zoning':
                s.budget -= 500_000;
                s.urbanSprawl = Math.max(0, s.urbanSprawl - 12);
                s.transitCoverage = Math.min(100, s.transitCoverage + 5);
                cons.push('Mixed-use zoning reduced driving needs — walkable neighbourhoods created.');
                break;
            case 'ev_transition':
                s.budget -= 1_500_000;
                s.airQuality = Math.min(100, s.airQuality + 10);
                cons.push('EV subsidies cut tailpipe emissions — air quality index up by 10 points.');
                break;
            case 'air_monitors':
                s.budget -= 600_000;
                s.airQuality = Math.min(100, s.airQuality + 8);
                cons.push('Monitors identified pollution sources — enforcement cut factory emissions.');
                break;
            case 'stormwater_mgmt':
                s.budget -= 1_800_000;
                s.floodRisk = Math.max(0, s.floodRisk - 15);
                s.greenSpaceRatio = Math.min(40, s.greenSpaceRatio + 3);
                cons.push('Retention basins absorbed storm surges — flooding events reduced by 50%.');
                break;
        }

        const r = Math.random();
        if (r < 0.15) {
            s.floodRisk = Math.min(100, s.floodRisk + 20);
            events.push('🌊 Extreme rainfall event — flash flooding hit residential zones!');
        } else if (r < 0.25) {
            s.airQuality = Math.max(5, s.airQuality - 8);
            events.push('🏭 Industrial accident released toxic smog — emergency air quality response needed!');
        } else if (r < 0.35) {
            s.budget += 1_500_000;
            events.push('🏙️ City resilience grant of ₹1.5M received from national government!');
        }

        // Emergency budget
        if (s.budget <= 0) {
            s.budget = 2_500_000;
            events.push('🆘 Emergency urban development fund of ₹2.5M disbursed!');
        }

        s.turn += 1;
        return { newState: s, consequences: cons, events };
    }

    tick(state) {
        const s = structuredClone(state);
        s.airQuality = Math.max(0, s.airQuality - 2);     // ongoing vehicle emissions
        s.urbanSprawl = Math.min(100, s.urbanSprawl + 2); // unchecked development
        s.turn += 1;
        return { newState: s, events: ['🌫️ Urban sprawl and traffic continued degrading air quality.'] };
    }

    computeScore(state) {
        return Math.round(
            Math.max(0, 100 - state.floodRisk) * 0.30 +
            state.airQuality * 0.30 +
            state.transitCoverage * 0.25 +
            state.greenSpaceRatio * 2.5 * 0.15
        );
    }

    isTerminal(state) {
        if (state.floodRisk < 20 && state.airQuality > 70 && state.transitCoverage > 65)
            return { done: true, outcome: 'won' };
        if (state.turn >= 25) {
            return { done: true, outcome: this.computeScore(state) >= 58 ? 'won' : 'lost' };
        }
        return { done: false };
    }
}

module.exports = SDG11Engine;
