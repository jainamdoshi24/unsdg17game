/**
 * SDG 4 — Quality Education: School Management Strategy
 * Run a school district — hire teachers, build classrooms, fight dropout.
 * Win: literacyRate > 85 AND dropoutRate < 10 (or score >=60 at turn 25)
 */
class SDG04Engine {
    init(difficulty, seed) {
        const d = difficulty;
        return {
            teacherCount: 20 - d * 3,
            classrooms: 10 - d * 2,
            dropoutRate: 35 + d * 8,
            literacyRate: 40 - d * 5,
            studentCount: 2000,
            teacherSatisfaction: 60,
            budget: 30000000 - d * 200_000,
            term: 1,
            turn: 0,
        };
    }

    availableActions(state) {
        const actions = [
            { id: 'hire_teachers', label: '👩‍🏫 Hire 5 Teachers', cost: 250_000, effect: '+5 teachers, -4% dropout, +5% literacy' },
            { id: 'build_classroom', label: '🏫 Build 2 Classrooms', cost: 300_000, effect: '+2 rooms, -3% dropout' },
            { id: 'digital_tablets', label: '📱 Deploy Tablet Programme', cost: 400_000, effect: '+8% literacy, -5% dropout' },
            { id: 'lunch_program', label: '🍱 School Lunch Programme', cost: 150_000, effect: '-6% dropout, +2% literacy' },
            { id: 'anti_dropout', label: '📣 Anti-Dropout Campaign', cost: 100_000, effect: '-8% dropout (outreach)' },
            { id: 'teacher_training', label: '📚 Teacher Development', cost: 180_000, effect: '+6% literacy, +teacher morale' },
            { id: 'scholarship_fund', label: '🎓 Scholarship Fund', cost: 200_000, effect: '-5% dropout, especially girls' },
            { id: 'parent_engagement', label: '👪 Parent-Community Day', cost: 50_000, effect: '-4% dropout, free action' },
        ].filter(a => a.cost <= state.budget);
        if (actions.length === 0) actions.push({ id: 'parent_engagement', label: '👪 Community Day (Free)', cost: 0, effect: '-3 dropout' });
        return actions;
    }

    applyAction(state, action, params = {}) {
        const s = structuredClone(state);
        const cons = [], events = [];

        switch (action) {
            case 'hire_teachers':
                s.budget -= 250_000;
                s.teacherCount = Math.min(60, s.teacherCount + 5);
                s.dropoutRate = Math.max(0, s.dropoutRate - 4);
                s.literacyRate = Math.min(100, s.literacyRate + 5);
                cons.push(`👩‍🏫 ${s.teacherCount} teachers now active — student ratio improved, literacy up 5%!`);
                break;
            case 'build_classroom':
                s.budget -= 300_000;
                s.classrooms = Math.min(40, s.classrooms + 2);
                s.dropoutRate = Math.max(0, s.dropoutRate - 3);
                cons.push(`🏫 ${s.classrooms} classrooms — overcrowding reduced, dropout fell 3%.`);
                break;
            case 'digital_tablets':
                s.budget -= 400_000;
                s.literacyRate = Math.min(100, s.literacyRate + 8);
                s.dropoutRate = Math.max(0, s.dropoutRate - 5);
                cons.push('📱 Tablets deployed — digital learning boosted scores and engagement!');
                break;
            case 'lunch_program':
                s.budget -= 150_000;
                s.dropoutRate = Math.max(0, s.dropoutRate - 6);
                s.literacyRate = Math.min(100, s.literacyRate + 2);
                cons.push('🍱 School meals launched — hungry kids can now focus and stay in school!');
                break;
            case 'anti_dropout':
                s.budget -= 100_000;
                s.dropoutRate = Math.max(0, s.dropoutRate - 8);
                cons.push('📣 Outreach campaign reduced dropout 8% — especially rural and working-age kids.');
                break;
            case 'teacher_training':
                s.budget -= 180_000;
                s.literacyRate = Math.min(100, s.literacyRate + 6);
                s.teacherSatisfaction = Math.min(100, s.teacherSatisfaction + 10);
                cons.push('📚 Teacher CPD improves lesson quality — literacy accelerating!');
                break;
            case 'scholarship_fund':
                s.budget -= 200_000;
                s.dropoutRate = Math.max(0, s.dropoutRate - 5);
                cons.push('🎓 Scholarship fund keeping vulnerable students in school!');
                break;
            case 'parent_engagement':
                s.budget -= 50_000;
                s.dropoutRate = Math.max(0, s.dropoutRate - 4);
                cons.push('👪 Parents engaged — community support boosted school attendance!');
                break;
        }

        // Emergency budget
        if (s.budget <= 0) {
            s.budget = 500_000;
            events.push('🆘 Emergency education grant of ₹500K received from state government!');
        }

        // Random events
        const r = Math.random();
        if (r < 0.12) {
            s.dropoutRate = Math.min(60, s.dropoutRate + 4);
            events.push('⚠️ Harvest season — 4% more kids pulled from school to work fields.');
        } else if (r < 0.22) {
            s.budget += 400_000;
            events.push('💸 Government education grant of ₹400K received!');
        } else if (r < 0.30) {
            s.literacyRate = Math.min(100, s.literacyRate + 3);
            events.push('🌟 National literacy drive — +3% literacy across all districts!');
        } else if (r < 0.38) {
            s.teacherSatisfaction = Math.max(0, s.teacherSatisfaction - 5);
            events.push('😤 Teacher strike risk — morale low. Consider teacher training!');
        }

        s.turn += 1;
        s.term = Math.min(25, Math.floor(s.turn / 4) + 1);
        s.budget = (s.budget || 0) + 500000;
        return { newState: s, consequences: cons, events };
    }

    tick(state) {
        const s = structuredClone(state);
        s.literacyRate = Math.max(0, s.literacyRate - 1);
        s.dropoutRate = Math.min(60, s.dropoutRate + 1);
        s.turn += 1;
        s.term = Math.min(25, Math.floor(s.turn / 4) + 1);
        s.budget = (s.budget || 0) + 500000;
        return { newState: s, events: ['📚 New term — learning regresses without investment.'] };
    }

    computeScore(state) {
        return Math.round(
            Math.min(100, state.literacyRate) * 0.50 +
            Math.max(0, 100 - state.dropoutRate) * 0.35 +
            Math.min(1, state.teacherCount / 40) * 100 * 0.15
        );
    }

    isTerminal(state) {
        if (state.literacyRate > 85 && state.dropoutRate < 10) return { done: true, outcome: 'won' };
        if (state.turn >= 25) {
            return { done: true, outcome: this.computeScore(state) >= 60 ? 'won' : 'lost' };
        }
        return { done: false };
    }
}

module.exports = SDG04Engine;
