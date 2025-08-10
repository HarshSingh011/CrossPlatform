const mongoose=require('mongoose');
require('dotenv').config();

const connectdb = async (MONGO_URI) => {
    try {
        const options = {
            serverSelectionTimeoutMS: 30000, // 30 seconds
            socketTimeoutMS: 45000, // 45 seconds
            maxPoolSize: 10,
            minPoolSize: 5,
        };
        
        console.log('Attempting to connect to MongoDB...');
        await mongoose.connect(MONGO_URI, options);
        console.log('✅ MongoDB connected successfully');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        throw error;
    }
};

module.exports = connectdb;