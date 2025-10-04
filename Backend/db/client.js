const { PrismaClient } = require('@prisma/client');

class DatabaseClient {
    constructor() {
        this.prisma = new PrismaClient({
            log: [ 'query', 'info', 'warn', 'error' ],
            errorFormat: 'pretty',
            datasources: {
                db: {
                    url: 'postgresql://insightaiuser:lucXIvEOaXbR0q2slgK7S1Ab9F0ENP1H@dpg-d3gdj5ffte5s73c1rqv0-a.singapore-postgres.render.com/authentication_hc9e'
                }
            }
        });

        DatabaseClient.instance = this;
    }

    async connect() {

    }

    async disconnect() {

    }

    async isHealthy() {

    }

    async getPrismaClient() {

    }
}

module.exports = new DatabaseClient();
