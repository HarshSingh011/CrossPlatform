
require('dotenv').config(); // Load env vars at the very top
const express = require('express');
const connectdb = require('./src/db/db');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const https = require('https');

const app = express();


const port = process.env.PORT || 3000;
const httpsPort = process.env.HTTPS_PORT || 3443;

// Connect to DB first, then set up middleware and routes
connectdb(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Database connected successfully");

    // Middleware
    app.use(express.json());
    app.use(cookieParser());
    app.use(cors({
      origin: process.env.FRONTEND_URL || 'https://localhost:5173',
      credentials: true
    }));

    // Serve static files from uploads directory
    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

    // Routes (require after DB connection)
    const authRoutes = require('./src/routes/authRoutes');
    const profileRoutes = require('./src/routes/profileRoutes');
    app.use('/api/auth', authRoutes);
    app.use('/api/profile', profileRoutes);

    // Root route
    app.get('/', (req, res) => {
      res.send('Syncly API is running');
    });

    // Start HTTP server
    app.listen(port, () => {
      console.log(`HTTP server running on port ${port}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      // Log the MongoDB URI (without password for security)
      const mongoUri = process.env.MONGO_URI;
      if (mongoUri) {
        const maskedUri = mongoUri.replace(/:([^@]+)@/, ':****@');
        console.log(`MongoDB URI: ${maskedUri}`);
      }
    });

    // Set up HTTPS server with SSL certificates
    try {
      if (
        fs.existsSync(process.env.SSL_KEY_PATH || './ssl/key.pem') &&
        fs.existsSync(process.env.SSL_CERT_PATH || './ssl/cert.pem')
      ) {
        const options = {
          key: fs.readFileSync(process.env.SSL_KEY_PATH || './ssl/key.pem'),
          cert: fs.readFileSync(process.env.SSL_CERT_PATH || './ssl/cert.pem')
        };
        const httpsServer = https.createServer(options, app);
        httpsServer.listen(httpsPort, () => {
          console.log(`HTTPS server running on port ${httpsPort}`);
        });
        httpsServer.on('error', (err) => {
          if (err.code === 'EADDRINUSE') {
            console.warn(`⚠️  HTTPS port ${httpsPort} already in use. Skipping HTTPS server startup.`);
          } else {
            console.error('Failed to start HTTPS server:', err.message);
          }
        });
      } else {
        console.log('SSL certificates not found. HTTPS server not started.');
        console.log('Run "npm run ssl:gen" to generate development certificates');
        console.log('For production, obtain proper SSL certificates');
      }
    } catch (error) {
      console.error('Failed to start HTTPS server:', error.message);
      console.log('⚠️ Running in HTTP mode only. For production, configure SSL certificates.');
    }
  })
  .catch((error) => {
    console.error("❌ Database connection error:", error.message);
    console.error("Please check your MongoDB connection string and network connectivity");
    process.exit(1);
  });

// Set up HTTPS server with SSL certificates
// In production, you should use real SSL certificates
try {
  // Check if SSL certificates exist
  if (
    fs.existsSync(process.env.SSL_KEY_PATH || './ssl/key.pem') && 
    fs.existsSync(process.env.SSL_CERT_PATH || './ssl/cert.pem')
  ) {
    // SSL certificate options
    const options = {
      key: fs.readFileSync(process.env.SSL_KEY_PATH || './ssl/key.pem'),
      cert: fs.readFileSync(process.env.SSL_CERT_PATH || './ssl/cert.pem')
    };

    // Create HTTPS server
    https.createServer(options, app).listen(httpsPort, () => {
      console.log(`HTTPS server running on port ${httpsPort}`);
    });
  } else {
    console.log('SSL certificates not found. HTTPS server not started.');
    console.log('Run "npm run ssl:gen" to generate development certificates');
    console.log('For production, obtain proper SSL certificates');
  }
} catch (error) {
  console.error('Failed to start HTTPS server:', error.message);
  console.log('⚠️ Running in HTTP mode only. For production, configure SSL certificates.');
}