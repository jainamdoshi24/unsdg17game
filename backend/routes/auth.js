const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { generateToken, requireAuth } = require('../middleware/auth');

// ─── POST /api/auth/register ───────────────────────────────────────
router.post('/register', async (req, res) => {
    try {
        const { displayName, email, password, grade, role } = req.body;

        if (!displayName || !email || !password)
            return res.status(400).json({ error: 'displayName, email and password are required' });

        const existing = await User.findOne({ email });
        if (existing)
            return res.status(409).json({ error: 'Email already registered' });

        const user = await User.create({
            displayName,
            email,
            password,
            grade,
            role: role === 'teacher' ? 'teacher' : 'student',
        });

        const token = generateToken({ userId: user._id, role: user.role });

        res.status(201).json({
            message: 'Account created',
            token,
            user: user.toPublicProfile(),
        });
    } catch (err) {
        console.error('[register]', err);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// ─── POST /api/auth/login ──────────────────────────────────────────
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({ error: 'Email and password are required' });

        const user = await User.findOne({ email }).select('+password');
        if (!user)
            return res.status(401).json({ error: 'Invalid credentials' });

        const valid = await user.comparePassword(password);
        if (!valid)
            return res.status(401).json({ error: 'Invalid credentials' });

        // Update last active
        user.lastActiveAt = new Date();
        await user.save();

        const token = generateToken({ userId: user._id, role: user.role });

        res.json({
            message: 'Login successful',
            token,
            user: user.toPublicProfile(),
        });
    } catch (err) {
        console.error('[login]', err);
        res.status(500).json({ error: 'Login failed' });
    }
});

// ─── GET /api/auth/me ──────────────────────────────────────────────
router.get('/me', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ user: user.toPublicProfile() });
    } catch (err) {
        res.status(500).json({ error: 'Could not fetch profile' });
    }
});

// ─── PUT /api/auth/profile ─────────────────────────────────────────
router.put('/profile', requireAuth, async (req, res) => {
    try {
        const { displayName, grade, preferences } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user.userId,
            { $set: { displayName, grade, preferences } },
            { new: true, runValidators: true }
        );
        res.json({ user: user.toPublicProfile() });
    } catch (err) {
        res.status(500).json({ error: 'Profile update failed' });
    }
});

// ─── POST /api/auth/refresh ───────────────────────────────────
router.post('/refresh', requireAuth, async (req, res) => {
    try {
        // requireAuth already verified the token — just issue a fresh one
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const token = generateToken({ userId: user._id, role: user.role });
        res.json({
            token,
            user: user.toPublicProfile(),
        });
    } catch (err) {
        console.error('[refresh]', err);
        res.status(500).json({ error: 'Token refresh failed' });
    }
});

module.exports = router;
