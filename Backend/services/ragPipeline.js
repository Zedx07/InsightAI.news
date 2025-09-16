import { ChromaClient } from "chromadb";

class RAGPipeline {
  constructor() {
    this.client = new ChromaClient({ path: "http://localhost:8000" });
    this.collection = null;
    this.collectionName = "news_articles";
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

  async embedAndStore(chunks) {
    try {
      if (!this.collection) {
        await this.initializeVectorStore();
      }

      const documents = chunks.map((c) => c.text);
      const metadatas = chunks.map((c) => ({
        source_title: c.source_title,
        source_link: c.source_link,
        pubDate: c.pubDate,
      }));

      const ids = chunks.map((c) => c.id);

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
        await this.initializeVectorStore();
      }

      const results = await this.collection.query({
        queryTexts: [query],
        nResults: topK,
      });

      const relevantChunks = [];
      if (results.documents && results.documents[0]) {
        for (let i = 0; i < results.documents[0].length; i++) {
          relevantChunks.push({
            text: results.documents[0][i],
            metadata: results.metadatas[0][i],
            distance: results.distances[0][i],
          });
        }
      }

      console.log(
        `ChromaDB: Retrieved ${relevantChunks.length} relevant chunks for query "${query}"`
      );
      return relevantChunks;
    } catch (error) {
      console.error("ChromaDB: Error retrieving relevant chunks", error);
      // return [];
      throw error;
    }
  }
}

module.exports = RAGPipeline;