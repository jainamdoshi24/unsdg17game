/**
 * Seed script — populates the MongoDB with sample questions for all 17 SDGs.
 * Usage: node seed.js
 */
require('dotenv').config({ path: '../../.env' });
const mongoose = require('mongoose');
const Question = require('./models/Question');
const User = require('./models/User');

const MONGO_URI = process.env.MONGODB_URL;

const QUESTIONS = [
    // ─── SDG 1: No Poverty ────────────────────────────────────────────
    {
        questionId: 'SDG01_Q001', sdgId: 'SDG_01', difficulty: 1, type: 'mcq', tags: ['poverty', 'policy'],
        content: {
            stem: 'A village of 200 families receives a food aid package for 10 days. The best distribution strategy is:',
            choices: [
                { id: 'A', text: 'Give all aid to the village chief to manage', isCorrect: false, feedback: 'Centralised unfair control risks corruption' },
                { id: 'B', text: 'Distribute equally to all families', isCorrect: false, feedback: 'Equal split ignores families with greater need' },
                { id: 'C', text: 'Prioritise families with young children and elderly', isCorrect: true, feedback: 'Needs-based distribution is most equitable' },
                { id: 'D', text: 'Auction the aid to highest bidders', isCorrect: false, feedback: 'Auction excludes the poorest families entirely' },
            ], explanation: 'Needs-based allocation is a core SDG 1 principle — resources go where the impact is greatest.'
        }
    },

    {
        questionId: 'SDG01_Q002', sdgId: 'SDG_01', difficulty: 2, type: 'scenario', tags: ['microfinance', 'economic'],
        content: {
            stem: 'As a microfinance officer, you have ₹50,000 to distribute. Applicant A needs ₹30,000 to buy seeds (seasonal), Applicant B needs ₹20,000 to repair their cart (year-round income). Who should receive funding?',
            choices: [
                { id: 'A', text: 'Applicant A only', isCorrect: false, feedback: 'Seasonal income has limited long-term poverty impact' },
                { id: 'B', text: 'Applicant B only', isCorrect: false, feedback: 'Ignores the immediate food security need' },
                { id: 'C', text: 'Both, splitting ₹30k/₹20k as requested', isCorrect: true, feedback: 'Funding both maximises total economic impact' },
                { id: 'D', text: 'Neither, save for emergencies', isCorrect: false, feedback: 'Idle capital defeats the purpose of microfinance' },
            ], explanation: 'Microfinance works best when it funds both immediate needs and sustainable income sources.'
        }
    },

    {
        questionId: 'SDG01_Q003', sdgId: 'SDG_01', difficulty: 3, type: 'scenario', tags: ['policy', 'systemic'],
        content: {
            stem: 'A government has a limited budget. Which poverty-reduction policy has the highest long-term multiplier effect?',
            choices: [
                { id: 'A', text: 'Direct cash transfers', isCorrect: false, feedback: 'Effective short-term, but limited structural change' },
                { id: 'B', text: 'Building rural schools', isCorrect: true, feedback: 'Education breaks the poverty cycle across generations' },
                { id: 'C', text: 'Subsidized food programmes', isCorrect: false, feedback: 'Addresses symptoms not root causes' },
                { id: 'D', text: 'Corporate tax incentives', isCorrect: false, feedback: 'Trickle-down effects are slow and unequal' },
            ], explanation: 'Education is consistently the highest-ROI investment in poverty reduction globally.'
        }
    },

    // ─── SDG 2: Zero Hunger ───────────────────────────────────────────
    {
        questionId: 'SDG02_Q001', sdgId: 'SDG_02', difficulty: 1, type: 'mcq', tags: ['food', 'supply_chain'],
        content: {
            stem: 'A drought has destroyed 40% of a region\'s crop. The fastest way to prevent mass hunger is:',
            choices: [
                { id: 'A', text: 'Wait for the next growing season', isCorrect: false, feedback: 'Waiting causes famine—proactive intervention is needed' },
                { id: 'B', text: 'Import food from neighbouring regions', isCorrect: true, feedback: 'Immediate import bridges the gap while long-term recovery begins' },
                { id: 'C', text: 'Raise food prices so people consume less', isCorrect: false, feedback: 'Price increases worsen hunger for the poor' },
                { id: 'D', text: 'Restrict food exports only', isCorrect: false, feedback: 'Export bans alone don\'t solve immediate supply shortage' },
            ], explanation: 'Food system resilience requires both local reserves and international trade partnerships.'
        }
    },

    {
        questionId: 'SDG02_Q002', sdgId: 'SDG_02', difficulty: 2, type: 'scenario', tags: ['agriculture', 'sustainability'],
        content: {
            stem: 'A smallholder farmer can adopt one of these practices. Which improves long-term food security AND soil health?',
            choices: [
                { id: 'A', text: 'Heavy chemical fertilizers each season', isCorrect: false, feedback: 'Degrades soil over time, reducing future yields' },
                { id: 'B', text: 'Crop rotation and composting', isCorrect: true, feedback: 'Maintains soil health while sustaining yield — core of SDG 2' },
                { id: 'C', text: 'Mono-cropping the highest-value crop', isCorrect: false, feedback: 'Monoculture increases vulnerability to pests and climate' },
                { id: 'D', text: 'Leaving fields fallow every year', isCorrect: false, feedback: 'Annual fallowing reduces total output significantly' },
            ], explanation: 'Sustainable agriculture is about maintaining productivity without depleting natural resources.'
        }
    },

    // ─── SDG 3: Good Health ───────────────────────────────────────────
    {
        questionId: 'SDG03_Q001', sdgId: 'SDG_03', difficulty: 1, type: 'mcq', tags: ['health', 'epidemic'],
        content: {
            stem: 'A new disease is spreading. What is the single most effective first response?',
            choices: [
                { id: 'A', text: 'Close all schools immediately', isCorrect: false, feedback: 'School closure alone is insufficient without identifying the disease' },
                { id: 'B', text: 'Identify and isolate infected individuals', isCorrect: true, feedback: 'Contact tracing and isolation breaks the transmission chain' },
                { id: 'C', text: 'Distribute antibiotics to everyone', isCorrect: false, feedback: 'Antibiotics don\'t work on viruses and cause resistance' },
                { id: 'D', text: 'Wait for natural immunity to develop', isCorrect: false, feedback: 'Natural herd immunity without vaccines causes preventable deaths' },
            ], explanation: 'Early identification and isolation is the cornerstone of epidemic control.'
        }
    },

    // ─── SDG 4: Quality Education ─────────────────────────────────────
    {
        questionId: 'SDG04_Q001', sdgId: 'SDG_04', difficulty: 1, type: 'mcq', tags: ['education', 'inclusion'],
        content: {
            stem: 'A rural school has 3 teachers for 120 students across 6 grade levels. What restructuring best improves learning outcomes?',
            choices: [
                { id: 'A', text: 'Put all 120 students in one class', isCorrect: false, feedback: 'Mixed-age classes without structure reduce individual attention' },
                { id: 'B', text: 'Multi-grade teaching with peer tutoring', isCorrect: true, feedback: 'Peer learning and structured multi-grade teaching maximises limited resources' },
                { id: 'C', text: 'Teach only the top 40 students', isCorrect: false, feedback: 'Exclusion violates SDG 4\'s inclusive education principle' },
                { id: 'D', text: 'Reduce school hours to 2 per day', isCorrect: false, feedback: 'Reduced hours significantly harm literacy outcomes' },
            ], explanation: 'Multi-grade teaching with peer tutoring is a proven model for resource-limited schools globally.'
        }
    },

    // ─── SDG 5: Gender Equality ───────────────────────────────────────
    {
        questionId: 'SDG05_Q001', sdgId: 'SDG_05', difficulty: 2, type: 'scenario', tags: ['gender', 'workplace'],
        content: {
            stem: 'Two candidates of equal qualification apply for a promotion. Data shows women in the company are promoted 30% less. The manager should:',
            choices: [
                { id: 'A', text: 'Choose based on personal preference', isCorrect: false, feedback: 'Personal preference often encodes unconscious bias' },
                { id: 'B', text: 'Use a blind review process removing names and gender', isCorrect: true, feedback: 'Blind review neutralises gender bias in hiring and promotion' },
                { id: 'C', text: 'Always promote the man to maintain stability', isCorrect: false, feedback: 'Explicit gender preference is discriminatory and illegal in most countries' },
                { id: 'D', text: 'Delay the promotion decision', isCorrect: false, feedback: 'Delay doesn\'t solve the structural bias problem' },
            ], explanation: 'Structural processes like blind review are more effective than relying on individual managers to overcome bias.'
        }
    },

    // ─── SDG 6: Clean Water ───────────────────────────────────────────
    {
        questionId: 'SDG06_Q001', sdgId: 'SDG_06', difficulty: 1, type: 'mcq', tags: ['water', 'sanitation'],
        content: {
            stem: 'A village well tests positive for E. coli bacteria. The safest immediate action is:',
            choices: [
                { id: 'A', text: 'Boil all water before drinking', isCorrect: true, feedback: 'Boiling is the most accessible immediate solution to biological contamination' },
                { id: 'B', text: 'Add more salt to the water', isCorrect: false, feedback: 'Salt does not kill E. coli bacteria' },
                { id: 'C', text: 'Filter through cloth only', isCorrect: false, feedback: 'Cloth filtration does not remove bacteria effectively' },
                { id: 'D', text: 'Continue using — small amounts are safe', isCorrect: false, feedback: 'Even small amounts of E. coli can cause serious illness' },
            ], explanation: 'Boiling water at 100°C for 1 minute kills all biological pathogens including E. coli.'
        }
    },

    // ─── SDG 7: Affordable Energy ─────────────────────────────────────
    {
        questionId: 'SDG07_Q001', sdgId: 'SDG_07', difficulty: 2, type: 'scenario', tags: ['energy', 'renewables'],
        content: {
            stem: 'A remote village needs reliable electricity. Solar panels are cheaper upfront but unreliable at night. What is the best solution?',
            choices: [
                { id: 'A', text: 'Solar panels alone', isCorrect: false, feedback: 'Solar alone fails at night and during cloudy days' },
                { id: 'B', text: 'Diesel generator only', isCorrect: false, feedback: 'Diesel is expensive long-term and polluting' },
                { id: 'C', text: 'Solar panels with battery storage', isCorrect: true, feedback: 'Solar + storage provides reliable, clean, cost-effective energy' },
                { id: 'D', text: 'Connect to a distant coal plant grid', isCorrect: false, feedback: 'Grid extension to remote areas is costly and slow' },
            ], explanation: 'Hybrid renewable systems with storage are the global standard for rural electrification.'
        }
    },

    // ─── SDG 8: Decent Work ───────────────────────────────────────────
    {
        questionId: 'SDG08_Q001', sdgId: 'SDG_08', difficulty: 1, type: 'mcq', tags: ['labour', 'rights'],
        content: {
            stem: 'Workers at a factory are paid below minimum wage and work 14-hour shifts. The first enforcement action should be:',
            choices: [
                { id: 'A', text: 'Shut the factory immediately', isCorrect: false, feedback: 'Immediate closure removes workers\' only income source' },
                { id: 'B', text: 'Issue a compliance order with 30-day correction period', isCorrect: true, feedback: 'Regulatory compliance orders protect workers while preserving employment' },
                { id: 'C', text: 'Ask workers to negotiate on their own', isCorrect: false, feedback: 'Powerless workers cannot negotiate against employers alone without legal backing' },
                { id: 'D', text: 'Publicise the factory name only', isCorrect: false, feedback: 'Public shaming alone rarely forces structural change' },
            ], explanation: 'Labour enforcement should use proportional measures — correction orders protect both workers and jobs.'
        }
    },

    // ─── SDG 9: Industry & Infrastructure ────────────────────────────
    {
        questionId: 'SDG09_Q001', sdgId: 'SDG_09', difficulty: 2, type: 'scenario', tags: ['infrastructure', 'innovation'],
        content: {
            stem: 'A developing city has a limited budget. Which infrastructure investment creates the broadest economic multiplier?',
            choices: [
                { id: 'A', text: 'A luxury hotel district', isCorrect: false, feedback: 'Luxury tourism has limited spillover for average citizens' },
                { id: 'B', text: 'A new highway bypassing the city center', isCorrect: false, feedback: 'Bypasses can isolate existing communities' },
                { id: 'C', text: 'High-speed internet infrastructure', isCorrect: true, feedback: 'Broadband enables education, commerce, healthcare, and remote work — highest multiplier' },
                { id: 'D', text: 'A single large shopping mall', isCorrect: false, feedback: 'Retail concentration benefits few local suppliers' },
            ], explanation: 'Digital infrastructure has been shown to multiply GDP by 1.4× for every 10% increase in broadband penetration.'
        }
    },

    // ─── SDG 10: Reduced Inequalities ────────────────────────────────
    {
        questionId: 'SDG10_Q001', sdgId: 'SDG_10', difficulty: 2, type: 'mcq', tags: ['inequality', 'policy'],
        content: {
            stem: 'A country has a Gini coefficient of 0.52 (high inequality). Which policy mix most effectively reduces it?',
            choices: [
                { id: 'A', text: 'Flat tax for everyone', isCorrect: false, feedback: 'Flat tax increases the relative burden on lower-income groups' },
                { id: 'B', text: 'Progressive taxation + universal basic services', isCorrect: true, feedback: 'Proven combination: progressive taxes reduce income gap; universal services reduce consumption gap' },
                { id: 'C', text: 'Remove all taxes to encourage economic growth', isCorrect: false, feedback: 'Tax-free economies cannot fund redistribution programmes' },
                { id: 'D', text: 'Cap maximum wages legally', isCorrect: false, feedback: 'Wage caps alone drive talent migration and reduce investment' },
            ], explanation: 'Combined fiscal policy (taxes + transfers) is the most evidence-backed approach to reducing Gini coefficients.'
        }
    },

    // ─── SDG 11: Sustainable Cities ──────────────────────────────────
    {
        questionId: 'SDG11_Q001', sdgId: 'SDG_11', difficulty: 1, type: 'mcq', tags: ['cities', 'urban_planning'],
        content: {
            stem: 'A growing city wants to reduce car traffic and pollution. The most effective long-term strategy is:',
            choices: [
                { id: 'A', text: 'Build more highways', isCorrect: false, feedback: 'More roads generate more traffic (induced demand effect)' },
                { id: 'B', text: 'Ban all private vehicles', isCorrect: false, feedback: 'Blanket bans without alternatives cause economic disruption' },
                { id: 'C', text: 'Invest in public transit + mixed-use zoning', isCorrect: true, feedback: 'Good transit + walkable neighbourhoods reduce car dependency systemically' },
                { id: 'D', text: 'Move factories outside city limits only', isCorrect: false, feedback: 'Industrial relocation alone doesn\'t solve commuter traffic' },
            ], explanation: 'Transit-oriented development (TOD) is the gold standard for sustainable cities globally.'
        }
    },

    // ─── SDG 12: Responsible Consumption ─────────────────────────────
    {
        questionId: 'SDG12_Q001', sdgId: 'SDG_12', difficulty: 1, type: 'mcq', tags: ['consumption', 'waste'],
        content: {
            stem: 'As a consumer, which action has the biggest impact on reducing your carbon footprint?',
            choices: [
                { id: 'A', text: 'Using a reusable shopping bag', isCorrect: false, feedback: 'Bags are a small fraction of personal carbon footprint' },
                { id: 'B', text: 'Reducing beef consumption by 50%', isCorrect: true, feedback: 'Animal agriculture accounts for ~14.5% of global emissions — diet changes have massive impact' },
                { id: 'C', text: 'Switching off lights when you leave a room', isCorrect: false, feedback: 'Lighting is ~3% of household energy — significant but less than diet' },
                { id: 'D', text: 'Buying local artisanal products', isCorrect: false, feedback: 'Local buying helps, but food type matters more than food miles' },
            ], explanation: 'Food choices — especially reducing ruminant meat — are among the most impactful personal climate actions.'
        }
    },

    // ─── SDG 13: Climate Action ───────────────────────────────────────
    {
        questionId: 'SDG13_Q001', sdgId: 'SDG_13', difficulty: 2, type: 'scenario', tags: ['climate', 'emissions'],
        content: {
            stem: 'A country must reduce emissions by 45% before 2030. Which sector should be targeted first for maximum impact?',
            choices: [
                { id: 'A', text: 'Aviation industry', isCorrect: false, feedback: 'Aviation is ~2.5% of global CO₂ — important but not the largest lever' },
                { id: 'B', text: 'Electricity and heat production', isCorrect: true, feedback: 'Energy production is ~34% of global emissions — the single largest sector' },
                { id: 'C', text: 'Tourism sector', isCorrect: false, feedback: 'Tourism contributes ~8% — significant but not priority for rapid decarbonisation' },
                { id: 'D', text: 'Retail and e-commerce packaging', isCorrect: false, feedback: 'Packaging is a small fraction of total sectoral emissions' },
            ], explanation: 'Decarbonising electricity generation is the highest-leverage action — it also enables electrification of transport and heating.'
        }
    },

    // ─── SDG 14: Life Below Water ─────────────────────────────────────
    {
        questionId: 'SDG14_Q001', sdgId: 'SDG_14', difficulty: 2, type: 'mcq', tags: ['ocean', 'biodiversity'],
        content: {
            stem: 'Fish stocks in a coastal region have declined 60% in 10 years. The first management action should be:',
            choices: [
                { id: 'A', text: 'Ban all fishing permanently', isCorrect: false, feedback: 'A total ban devastates fishing communities without a transition plan' },
                { id: 'B', text: 'Set science-based catch quotas and seasonal limits', isCorrect: true, feedback: 'Quota systems aligned with Maximum Sustainable Yield allow stock recovery while preserving livelihoods' },
                { id: 'C', text: 'Import more fish to reduce local pressure', isCorrect: false, feedback: 'Imports don\'t address the underlying overfishing problem' },
                { id: 'D', text: 'Stock the ocean with farmed fish', isCorrect: false, feedback: 'Stocking with non-native species can disrupt ecosystems further' },
            ], explanation: 'Ecosystem-based fisheries management with science-backed quotas is the global standard for stock recovery.'
        }
    },

    // ─── SDG 15: Life on Land ─────────────────────────────────────────
    {
        questionId: 'SDG15_Q001', sdgId: 'SDG_15', difficulty: 1, type: 'mcq', tags: ['biodiversity', 'land'],
        content: {
            stem: 'A rainforest is being cleared for palm oil farming. What is the most effective policy intervention?',
            choices: [
                { id: 'A', text: 'Provide incentives for sustainable certification (RSPO)', isCorrect: true, feedback: 'Market-based sustainability certification creates economic incentives to protect forests' },
                { id: 'B', text: 'Ban all palm oil globally', isCorrect: false, feedback: 'A global ban would harm millions of smallholder farmers with no alternative income' },
                { id: 'C', text: 'Allow deforestation if replanting occurs later', isCorrect: false, feedback: 'Replanting monocultures does not restore biodiversity' },
                { id: 'D', text: 'Penalise only large corporations, not smallholders', isCorrect: false, feedback: 'Smallholders drive a significant share of deforestation and cannot be excluded from policy' },
            ], explanation: 'Sustainability certification (like RSPO) aligns market incentives with conservation — more effective than blanket bans.'
        }
    },

    // ─── SDG 16: Peace & Justice ──────────────────────────────────────
    {
        questionId: 'SDG16_Q001', sdgId: 'SDG_16', difficulty: 2, type: 'scenario', tags: ['justice', 'governance'],
        content: {
            stem: 'A judge discovers that a bribe was offered before a trial verdict. The correct action is:',
            choices: [
                { id: 'A', text: 'Accept the bribe if it matches the "right" outcome', isCorrect: false, feedback: 'Corruption undermines rule of law regardless of outcome' },
                { id: 'B', text: 'Report to the judicial oversight body and recuse', isCorrect: true, feedback: 'Reporting and recusal protects judicial integrity — core of SDG 16' },
                { id: 'C', text: 'Ignore it and proceed with the trial normally', isCorrect: false, feedback: 'Ignoring bribery is itself a form of complicity' },
                { id: 'D', text: 'Impose a harsher sentence to compensate', isCorrect: false, feedback: 'Biased sentencing is not a substitute for proper anti-corruption reporting' },
            ], explanation: 'Judicial integrity requires active reporting of corruption attempts, not passive resistance.'
        }
    },

    // ─── SDG 17: Partnerships ─────────────────────────────────────────
    {
        questionId: 'SDG17_Q001', sdgId: 'SDG_17', difficulty: 1, type: 'mcq', tags: ['partnerships', 'cooperation'],
        content: {
            stem: 'A small island nation needs climate adaptation funding. The most effective route is:',
            choices: [
                { id: 'A', text: 'Request bilateral loans from one wealthy country', isCorrect: false, feedback: 'Bilateral dependency creates political leverage — less resilient' },
                { id: 'B', text: 'Access multilateral funds (Green Climate Fund, GEF)', isCorrect: true, feedback: 'Multilateral funds provide grants and concessional loans specifically designed for SDG-aligned climate adaptation' },
                { id: 'C', text: 'Issue national treasury bonds only', isCorrect: false, feedback: 'Small island nations have limited bond market access and paying high interest on climate debt is unfair' },
                { id: 'D', text: 'Rely on tourism revenue increases', isCorrect: false, feedback: 'Tourism revenue is vulnerable to the same climate shocks needing adaptation' },
            ], explanation: 'Multilateral climate finance mechanisms exist precisely to support vulnerable nations — they are the SDG 17 partnership in action.'
        }
    },
];

async function seed() {
    await mongoose.connect(MONGO_URI, { dbName: 'sdg_quest' });
    console.log('✅ Connected to MongoDB');

    // Upsert questions (safe to re-run)
    let inserted = 0, skipped = 0;
    for (const q of QUESTIONS) {
        const exists = await Question.findOne({ questionId: q.questionId });
        if (exists) { skipped++; continue; }
        await Question.create(q);
        inserted++;
    }

    console.log(`✅ Seeded ${inserted} questions. ${skipped} already existed.`);

    // Create a demo student account if not present
    const demo = await User.findOne({ email: 'demo@sdgquest.org' });
    if (!demo) {
        await User.create({
            displayName: 'Demo Student',
            email: 'demo@sdgquest.org',
            password: 'Demo@1234',
            role: 'student',
            grade: 10,
        });
        console.log('✅ Demo student created — email: demo@sdgquest.org | password: Demo@1234');
    } else {
        console.log('ℹ️  Demo student already exists');
    }

    // Create a demo teacher account
    const teacher = await User.findOne({ email: 'teacher@sdgquest.org' });
    if (!teacher) {
        await User.create({
            displayName: 'Demo Teacher',
            email: 'teacher@sdgquest.org',
            password: 'Teacher@1234',
            role: 'teacher',
        });
        console.log('✅ Demo teacher created — email: teacher@sdgquest.org | password: Teacher@1234');
    } else {
        console.log('ℹ️  Demo teacher already exists');
    }

    await mongoose.disconnect();
    console.log('✅ Seed complete. Database disconnected.');
}

seed().catch(err => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});
