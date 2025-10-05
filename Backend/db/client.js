const { PrismaClient } = require('@prisma/client');

class DatabaseClient {
    constructor() {
        this.prisma = new PrismaClient({
            log: [ 'query', 'info', 'warn', 'error' ],
            errorFormat: 'pretty',
            datasources: {
                db: {
                    url: process.env.DATABASE_URL || 'postgresql://insightaiuser:lucXIvEOaXbR0q2slgK7S1Ab9F0ENP1H@dpg-d3gdj5ffte5s73c1rqv0-a.singapore-postgres.render.com/authentication_hc9e'
                }
            }
        });

        this.isConnected = false;
        DatabaseClient.instance = this;
    }

    async connect() {
        try {
            if (this.isConnected) {
                console.log('⚠️ Database already connected');
                return;
            }

            await this.prisma.$connect();
            this.isConnected = true;
            console.log('Database connected successfully');

            // Test connection
            const healthy = await this.isHealthy();
            if (healthy) {
                console.log('Database health check passed');
            }
        } catch (error) {
            console.error('Database connection failed:', error.message);
            this.isConnected = false;
            throw error;
        }
    }

    async disconnect() {
        try {
            if (!this.isConnected) {
                console.log('⚠️ Database already disconnected');
                return;
            }

            await this.prisma.$disconnect();
            this.isConnected = false;
            console.log('Database disconnected successfully');
        } catch (error) {
            console.error('Error disconnecting database:', error.message);
            throw error;
        }
    }

    async isHealthy() {
        try {
            // Simple query to test database connection
            await this.prisma.$queryRaw`SELECT 1`;
            return true;
        } catch (error) {
            console.error('Database health check failed:', error.message);
            return false;
        }
    }

    getPrismaClient() {
        if (!this.prisma) {
            throw new Error('Prisma client not initialized');
        }
        return this.prisma;
    }

    // Helper method to get connection status
    getConnectionStatus() {
        return {
            connected: this.isConnected,
            timestamp: new Date().toISOString()
        };
    }

    // Static method to get instance
    static getInstance() {
        if (!DatabaseClient.instance) {
            DatabaseClient.instance = new DatabaseClient();
        }
        return DatabaseClient.instance;
    }
}

module.exports = new DatabaseClient();