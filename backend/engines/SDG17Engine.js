/**
 * SDG 17 — Partnerships for the Goals: Global Cooperation & Aid Allocator
 * Coordinate with 5 partner nations, fund development, share technology.
 * Win: All 5 partners have sdgAlignment > 60 (or score >= 55 at turn 25)
 */
const { createRNG } = require('../utils/seededRandom');

class SDG17Engine {
    init(difficulty, seed) {
        const d = difficulty;
        const partners = [
            { id: 'P1', name: '🌍 Sub-Saharan Africa', sdgAlignment: 30 - d * 3, trust: 50, specialNeed: 'health' },
            { id: 'P2', name: '🌏 South Asia', sdgAlignment: 35 - d * 4, trust: 45, specialNeed: 'education' },
            { id: 'P3', name: '🌎 Latin America', sdgAlignment: 40 - d * 3, trust: 55, specialNeed: 'climate' },
            { id: 'P4', name: '🏝️ Small Island State', sdgAlignment: 25 - d * 5, trust: 60, specialNeed: 'climate' },
            { id: 'P5', name: '🤝 Least Developed', sdgAlignment: 20 - d * 4, trust: 40, specialNeed: 'trade' },
        ];
        return {
            partners,
            aidEfficiency: 50 - d * 5,
            technologyTransfer: 20 - d * 3,
            tradeBalance: 0,
            globalTrust: 55 - d * 5,
            budget: 30_000_000,
            fundPool: 30_000_000,
            summitsHosted: 0,
            rngSeed: seed || 'sdg17_default',
            rngCallCount: 0,
            turn: 0,
        };
    }

    availableActions(state) {
        const partnerActions = state.partners.flatMap(p => [
            { id: `fund_${p.id}`, label: `💰 Development Fund → ${p.name}`, cost: 2_000_000, partnerId: p.id },
            { id: `tech_${p.id}`, label: `🔬 Technology Transfer → ${p.name}`, cost: 1_500_000, partnerId: p.id },
        ]);
        const globals = [
            { id: 'negotiate_trade', label: '📦 Negotiate Fair Trade Framework', cost: 1_000_000 },
            { id: 'debt_relief', label: '💳 Coordinate Debt Relief Initiative', cost: 3_000_000 },
            { id: 'host_summit', label: '🌐 Host Global SDG Summit', cost: 800_000 },
            { id: 'boost_efficiency', label: '⚙️ Audit Aid Delivery Efficiency', cost: 500_000 },
            { id: 'climate_fund', label: '🌿 Green Climate Fund Contribution', cost: 1_200_000 },
        ];
        const combined = [...partnerActions, ...globals].filter(a => a.cost <= state.budget);
        if (combined.length === 0) combined.push({ id: 'host_summit', label: '🌐 Mini SDG Summit (Emergency)', cost: 0 });
        return combined;
    }

    applyAction(state, action, params = {}) {
        const s = structuredClone(state);
        const cons = [], events = [];

        // Re-init RNG from stored seed + call count for reproducibility
        const rng = createRNG(`${s.rngSeed}-${s.rngCallCount}`);
        s.rngCallCount += 1;

        if (action.startsWith('fund_')) {
            const partnerId = action.replace('fund_', '');
            const partner = s.partners.find(p => p.id === partnerId);
            if (partner) {
                const efficiency = s.aidEfficiency / 100;
                const gain = Math.round(10 * efficiency);
                s.budget -= 2_000_000;
                partner.sdgAlignment = Math.min(100, partner.sdgAlignment + gain);
                partner.trust = Math.min(100, partner.trust + 6);
                s.globalTrust = Math.min(100, s.globalTrust + 2);
                cons.push(`💰 Development fund delivered to ${partner.name} — alignment +${gain}, trust +6!`);
            }
        } else if (action.startsWith('tech_')) {
            const partnerId = action.replace('tech_', '');
            const partner = s.partners.find(p => p.id === partnerId);
            if (partner) {
                s.budget -= 1_500_000;
                s.technologyTransfer = Math.min(100, s.technologyTransfer + 5);
                partner.sdgAlignment = Math.min(100, partner.sdgAlignment + 9);
                partner.trust = Math.min(100, partner.trust + 4);
                cons.push(`🔬 Technology package transferred to ${partner.name} — innovation unlocked! Alignment +9!`);
            }
        } else {
            switch (action) {
                case 'negotiate_trade':
                    s.budget -= 1_000_000;
                    s.tradeBalance = Math.min(50, s.tradeBalance + 10);
                    s.partners.forEach(p => { p.sdgAlignment = Math.min(100, p.sdgAlignment + 3); });
                    s.globalTrust = Math.min(100, s.globalTrust + 5);
                    cons.push('📦 Fair trade framework agreed — all partners benefit, global trust up 5!');
                    break;
                case 'debt_relief':
                    s.budget -= 3_000_000;
                    s.partners.forEach(p => { p.trust = Math.min(100, p.trust + 10); p.sdgAlignment = Math.min(100, p.sdgAlignment + 5); });
                    s.globalTrust = Math.min(100, s.globalTrust + 10);
                    cons.push('💳 Debt relief unlocks development budgets for all 5 nations! Trust surges!');
                    break;
                case 'host_summit':
                    s.budget -= 800_000;
                    s.summitsHosted += 1;
                    s.globalTrust = Math.min(100, s.globalTrust + 8);
                    s.aidEfficiency = Math.min(100, s.aidEfficiency + 5);
                    s.partners.forEach(p => { p.sdgAlignment = Math.min(100, p.sdgAlignment + 2); });
                    cons.push(`🌐 Summit #${s.summitsHosted} complete! Aid efficiency improved, all alignment +2!`);
                    break;
                case 'boost_efficiency':
                    s.budget -= 500_000;
                    s.aidEfficiency = Math.min(100, s.aidEfficiency + 15);
                    cons.push(`⚙️ Aid efficiency now ${s.aidEfficiency}% — every dollar goes further!`);
                    break;
                case 'climate_fund':
                    s.budget -= 1_200_000;
                    s.partners.filter(p => p.specialNeed === 'climate').forEach(p => {
                        p.sdgAlignment = Math.min(100, p.sdgAlignment + 8);
                        p.trust = Math.min(100, p.trust + 5);
                    });
                    cons.push('🌿 Green Climate Fund contribution targeting most vulnerable nations!');
                    break;
            }
        }

        // Emergency budget
        if (s.budget <= 0) {
            s.budget = 5_000_000;
            events.push('🆘 G20 emergency solidarity fund of ₹5M disbursed!');
        }

        // Random events using seeded RNG
        const r = rng();
        if (r < 0.12) {
            const victim = s.partners[Math.floor(rng() * s.partners.length)];
            victim.sdgAlignment = Math.max(0, victim.sdgAlignment - 8);
            events.push(`⚠️ Political crisis in ${victim.name} — SDG alignment fell 8 points!`);
        } else if (r < 0.22) {
            s.budget += 3_000_000;
            events.push('💰 G7 pledged emergency climate finance — ₹3M added to fund pool!');
        } else if (r < 0.30) {
            s.globalTrust = Math.min(100, s.globalTrust + 10);
            events.push('🌟 UN Secretary-General commended the partnership — global trust +10!');
        } else if (r < 0.38) {
            s.aidEfficiency = Math.min(100, s.aidEfficiency + 8);
            events.push('⚡ New digital aid tracking system boosted efficiency +8%!');
        }

        s.turn += 1;
        return { newState: s, consequences: cons, events };
    }

    tick(state) {
        const s = structuredClone(state);
        const rng = createRNG(`${s.rngSeed}-tick-${s.rngCallCount}`);
        s.rngCallCount += 1;
        // Passive trust building but alignment drifts without active support
        s.partners.forEach(p => {
            p.sdgAlignment = Math.max(0, p.sdgAlignment - 1);
        });
        s.globalTrust = Math.max(0, s.globalTrust - 1);
        s.turn += 1;
        return { newState: s, events: ['🌍 Without support, partners lose alignment momentum. Intervene!'] };
    }

    computeScore(state) {
        const avgAlignment = state.partners.reduce((sum, p) => sum + p.sdgAlignment, 0) / state.partners.length;
        return Math.round(
            avgAlignment * 0.50 +
            state.globalTrust * 0.25 +
            state.aidEfficiency * 0.15 +
            Math.min(100, state.technologyTransfer * 2) * 0.10
        );
    }

    isTerminal(state) {
        const allAligned = state.partners.every(p => p.sdgAlignment > 60);
        if (allAligned) return { done: true, outcome: 'won' };
        if (state.turn >= 25) {
            return { done: true, outcome: this.computeScore(state) >= 55 ? 'won' : 'lost' };
        }
        return { done: false };
    }
}

module.exports = SDG17Engine;
