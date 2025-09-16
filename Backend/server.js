require("dotenv").config();

const express = require("express");
const cors = require("cors");
const DataIngestionService = require("./services/dataIngestion");
const RAGPipeline = require("./services/ragPipeline");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const dataService = new DataIngestionService();
const RAGService = new RAGPipeline();

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

    const chunks = await ragService.retrieveRelevantChunks(query);
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

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
