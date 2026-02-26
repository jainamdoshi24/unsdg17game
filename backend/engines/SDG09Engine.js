/**
 * SDG 9 — Industry & Infrastructure: City Infrastructure Planner
 * Build roads, broadband, industry, smart city tech.
 * Win: connectivity > 80 AND broadbandCoverage > 70 (or score>=58 at turn 25)
 */
class SDG09Engine {
    init(difficulty, seed) {
        const d = difficulty;
        return {
            connectivity: 25 - d * 3,
            industrialOutput: 40 - d * 5,
            broadbandCoverage: 20 - d * 3,
            greenInfrastructure: 10,
            budget: 20_000_000,
            constructionQueueCount: 0,
            populationServed: 30 + d * 5,
            projectsCompleted: 0,
            turn: 0,
        };
    }

    availableActions(state) {
        const actions = [
            { id: 'build_roads', label: '🛣️ Build Rural Road Network', cost: 2_000_000, effect: '+15% connectivity' },
            { id: 'lay_fibre', label: '🌐 Lay Fibre Broadband', cost: 3_000_000, effect: '+20% broadband' },
            { id: 'industrial_park', label: '🏭 Industrial Special Zone', cost: 4_000_000, effect: '+15% industrial output' },
            { id: 'upgrade_ports', label: '⚓ Upgrade Seaport/Logistics', cost: 3_500_000, effect: '+12% output, +connectivity' },
            { id: 'smart_city', label: '💡 Smart City Sensors', cost: 2_500_000, effect: '+8% broadband, +12% green' },
            { id: 'public_transport', label: '🚌 Public Transit Lines', cost: 2_800_000, effect: '+12% connectivity' },
            { id: 'green_infra', label: '♻️ Green Infrastructure', cost: 1_500_000, effect: '+18% green infra' },
            { id: 'mobile_towers', label: '📡 Mobile Phone Towers', cost: 1_200_000, effect: '+10% broadband, cheap' },
        ].filter(a => a.cost <= state.budget);
        if (actions.length === 0) actions.push({ id: 'mobile_towers', label: '📡 Mobile Towers (Budget)', cost: 500_000, effect: '+5% broadband' });
        return actions;
    }

    applyAction(state, action, params = {}) {
        const s = structuredClone(state);
        const cons = [], events = [];

        switch (action) {
            case 'build_roads':
                s.budget -= 2_000_000;
                s.connectivity = Math.min(100, s.connectivity + 15);
                s.industrialOutput = Math.min(100, s.industrialOutput + 5);
                s.populationServed = Math.min(100, s.populationServed + 10);
                s.projectsCompleted += 1;
                cons.push(`🛣️ Project #${s.projectsCompleted}: Road network extended — 10% more people connected to markets!`);
                break;
            case 'lay_fibre':
                s.budget -= 3_000_000;
                s.broadbandCoverage = Math.min(100, s.broadbandCoverage + 20);
                s.industrialOutput = Math.min(100, s.industrialOutput + 8);
                s.projectsCompleted += 1;
                cons.push(`🌐 Project #${s.projectsCompleted}: Fibre optic laid — broadband reached 20% more citizens!`);
                break;
            case 'industrial_park':
                s.budget -= 4_000_000;
                s.industrialOutput = Math.min(100, s.industrialOutput + 15);
                s.connectivity = Math.min(100, s.connectivity + 5);
                s.projectsCompleted += 1;
                cons.push(`🏭 Project #${s.projectsCompleted}: Industrial zone live — manufacturing jobs surging!`);
                break;
            case 'upgrade_ports':
                s.budget -= 3_500_000;
                s.industrialOutput = Math.min(100, s.industrialOutput + 12);
                s.connectivity = Math.min(100, s.connectivity + 8);
                cons.push('⚓ Port upgrade complete — export capacity doubled, logistics boom!');
                break;
            case 'smart_city':
                s.budget -= 2_500_000;
                s.broadbandCoverage = Math.min(100, s.broadbandCoverage + 8);
                s.greenInfrastructure = Math.min(100, s.greenInfrastructure + 12);
                s.connectivity = Math.min(100, s.connectivity + 5);
                cons.push('💡 Smart sensors optimising traffic, energy use, and emergency response!');
                break;
            case 'public_transport':
                s.budget -= 2_800_000;
                s.connectivity = Math.min(100, s.connectivity + 12);
                s.populationServed = Math.min(100, s.populationServed + 8);
                cons.push('🚌 Transit lines cut commute times — city mobility transformed!');
                break;
            case 'green_infra':
                s.budget -= 1_500_000;
                s.greenInfrastructure = Math.min(100, s.greenInfrastructure + 18);
                s.connectivity = Math.min(100, s.connectivity + 3);
                cons.push('♻️ Green infrastructure future-proofs city against floods and heat!');
                break;
            case 'mobile_towers':
                s.budget -= 1_200_000;
                s.broadbandCoverage = Math.min(100, s.broadbandCoverage + 10);
                cons.push('📡 Mobile towers raised broadband coverage 10% — cheapest route to connectivity!');
                break;
        }

        // Emergency budget
        if (s.budget <= 0) {
            s.budget = 3_000_000;
            events.push('🆘 World Bank infrastructure emergency grant of ₹3M approved!');
        }

        // Random events
        const r = Math.random();
        if (r < 0.12) {
            s.budget = Math.max(1_000_000, s.budget - 800_000);
            events.push('🌪️ Storm damaged infrastructure — ₹800K emergency repairs!');
        } else if (r < 0.22) {
            s.budget += 2_500_000;
            events.push('🏗️ World Bank infrastructure grant of ₹2.5M approved!');
        } else if (r < 0.30) {
            s.connectivity = Math.min(100, s.connectivity + 5);
            events.push('🤝 Neighboring country shared unused road corridor — connectivity +5%!');
        } else if (r < 0.38) {
            s.broadbandCoverage = Math.min(100, s.broadbandCoverage + 5);
            events.push('📱 Telecom company expanded coverage — broadband +5% at no cost!');
        }

        s.turn += 1;
        return { newState: s, consequences: cons, events };
    }

    tick(state) {
        const s = structuredClone(state);
        s.budget = Math.max(1_000_000, s.budget - 150_000);
        s.turn += 1;
        return { newState: s, events: ['🔧 Infrastructure maintenance costs deducted. Keep building!'] };
    }

    computeScore(state) {
        return Math.round(
            state.connectivity * 0.35 +
            state.broadbandCoverage * 0.30 +
            state.industrialOutput * 0.20 +
            state.greenInfrastructure * 0.15
        );
    }

    isTerminal(state) {
        if (state.connectivity > 80 && state.broadbandCoverage > 70) return { done: true, outcome: 'won' };
        if (state.turn >= 25) {
            return { done: true, outcome: this.computeScore(state) >= 58 ? 'won' : 'lost' };
        }
        return { done: false };
    }
}

module.exports = SDG09Engine;
