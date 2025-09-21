const redis = require('redis');
const { v4: uuidv4 } = require('uuid');

class SessionManager {
  constructor() {
    // Try to create Redis client with URL first, fallback to explicit config
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    try {
      // First attempt: use URL
      this.client = redis.createClient({ url: redisUrl });
    } catch (error) {
      console.log('Failed to create client with URL, trying explicit config:', error.message);

      // Fallback: explicit configuration for Redis Cloud
      this.client = redis.createClient({
        username: 'default',
        password: process.env.REDIS_PASSWORD || 'kRKq4VPS4eAWEtqtuWCWQlNKL6hxvbsS',
        socket: {
          host: process.env.REDIS_HOST || 'redis-14090.crce206.ap-south-1-1.ec2.redns.redis-cloud.com',
          port: parseInt(process.env.REDIS_PORT) || 14090
        }
      });
    }

    this.client.on("error", (err) => console.log("Redis Client Error", err));

    this.client.on("connect", () => {
      console.log("Connected to Redis server");
    });

    this.client.on("ready", () => {
      console.log("Redis client is ready to use");
    });

    // Load TTL from environment with fallback
    this.sessionTTL = parseInt(process.env.SESSION_TTL) || 86400; // 24 hours default
    console.log(`SessionManager: Using TTL of ${this.sessionTTL} seconds (${this.sessionTTL / 3600} hours)`);
  }

  async connect() {
    if (!this.client.isOpen) {
      await this.client.connect();
    }
  }

  async createSession() {
    try {
      await this.connect();
      const sessionId = uuidv4();
      const sessionData = {
        id: sessionId,
        createdAt: new Date().toISOString(),
        messages: [],
      };
      // Use configurable TTL
      await this.client.setEx(
        `session:${sessionId}`,
        this.sessionTTL,
        JSON.stringify(sessionData)
      );
      console.log(`Session created: ${sessionId} with TTL ${this.sessionTTL}s`);

      return sessionId;
    } catch (error) {
      console.error("Error creating session:", error);
      throw error;
    }
  }

  async getSession(sessionId) {
    try {
      await this.connect();
      const sessionData = await this.client.get(`session:${sessionId}`);
      if (!sessionData) {
        console.log("Session not found:", sessionId);
        throw new Error("Session not found");
      }

      return JSON.parse(sessionData);
    } catch (error) {
      console.error("Error getting session:", error);
      throw error;
    }
  }

  async addMessage(sessionId, message) {
    try {
      const session = await this.getSession(sessionId);
      session.messages.push({
        ...message,
        timestamp: new Date().toISOString(),
      });

      // Update session with configurable TTL
      await this.client.setEx(
        `session:${sessionId}`,
        this.sessionTTL,
        JSON.stringify(session)
      );
      console.log(`Added message to session ${sessionId}`);
      return session;
    } catch (error) {
      console.error("Error adding message:", error);
      throw error;
    }
  }

  async clearSession(sessionId) {
    try {
      await this.connect();
      await this.client.del(`session:${sessionId}`);
      console.log(`Cleared session: ${sessionId}`);
      return true;
    } catch (error) {
      console.error("Error clearing session:", error);
      throw error;
    }
  }

  // get only messages from a session
  async getSessionHistory(sessionId) {
    try {
      const session = await this.getSession(sessionId);
      return session.messages;
    } catch (error) {
      console.error("Error getting session history:", error);
      throw error;
    }
  }

  // Check if session exists
  async sessionExists(sessionId) {
    try {
      await this.connect();
      const exists = await this.client.exists(`session:${sessionId}`);
      return exists === 1;
    } catch (error) {
      console.error("Error checking session existence:", error);
      return false;
    }
  }

  // Get all sessions (for frontend session list)
  async getAllSessions() {
    try {
      await this.connect();
      const keys = await this.client.keys('session:*');
      const sessions = [];

      for (const key of keys) {
        try {
          const sessionData = await this.client.get(key);
          if (sessionData) {
            const session = JSON.parse(sessionData);
            // Get TTL information
            const ttl = await this.client.ttl(key);

            // Return basic session info for the frontend
            sessions.push({
              id: session.id,
              title: `Chat ${session.id.slice(0, 8)}`, // Short ID for title
              lastMessage: session.messages.length > 0
                ? session.messages[ session.messages.length - 1 ].content
                : 'No messages',
              timestamp: session.createdAt,
              ttl: ttl > 0 ? ttl : 0 // TTL in seconds, 0 if expired
            });
          }
        } catch (parseError) {
          console.error('Error parsing session data:', parseError);
        }
      }

      // Sort by creation date, newest first
      return sessions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      console.error("Error getting all sessions:", error);
      return [];
    }
  }

  /**
   * Extend session TTL (refresh session)
   */
  async refreshSession(sessionId) {
    try {
      await this.connect();
      const exists = await this.client.exists(`session:${sessionId}`);
      if (exists) {
        await this.client.expire(`session:${sessionId}`, this.sessionTTL);
        console.log(`Session ${sessionId} TTL refreshed to ${this.sessionTTL}s`);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error refreshing session:", error);
      return false;
    }
  }

  /**
   * Get session TTL
   */
  async getSessionTTL(sessionId) {
    try {
      await this.connect();
      const ttl = await this.client.ttl(`session:${sessionId}`);
      return ttl > 0 ? ttl : 0;
    } catch (error) {
      console.error("Error getting session TTL:", error);
      return 0;
    }
  }

  /**
   * Update TTL configuration
   */
  updateTTL(newTTL) {
    this.sessionTTL = newTTL;
    console.log(`SessionManager: TTL updated to ${this.sessionTTL} seconds`);
  }
}

module.exports = SessionManager;
