import jwt from 'jsonwebtoken';
import User from '../models/user.js';

export const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'Access token required' });
    }

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (error) {
        return res.status(403).json({ success: false, message: 'Invalid token' });
    }
};

export const authenticateApiKey = async (req, res, next) => {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
        return res.status(401).json({ success: false, message: 'API key required' });
    }

    try {
        const user = await User.validateApiKey(apiKey);
        if (!user) {
            return res.status(403).json({ success: false, message: 'Invalid API key' });
        }
        req.user = user;
        next();
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};