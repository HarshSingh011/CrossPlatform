const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
    console.log('🧪 Testing MongoDB connection...');
    
    if (!process.env.MONGO_URI) {
        console.error('❌ MONGO_URI environment variable is not set');
        process.exit(1);
    }
    
    // Log the connection string (masked for security)
    const maskedUri = process.env.MONGO_URI.replace(/:([^@]+)@/, ':****@');
    console.log(`📡 Connecting to: ${maskedUri}`);
    
    try {
        const options = {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
            minPoolSize: 1,
        };
        
        await mongoose.connect(process.env.MONGO_URI, options);
        console.log('✅ MongoDB connection successful!');
        
        // Test a simple query
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`📚 Available collections: ${collections.length}`);
        collections.forEach(col => console.log(`  - ${col.name}`));
        
        // Test write operation
        const testCollection = mongoose.connection.db.collection('connection_test');
        await testCollection.insertOne({ test: true, timestamp: new Date() });
        console.log('✅ Write test successful!');
        
        // Clean up test document
        await testCollection.deleteOne({ test: true });
        console.log('🧹 Test cleanup completed');
        
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        
        if (error.message.includes('ENOTFOUND')) {
            console.error('🔍 DNS resolution failed. Check your internet connection and cluster URL.');
        } else if (error.message.includes('authentication failed')) {
            console.error('🔑 Authentication failed. Check your username and password.');
        } else if (error.message.includes('timeout')) {
            console.error('⏱️  Connection timeout. Check network connectivity and cluster status.');
        }
        
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Connection closed');
        process.exit(0);
    }
}

testConnection();
