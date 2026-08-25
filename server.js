require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

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

const FRONTEND_URL = 'https://mahokofridaynews.com';
const WWW_FRONTEND_URL = 'https://www.mahokofridaynews.com';
const OLD_FRONTEND_URL = 'https://mahokofridaynews.onrender.com';

const BACKEND_URL =
  'https://mahokofridaynewsbackend.onrender.com';

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

    console.log('Blocked by CORS:', origin);

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

app.use(cors(corsOptions));

// Preflight
app.options('*', cors(corsOptions));

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
    error: 'Too many login attempts. Try again later.'
  }
});

// Login protection
app.use(
  '/api/auth/login',
  loginLimiter
);

// General API protection
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
    path.join(__dirname, 'uploads')
  )
);

// =====================================================
// HEALTH CHECK
// =====================================================

app.get(
  '/health',
  (req, res) => {

    res.status(200).json({
      status: 'ok',
      service: 'MFN Backend',
      database: 'MongoDB',
      frontend: FRONTEND_URL,
      time: new Date().toISOString()
    });

  }
);

// =====================================================
// API ROOT
// =====================================================

app.get(
  '/api',
  (req, res) => {

    res.status(200).json({

      status: 'ok',

      message: 'MFN API is running',

      service: 'MFN Backend',

      frontend: FRONTEND_URL,

      backend: BACKEND_URL,

      endpoints: {
        auth: '/api/auth',
        stories: '/api/stories',
        uploads: '/uploads'
      }

    });

  }
);

// =====================================================
// API ROUTES
// =====================================================

// Authentication
app.use(
  '/api/auth',
  require('./routes/auth')
);

// Stories
app.use(
  '/api/stories',
  require('./routes/stories')
);

// Other API routes
app.use(
  '/api',
  require('./routes/api')
);

console.log('API routes loaded');

// =====================================================
// 404
// =====================================================

app.use(
  (req, res) => {

    res.status(404).json({

      error: 'Route not found',

      path: req.originalUrl

    });

  }
);

// =====================================================
// ERROR HANDLER
// =====================================================

app.use(
  (err, req, res, next) => {

    console.error(
      'SERVER ERROR:',
      err.stack || err
    );

    // CORS error
    if (
      err.message === 'Not allowed by CORS'
    ) {

      return res.status(403).json({
        error: 'CORS origin not allowed'
      });

    }

    res.status(500).json({

      error:
        process.env.NODE_ENV === 'production'
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

    console.log(
      'Connecting to MongoDB...'
    );

    await connectDB();

    console.log(
      'MongoDB connected successfully'
    );

    app.listen(
      PORT,
      '0.0.0.0',
      () => {

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
          `❤️ Health: ${BACKEND_URL}/health`
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
