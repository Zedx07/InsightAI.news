require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { CloudClient, ChromaClient } = require("chromadb");

class RAGPipeline {
  constructor() {
    // Check if cloud credentials are available
    const chromaApiKey = process.env.CHROMA_API_KEY;
    const chromaTenant = process.env.CHROMA_TENANT;
    const chromaDatabase = process.env.CHROMA_DATABASE;

    if (chromaApiKey && chromaTenant && chromaDatabase) {
      // Use cloud ChromaDB
      this.client = new CloudClient({
        apiKey: chromaApiKey,
        tenant: chromaTenant,
        database: chromaDatabase
      });
      console.log("ChromaDB: Using cloud client");
    } else {
      // Fallback to local ChromaDB
      const chromaUrl = process.env.CHROMA_URL || "http://localhost:8000";
      this.client = new ChromaClient({ path: chromaUrl });
      console.log("ChromaDB: Using local client at", chromaUrl);
    }

    this.collection = null;
    this.collectionName = "news_articles";

    //Gemini
    this.genAI = new GoogleGenerativeAI(
      "AIzaSyBygXCEz3tIFoYGGERHUkxVdgZwbdA5Vns"
    );
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  }

  async initializeVectorStore() {
    try {
      this.collection = await this.client.getOrCreateCollection({
        name: this.collectionName,
        metadata: { "hnsw:space": "cosine" },
      });

      console.log("ChromaDB: collection initialized");
      return true;
    } catch (error) {
      console.error("ChromaDB: collection initialization failed", error);
      return false;
    }
  }

  async clearVectorStore() {
    try {
      // Delete the existing collection
      await this.client.deleteCollection({ name: this.collectionName });
      console.log("ChromaDB: collection deleted");

      // Recreate the collection
      const initialized = await this.initializeVectorStore();
      if (initialized) {
        console.log("ChromaDB: collection cleared and recreated");
        return true;
      }
      return false;
    } catch (error) {
      console.error("ChromaDB: Error clearing collection", error);
      // If deletion fails, try to initialize anyway
      return await this.initializeVectorStore();
    }
  }

  async embedAndStore(chunks) {
    try {
      if (!this.collection) {
        const initialized = await this.initializeVectorStore();
        if (!initialized) {
          console.error(
            "ChromaDB: Cannot store chunks - collection not initialized"
          );
          return false;
        }
      }

      const documents = chunks.map((c) => c.text);
      const metadatas = chunks.map((c) => ({
        source_title: c.source?.title || "Unknown",
        source_link: c.source?.link || "#",
        pubDate: c.source?.pubDate || "Unknown",
      }));

      const ids = chunks.map((c) => c.id);

      // Debug logging
      console.log("ChromaDB Storage Debug:", {
        chunksLength: chunks.length,
        firstChunk: chunks[ 0 ]
          ? {
            hasText: !!chunks[ 0 ].text,
            hasSource: !!chunks[ 0 ].source,
            hasSourceTitle: !!chunks[ 0 ].source?.title,
            hasSourceLink: !!chunks[ 0 ].source?.link,
            hasPubDate: !!chunks[ 0 ].source?.pubDate,
            hasId: !!chunks[ 0 ].id,
            sourceTitle: chunks[ 0 ].source?.title,
            sourceLink: chunks[ 0 ].source?.link,
          }
          : "No chunks",
        firstMetadata: metadatas[ 0 ] || "No metadata",
      });

      await this.collection.add({
        documents: documents,
        metadatas: metadatas,
        ids: ids,
      });

      console.log(`ChromaDB: Stored ${chunks.length} chunks in vector store`);
      return true;
    } catch (error) {
      console.error("ChromaDB: Error storing chunks", error);
      return false;
    }
  }

  async retrieveRelevantChunks(query, topK = 3) {
    try {
      if (!this.collection) {
        const initialized = await this.initializeVectorStore();
        if (!initialized) {
          console.error(
            "ChromaDB: Cannot retrieve chunks - collection not initialized"
          );
          return [];
        }
      }

      const results = await this.collection.query({
        queryTexts: [ query ],
        nResults: topK,
        include: [ "documents", "metadatas", "distances" ],
      });

      // Debug logging
      console.log("ChromaDB Query Results Structure:", {
        hasDocuments: !!results.documents,
        hasMetadatas: !!results.metadatas,
        hasDistances: !!results.distances,
        documentsLength: results.documents ? results.documents[ 0 ]?.length : 0,
        metadatasLength: results.metadatas ? results.metadatas[ 0 ]?.length : 0,
        firstMetadata:
          results.metadatas && results.metadatas[ 0 ]
            ? results.metadatas[ 0 ][ 0 ]
            : "null",
      });

      const relevantChunks = [];
      if (results.documents && results.documents[ 0 ]) {
        for (let i = 0; i < results.documents[ 0 ].length; i++) {
          relevantChunks.push({
            text: results.documents[ 0 ][ i ],
            metadata:
              results.metadatas && results.metadatas[ 0 ]
                ? results.metadatas[ 0 ][ i ]
                : null,
            distance:
              results.distances && results.distances[ 0 ]
                ? results.distances[ 0 ][ i ]
                : null,
          });
        }
      }

      console.log(
        `ChromaDB: Retrieved ${relevantChunks.length} relevant chunks for query "${query}"`
      );
      return relevantChunks;
    } catch (error) {
      console.error("ChromaDB: Error retrieving relevant chunks", error);
      return [];
    }
  }

  async generateAnswer(query, relevantChunks) {
    try {
      const context = relevantChunks
        .map((chunk, index) => `[${index + 1}] ${chunk.text}`)
        .join("\n\n");
      const prompt = `Based on the following news articles, answer the user's question in well-formatted Markdown. If the information isn't available in the articles, let the user know.

Please format your response using proper Markdown syntax:
- Use **bold** for important terms and names
- Use bullet points (•) or numbered lists for multiple items
- Use headers (##) to organize different topics
- Keep paragraphs concise and readable
      
Context from news articles: 
${context}

User Question: ${query}
      
Answer (in Markdown format):`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const answer = response.text();

      return {
        answer,
        sources: relevantChunks.map((chunk) => ({
          title: chunk.metadata?.source_title || "Unknown Source",
          link: chunk.metadata?.source_link || "#",
        })),
      };
    } catch (error) {
      console.error(`Error generating answer:`, error.message);
      throw error;
    }
  }
}

module.exports = RAGPipeline;
