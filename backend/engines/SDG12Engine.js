/**
 * SDG 12 — Responsible Consumption: Circular Economy Tracker
 * Resources: wasteGenerated, recyclingRate, carbonFootprint, consumerDemand, profitMargin
 * Win: recyclingRate > 75 AND carbonFootprint < 40 AND profitMargin > 0
 */
class SDG12Engine {
    init(difficulty, seed) {
        const d = difficulty;
        return {
            wasteGenerated: 80 + d * 5,    // tonnes/day index
            recyclingRate: 15 - d * 3,    // %
            carbonFootprint: 75 + d * 5,    // index 0–100 (lower=better)
            consumerDemand: 70,            // 0–100 demand level
            profitMargin: 50 - d * 5,    // business profitability 0–100
            returnsCompliance: 10,          // % products with take-back
            sustainableSupply: 20 - d * 3, // % sustainable sourcing
            budget: 60000000,
            turn: 0,
        };
    }

    availableActions(state) {
        return [
            { id: 'redesign_product', label: 'Product Redesign for Durability', cost: 800_000 },
            { id: 'takeback_scheme', label: 'Launch Product Take-Back Programme', cost: 600_000 },
            { id: 'recycling_infra', label: 'Build Recycling Infrastructure', cost: 1_200_000 },
            { id: 'ecolabel', label: 'Eco-Labelling + Consumer Campaign', cost: 400_000 },
            { id: 'clean_supply', label: 'Shift to Sustainable Supply Chain', cost: 1_000_000 },
            { id: 'repair_cafes', label: 'Fund Community Repair Cafes', cost: 200_000 },
            { id: 'waste_tax', label: 'Introduce Packaging Waste Tax', cost: 0 },
        ].filter(a => a.cost <= state.budget);
    }

    applyAction(state, action, params = {}) {
        const s = structuredClone(state);
        const cons = [], events = [];

        switch (action) {
            case 'redesign_product':
                s.budget -= 800_000;
                s.wasteGenerated = Math.max(0, s.wasteGenerated - 10);
                s.carbonFootprint = Math.max(0, s.carbonFootprint - 8);
                s.profitMargin = Math.max(0, s.profitMargin - 3); // R&D cost hit
                cons.push('Product redesigned for longevity — waste and carbon both reduced.');
                break;
            case 'takeback_scheme':
                s.budget -= 600_000;
                s.returnsCompliance = Math.min(100, s.returnsCompliance + 20);
                s.recyclingRate = Math.min(100, s.recyclingRate + 12);
                s.wasteGenerated = Math.max(0, s.wasteGenerated - 8);
                cons.push('Take-back scheme launched — 20% more products returned for recycling or refurbishment.');
                break;
            case 'recycling_infra':
                s.budget -= 1_200_000;
                s.recyclingRate = Math.min(100, s.recyclingRate + 20);
                s.wasteGenerated = Math.max(0, s.wasteGenerated - 12);
                cons.push('Recycling plant built — 20% more waste diverted from landfill.');
                break;
            case 'ecolabel':
                s.budget -= 400_000;
                s.sustainableSupply = Math.min(100, s.sustainableSupply + 8);
                s.consumerDemand = Math.min(100, s.consumerDemand - 5); // demand shifts to eco choices
                s.carbonFootprint = Math.max(0, s.carbonFootprint - 5);
                cons.push('Eco-labels shifted consumer preferences — sustainable product sales grew.');
                break;
            case 'clean_supply':
                s.budget -= 1_000_000;
                s.sustainableSupply = Math.min(100, s.sustainableSupply + 15);
                s.carbonFootprint = Math.max(0, s.carbonFootprint - 12);
                s.profitMargin = Math.max(0, s.profitMargin - 5); // transition costs
                cons.push('Supply chain decarbonised — carbon footprint dropped 12 points.');
                break;
            case 'repair_cafes':
                s.budget -= 200_000;
                s.wasteGenerated = Math.max(0, s.wasteGenerated - 5);
                s.recyclingRate = Math.min(100, s.recyclingRate + 5);
                cons.push('Community repair cafes extended product lifetimes — less landfill waste.');
                break;
            case 'waste_tax':
                s.wasteGenerated = Math.max(0, s.wasteGenerated - 8);
                s.recyclingRate = Math.min(100, s.recyclingRate + 8);
                s.profitMargin = Math.max(0, s.profitMargin - 4);
                s.budget += 500_000;
                cons.push('Packaging tax raised ₹500K and reduced throwaway product output.');
                break;
        }

        const r = Math.random();
        if (r < 0.12) {
            s.wasteGenerated = Math.min(100, s.wasteGenerated + 10);
            events.push('📦 Holiday season surge — consumer waste spiked by 10 tonnes/day!');
        } else if (r < 0.22) {
            s.budget += 600_000;
            events.push('🌿 Green business award — corporate sponsor donated ₹600K to circular programme.');
        } else if (r < 0.30) {
            s.recyclingRate = Math.min(100, s.recyclingRate + 5);
            events.push('♻️ National recycling mandate — recycling rate jumped 5% industry-wide!');
        }

        // Emergency budget
        if (s.budget <= 0) {
            s.budget = 1_200_000;
            events.push('🆘 Circular Economy Fund emergency grant of ₹1.2M received!');
        }

        s.turn += 1;
        s.budget = (s.budget || 0) + 500000;
        return { newState: s, consequences: cons, events };
    }

    tick(state) {
        const s = structuredClone(state);
        s.wasteGenerated = Math.min(100, s.wasteGenerated + 2);
        s.carbonFootprint = Math.min(100, s.carbonFootprint + 1);
        s.turn += 1;
        s.budget = (s.budget || 0) + 500000;
        return { newState: s, events: ['🗑️ Consumption continued — waste and emissions crept upward.'] };
    }

    computeScore(state) {
        return Math.round(
            state.recyclingRate * 0.35 +
            Math.max(0, 100 - state.carbonFootprint) * 0.30 +
            Math.max(0, state.profitMargin) * 0.20 +
            state.sustainableSupply * 0.15
        );
    }

    isTerminal(state) {
        if (state.recyclingRate > 75 && state.carbonFootprint < 40 && state.profitMargin > 0)
            return { done: true, outcome: 'won' };
        if (state.turn >= 25) {
            return { done: true, outcome: this.computeScore(state) >= 55 ? 'won' : 'lost' };
        }
        return { done: false };
    }
}

module.exports = SDG12Engine;
