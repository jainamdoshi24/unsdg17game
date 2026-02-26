/**
 * SDG 3 — Good Health: Pandemic Management Hospital Sim (SIR Model)
 * Crisis response: vaccinate, control spread, keep hospitals from collapsing.
 * Win: infected < 1% of population AND economicHealth > 50 (or score >=55 at turn 25)
 */
class SDG03Engine {
    init(difficulty, seed) {
        const pop = 100_000;
        const d = difficulty;
        return {
            population: pop,
            susceptible: pop - 500 * d,
            infected: 500 * d,
            recovered: 0,
            deaths: 0,
            hospitalCapacity: 2000 - d * 300,
            occupancy: 500 * d,
            vaccineDoses: 8000 - d * 1000,
            economicHealth: 70 - d * 10,
            publicCompliance: 80 - d * 10,
            researchLevel: 0,
            budget: 8_000_000,
            turn: 0,
        };
    }

    availableActions(state) {
        const actions = [
            { id: 'deploy_vaccines', label: '💉 Deploy Vaccine Campaign', cost: 500_000, effect: '-10K susceptible' },
            { id: 'lockdown', label: '🔒 Partial Lockdown', cost: 200_000, effect: '+compliance, -economy' },
            { id: 'open_field_hospital', label: '🏥 Open Field Hospital (+500 beds)', cost: 800_000, effect: '+hospital capacity' },
            { id: 'contact_tracing', label: '📱 Contact Tracing App', cost: 300_000, effect: '+compliance, faster isolation' },
            { id: 'public_comms', label: '📢 Public Awareness Drive', cost: 150_000, effect: '+15% compliance' },
            { id: 'fund_research', label: '🔬 Fund Treatment Research', cost: 600_000, effect: '+recovery rate' },
            { id: 'ease_lockdown', label: '🎉 Ease Restrictions', cost: 0, effect: '+economy, -compliance' },
            { id: 'mobile_clinics', label: '🚑 Deploy Mobile Clinics', cost: 350_000, effect: '+500 beds, +compliance' },
        ].filter(a => a.cost <= state.budget);
        if (actions.length === 0) actions.push({ id: 'ease_lockdown', label: '🎉 Ease Restrictions (Free)', cost: 0, effect: '+economy' });
        return actions;
    }

    applyAction(state, action, params = {}) {
        const s = structuredClone(state);
        const cons = [], events = [];

        switch (action) {
            case 'deploy_vaccines': {
                const doses = Math.min(s.vaccineDoses, 10_000);
                const immunised = Math.floor(doses * 0.85);
                s.budget -= 500_000;
                s.vaccineDoses -= doses;
                s.susceptible = Math.max(0, s.susceptible - immunised);
                s.recovered += immunised;
                cons.push(`💉 ${immunised.toLocaleString()} people vaccinated — herd immunity growing!`);
                break;
            }
            case 'lockdown':
                s.budget -= 200_000;
                s.publicCompliance = Math.min(100, s.publicCompliance + 10);
                s.economicHealth = Math.max(10, s.economicHealth - 6);
                cons.push('🔒 Lockdown curbs transmission but costs economic activity.');
                break;
            case 'open_field_hospital':
                s.budget -= 800_000;
                s.hospitalCapacity = Math.min(6000, s.hospitalCapacity + 500);
                cons.push(`🏥 Field hospital open — capacity now ${s.hospitalCapacity.toLocaleString()} beds!`);
                break;
            case 'contact_tracing':
                s.budget -= 300_000;
                s.publicCompliance = Math.min(100, s.publicCompliance + 5);
                cons.push('📱 Digital contact tracing isolated 30% more cases before they spread.');
                break;
            case 'public_comms':
                s.budget -= 150_000;
                s.publicCompliance = Math.min(100, s.publicCompliance + 15);
                cons.push('📢 Awareness campaign boosted mask usage and social distancing!');
                break;
            case 'fund_research':
                s.budget -= 600_000;
                s.researchLevel = (s.researchLevel || 0) + 1;
                s._researchBonus = (s._researchBonus || 0) + 0.08;
                cons.push(`🔬 Research level ${s.researchLevel} — treatment efficacy improving!`);
                break;
            case 'ease_lockdown':
                s.economicHealth = Math.min(100, s.economicHealth + 10);
                s.publicCompliance = Math.max(20, s.publicCompliance - 8);
                cons.push('🎉 Restrictions eased — economy recovering, stay vigilant on compliance!');
                break;
            case 'mobile_clinics':
                s.budget -= 350_000;
                s.hospitalCapacity = Math.min(6000, s.hospitalCapacity + 300);
                s.publicCompliance = Math.min(100, s.publicCompliance + 5);
                cons.push('🚑 Mobile clinics deployed — rural areas now covered, hospital strain easing!');
                break;
        }

        // Apply SIR tick
        this._sirStep(s, cons);

        // Emergency budget
        if (s.budget <= 0) {
            s.budget = 1_500_000;
            events.push('🆘 WHO emergency health fund of ₹1.5M disbursed!');
        }

        // Random events
        const r = Math.random();
        if (r < 0.10) {
            const surge = Math.floor(s.susceptible * 0.05);
            s.infected = Math.min(s.susceptible + s.infected, s.infected + surge);
            events.push(`⚠️ New variant detected — ${surge.toLocaleString()} additional infections reported!`);
        } else if (r < 0.20) {
            s.vaccineDoses += 25_000;
            events.push('💉 WHO emergency vaccine shipment of 25,000 doses arrived!');
        } else if (r < 0.28) {
            s.economicHealth = Math.min(100, s.economicHealth + 8);
            events.push('📈 Government stimulus boosted economic health by 8%!');
        } else if (r < 0.36) {
            s.publicCompliance = Math.min(100, s.publicCompliance + 8);
            events.push('🌟 Viral social media campaign boosted public compliance +8%!');
        }

        s.turn += 1;
        return { newState: s, consequences: cons, events };
    }

    _sirStep(s, cons) {
        const beta = 0.28 * (1 - s.publicCompliance / 100);
        const gamma = 0.04 + (s._researchBonus || 0);
        const ifr = 0.008;

        const newInfected = Math.floor(beta * s.infected * (s.susceptible / s.population));
        const newRecovered = Math.floor(gamma * s.infected);
        const newDeaths = Math.floor(ifr * s.infected * (Math.max(0, s.occupancy - s.hospitalCapacity) / s.population + 0.001));

        s.susceptible = Math.max(0, s.susceptible - newInfected);
        s.infected = Math.max(0, s.infected + newInfected - newRecovered - newDeaths);
        s.recovered += newRecovered;
        s.deaths += newDeaths;
        s.occupancy = Math.min(s.hospitalCapacity * 1.5, s.infected * 0.15);

        if (s.occupancy > s.hospitalCapacity) {
            cons.push(`🏥 ALERT: Hospitals at ${Math.round(s.occupancy / s.hospitalCapacity * 100)}% capacity! Build more beds!`);
        }
    }

    tick(state) {
        const s = structuredClone(state);
        this._sirStep(s, []);
        s.economicHealth = Math.max(10, s.economicHealth - 1);
        s.turn += 1;
        return {
            newState: s,
            events: [`📊 Status: ${s.infected.toLocaleString()} infected | ${s.deaths.toLocaleString()} deaths | ${s.recovered.toLocaleString()} recovered`],
        };
    }

    computeScore(state) {
        const infectionControl = Math.max(0, 100 - (state.infected / state.population * 100)) * 0.40;
        const economicScore = state.economicHealth * 0.30;
        const survivalScore = Math.max(0, 100 - (state.deaths / state.population * 1000)) * 0.30;
        return Math.round(infectionControl + economicScore + survivalScore);
    }

    isTerminal(state) {
        const infectionRate = state.infected / state.population;
        if (infectionRate < 0.01 && state.economicHealth > 50) return { done: true, outcome: 'won' };
        if (state.turn >= 25) {
            return { done: true, outcome: this.computeScore(state) >= 55 ? 'won' : 'lost' };
        }
        return { done: false };
    }
}

module.exports = SDG03Engine;
