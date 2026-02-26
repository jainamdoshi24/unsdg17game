/**
 * SDG 7 — Affordable Energy: National Energy Grid Investment Balancer
 * Resources: gridCapacity, renewableShare, emissionRate, blackoutRisk, costPerKwh, budget
 * Win: renewableShare > 60 AND emissionRate < 40 AND blackoutRisk < 15
 */
class SDG07Engine {
    init(difficulty, seed) {
        const d = difficulty;
        return {
            gridCapacity: 50 + d * 5,   // GW total
            renewableShare: 15 - d * 3,   // % of grid
            emissionRate: 70 + d * 5,   // CO2 intensity index
            blackoutRisk: 40 + d * 10,  // % chance of rolling blackout
            coalPlants: 8 - d,        // number active
            solarFarms: 2,
            windFarms: 1,
            costPerKwh: 0.12 + d * 0.02, // currency unit
            budget: 200000000,
            population: 5_000_000,
            turn: 0,
        };
    }

    availableActions(state) {
        return [
            { id: 'build_solar', label: 'Build Solar Farm (+5GW)', cost: 3_000_000 },
            { id: 'build_wind', label: 'Build Wind Farm (+3GW)', cost: 2_500_000 },
            { id: 'build_storage', label: 'Install Battery Storage', cost: 4_000_000 },
            { id: 'close_coal', label: 'Decommission Coal Plant', cost: 1_000_000 },
            { id: 'smart_grid', label: 'Deploy Smart Grid Technology', cost: 2_000_000 },
            { id: 'demand_management', label: 'Launch Demand Response Scheme', cost: 500_000 },
            { id: 'grid_interconnect', label: 'Connect Regional Grid Lines', cost: 1_500_000 },
        ].filter(a => a.cost <= state.budget);
    }

    applyAction(state, action, params = {}) {
        const s = structuredClone(state);
        const cons = [], events = [];

        switch (action) {
            case 'build_solar':
                s.budget -= 3_000_000;
                s.solarFarms += 1;
                s.gridCapacity = Math.min(200, s.gridCapacity + 5);
                s.renewableShare = Math.min(100, s.renewableShare + 8);
                s.emissionRate = Math.max(0, s.emissionRate - 5);
                s.blackoutRisk = Math.max(0, s.blackoutRisk - 5);
                cons.push('Solar farm online — renewable share grew by 8%, emissions fell by 5 index points.');
                break;
            case 'build_wind':
                s.budget -= 2_500_000;
                s.windFarms += 1;
                s.gridCapacity = Math.min(200, s.gridCapacity + 3);
                s.renewableShare = Math.min(100, s.renewableShare + 5);
                s.emissionRate = Math.max(0, s.emissionRate - 3);
                cons.push('Wind farm operational — consistent night-time generation added.');
                break;
            case 'build_storage':
                s.budget -= 4_000_000;
                s.blackoutRisk = Math.max(0, s.blackoutRisk - 18);
                cons.push('Battery storage eliminates intermittency — blackout risk sharply reduced.');
                break;
            case 'close_coal':
                if (s.coalPlants > 0) {
                    s.budget -= 1_000_000;
                    s.coalPlants -= 1;
                    s.emissionRate = Math.max(0, s.emissionRate - 10);
                    s.blackoutRisk = Math.min(100, s.blackoutRisk + 8); // risk if not replaced
                    cons.push('Coal plant decommissioned — emissions dropped 10 points, but grid reliability temporarily reduced.');
                }
                break;
            case 'smart_grid':
                s.budget -= 2_000_000;
                s.blackoutRisk = Math.max(0, s.blackoutRisk - 12);
                s.costPerKwh = Math.max(0.05, s.costPerKwh - 0.015);
                cons.push('Smart grid reduces transmission loss — cheaper, more reliable power supply.');
                break;
            case 'demand_management':
                s.budget -= 500_000;
                s.blackoutRisk = Math.max(0, s.blackoutRisk - 6);
                s.emissionRate = Math.max(0, s.emissionRate - 2);
                cons.push('Demand response reduced peak-hour load — fewer blackouts and lower emissions.');
                break;
            case 'grid_interconnect':
                s.budget -= 1_500_000;
                s.gridCapacity = Math.min(200, s.gridCapacity + 8);
                s.blackoutRisk = Math.max(0, s.blackoutRisk - 8);
                cons.push('Regional grid interconnection increases resilience — power can be shared between zones.');
                break;
        }

        const r = Math.random();
        if (r < 0.12) {
            s.blackoutRisk = Math.min(100, s.blackoutRisk + 15);
            events.push('⛈️ Major storm damaged grid infrastructure — blackout risk spiked!');
        } else if (r < 0.22) {
            s.budget += 2_000_000;
            events.push('💚 Green energy subsidy received — ₹2M added to budget.');
        } else if (r < 0.30) {
            s.renewableShare = Math.min(100, s.renewableShare + 5);
            events.push('☀️ Solar panel price crash — installed 5% more renewable capacity for free!');
        }

        // Emergency budget
        if (s.budget <= 0) {
            s.budget = 5_000_000;
            events.push('🆘 International Energy Agency emergency fund of ₹5M disbursed!');
        }

        s.turn += 1;
        s.budget = (s.budget || 0) + 500000;
        return { newState: s, consequences: cons, events };
    }

    tick(state) {
        const s = structuredClone(state);
        // Growing demand without investment increases blackout risk
        s.blackoutRisk = Math.min(100, s.blackoutRisk + 2);
        s.budget = Math.max(1_000_000, s.budget - 300_000); // grid maintenance
        s.turn += 1;
        s.budget = (s.budget || 0) + 500000;
        return { newState: s, events: ['⚡ Energy demand grew — grid pressure increased.'] };
    }

    computeScore(state) {
        return Math.round(
            state.renewableShare * 0.35 +
            Math.max(0, 100 - state.emissionRate) * 0.30 +
            Math.max(0, 100 - state.blackoutRisk) * 0.25 +
            Math.max(0, (0.20 - state.costPerKwh) * 500) * 0.10
        );
    }

    isTerminal(state) {
        if (state.renewableShare > 60 && state.emissionRate < 40 && state.blackoutRisk < 15)
            return { done: true, outcome: 'won' };
        if (state.turn >= 25) {
            return { done: true, outcome: this.computeScore(state) >= 55 ? 'won' : 'lost' };
        }
        return { done: false };
    }
}

module.exports = SDG07Engine;
