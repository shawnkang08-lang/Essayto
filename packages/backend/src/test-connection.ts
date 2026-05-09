import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Testing ESSAYTO Backend Configuration...\n');

// Check environment variables
console.log('📋 Environment Variables:');
console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`  PORT: ${process.env.PORT || 'not set'}`);
console.log(`  DATABASE_URL: ${process.env.DATABASE_URL ? '✓ set' : '✗ not set'}`);
console.log(`  REDIS_URL: ${process.env.REDIS_URL ? '✓ set' : '✗ not set'}`);
console.log(`  OPENAI_API_KEY: ${process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key-here' ? '✓ set' : '✗ not set'}`);
console.log(`  JWT_SECRET: ${process.env.JWT_SECRET ? '✓ set' : '✗ not set'}\n`);

// Test database connection
console.log('🗄️  Testing Database Connection...');
import('./config/database.js')
  .then(async (db) => {
    try {
      await db.connectDatabase(1, 1000); // 1 retry, 1 second delay
      console.log('  ✅ Database connection successful\n');
    } catch (error: any) {
      console.log('  ❌ Database connection failed:', error.message);
      console.log('  ℹ️  You need PostgreSQL running on localhost:5432\n');
    }
  })
  .catch((error) => {
    console.log('  ❌ Database module error:', error.message, '\n');
  });

// Test Redis connection
console.log('🔴 Testing Redis Connection...');
import('./config/redis.js')
  .then(async (redis) => {
    try {
      await redis.connectRedis();
      console.log('  ✅ Redis connection successful\n');
    } catch (error: any) {
      console.log('  ⚠️  Redis connection failed:', error.message);
      console.log('  ℹ️  Redis is optional - app will work without it\n');
    }
  })
  .catch((error) => {
    console.log('  ⚠️  Redis module error:', error.message, '\n');
  });

console.log('📝 Summary:');
console.log('  - If database fails: Install PostgreSQL or use Docker');
console.log('  - If Redis fails: Optional, app will continue without cache');
console.log('  - If OpenAI key missing: Set OPENAI_API_KEY in .env file\n');
