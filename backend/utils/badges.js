/**
 * Badge definitions and award logic for FUN&LEARN
 * Called after game completion or quiz submission
 */

const BADGE_DEFINITIONS = [
    {
        id: 'first_win',
        label: '🏆 First Victory',
        description: 'Complete your first SDG simulation',
        icon: '🏆',
        check: (stats) => stats.totalCompletions >= 1,
    },
    {
        id: 'sdg_explorer',
        label: '🧭 SDG Explorer',
        description: 'Complete 3 different SDG simulations',
        icon: '🧭',
        check: (stats) => stats.uniqueSdgsCompleted >= 3,
    },
    {
        id: 'all_rounder',
        label: '🌍 All-Rounder',
        description: 'Complete 10 different SDG simulations',
        icon: '🌍',
        check: (stats) => stats.uniqueSdgsCompleted >= 10,
    },
    {
        id: 'climate_warrior',
        label: '🌿 Climate Warrior',
        description: 'Complete the SDG 13 Climate Action simulation',
        icon: '🌿',
        check: (stats) => stats.completedSdgs.includes('SDG_13'),
    },
    {
        id: 'ocean_guardian',
        label: '🐠 Ocean Guardian',
        description: 'Complete the SDG 14 Life Below Water simulation',
        icon: '🐠',
        check: (stats) => stats.completedSdgs.includes('SDG_14'),
    },
    {
        id: 'knowledge_master',
        label: '🧠 Knowledge Master',
        description: 'Score 90% or higher on any SDG quiz',
        icon: '🧠',
        check: (stats) => stats.bestQuizPct >= 90,
    },
    {
        id: 'quiz_champion',
        label: '📚 Quiz Champion',
        description: 'Score 100% on any SDG quiz',
        icon: '📚',
        check: (stats) => stats.bestQuizPct >= 100,
    },
    {
        id: 'high_scorer',
        label: '🎯 High Scorer',
        description: 'Achieve a simulation score of 80 or higher',
        icon: '🎯',
        check: (stats) => stats.bestSimScore >= 80,
    },
    {
        id: 'poverty_fighter',
        label: '❤️ Poverty Fighter',
        description: 'Complete the SDG 1 No Poverty simulation',
        icon: '❤️',
        check: (stats) => stats.completedSdgs.includes('SDG_01'),
    },
    {
        id: 'energy_engineer',
        label: '⚡ Energy Engineer',
        description: 'Complete the SDG 7 Clean Energy simulation',
        icon: '⚡',
        check: (stats) => stats.completedSdgs.includes('SDG_07'),
    },
];

/**
 * Compute player stats needed to check badge conditions
 */
async function getPlayerStats(userId, User, MissionSession, extraQuizPct = null) {
    const user = await User.findById(userId).select('badges sdgProgress totalXP').lean();
    if (!user) return null;

    // Collect completed SDGs from sdgProgress map
    const sdgProgress = user.sdgProgress || {};
    const completedSdgs = [];
    let totalCompletions = 0;

    for (const [sdgId, prog] of Object.entries(sdgProgress)) {
        if ((prog.missionsCompleted || 0) > 0) {
            completedSdgs.push(sdgId);
            totalCompletions += prog.missionsCompleted || 0;
        }
    }

    // Best sim score
    const sessions = await MissionSession.find({ userId, status: 'won' })
        .sort({ 'score.normalized': -1 }).limit(1).lean();
    const bestSimScore = sessions.length ? (sessions[0].score?.normalized || 0) : 0;

    return {
        completedSdgs,
        uniqueSdgsCompleted: completedSdgs.length,
        totalCompletions,
        bestSimScore,
        bestQuizPct: extraQuizPct ?? (user.bestQuizPct || 0),
        existingBadges: user.badges || [],
    };
}

/**
 * Check all badge conditions and award new ones.
 * Returns array of newly earned badge objects.
 */
async function checkAndAwardBadges(userId, User, MissionSession, extraQuizPct = null) {
    try {
        const stats = await getPlayerStats(userId, User, MissionSession, extraQuizPct);
        if (!stats) return [];

        const newBadgeIds = BADGE_DEFINITIONS
            .filter(b => !stats.existingBadges.includes(b.id) && b.check(stats))
            .map(b => b.id);

        if (newBadgeIds.length > 0) {
            await User.findByIdAndUpdate(userId, {
                $addToSet: { badges: { $each: newBadgeIds } }
            });
        }

        return BADGE_DEFINITIONS.filter(b => newBadgeIds.includes(b.id));
    } catch (err) {
        console.error('[badges] checkAndAwardBadges error:', err.message);
        return [];
    }
}

module.exports = { checkAndAwardBadges, BADGE_DEFINITIONS };
