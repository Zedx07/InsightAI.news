const redis = require('redis');

class CacheManager {
    constructor() {
        // Configure Redis client for Redis Cloud
        // Use explicit configuration that works with Redis Cloud
        this.client = redis.createClient({
            username: process.env.REDIS_USERNAME || 'default',
            password: process.env.REDIS_PASSWORD || 'kRKq4VPS4eAWEtqtuWCWQlNKL6hxvbsS',
            socket: {
                host: process.env.REDIS_HOST || 'redis-14090.crce206.ap-south-1-1.ec2.redns.redis-cloud.com',
                port: parseInt(process.env.REDIS_PORT) || 14090,
                tls: false,  // Redis Cloud instance doesn't require TLS
                connectTimeout: 15000,
            }
        });

        this.client.on("error", (err) => console.log("Cache Manager Redis Error", err));
        this.client.on("connect", () => console.log("Cache Manager connected to Redis"));
        this.client.on("ready", () => console.log("Cache Manager Redis client is ready"));

        // Load TTL configurations from environment
        this.ttlConfig = {
            session: parseInt(process.env.SESSION_TTL) || 86400, // 24 hours
            vectorCache: parseInt(process.env.VECTOR_CACHE_TTL) || 21600, // 6 hours
            queryCache: parseInt(process.env.QUERY_CACHE_TTL) || 3600, // 1 hour
        };

        // Cache warming configuration
        this.cacheWarmingEnabled = process.env.ENABLE_CACHE_WARMING === 'true' || process.env.ENABLE_CACHE_WARMING === true;
        this.cacheWarmingInterval = parseInt(process.env.CACHE_WARMING_INTERVAL) || 60; // minutes
        this.popularQueries = process.env.POPULAR_QUERIES ?
            process.env.POPULAR_QUERIES.split(',').map(q => q.trim()) :
            [ 'latest news', 'breaking news', 'today\'s news' ];

        console.log(`CacheManager: Cache warming ${this.cacheWarmingEnabled ? 'enabled' : 'disabled'}`);
        console.log(`CacheManager: Warming interval: ${this.cacheWarmingInterval} minutes`);

        this.warmingInterval = null;
    }

    async connect() {
        if (!this.client.isOpen) {
            await this.client.connect();
        }
    }

    /**
     * Set cache with configurable TTL
     */
    async set(key, value, category = 'default') {
        try {
            await this.connect();

            let ttl;
            switch (category) {
                case 'session':
                    ttl = this.ttlConfig.session;
                    break;
                case 'vector':
                    ttl = this.ttlConfig.vectorCache;
                    break;
                case 'query':
                    ttl = this.ttlConfig.queryCache;
                    break;
                default:
                    ttl = 3600; // 1 hour default
            }

            const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
            await this.client.setEx(key, ttl, serializedValue);

            console.log(`Cache: Set ${key} with TTL ${ttl}s (category: ${category})`);
            return true;
        } catch (error) {
            console.error('Cache: Error setting cache', error);
            return false;
        }
    }

    /**
     * Get cached value
     */
    async get(key) {
        try {
            await this.connect();
            const value = await this.client.get(key);

            if (value) {
                try {
                    return JSON.parse(value);
                } catch {
                    return value; // Return as string if not JSON
                }
            }
            return null;
        } catch (error) {
            console.error('Cache: Error getting cache', error);
            return null;
        }
    }

    /**
     * Delete cached value
     */
    async del(key) {
        try {
            await this.connect();
            await this.client.del(key);
            console.log(`Cache: Deleted ${key}`);
            return true;
        } catch (error) {
            console.error('Cache: Error deleting cache', error);
            return false;
        }
    }

    /**
     * Check if key exists in cache
     */
    async exists(key) {
        try {
            await this.connect();
            const result = await this.client.exists(key);
            return result === 1;
        } catch (error) {
            console.error('Cache: Error checking existence', error);
            return false;
        }
    }

    /**
     * Get TTL for a key
     */
    async getTTL(key) {
        try {
            await this.connect();
            const ttl = await this.client.ttl(key);
            return ttl;
        } catch (error) {
            console.error('Cache: Error getting TTL', error);
            return -1;
        }
    }

    /**
     * Set TTL for existing key
     */
    async setTTL(key, ttl) {
        try {
            await this.connect();
            await this.client.expire(key, ttl);
            console.log(`Cache: Set TTL ${ttl}s for ${key}`);
            return true;
        } catch (error) {
            console.error('Cache: Error setting TTL', error);
            return false;
        }
    }

    /**
     * Get cache statistics
     */
    async getStats() {
        try {
            await this.connect();
            const keys = await this.client.keys('*');
            const stats = {
                totalKeys: keys.length,
                categories: {
                    sessions: 0,
                    queries: 0,
                    vectors: 0,
                    other: 0
                },
                keysByTTL: {
                    expiring: 0,
                    persistent: 0
                }
            };

            // Get memory info from Redis INFO command
            let memoryUsage = 0;
            try {
                const info = await this.client.info('memory');
                const memoryMatch = info.match(/used_memory:(\d+)/);
                if (memoryMatch) {
                    memoryUsage = parseInt(memoryMatch[ 1 ]);
                }
            } catch (memError) {
                console.log('Could not get memory info, using key count instead');
            }

            stats.memoryUsage = memoryUsage;

            for (const key of keys) {
                // Categorize keys
                if (key.startsWith('session:')) stats.categories.sessions++;
                else if (key.startsWith('query:')) stats.categories.queries++;
                else if (key.startsWith('vector:')) stats.categories.vectors++;
                else stats.categories.other++;

                // Check TTL
                try {
                    const ttl = await this.client.ttl(key);
                    if (ttl > 0) stats.keysByTTL.expiring++;
                    else stats.keysByTTL.persistent++;
                } catch (ttlError) {
                    console.log(`Could not get TTL for key: ${key}`);
                }
            }

            return stats;
        } catch (error) {
            console.error('Cache: Error getting stats', error);
            return null;
        }
    }

    /**
     * Clear cache by pattern
     */
    async clearByPattern(pattern) {
        try {
            await this.connect();
            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(keys);
                console.log(`Cache: Cleared ${keys.length} keys matching ${pattern}`);
            }
            return keys.length;
        } catch (error) {
            console.error('Cache: Error clearing by pattern', error);
            return 0;
        }
    }

    /**
     * Start cache warming process
     */
    startCacheWarming(ragService, dataService) {
        if (!this.cacheWarmingEnabled) {
            console.log('Cache warming is disabled');
            return;
        }

        console.log(`Starting cache warming every ${this.cacheWarmingInterval} minutes`);

        // Initial warming
        this.warmCache(ragService, dataService);

        // Set interval for periodic warming
        this.warmingInterval = setInterval(async () => {
            await this.warmCache(ragService, dataService);
        }, this.cacheWarmingInterval * 60 * 1000);
    }

    /**
     * Stop cache warming process
     */
    stopCacheWarming() {
        if (this.warmingInterval) {
            clearInterval(this.warmingInterval);
            this.warmingInterval = null;
            console.log('Cache warming stopped');
        }
    }

    /**
     * Warm cache with popular queries
     */
    async warmCache(ragService, dataService) {
        try {
            console.log('Cache warming: Starting cache warming process');

            // Ensure fresh data is available
            if (dataService.articles.length === 0) {
                await dataService.fetchRSSFeed();
                const chunks = dataService.getChunkedData();
                await ragService.embedAndStore(chunks);
            }

            // Pre-cache popular queries
            for (const query of this.popularQueries) {
                const cacheKey = `query:${Buffer.from(query).toString('base64')}`;

                // Check if already cached
                const cached = await this.exists(cacheKey);
                if (!cached) {
                    console.log(`Cache warming: Processing query "${query}"`);

                    try {
                        const relevantChunks = await ragService.retrieveRelevantChunks(query, 3);
                        if (relevantChunks.length > 0) {
                            const result = await ragService.generateAnswer(query, relevantChunks);

                            // Cache the result
                            await this.set(cacheKey, {
                                query,
                                answer: result.answer,
                                sources: result.sources,
                                timestamp: new Date().toISOString(),
                                warmed: true
                            }, 'query');
                        }
                    } catch (error) {
                        console.error(`Cache warming: Error processing query "${query}":`, error.message);
                    }
                } else {
                    console.log(`Cache warming: Query "${query}" already cached`);
                }
            }

            console.log('Cache warming: Process completed');
        } catch (error) {
            console.error('Cache warming: Error during warming process:', error);
        }
    }

    /**
     * Get cached query result
     */
    async getCachedQuery(query) {
        const cacheKey = `query:${Buffer.from(query).toString('base64')}`;
        const cached = await this.get(cacheKey);

        if (cached) {
            console.log(`Cache: Query result retrieved from cache for "${query}"`);
            return {
                ...cached,
                fromCache: true
            };
        }

        return null;
    }

    /**
     * Cache query result
     */
    async cacheQueryResult(query, answer, sources) {
        const cacheKey = `query:${Buffer.from(query).toString('base64')}`;
        const result = {
            query,
            answer,
            sources,
            timestamp: new Date().toISOString(),
            warmed: false
        };

        await this.set(cacheKey, result, 'query');
        console.log(`Cache: Query result cached for "${query}"`);
    }
}

module.exports = CacheManager;