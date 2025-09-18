# InsightAI.news - Intelligent News RAG System

## Overview

InsightAI.news is a sophisticated Retrieval-Augmented Generation (RAG) system that provides intelligent answers to news-related queries. The system features advanced caching mechanisms, configurable TTL (Time To Live) settings, and automatic cache warming for optimal performance.

## Features

- 🔍 **Smart News Analysis**: RAG-powered question answering using real-time news data
- 🚀 **High Performance Caching**: Multi-layer caching with Redis
- ⏰ **Configurable TTL**: Flexible time-to-live settings for different cache categories
- 🔥 **Auto Cache Warming**: Proactive caching of popular queries
- 💬 **Session Management**: Persistent chat sessions with configurable expiration
- 📊 **Cache Analytics**: Real-time cache statistics and monitoring

## Architecture

```
Frontend (React) ←→ Backend (Node.js/Express) ←→ Redis (Caching) ←→ ChromaDB (Vectors) ←→ Gemini AI
```

## Cache Management System

### Cache Categories

1. **Session Cache** (`session:*`)

   - Stores user chat sessions and conversation history
   - Default TTL: 24 hours (86400 seconds)
   - Auto-renewed on activity

2. **Query Cache** (`query:*`)

   - Caches frequently asked questions and responses
   - Default TTL: 1 hour (3600 seconds)
   - Includes source references and metadata

3. **Vector Cache** (`vector:*`)
   - Stores processed vector embeddings
   - Default TTL: 6 hours (21600 seconds)
   - Reduces computation overhead

### TTL Configuration

Configure cache expiration times in the `.env` file:

```env
# Cache Configuration
SESSION_TTL=86400          # Session TTL in seconds (24 hours)
VECTOR_CACHE_TTL=21600     # Vector cache TTL in seconds (6 hours)
QUERY_CACHE_TTL=3600       # Query result cache TTL in seconds (1 hour)
```

### Cache Warming

Automatic cache warming pre-loads popular queries to improve response times:

```env
# Cache Warming Configuration
ENABLE_CACHE_WARMING=true                    # Enable/disable cache warming
CACHE_WARMING_INTERVAL=60                    # Warming interval in minutes
POPULAR_QUERIES=what is the latest news,today's news,breaking news,politics,sports
```

## Installation & Setup

### Prerequisites

- Node.js 18+
- Redis Server
- ChromaDB Server

### Backend Setup

1. **Clone and install dependencies:**

```bash
cd Backend
npm install
```

2. **Configure environment variables:**

```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start Redis server:**

```bash
redis-server
```

4. **Start ChromaDB server:**

```bash
docker run -p 8000:8000 chromadb/chroma
```

5. **Start the backend server:**

```bash
npm start
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

## Cache Management API

### Get Cache Statistics

```http
GET /api/cache/stats
```

Response:

```json
{
  "success": true,
  "stats": {
    "totalKeys": 156,
    "categories": {
      "sessions": 23,
      "queries": 45,
      "vectors": 88,
      "other": 0
    },
    "keysByTTL": {
      "expiring": 140,
      "persistent": 16
    },
    "memoryUsage": 2048576
  }
}
```

### Manual Cache Warming

```http
POST /api/cache/warm
```

### Clear Cache by Pattern

```http
DELETE /api/cache/clear/query:*
```

**Or clear all cache:**

```http
DELETE /api/cache/clear
```

### Session TTL Management

**Refresh session TTL:**

```http
PUT /api/session/{sessionId}/refresh
```

**Check session TTL:**

```http
GET /api/session/{sessionId}/ttl
```

Response:

```json
{
  "success": true,
  "sessionId": "abc-123",
  "ttl": 3600,
  "expiresIn": "60 minutes"
}
```

## Performance Optimization

### Cache Hit Strategies

1. **Popular Query Caching**: Frequently asked questions are pre-cached
2. **Session Persistence**: User conversations persist across browser sessions
3. **Vector Optimization**: Embeddings cached to avoid recomputation
4. **Intelligent Warming**: System learns and caches trending topics

### TTL Best Practices

**Short TTL (1-5 minutes):**

- Real-time data queries
- Breaking news updates
- Live event information

**Medium TTL (1-6 hours):**

- General news queries
- Analysis and summaries
- Topic-based searches

**Long TTL (12-24 hours):**

- User sessions
- Historical data
- Static content

### Cache Warming Strategies

1. **Time-based Warming**: Schedule warming during off-peak hours
2. **Usage-based Warming**: Cache queries based on frequency patterns
3. **Topic-based Warming**: Pre-cache content for trending topics
4. **Geographic Warming**: Cache region-specific content

## Monitoring & Debugging

### Cache Metrics

Monitor cache performance using the stats endpoint:

```javascript
// Example monitoring script
const monitorCache = async () => {
  const response = await fetch("/api/cache/stats");
  const { stats } = await response.json();

  console.log("Cache Hit Ratio:", stats.hitRatio);
  console.log("Memory Usage:", stats.memory);
  console.log("Key Distribution:", stats.categories);
};
```

### Debug Cache Issues

1. **Check TTL settings**: Verify environment variables are loaded correctly
2. **Monitor Redis logs**: Watch for connection issues or memory warnings
3. **Analyze cache patterns**: Use stats endpoint to identify bottlenecks
4. **Test cache warming**: Manually trigger warming to verify functionality

## Configuration Examples

### Development Environment

```env
# Fast development cycles
SESSION_TTL=3600           # 1 hour
VECTOR_CACHE_TTL=1800      # 30 minutes
QUERY_CACHE_TTL=300        # 5 minutes
CACHE_WARMING_INTERVAL=15  # 15 minutes
```

### Production Environment

```env
# Optimized for performance
SESSION_TTL=86400          # 24 hours
VECTOR_CACHE_TTL=43200     # 12 hours
QUERY_CACHE_TTL=7200       # 2 hours
CACHE_WARMING_INTERVAL=60  # 60 minutes
```

### High-Traffic Setup

```env
# Maximum performance
SESSION_TTL=172800         # 48 hours
VECTOR_CACHE_TTL=86400     # 24 hours
QUERY_CACHE_TTL=14400      # 4 hours
CACHE_WARMING_INTERVAL=30  # 30 minutes
POPULAR_QUERIES=breaking news,latest updates,politics,sports,technology,health,business,entertainment
```

## Troubleshooting

### Common Issues

**Cache Not Working:**

- Verify Redis server is running on localhost:6379
- Check Redis connection in application logs
- Confirm environment variables are set correctly

**Poor Cache Hit Rates:**

- Increase TTL values for stable content
- Add more popular queries to warming list
- Monitor query patterns and adjust accordingly

**Memory Issues:**

- Implement cache size limits
- Set appropriate TTL values
- Use Redis memory optimization settings

**Session Expiration:**

- Check SESSION_TTL configuration
- Implement auto-refresh for active sessions
- Consider warning users before expiration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes with proper TTL/caching considerations
4. Add tests for cache functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details

---

**Need Help?** Check the API documentation or create an issue for support with caching configurations.
