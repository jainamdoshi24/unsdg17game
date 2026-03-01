/**
 * SDG 14 — Life Below Water: Ocean Fisheries & Ecosystem Manager
 * Resources: fishStockHealth, quotaCompliance, coralCoverage, plasticLevel, fishingIncome
 * Win: fishStockHealth > 70 AND coralCoverage > 50
 */
class SDG14Engine {
    init(difficulty, seed) {
        const d = difficulty;
        return {
            fishStockHealth: 40 - d * 8,   // 0–100
            quotaCompliance: 30 - d * 5,   // %
            coralCoverage: 35 - d * 8,   // %
            plasticLevel: 60 + d * 10,  // pollution index (lower=better)
            fishingIncome: 70,           // economic livelihood index
            marinePAs: 5,            // % ocean in protected areas
            illegalFishing: 40 + d * 5,  // % of fishing activity illegal
            budget: 50000000,
            turn: 0,
        };
    }

    availableActions(state) {
        return [
            { id: 'set_quota', label: '⚖️ Enforce Strict Fishing Quotas', cost: 300_000 },
            { id: 'create_mpa', label: '🛡️ Establish Marine Protected Area', cost: 800_000 },
            { id: 'ban_trawling', label: '🚫 Ban Bottom Trawling', cost: 0 },
            { id: 'plastic_cleanup', label: '🧹 Deploy Ocean Plastic Cleanup Systems', cost: 1_200_000 },
            { id: 'coral_restore', label: '🪸 Coral Reef Restoration Programme', cost: 900_000 },
            { id: 'patrol_illegal', label: '🚤 Fund Illegal Fishing Patrol Fleet', cost: 700_000 },
            { id: 'aquaculture', label: '🐟 Develop Sustainable Aquaculture', cost: 600_000 },
        ].filter(a => a.cost <= state.budget);
    }

    applyAction(state, action, params = {}) {
        const s = structuredClone(state);
        const cons = [], events = [];

        switch (action) {
            case 'set_quota':
                s.budget -= 300_000;
                s.quotaCompliance = Math.min(100, s.quotaCompliance + 20);
                s.fishStockHealth = Math.min(100, s.fishStockHealth + 8);
                s.fishingIncome = Math.max(0, s.fishingIncome - 8); // income drops short-term
                cons.push('Strict quotas enforced — fish stocks recovering, but fishing revenue fell temporarily.');
                break;
            case 'create_mpa':
                s.budget -= 800_000;
                s.marinePAs = Math.min(50, s.marinePAs + 5);
                s.fishStockHealth = Math.min(100, s.fishStockHealth + 12);
                s.coralCoverage = Math.min(100, s.coralCoverage + 6);
                cons.push('Marine Protected Area established — 5% more ocean now under ecological protection.');
                break;
            case 'ban_trawling':
                s.fishStockHealth = Math.min(100, s.fishStockHealth + 10);
                s.coralCoverage = Math.min(100, s.coralCoverage + 8);
                s.fishingIncome = Math.max(0, s.fishingIncome - 12); // trawler industry loss
                s.quotaCompliance = Math.min(100, s.quotaCompliance + 5);
                cons.push('Bottom trawling banned — coral and fish habitat recovery begins. Trawler losses significant.');
                break;
            case 'plastic_cleanup':
                s.budget -= 1_200_000;
                s.plasticLevel = Math.max(0, s.plasticLevel - 20);
                s.coralCoverage = Math.min(100, s.coralCoverage + 5);
                cons.push('Ocean cleanup systems deployed — plastic pollution reduced by 20 index points.');
                break;
            case 'coral_restore':
                s.budget -= 900_000;
                s.coralCoverage = Math.min(100, s.coralCoverage + 15);
                s.fishStockHealth = Math.min(100, s.fishStockHealth + 6);
                cons.push('Coral restoration: 15% more reef now recovering — fish habitat expanding.');
                break;
            case 'patrol_illegal':
                s.budget -= 700_000;
                s.illegalFishing = Math.max(0, s.illegalFishing - 15);
                s.quotaCompliance = Math.min(100, s.quotaCompliance + 10);
                s.fishStockHealth = Math.min(100, s.fishStockHealth + 5);
                cons.push('Patrol fleet deterred illegal fishing — quota compliance and stock health improved.');
                break;
            case 'aquaculture':
                s.budget -= 600_000;
                s.fishingIncome = Math.min(100, s.fishingIncome + 12);
                s.fishStockHealth = Math.min(100, s.fishStockHealth + 4); // less wild catch pressure
                cons.push('Sustainable aquaculture provides alternative income — pressure on wild stocks relieved.');
                break;
        }

        const r = Math.random();
        if (r < 0.12) {
            s.plasticLevel = Math.min(100, s.plasticLevel + 12);
            events.push('⚠️ Mega-plastic dump washed ashore — pollution levels spiked!');
        } else if (r < 0.22) {
            s.fishStockHealth = Math.max(0, s.fishStockHealth - 10);
            events.push('🌊 Unpredicted algal bloom depleted fish stocks in 2 zones!');
        } else if (r < 0.30) {
            s.budget += 500_000;
            events.push('🤝 Blue economy grant of ₹500K received from conservation fund.');
        } else if (r < 0.38) {
            s.fishStockHealth = Math.min(100, s.fishStockHealth + 5);
            events.push('🐬 Dolphin-safe trawling voluntary pledge raised fish stock health +5!');
        }

        // Emergency budget
        if (s.budget <= 0) {
            s.budget = 1_000_000;
            events.push('🆘 Ocean Conservation Fund emergency grant of ₹1M disbursed!');
        }

        s.turn += 1;
        s.budget = (s.budget || 0) + 500000;
        return { newState: s, consequences: cons, events };
    }

    tick(state) {
        const s = structuredClone(state);
        // Natural drift: overfishing and plastic continue without intervention
        s.fishStockHealth = Math.max(0, s.fishStockHealth - 3);
        s.plasticLevel = Math.min(100, s.plasticLevel + 2);
        s.coralCoverage = Math.max(0, s.coralCoverage - 1);
        s.turn += 1;
        s.budget = (s.budget || 0) + 500000;
        return { newState: s, events: ['🐟 Unchecked fishing and pollution: stocks fell, plastic rose, reefs bleached.'] };
    }

    computeScore(state) {
        return Math.round(
            state.fishStockHealth * 0.35 +
            state.coralCoverage * 0.30 +
            Math.max(0, 100 - state.plasticLevel) * 0.20 +
            state.quotaCompliance * 0.15
        );
    }

    isTerminal(state) {
        if (state.fishStockHealth > 70 && state.coralCoverage > 50) return { done: true, outcome: 'won' };
        if (state.turn >= 25) {
            return { done: true, outcome: this.computeScore(state) >= 55 ? 'won' : 'lost' };
        }
        return { done: false };
    }
}

module.exports = SDG14Engine;
