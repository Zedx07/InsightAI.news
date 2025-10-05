const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')
const dbClient = require('../db/client');

class AuthService {
    constructor() {
        // this.prisma = dbClient.getPrismaClient();
        this.prisma = dbClient.getPrismaClient();
        this.JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
        this.JWT_EXPIRES_IN = '7d';
    }

    async initialize() {
        try {
            await dbClient.connect();
            console.log('Authentication service initialized successfully');
        } catch (error) {
            console.error('Error initializing AuthService', error);
            throw error;
        }
    }

    async register(email, password, name) {
        try {
            if (!email || !password) {
                throw new Error("Email & password are required");
            }

            if (password.length < 6) {
                throw new Error('Password must be at least 6 characters');
            }

            console.log('Trying to fetch exisitng details');

            const existingUser = await this.prisma.user.findUnique({
                where: { email }
            });

            console.log('Got existing user');

            if (existingUser) {
                throw new Error('User already exists with this email');
            }

            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            const user = await this.prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name: name || null
                },
                select: {
                    userId: true,
                    email: true,
                    name: true,
                    createdAt: true
                }
            });

            console.log(`User registered: ${email}`);

            return user;
        } catch (error) {
            console.error('Registration error:', error.message);
            throw error;
        }
    }

    //Login user
    async login(email, password, name) {
        try {
            if (!email || !password) {
                throw new Error('Email and password are required');
            }

            const user = await this.prisma.user.findUnique({
                where: { email }
            });

            console.log(`Fetched user`, user);


            if (!user) {
                throw new Error('Invalid email or password');
            }

            // Verify password
            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
                throw new Error('Invalid email or password');
            }

            await this.prisma.user.update({
                where: { userId: user.userId },
                data: { lastLogin: new Date() }
            });

            // Generate token
            const token = jwt.sign(
                {
                    userId: user.userId,
                    email: user.email
                },
                this.JWT_SECRET,
                { expiresIn: this.JWT_EXPIRES_IN }
            );

            console.log(`User logged in: ${email}`);

            return {
                token,
                user: {
                    userId: user.userId,
                    email: user.email,
                    name: user.name
                }
            };
        } catch (error) {
            console.error('Login error:', error.message);
            throw error;
        }
    }

    // Verify JWT token
    verifyToken(token) {
        try {
            const decoded = jwt.verify(token, this.JWT_SECRET);
            return decoded;
        } catch (error) {
            throw new Error('Invalid or expired token');
        }
    }


    // Get user by ID
    async getUserById(userId) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { userId: userId },
                select: {
                    userId: true,
                    email: true,
                    name: true,
                    createdAt: true,
                    lastLogin: true
                }
            });

            if (!user) {
                throw new Error('User not found');
            }

            return user;
        } catch (error) {
            console.error('Error getting user:', error.message);
            throw error;
        }
    }


    // Get user sessions
    async getUserSessions(userId) {
        try {
            const sessions = await this.prisma.session.findMany({
                where: { userId },
                orderBy: { lastActive: 'desc' },
                include: {
                    _count: {
                        select: { messages: true }
                    }
                }
            });

            return sessions;
        } catch (error) {
            console.error('Error getting user sessions:', error.message);
            throw error;
        }
    }
}

module.exports = AuthService;