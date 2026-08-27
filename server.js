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
// API-FOOTBALL
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
    error:
      'Too many login attempts. Try again later.'
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
      footballAPI:
        FOOTBALL_API_KEY
          ? 'configured'
          : 'not configured',
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
        sports: '/api/sports',
        uploads: '/uploads'
      }

    });

  }
);

// =====================================================
// SPORTS API CONFIG CHECK
// =====================================================

app.get(
  '/api/sports/status',
  (req, res) => {

    res.status(200).json({

      success: true,

      service: 'MFN Sports API',

      provider: 'API-Football',

      configured:
        Boolean(FOOTBALL_API_KEY),

      endpoint:
        FOOTBALL_API_URL

    });

  }
);

// =====================================================
// SPORTS API PROXY
// =====================================================
//
// Frontend will call:
//
// GET /api/sports/fixtures
//
// Backend calls API-Football:
//
// GET /fixtures
//
// The API key NEVER goes to the frontend.
// =====================================================

app.get(
  '/api/sports/fixtures',
  async (req, res) => {

    try {

      if (!FOOTBALL_API_KEY) {

        return res.status(500).json({

          success: false,

          error:
            'FOOTBALL_API_KEY is not configured on the server.'

        });

      }

      const {
        league,
        season,
        date,
        from,
        to,
        status,
        team,
        ids
      } = req.query;

      const params = new URLSearchParams();

      if (league) {
        params.append('league', league);
      }

      if (season) {
        params.append('season', season);
      }

      if (date) {
        params.append('date', date);
      }

      if (from) {
        params.append('from', from);
      }

      if (to) {
        params.append('to', to);
      }

      if (status) {
        params.append('status', status);
      }

      if (team) {
        params.append('team', team);
      }

      if (ids) {
        params.append('ids', ids);
      }

      const response = await fetch(
        `${FOOTBALL_API_URL}/fixtures?${params.toString()}`,
        {
          method: 'GET',

          headers: {
            'x-apisports-key':
              FOOTBALL_API_KEY,

            Accept:
              'application/json'
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {

        return res.status(
          response.status
        ).json({

          success: false,

          error:
            'API-Football request failed.',

          details: data

        });

      }

      return res.status(200).json({

        success: true,

        provider: 'API-Football',

        results:
          data.results || 0,

        response:
          data.response || [],

        errors:
          data.errors || []

      });

    } catch (error) {

      console.error(
        'SPORTS FIXTURES ERROR:',
        error
      );

      return res.status(500).json({

        success: false,

        error:
          'Unable to retrieve football fixtures.'

      });

    }

  }
);

// =====================================================
// SPORTS LEAGUES
// =====================================================

app.get(
  '/api/sports/leagues',
  async (req, res) => {

    try {

      if (!FOOTBALL_API_KEY) {

        return res.status(500).json({

          success: false,

          error:
            'FOOTBALL_API_KEY is not configured.'

        });

      }

      const {
        id,
        season,
        country
      } = req.query;

      const params = new URLSearchParams();

      if (id) {
        params.append('id', id);
      }

      if (season) {
        params.append('season', season);
      }

      if (country) {
        params.append('country', country);
      }

      const response = await fetch(
        `${FOOTBALL_API_URL}/leagues?${params.toString()}`,
        {
          method: 'GET',

          headers: {
            'x-apisports-key':
              FOOTBALL_API_KEY,

            Accept:
              'application/json'
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {

        return res.status(
          response.status
        ).json({

          success: false,

          error:
            'API-Football leagues request failed.',

          details: data

        });

      }

      return res.status(200).json({

        success: true,

        results:
          data.results || 0,

        response:
          data.response || [],

        errors:
          data.errors || []

      });

    } catch (error) {

      console.error(
        'SPORTS LEAGUES ERROR:',
        error
      );

      return res.status(500).json({

        success: false,

        error:
          'Unable to retrieve football leagues.'

      });

    }

  }
);

// =====================================================
// SPORTS STANDINGS
// =====================================================

app.get(
  '/api/sports/standings',
  async (req, res) => {

    try {

      if (!FOOTBALL_API_KEY) {

        return res.status(500).json({

          success: false,

          error:
            'FOOTBALL_API_KEY is not configured.'

        });

      }

      const {
        league,
        season,
        team
      } = req.query;

      if (!league || !season) {

        return res.status(400).json({

          success: false,

          error:
            'league and season are required.'

        });

      }

      const params =
        new URLSearchParams();

      params.append(
        'league',
        league
      );

      params.append(
        'season',
        season
      );

      if (team) {

        params.append(
          'team',
          team
        );

      }

      const response = await fetch(
        `${FOOTBALL_API_URL}/standings?${params.toString()}`,
        {
          method: 'GET',

          headers: {

            'x-apisports-key':
              FOOTBALL_API_KEY,

            Accept:
              'application/json'

          }
        }
      );

      const data =
        await response.json();

      if (!response.ok) {

        return res.status(
          response.status
        ).json({

          success: false,

          error:
            'API-Football standings request failed.',

          details: data

        });

      }

      return res.status(200).json({

        success: true,

        results:
          data.results || 0,

        response:
          data.response || [],

        errors:
          data.errors || []

      });

    } catch (error) {

      console.error(
        'SPORTS STANDINGS ERROR:',
        error
      );

      return res.status(500).json({

        success: false,

        error:
          'Unable to retrieve standings.'

      });

    }

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

console.log(
  'API routes loaded'
);

// =====================================================
// 404
// =====================================================

app.use(
  (req, res) => {

    res.status(404).json({

      error:
        'Route not found',

      path:
        req.originalUrl

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
      err.message ===
      'Not allowed by CORS'
    ) {

      return res.status(403).json({

        error:
          'CORS origin not allowed'

      });

    }

    res.status(500).json({

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

    console.log(
      'Connecting to MongoDB...'
    );

    await connectDB();

    console.log(
      'MongoDB connected successfully'
    );

    console.log(
      `Football API:
       ${
         FOOTBALL_API_KEY
           ? 'configured'
           : 'NOT CONFIGURED'
       }`
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
          `⚽ Sports:
           ${BACKEND_URL}/api/sports`
        );

        console.log(
          `❤️ Health:
           ${BACKEND_URL}/health`
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
