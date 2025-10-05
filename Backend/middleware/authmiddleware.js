const AuthService = require("../services/authService");
const authService = new AuthService();

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'No token provided. Please login first, then try again'
            });
        }

        const token = authHeader.split(' ')[ 1 ]; //Bearer token -> token

        const decoded = authService.verifyToken(token);

        req.user = {
            userId: decoded.userId,
            email: decoded.email
        };

        next();

    } catch (error) {
        console.error('Auth middleware error:', error.message);
        return res.status(401).json({
            success: false,
            error: 'Invalid or expired token. Please login again.'
        });
    }
}

module.exports = authMiddleware;