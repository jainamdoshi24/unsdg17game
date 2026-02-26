/**
 * SDG 16 — Peace & Justice: Governance & Anti-Corruption Strategy
 * Build institutions, fight corruption, earn citizen trust.
 * Win: corruptionIndex < 3.0 AND citizenTrust > 65 (or score>=55 at turn 25)
 */
class SDG16Engine {
    init(difficulty, seed) {
        const d = difficulty;
        return {
            corruptionIndex: 7.5 + d * 0.5,
            citizenTrust: 30 - d * 5,
            justiceCapacity: 25 - d * 3,
            pressureFreedom: 40 - d * 8,
            ruleOfLaw: 35 - d * 5,
            impunityRate: 70 + d * 5,
            officialsJailed: 0,
            budget: 120000000,
            turn: 0,
        };
    }

    availableActions(state) {
        const actions = [
            { id: 'reform_judiciary', label: '⚖️ Reform Independent Judiciary', cost: 1_500_000, effect: '+justice capacity, -impunity' },
            { id: 'transparency_law', label: '📋 Freedom of Information Law', cost: 0, effect: '-corruption, +trust, free' },
            { id: 'whistleblower', label: '📣 Whistleblower Protection', cost: 400_000, effect: '-corruption, +press freedom' },
            { id: 'anti_corrupt_unit', label: '🕵️ Anti-Corruption Taskforce', cost: 800_000, effect: '-1.0 corruption, -20 impunity' },
            { id: 'press_freedom', label: '📰 Protect Press Freedom', cost: 300_000, effect: '+press freedom, -corruption' },
            { id: 'civic_education', label: '🏛️ Citizens Rights Campaign', cost: 500_000, effect: '+12 trust, +rule of law' },
            { id: 'e_governance', label: '💻 Digital Public Services', cost: 1_200_000, effect: '-corruption, +trust, +rule of law' },
            { id: 'open_audit', label: '🔍 Publish Government Audit', cost: 200_000, effect: '+trust, -impunity' },
        ].filter(a => a.cost <= state.budget);
        if (actions.length === 0) actions.push({ id: 'transparency_law', label: '📋 FOI Law (Free)', cost: 0, effect: '-corruption' });
        return actions;
    }

    applyAction(state, action, params = {}) {
        const s = structuredClone(state);
        const cons = [], events = [];

        switch (action) {
            case 'reform_judiciary':
                s.budget -= 1_500_000;
                s.justiceCapacity = Math.min(100, s.justiceCapacity + 20);
                s.impunityRate = Math.max(0, s.impunityRate - 15);
                s.ruleOfLaw = Math.min(100, s.ruleOfLaw + 10);
                cons.push('⚖️ Independent judiciary strengthened — prosecution rate up, impunity fell 15%!');
                break;
            case 'transparency_law':
                s.pressureFreedom = Math.min(100, s.pressureFreedom + 15);
                s.corruptionIndex = Math.max(0, s.corruptionIndex - 0.5);
                s.citizenTrust = Math.min(100, s.citizenTrust + 8);
                s.ruleOfLaw = Math.min(100, s.ruleOfLaw + 5);
                cons.push('📋 FOI law enacted — citizens can now audit every government contract!');
                break;
            case 'whistleblower':
                s.budget -= 400_000;
                s.corruptionIndex = Math.max(0, s.corruptionIndex - 0.6);
                s.pressureFreedom = Math.min(100, s.pressureFreedom + 8);
                s.impunityRate = Math.max(0, s.impunityRate - 8);
                cons.push('📣 Whistleblower hotline launched — 3 major corruption cases opened!');
                break;
            case 'anti_corrupt_unit':
                s.budget -= 800_000;
                s.corruptionIndex = Math.max(0, s.corruptionIndex - 1.0);
                s.impunityRate = Math.max(0, s.impunityRate - 20);
                s.citizenTrust = Math.min(100, s.citizenTrust + 10);
                s.officialsJailed += 12;
                cons.push(`🕵️ ${s.officialsJailed} corrupt officials prosecuted — corruption index dropped 1.0!`);
                break;
            case 'press_freedom':
                s.budget -= 300_000;
                s.pressureFreedom = Math.min(100, s.pressureFreedom + 18);
                s.corruptionIndex = Math.max(0, s.corruptionIndex - 0.3);
                s.citizenTrust = Math.min(100, s.citizenTrust + 5);
                cons.push('📰 Free press restored — investigative journalism exposing corruption daily!');
                break;
            case 'civic_education':
                s.budget -= 500_000;
                s.citizenTrust = Math.min(100, s.citizenTrust + 12);
                s.ruleOfLaw = Math.min(100, s.ruleOfLaw + 5);
                cons.push('🏛️ Citizens know their rights — demand for accountability at record levels!');
                break;
            case 'e_governance':
                s.budget -= 1_200_000;
                s.corruptionIndex = Math.max(0, s.corruptionIndex - 0.7);
                s.citizenTrust = Math.min(100, s.citizenTrust + 8);
                s.ruleOfLaw = Math.min(100, s.ruleOfLaw + 8);
                cons.push('💻 Digital services at 95% uptime — bribery opportunities eliminated!');
                break;
            case 'open_audit':
                s.budget -= 200_000;
                s.citizenTrust = Math.min(100, s.citizenTrust + 10);
                s.impunityRate = Math.max(0, s.impunityRate - 10);
                cons.push('🔍 Full government audit published — transparency is winning public trust!');
                break;
        }

        // Emergency budget
        if (s.budget <= 0) {
            s.budget = 2_000_000;
            events.push('🆘 Anti-Corruption coalition donor emergency grant of ₹2M received!');
        }

        // Random events
        const r = Math.random();
        if (r < 0.12) {
            s.corruptionIndex = Math.min(10, s.corruptionIndex + 0.4);
            events.push('⚠️ Political scandal breaks — corruption perception crept up 0.4!');
        } else if (r < 0.22) {
            s.citizenTrust = Math.min(100, s.citizenTrust + 8);
            events.push('📣 Mass civil society protest forced faster reform — trust up 8%!');
        } else if (r < 0.30) {
            s.impunityRate = Math.max(0, s.impunityRate - 10);
            events.push('🏆 International court ruling sets precedent — impunity rate drops 10!');
        } else if (r < 0.38) {
            s.budget += 1_000_000;
            events.push('💰 Rule of Law fund disbursed ₹1M for institutional reforms!');
        }

        s.turn += 1;
        s.budget = (s.budget || 0) + 500000;
        return { newState: s, consequences: cons, events };
    }

    tick(state) {
        const s = structuredClone(state);
        s.corruptionIndex = Math.min(10, s.corruptionIndex + 0.15);
        s.citizenTrust = Math.max(5, s.citizenTrust - 1);
        s.turn += 1;
        s.budget = (s.budget || 0) + 500000;
        return { newState: s, events: ['🏛️ Without reform, corruption deepens and trust erodes.'] };
    }

    computeScore(state) {
        return Math.round(
            Math.max(0, (10 - state.corruptionIndex) * 10) * 0.35 +
            state.citizenTrust * 0.30 +
            state.ruleOfLaw * 0.20 +
            state.pressureFreedom * 0.15
        );
    }

    isTerminal(state) {
        if (state.corruptionIndex < 3.0 && state.citizenTrust > 65) return { done: true, outcome: 'won' };
        if (state.turn >= 25) {
            return { done: true, outcome: this.computeScore(state) >= 55 ? 'won' : 'lost' };
        }
        return { done: false };
    }
}

module.exports = SDG16Engine;
