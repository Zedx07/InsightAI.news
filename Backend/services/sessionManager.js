const redis = require('redis');
const { v4: uuidv4 } = require('uuid');

class SessionManager {
  constructor() {
    this.client = redis.createClient({
      host: "localhost",
      port: 6379,
    });

    this.client.on("error", (err) => console.log("Redis Client Error", err));

    this.client.on("connect", () => {
      console.log("Connected to Redis server");
    });
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
      // 24 hour ttl
      await this.client.setEx(
        `session:${sessionId}`,
        86400,
        JSON.stringify(sessionData)
      );
      console.log("Session created:", sessionId);

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

      // Update session with new TTL
      await this.client.setEx(
        `session:${sessionId}`,
        86400, // 24hrs
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
}

module.exports = SessionManager;
