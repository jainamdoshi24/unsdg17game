const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'sdg_quest_secret_change_in_production';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

const generateToken = (payload) =>
    jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });

const verifyToken = (token) =>
    jwt.verify(token, JWT_SECRET);

// Middleware: protect routes requiring authentication
const requireAuth = (req, res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization token missing' });
    }
    try {
        const payload = verifyToken(header.slice(7));
        req.user = payload;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Token invalid or expired' });
    }
};

// Middleware: restrict to specific roles
const requireRole = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
};

module.exports = { generateToken, verifyToken, requireAuth, requireRole };
