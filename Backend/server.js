require("dotenv").config();

const express = require("express");
const cors = require("cors");
const DataIngestionService = require("./services/dataIngestion");
const RAGPipeline = require("./services/ragPipeline");
const SessionManager = require('./services/sessionManager');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const dataService = new DataIngestionService();
const RAGService = new RAGPipeline();
const sessionManager = new SessionManager();

app.get("/api/health", (req, res) => {
  res.json({
    message: "RAG bot is up to Go!",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/articles", async (req, res) => {
  try {
    const articles = await dataService.fetchRSSFeed();
    res.json({
      success: true,
      count: articles.length,
      articles: articles,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get("/api/chunks", async (req, res) => {
  try {
    if (dataService.articles.length === 0) {
      await dataService.fetchRSSFeed();
    }

    const chunks = dataService.getChunkedData();
    res.json({
      success: true,
      count: chunks.length,
      chunks: chunks.slice(0, 5),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.post("/api/initialize-rag", async (req, res) => {
  try {
    if (dataService.articles.length === 0) {
      await dataService.fetchRSSFeed();
    }

    const chunks = dataService.getChunkedData();
    if (chunks.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No chunks available to store in vector store",
      });
    }

    // Clear existing collection to remove old data with null metadata
    await RAGService.clearVectorStore();

    await RAGService.embedAndStore(chunks);

    res.json({
      success: true,
      message: "RAG pipeline initialized and chunks stored",
      storedChunks: chunks.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.post("/api/search", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    const chunks = await RAGService.retrieveRelevantChunks(query);
    res.json({
      success: true,
      query,
      relevantChunks: chunks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

//gemini chat endpoint with session management
app.post("/api/chat", async (req, res) => {
  try {
    const { query, sessionId } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: "Please provide your query",
      });
    }

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: "Please provide a valid sessionId",
      });
    }



    console.log("Processing query", query, "for session", sessionId);

    //Store user query in session
    await sessionManager.addMessage(sessionId, { role: 'user', content: query });

    //RAG: retrieve relevant chunks
    const relevantChunks = await RAGService.retrieveRelevantChunks(query, 3);

    let answer, sources = [];


    if (relevantChunks.length === 0) {
      answer = "I couldn't find any relevant information in the news articles to answer your question.";

    } else {
      const result = await RAGService.generateAnswer(query, relevantChunks);
      answer = result.answer;
      sources = result.sources;
    }

    await sessionManager.addMessage(sessionId, { role: 'bot', content: answer, sources: sources });

    res.json({
      success: true,
      sessionId,
      query,
      answer,
      sources,
      retrievedChunks: relevantChunks.length,
    });

  } catch (error) {
    console.error("Chat endpoint error:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

//session management
app.post("/api/session/createNew", async (req, res) => {
  try {
    const sessionId = await sessionManager.createSession();
    res.json({
      success: true,
      sessionId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// New endpoint to get all sessions
app.get('/api/sessions', async (req, res) => {
  try {
    const sessions = await sessionManager.getAllSessions();
    res.json({
      success: true,
      sessions: sessions || []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      sessions: []
    });
  }
});

// New endpoint to validate session
app.get('/api/session/:sessionId/validate', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const isValid = await sessionManager.sessionExists(sessionId);
    res.json({
      success: true,
      valid: isValid
    });
  } catch (error) {
    res.json({
      success: false,
      valid: false
    });
  }
});

app.get('/api/session/:sessionId/history', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const history = await sessionManager.getSessionHistory(sessionId);
    res.json({
      success: true,
      sessionId,
      messages: history
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: 'Session not found'
    });
  }
});

app.delete('/api/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    await sessionManager.clearSession(sessionId);
    res.json({
      success: true,
      message: 'Session cleared'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
