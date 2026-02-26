/**
 * SDG 8 — Decent Work: Labour Market & Jobs Strategy
 * Manage employment, wages, child labour and economic growth.
 * Win: unemployment < 10 AND childLabourRate < 2 AND complianceScore > 80
 */
class SDG08Engine {
    init(difficulty, seed) {
        const d = difficulty;
        return {
            unemployment: 25 + d * 5,
            wageLevel: 60 - d * 10,
            childLabourRate: 12 + d * 4,
            gdpGrowth: 3 - d * 0.5,
            complianceScore: 35 - d * 5,
            informalSector: 55 + d * 5,
            budget: 100000000,
            jobsCreated: 0,
            turn: 0,
        };
    }

    availableActions(state) {
        const actions = [
            { id: 'raise_min_wage', label: '💰 Raise Minimum Wage', cost: 0, effect: '+12% wage, -0.5% GDP growth' },
            { id: 'factory_inspection', label: '🔍 Factory Inspections', cost: 600_000, effect: '+20 compliance, -4% child labour' },
            { id: 'youth_jobs', label: '🧑‍💼 Youth Jobs Initiative', cost: 1_500_000, effect: '-6% unemployment, +0.3% GDP' },
            { id: 'skills_program', label: '🧑‍🔧 Skills Training', cost: 800_000, effect: '-4% unemploy, -8% informal' },
            { id: 'formalise_sector', label: '🏢 Formalise Businesses', cost: 500_000, effect: '-12% informal, +10 compliance' },
            { id: 'child_labour_ban', label: '🚫 Enforce Child Labour Ban', cost: 400_000, effect: '-6% child labour, +8 compliance' },
            { id: 'startup_grants', label: '🚀 Small Business Grants', cost: 700_000, effect: '-4% unemploy, +GDP growth' },
            { id: 'apprenticeship', label: '🛠️ Apprenticeship Scheme', cost: 350_000, effect: '-3% unemploy, -5% informal' },
        ].filter(a => a.cost <= state.budget);
        if (actions.length === 0) actions.push({ id: 'raise_min_wage', label: '💰 Wage Reform (Free)', cost: 0, effect: '+wage' });
        return actions;
    }

    applyAction(state, action, params = {}) {
        const s = structuredClone(state);
        const cons = [], events = [];

        switch (action) {
            case 'raise_min_wage':
                s.wageLevel = Math.min(100, s.wageLevel + 12);
                s.gdpGrowth = Math.max(-2, s.gdpGrowth - 0.3);
                s.complianceScore = Math.min(100, s.complianceScore + 5);
                cons.push('💰 Minimum wage raised — workers earn more, businesses adjusting.');
                break;
            case 'factory_inspection':
                s.budget -= 600_000;
                s.complianceScore = Math.min(100, s.complianceScore + 20);
                s.childLabourRate = Math.max(0, s.childLabourRate - 4);
                s.wageLevel = Math.min(100, s.wageLevel + 5);
                cons.push('🔍 Inspections issued 200 compliance orders — child labour falling!');
                break;
            case 'youth_jobs':
                s.budget -= 1_500_000;
                s.unemployment = Math.max(0, s.unemployment - 6);
                s.gdpGrowth = Math.min(10, s.gdpGrowth + 0.3);
                s.jobsCreated += 30_000;
                cons.push(`🧑‍💼 ${(s.jobsCreated / 1000).toFixed(0)}K total youth jobs created!`);
                break;
            case 'skills_program':
                s.budget -= 800_000;
                s.unemployment = Math.max(0, s.unemployment - 4);
                s.informalSector = Math.max(0, s.informalSector - 8);
                s.wageLevel = Math.min(100, s.wageLevel + 6);
                cons.push('🧑‍🔧 Certified workers moving from informal to formal jobs!');
                break;
            case 'formalise_sector':
                s.budget -= 500_000;
                s.informalSector = Math.max(0, s.informalSector - 12);
                s.complianceScore = Math.min(100, s.complianceScore + 10);
                s.gdpGrowth = Math.min(10, s.gdpGrowth + 0.4);
                cons.push('🏢 50,000 workers now covered by labour law protections!');
                break;
            case 'child_labour_ban':
                s.budget -= 400_000;
                s.childLabourRate = Math.max(0, s.childLabourRate - 6);
                s.complianceScore = Math.min(100, s.complianceScore + 8);
                cons.push('🚫 Child labour enforcement — thousands of kids back in school!');
                break;
            case 'startup_grants':
                s.budget -= 700_000;
                s.unemployment = Math.max(0, s.unemployment - 4);
                s.gdpGrowth = Math.min(10, s.gdpGrowth + 0.5);
                s.jobsCreated += 15_000;
                cons.push(`🚀 Small business grants spawned 15K new jobs — GDP growing!`);
                break;
            case 'apprenticeship':
                s.budget -= 350_000;
                s.unemployment = Math.max(0, s.unemployment - 3);
                s.informalSector = Math.max(0, s.informalSector - 5);
                cons.push('🛠️ Apprenticeship scheme placed 10K workers in skilled trades!');
                break;
        }

        // Emergency budget
        if (s.budget <= 0) {
            s.budget = 2_000_000;
            events.push('🆘 World Bank emergency economic loan of ₹2M secured!');
        }

        // Random events
        const r = Math.random();
        if (r < 0.12) {
            s.unemployment = Math.min(50, s.unemployment + 4);
            events.push('⚠️ Economic downturn — manufacturing sector shed 4% jobs!');
        } else if (r < 0.22) {
            s.gdpGrowth = Math.min(10, s.gdpGrowth + 0.8);
            events.push('📈 Export boom! GDP growth accelerated +0.8%!');
        } else if (r < 0.30) {
            s.complianceScore = Math.min(100, s.complianceScore + 8);
            events.push('🏆 ILO commendation — compliance score boosted by 8 points!');
        } else if (r < 0.38) {
            s.wageLevel = Math.min(100, s.wageLevel + 5);
            events.push('💼 Collective bargaining deal raised wages industry-wide!');
        }

        s.turn += 1;
        s.budget = (s.budget || 0) + 500000;
        return { newState: s, consequences: cons, events };
    }

    tick(state) {
        const s = structuredClone(state);
        s.unemployment = Math.min(50, s.unemployment + 1);
        s.gdpGrowth = Math.max(-3, s.gdpGrowth - 0.1);
        s.turn += 1;
        s.budget = (s.budget || 0) + 500000;
        return { newState: s, events: ['📉 Labour market: structural unemployment crept up. Intervene!'] };
    }

    computeScore(state) {
        return Math.round(
            Math.max(0, 100 - state.unemployment * 2) * 0.30 +
            state.complianceScore * 0.30 +
            Math.max(0, 100 - state.childLabourRate * 5) * 0.25 +
            Math.max(0, state.wageLevel) * 0.15
        );
    }

    isTerminal(state) {
        if (state.unemployment < 10 && state.childLabourRate < 2 && state.complianceScore > 80)
            return { done: true, outcome: 'won' };
        if (state.turn >= 25) {
            return { done: true, outcome: this.computeScore(state) >= 58 ? 'won' : 'lost' };
        }
        return { done: false };
    }
}

module.exports = SDG08Engine;
