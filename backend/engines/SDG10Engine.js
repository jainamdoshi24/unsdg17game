/**
 * SDG 10 — Reduced Inequalities: Wealth Distribution Engine
 * Resources: giniCoefficient, taxRevenue, investorConfidence, publicApproval, povertyRate
 * Win: giniCoefficient < 0.35 AND povertyRate < 15 AND investorConfidence > 50
 */
class SDG10Engine {
    init(difficulty, seed) {
        const d = difficulty;
        return {
            giniCoefficient: 0.52 + d * 0.05,
            taxRevenue: 100,   // index
            investorConfidence: 70 - d * 10,
            publicApproval: 50,
            povertyRate: 30 + d * 5,
            wealthTop10Share: 50 + d * 5,  // % income held by top 10%
            socialSpending: 20 - d * 3,  // % of GDP
            budget: 10_000_000,
            turn: 0,
        };
    }

    availableActions(state) {
        return [
            { id: 'progressive_tax', label: 'Increase Progressive Tax Rate', cost: 0 },
            { id: 'wealth_tax', label: 'Introduce Wealth Tax on Top 1%', cost: 0 },
            { id: 'social_transfer', label: 'Universal Basic Income Pilot', cost: 3_000_000 },
            { id: 'healthcare_free', label: 'Universal Healthcare Access', cost: 2_500_000 },
            { id: 'housing_subsidy', label: 'Subsidised Social Housing Build', cost: 2_000_000 },
            { id: 'trade_deal', label: 'Negotiate Equitable Trade Deal', cost: 500_000 },
            { id: 'capital_gains', label: 'Reform Capital Gains Tax', cost: 0 },
        ].filter(a => a.cost <= state.budget);
    }

    applyAction(state, action, params = {}) {
        const s = structuredClone(state);
        const cons = [], events = [];

        switch (action) {
            case 'progressive_tax':
                s.taxRevenue = Math.min(150, s.taxRevenue + 15);
                s.giniCoefficient = Math.max(0.2, s.giniCoefficient - 0.03);
                s.investorConfidence = Math.max(0, s.investorConfidence - 8);
                s.budget += 1_000_000;
                cons.push('Progressive tax raised revenue by 15 index points — but investor confidence fell 8%.');
                break;
            case 'wealth_tax':
                s.taxRevenue = Math.min(150, s.taxRevenue + 20);
                s.giniCoefficient = Math.max(0.2, s.giniCoefficient - 0.05);
                s.wealthTop10Share = Math.max(30, s.wealthTop10Share - 5);
                s.investorConfidence = Math.max(0, s.investorConfidence - 12);
                s.budget += 2_000_000;
                cons.push('Wealth tax on top 1% generated ₹2M and significantly narrowed inequality.');
                break;
            case 'social_transfer':
                s.budget -= 3_000_000;
                s.povertyRate = Math.max(0, s.povertyRate - 8);
                s.publicApproval = Math.min(100, s.publicApproval + 12);
                s.giniCoefficient = Math.max(0.2, s.giniCoefficient - 0.02);
                cons.push('UBI pilot cut poverty by 8% and earned broad public support.');
                break;
            case 'healthcare_free':
                s.budget -= 2_500_000;
                s.povertyRate = Math.max(0, s.povertyRate - 5);
                s.publicApproval = Math.min(100, s.publicApproval + 10);
                s.giniCoefficient = Math.max(0.2, s.giniCoefficient - 0.015);
                cons.push('Universal healthcare reduced health-related poverty and improved equality.');
                break;
            case 'housing_subsidy':
                s.budget -= 2_000_000;
                s.povertyRate = Math.max(0, s.povertyRate - 4);
                s.giniCoefficient = Math.max(0.2, s.giniCoefficient - 0.01);
                cons.push('Social housing reduced housing costs for lowest-income quartile.');
                break;
            case 'trade_deal':
                s.budget -= 500_000;
                s.investorConfidence = Math.min(100, s.investorConfidence + 10);
                s.taxRevenue = Math.min(150, s.taxRevenue + 8);
                cons.push('Equitable trade deal boosted investor confidence and expanded tax base.');
                break;
            case 'capital_gains':
                s.taxRevenue = Math.min(150, s.taxRevenue + 12);
                s.giniCoefficient = Math.max(0.2, s.giniCoefficient - 0.025);
                s.wealthTop10Share = Math.max(30, s.wealthTop10Share - 3);
                s.investorConfidence = Math.max(0, s.investorConfidence - 5);
                s.budget += 800_000;
                cons.push('Capital gains reform taxed passive wealth — inequality narrowed modestly.');
                break;
        }

        const r = Math.random();
        if (r < 0.12) {
            s.investorConfidence = Math.max(0, s.investorConfidence - 15);
            events.push('📉 Capital flight warning — investor confidence dropped sharply!');
        } else if (r < 0.22) {
            s.publicApproval = Math.min(100, s.publicApproval + 8);
            events.push('📰 Inequality report by think tank boosted public support for redistribution.');
        } else if (r < 0.30) {
            s.giniCoefficient = Math.max(0.2, s.giniCoefficient - 0.02);
            events.push('🌍 IMF report praised redistribution policies — Gini improved 0.02!');
        }

        // Emergency budget
        if (s.budget <= 0) {
            s.budget = 2_000_000;
            events.push('🆘 Emergency World Bank grant of ₹2M unlocked for social programs!');
        }

        s.turn += 1;
        return { newState: s, consequences: cons, events };
    }

    tick(state) {
        const s = structuredClone(state);
        s.giniCoefficient = Math.min(0.75, s.giniCoefficient + 0.01); // natural drift upward
        s.povertyRate = Math.min(60, s.povertyRate + 1);
        s.turn += 1;
        return { newState: s, events: ['📊 Without policy action — inequality and poverty both increased.'] };
    }

    computeScore(state) {
        return Math.round(
            Math.max(0, (0.6 - state.giniCoefficient) * 200) * 0.35 +
            Math.max(0, 100 - state.povertyRate) * 0.30 +
            state.investorConfidence * 0.20 +
            state.publicApproval * 0.15
        );
    }

    isTerminal(state) {
        if (state.giniCoefficient < 0.35 && state.povertyRate < 15 && state.investorConfidence > 50)
            return { done: true, outcome: 'won' };
        if (state.turn >= 25) {
            return { done: true, outcome: this.computeScore(state) >= 55 ? 'won' : 'lost' };
        }
        return { done: false };
    }
}

module.exports = SDG10Engine;
