/**
 * SDG 5 — Gender Equality: Policy Reform & Social Change Strategy
 * Push through legislation, run campaigns, grow female workforce participation.
 * Win: genderEquityIndex > 75 without political collapse (or score>=58 at turn 25)
 */
class SDG05Engine {
    init(difficulty, seed) {
        const d = difficulty;
        return {
            genderEquityIndex: 30 - d * 5,
            politicalCapital: 80 - d * 10,
            publicApproval: 55 - d * 8,
            workforceParticipation: 40 - d * 5,
            mediaFreedom: 50,
            corporateCompliance: 30,
            lawsPassed: 0,
            budget: 4_000_000,
            turn: 0,
        };
    }

    availableActions(state) {
        const actions = [
            { id: 'pass_equal_pay_law', label: '⚖️ Pass Equal Pay Law', cost: 0, pcCost: 15 },
            { id: 'fund_womens_shelter', label: '🏠 Fund Safety Shelters', cost: 400_000, pcCost: 5 },
            { id: 'corporate_mandate', label: '💼 Board Gender Quotas', cost: 0, pcCost: 20 },
            { id: 'media_campaign', label: '📺 Awareness Campaign', cost: 300_000, pcCost: 0 },
            { id: 'education_girls', label: '📚 Girls Education Subsidy', cost: 500_000, pcCost: 5 },
            { id: 'lobby_parliament', label: '🗣️ Lobby Parliament', cost: 200_000, pcCost: 5 },
            { id: 'childcare_policy', label: '👶 Affordable Childcare Policy', cost: 600_000, pcCost: 10 },
            { id: 'run_media_blitz', label: '📰 Media Blitz (+approval)', cost: 150_000, pcCost: 0 },
        ].filter(a => a.cost <= state.budget && a.pcCost <= state.politicalCapital);
        // Always ensure at least one action available
        if (actions.length === 0) actions.push({ id: 'run_media_blitz', label: '📰 Media Blitz (Free)', cost: 0, pcCost: 0 });
        return actions;
    }

    applyAction(state, action, params = {}) {
        const s = structuredClone(state);
        const cons = [], events = [];

        switch (action) {
            case 'pass_equal_pay_law':
                s.politicalCapital -= 15;
                s.genderEquityIndex = Math.min(100, s.genderEquityIndex + 12);
                s.workforceParticipation = Math.min(100, s.workforceParticipation + 5);
                s.corporateCompliance = Math.min(100, s.corporateCompliance + 15);
                s.lawsPassed += 1;
                cons.push(`⚖️ Equal pay law #${s.lawsPassed} passed! Wage gap narrowing.`);
                break;
            case 'fund_womens_shelter':
                s.budget -= 400_000;
                s.politicalCapital -= 5;
                s.genderEquityIndex = Math.min(100, s.genderEquityIndex + 5);
                s.publicApproval = Math.min(100, s.publicApproval + 8);
                cons.push('🏠 Safety shelters funded — women protected, public approval surging!');
                break;
            case 'corporate_mandate':
                s.politicalCapital -= 20;
                s.corporateCompliance = Math.min(100, s.corporateCompliance + 20);
                s.genderEquityIndex = Math.min(100, s.genderEquityIndex + 8);
                s.workforceParticipation = Math.min(100, s.workforceParticipation + 6);
                cons.push('💼 Board quotas mandated — corporate leadership becoming more diverse!');
                break;
            case 'media_campaign':
                s.budget -= 300_000;
                s.publicApproval = Math.min(100, s.publicApproval + 12);
                s.politicalCapital = Math.min(100, s.politicalCapital + 8);
                s.genderEquityIndex = Math.min(100, s.genderEquityIndex + 3);
                s.mediaFreedom = Math.min(100, s.mediaFreedom + 10);
                cons.push('📺 Campaign went viral — approval +12%, political capital gained!');
                break;
            case 'education_girls':
                s.budget -= 500_000;
                s.politicalCapital -= 5;
                s.genderEquityIndex = Math.min(100, s.genderEquityIndex + 10);
                s.workforceParticipation = Math.min(100, s.workforceParticipation + 8);
                cons.push('📚 Girls education subsidies will reshape the workforce in 10 years!');
                break;
            case 'lobby_parliament':
                s.budget -= 200_000;
                s.politicalCapital = Math.min(100, s.politicalCapital + 18);
                cons.push('🗣️ Parliament lobbied — political capital built for bigger reforms!');
                break;
            case 'childcare_policy':
                s.budget -= 600_000;
                s.politicalCapital -= 10;
                s.workforceParticipation = Math.min(100, s.workforceParticipation + 10);
                s.genderEquityIndex = Math.min(100, s.genderEquityIndex + 7);
                s.publicApproval = Math.min(100, s.publicApproval + 10);
                cons.push('👶 Affordable childcare enables more women to enter the workforce!');
                break;
            case 'run_media_blitz':
                s.budget -= 150_000;
                s.publicApproval = Math.min(100, s.publicApproval + 8);
                s.politicalCapital = Math.min(100, s.politicalCapital + 5);
                cons.push('📰 Media blitz — public approval up, political ground gained!');
                break;
        }

        // Emergency political recovery
        if (s.politicalCapital <= 10) {
            s.politicalCapital = 20;
            events.push('🆘 Coalition ally stepped in — political capital stabilised!');
        }
        if (s.budget <= 0) {
            s.budget = 800_000;
            events.push('💵 International grant of ₹800K received for gender programs!');
        }

        // Random events
        const r = Math.random();
        if (r < 0.12) {
            s.politicalCapital = Math.max(10, s.politicalCapital - 8);
            events.push('⚠️ Conservative bloc backlash — lost 8 political capital!');
        } else if (r < 0.22) {
            s.publicApproval = Math.min(100, s.publicApproval + 10);
            events.push('📰 Viral gender equality story boosted public support +10%!');
        } else if (r < 0.30) {
            s.genderEquityIndex = Math.min(100, s.genderEquityIndex + 5);
            events.push('🌍 UN Gender Equality Award — international recognition boosts momentum!');
        }

        s.turn += 1;
        return { newState: s, consequences: cons, events };
    }

    tick(state) {
        const s = structuredClone(state);
        s.genderEquityIndex = Math.max(0, s.genderEquityIndex - 1);
        s.publicApproval = Math.max(0, s.publicApproval - 1);
        s.turn += 1;
        return { newState: s, events: ['📉 Without new policy, gender equity regresses. Keep pushing!'] };
    }

    computeScore(state) {
        return Math.round(
            state.genderEquityIndex * 0.45 +
            state.workforceParticipation * 0.30 +
            state.publicApproval * 0.15 +
            state.corporateCompliance * 0.10
        );
    }

    isTerminal(state) {
        if (state.genderEquityIndex > 75) return { done: true, outcome: 'won' };
        if (state.turn >= 25) {
            return { done: true, outcome: this.computeScore(state) >= 58 ? 'won' : 'lost' };
        }
        return { done: false };
    }
}

module.exports = SDG05Engine;
