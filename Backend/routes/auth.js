const express = require('express');
const router = express.Router();
const AuthService = require('../services/authService');
const authMiddleware = require('../middleware/authmiddleware');

const authService = new AuthService();

// Initialize auth service
authService.initialize().catch(err => {
    console.error('Failed to initialize auth service:', err);
});

// Register endpoint
router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        const user = await authService.register(email, password, name);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const result = await authService.login(email, password);

        res.json({
            success: true,
            message: 'Login successful',
            token: result.token,
            user: result.user
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            error: error.message
        });
    }
});

// Logout endpoint (client-side token removal mainly)
router.post('/logout', authMiddleware, (req, res) => {
    // With JWT, logout is mainly handled client-side by removing the token
    // You could add token blacklisting here if needed
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

// Get current user profile
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await authService.getUserById(req.user.userId);

        res.json({
            success: true,
            user
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            error: error.message
        });
    }
});

// Verify token endpoint (useful for frontend)
router.get('/verify', authMiddleware, (req, res) => {
    res.json({
        success: true,
        valid: true,
        user: req.user
    });
});

module.exports = router;