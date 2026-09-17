#!/usr/bin/env node
/**
 * Clear corrupted resume.parsedData from MongoDB
 * This removes the parsedData field that was created by the old rule-based parser
 */

import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb://127.0.0.1:27017/ifind';

async function clearParsedData() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const users = db.collection('users');
    
    // Remove the parsedData field from all users
    const result = await users.updateMany(
      { 'resume.parsedData': { $exists: true } },
      { $unset: { 'resume.parsedData': '' } }
    );
    
    console.log(`✅ Cleared parsedData from ${result.modifiedCount} users`);
    console.log('✅ Done! Restart your browser and navigate to /dashboard?tab=resume');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

clearParsedData();
