const axios = require('axios');
const cheerio = require('cheerio');

class DataIngestionService {
  constructor() {
    this.articles = [];
  }

  async fetchRSSFeed() {
    try {
      // BBC RSS feed - reliable and simple
      const response = await axios.get('http://feeds.bbci.co.uk/news/rss.xml');
      const $ = cheerio.load(response.data, { xmlMode: true });
      
      const articles = [];
      
      // Parse RSS items (limit to 15)
      $('item').slice(0, 15).each((i, item) => {
        const title = $(item).find('title').text();
        const description = $(item).find('description').text();
        const link = $(item).find('link').text();
        const pubDate = $(item).find('pubDate').text();
        
        if (title && description) {
          articles.push({
            id: i + 1,
            title: title.trim(),
            description: description.trim(),
            link: link.trim(),
            pubDate: pubDate.trim()
          });
        }
      });
      
      this.articles = articles;
      console.log(`DataIngestion: Fetched ${articles.length} articles from RSS`);
      return articles;
      
    } catch (error) {
      console.error('DataIngestion: Error fetching RSS:', error.message);
      throw error;
    }
  }

  // TODO
  chunkText(text, maxLength = 500) {
    // Simple sentence-based chunking
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const chunks = [];
    let currentChunk = '';
    
    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if ((currentChunk + trimmed).length > maxLength && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = trimmed;
      } else {
        currentChunk += (currentChunk ? '. ' : '') + trimmed;
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }

  getChunkedData() {
    const allChunks = [];
    
    for (const article of this.articles) {
      // Combine title and description for better context
      const fullText = `${article.title}. ${article.description}`;
      const chunks = this.chunkText(fullText);
      
      chunks.forEach((chunk, index) => {
        allChunks.push({
          id: `${article.id}-${index}`,
          text: chunk,
          source: {
            title: article.title,
            link: article.link,
            pubDate: article.pubDate
          }
        });
      });
    }

    console.log(`DataIngestion: Created ${allChunks.length} text chunks`);
    return allChunks;
  }
}

module.exports = DataIngestionService;