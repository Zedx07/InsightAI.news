const API_BASE_URL = 'https://insightai-k8wq.onrender.com/api';

class ApiService {
    async createSession() {
        try {
            const response = await fetch(`${API_BASE_URL}/session/createNew`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return { session: { id: data.sessionId, title: 'New Chat' } };
        } catch (error) {
            console.error('Error creating session:', error);
            return { session: { id: Date.now(), title: 'New Chat' } };
        }
    }

    async sendMessage(query, sessionId) {
        try {
            const response = await fetch(`${API_BASE_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query, sessionId }),
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return { message: data.answer, sources: data.sources };
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    }

    async getSessions() {
        try {
            const response = await fetch(`${API_BASE_URL}/sessions`);
            const data = await response.json();
            return { sessions: data.sessions || [] };
        } catch (error) {
            console.error('Error getting sessions:', error);
            return { sessions: [] };
        }
    }

    async deleteSession(sessionId) {
        try {
            const response = await fetch(`${API_BASE_URL}/session/${sessionId}`, {
                method: 'DELETE',
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return true;
        } catch (error) {
            console.error('Error deleting session:', error);
            throw error;
        }
    }

    async getSessionHistory(sessionId) {
        try {
            const response = await fetch(`${API_BASE_URL}/session/${sessionId}/history`);
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            return data.messages;
        } catch (error) {
            console.error('Error getting session history:', error);
            return [];
        }
    }

    async validateSession(sessionId) {
        try {
            const response = await fetch(`${API_BASE_URL}/session/${sessionId}/validate`);
            const data = await response.json();
            return data.valid;
        } catch (error) {
            console.error('Error validating session:', error);
            return false;
        }
    }

    // Health check
    async healthCheck() {
        try {
            const response = await fetch(`${API_BASE_URL}/health`);
            return await response.json();
        } catch (error) {
            console.error('Health check failed:', error);
            return { status: 'error' };
        }
    }
}

export default new ApiService();