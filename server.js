
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const sitemapRoutes = require("./routes/sitemap");
const connectDB = require('./db');

const app = express();

// =====================================================
// RENDER PROXY
// =====================================================

app.set('trust proxy', 1);

// =====================================================
// PORT
// =====================================================

const PORT = process.env.PORT || 5000;

// =====================================================
// URLs
// =====================================================

const FRONTEND_URL =
  'https://mahokofridaynews.com';

const WWW_FRONTEND_URL =
  'https://www.mahokofridaynews.com';

const OLD_FRONTEND_URL =
  'https://mahokofridaynews.onrender.com';

const BACKEND_URL =
  'https://mahokofridaynewsbackend.onrender.com';

// =====================================================
// API-FOOTBALL CONFIG
// =====================================================

const FOOTBALL_API_URL =
  'https://v3.football.api-sports.io';

const FOOTBALL_API_KEY =
  process.env.FOOTBALL_API_KEY;

// =====================================================
// CORS
// =====================================================

const allowedOrigins = [
  FRONTEND_URL,
  WWW_FRONTEND_URL,
  OLD_FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:5173'
];

const corsOptions = {
  origin: function (origin, callback) {

    // Requests without Origin:
    // Postman, server-to-server, mobile apps, etc.
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log(
      'Blocked by CORS:',
      origin
    );

    return callback(
      new Error('Not allowed by CORS')
    );
  },

  credentials: true,

  methods: [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS'
  ],

  allowedHeaders: [
    'Content-Type',
    'Authorization'
  ],

  exposedHeaders: [
    'Content-Length'
  ]
};

app.use(
  cors(corsOptions)
);

// Preflight
app.options(
  '*',
  cors(corsOptions)
);

// =====================================================
// SECURITY
// =====================================================

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: 'cross-origin'
    }
  })
);

// =====================================================
// BODY PARSER
// =====================================================

app.use(
  express.json({
    limit: '10mb'
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '10mb'
  })
);

// =====================================================
// RATE LIMIT
// =====================================================

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,

  max: 300,

  standardHeaders: true,

  legacyHeaders: false,

  message: {
    error: 'Too many requests'
  }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  max: 10,

  standardHeaders: true,

  legacyHeaders: false,

  message: {
    error:
      'Too many login attempts. Try again later.'
  }
});

// =====================================================
// LOGIN RATE LIMIT
// =====================================================

app.use(
  '/api/auth/login',
  loginLimiter
);
app.use("/", sitemapRoutes);
// =====================================================
// GENERAL API RATE LIMIT
// =====================================================

app.use(
  '/api',
  apiLimiter
);

// =====================================================
// UPLOADS
// =====================================================

app.use(
  '/uploads',
  express.static(
    path.join(
      __dirname,
      'uploads'
    )
  )
);

// =====================================================
// HEALTH CHECK
// =====================================================

app.get(
  '/health',
  (req, res) => {

    return res.status(200).json({

      status: 'ok',

      service: 'MFN Backend',

      database: 'MongoDB',

      footballAPI:
        FOOTBALL_API_KEY
          ? 'configured'
          : 'not configured',

      frontend:
        FRONTEND_URL,

      backend:
        BACKEND_URL,

      time:
        new Date().toISOString()

    });

  }
);

// =====================================================
// API ROOT
// =====================================================

app.get(
  '/api',
  (req, res) => {

    return res.status(200).json({

      status: 'ok',

      message:
        'MFN API is running',

      service:
        'MFN Backend',

      frontend:
        FRONTEND_URL,

      backend:
        BACKEND_URL,

      endpoints: {

        auth:
          '/api/auth',

        stories:
          '/api/stories',

        sports:
          '/api/sports',

        sportsStatus:
          '/api/sports/status',

        fixtures:
          '/api/sports/fixtures',

        live:
          '/api/sports/live',

        upcoming:
          '/api/sports/upcoming',

        leagues:
          '/api/sports/leagues',

        standings:
          '/api/sports/standings',

        topScorers:
          '/api/sports/top-scorers',

        uploads:
          '/uploads'

      }

    });

  }
);

// =====================================================
// SPORTS API CONFIG STATUS
// =====================================================

app.get(
  '/api/sports/status',
  (req, res) => {

    return res.status(200).json({

      success: true,

      service:
        'MFN Sports API',

      provider:
        'API-Football',

      configured:
        Boolean(FOOTBALL_API_KEY),

      endpoint:
        FOOTBALL_API_URL

    });

  }
);

// =====================================================
// SPORTS ROUTES
// =====================================================
//
// All sports endpoints are handled by:
// ./routes/sports.js
//
// Available:
//
// GET /api/sports
// GET /api/sports/fixtures
// GET /api/sports/live
// GET /api/sports/upcoming
// GET /api/sports/leagues
// GET /api/sports/standings
// GET /api/sports/top-scorers
//
// =====================================================

app.use(
  '/api/sports',
  require('./routes/sports')
);

// =====================================================
// AUTHENTICATION ROUTES
// =====================================================

app.use(
  '/api/auth',
  require('./routes/auth')
);

// =====================================================
// STORIES ROUTES
// =====================================================

app.use(
  '/api/stories',
  require('./routes/stories')
);

// =====================================================
// OTHER API ROUTES
// =====================================================

app.use(
  '/api',
  require('./routes/api')
);

console.log(
  'API routes loaded'
);

// =====================================================
// 404 HANDLER
// =====================================================

app.use(
  (req, res) => {

    return res.status(404).json({

      success: false,

      error:
        'Route not found',

      path:
        req.originalUrl

    });

  }
);

// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use(
  (err, req, res, next) => {

    console.error(
      'SERVER ERROR:',
      err.stack || err
    );

    // -----------------------------------------------
    // CORS ERROR
    // -----------------------------------------------

    if (
      err.message ===
      'Not allowed by CORS'
    ) {

      return res.status(403).json({

        success: false,

        error:
          'CORS origin not allowed'

      });

    }

    // -----------------------------------------------
    // DEFAULT ERROR
    // -----------------------------------------------

    return res.status(500).json({

      success: false,

      error:
        process.env.NODE_ENV ===
        'production'

          ? 'Internal server error'

          : err.message

    });

  }
);

// =====================================================
// START SERVER
// =====================================================

const start = async () => {

  try {

    console.log(
      'Starting MFN Backend...'
    );

    // -----------------------------------------------
    // DATABASE
    // -----------------------------------------------

    console.log(
      'Connecting to MongoDB...'
    );

    await connectDB();

    console.log(
      'MongoDB connected successfully'
    );

    // -----------------------------------------------
    // FOOTBALL API
    // -----------------------------------------------

    console.log(
      `Football API:
${FOOTBALL_API_KEY
  ? 'configured'
  : 'NOT CONFIGURED'}`
    );

    // -----------------------------------------------
    // SERVER
    // -----------------------------------------------

    app.listen(
      PORT,
      '0.0.0.0',
      () => {

        console.log('');
        console.log(
          '=========================================='
        );

        console.log(
          `🚀 MFN Backend running on port ${PORT}`
        );

        console.log(
          `🌐 Frontend: ${FRONTEND_URL}`
        );

        console.log(
          `🔌 Backend: ${BACKEND_URL}`
        );

        console.log(
          `📡 API: ${BACKEND_URL}/api`
        );

        console.log(
          `⚽ Sports: ${BACKEND_URL}/api/sports`
        );

        console.log(
          `❤️ Health: ${BACKEND_URL}/health`
        );

        console.log(
          `🏆 Standings: ${BACKEND_URL}/api/sports/standings`
        );

        console.log(
          `🥅 Top Scorers: ${BACKEND_URL}/api/sports/top-scorers`
        );

        console.log(
          `🔴 Live: ${BACKEND_URL}/api/sports/live`
        );

        console.log(
          '=========================================='
        );

      }
    );

  } catch (error) {

    console.error(
      '❌ Startup failed:',
      error
    );

    process.exit(1);

  }

};

// =====================================================
// RUN
// =====================================================

start();

