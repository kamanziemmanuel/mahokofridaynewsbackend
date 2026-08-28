
// =====================================================
// MFN SPORTS ROUTES
// BIG BALLS SPORTS DATA
// =====================================================

const express = require('express');

const router = express.Router();

const {
  getMatches,
  getLiveMatches,
  getUpcomingMatches,
  getLeagues,
  getStandings,
  getTopScorers,
  getSportsUpdates
} = require('../services/footballService');

// =====================================================
// DEFAULT LEAGUES
// =====================================================
//
// Big Balls league codes
//
// epl = Premier League
// laliga = La Liga
// seriea = Serie A
// bundesliga = Bundesliga
// ligue1 = Ligue 1
//
// Keep these as the five main leagues.
// =====================================================

const DEFAULT_LEAGUES = [
  'epl',
  'laliga',
  'seriea',
  'bundesliga',
  'ligue1'
];

// =====================================================
// SPORTS HOME / STATUS
// GET /api/sports
// =====================================================

router.get('/', async (req, res) => {

  return res.status(200).json({

    success: true,

    service: 'MFN Sports API',

    provider: 'Big Balls Sports Data',

    sport: 'football',

    defaultLeagues: DEFAULT_LEAGUES,

    endpoints: {

      updates:
        '/api/sports/updates',

      fixtures:
        '/api/sports/fixtures',

      live:
        '/api/sports/live',

      upcoming:
        '/api/sports/upcoming',

      leagues:
        '/api/sports/leagues',

      standings:
        '/api/sports/standings?league=epl',

      topScorers:
        '/api/sports/top-scorers?league=epl'

    }

  });

});

// =====================================================
// SPORTS UPDATES PACKAGE
//
// GET /api/sports/updates
//
// Optional:
// /api/sports/updates?leagues=epl,laliga,seriea
//
// This is the main endpoint for frontend.
// =====================================================

router.get('/updates', async (req, res) => {

  try {

    let leagues = DEFAULT_LEAGUES;

    if (req.query.leagues) {

      leagues = String(req.query.leagues)
        .split(',')
        .map(item => item.trim().toLowerCase())
        .filter(Boolean);

    }

    const data = await getSportsUpdates({
      leagues
    });

    return res.status(200).json(data);

  } catch (error) {

    console.error(
      'SPORTS UPDATES ERROR:',
      error
    );

    return res.status(
      error.status || 500
    ).json({

      success: false,

      provider:
        'Big Balls Sports Data',

      error:
        error.message ||
        'Unable to retrieve sports updates.',

      details:
        error.details || undefined

    });

  }

});

// =====================================================
// FIXTURES
//
// GET /api/sports/fixtures
//
// Examples:
//
// /api/sports/fixtures
// /api/sports/fixtures?league=epl
// /api/sports/fixtures?league=laliga
// /api/sports/fixtures?status=live
// =====================================================

router.get('/fixtures', async (req, res) => {

  try {

    const {
      league,
      status,
      date,
      limit,
      page
    } = req.query;

    const params = {

      sport: 'football',

      limit:
        Number(limit) || 50

    };

    if (league) {
      params.league =
        String(league).trim().toLowerCase();
    }

    if (status) {
      params.status =
        String(status).trim().toLowerCase();
    }

    if (date) {
      params.date = date;
    }

    if (page) {
      params.page =
        Number(page) || 1;
    }

    const data =
      await getMatches(params);

    return res.status(200).json({

      success: true,

      provider:
        'Big Balls Sports Data',

      sport:
        'football',

      results:
        Array.isArray(data.data)
          ? data.data.length
          : 0,

      response:
        Array.isArray(data.data)
          ? data.data
          : [],

      meta:
        data.meta || null,

      error:
        data.error || null

    });

  } catch (error) {

    console.error(
      'SPORTS FIXTURES ERROR:',
      error
    );

    return res.status(
      error.status || 500
    ).json({

      success: false,

      provider:
        'Big Balls Sports Data',

      error:
        error.message ||
        'Unable to retrieve football fixtures.',

      details:
        error.details || undefined

    });

  }

});

// =====================================================
// LIVE MATCHES
//
// GET /api/sports/live
//
// Optional:
// /api/sports/live?league=epl
// =====================================================

router.get('/live', async (req, res) => {

  try {

    const league =
      req.query.league
        ? String(req.query.league)
            .trim()
            .toLowerCase()
        : null;

    const data =
      await getLiveMatches(
        league
      );

    return res.status(200).json({

      success: true,

      provider:
        'Big Balls Sports Data',

      sport:
        'football',

      results:
        Array.isArray(data.data)
          ? data.data.length
          : 0,

      response:
        Array.isArray(data.data)
          ? data.data
          : [],

      meta:
        data.meta || null,

      error:
        data.error || null

    });

  } catch (error) {

    console.error(
      'SPORTS LIVE ERROR:',
      error
    );

    return res.status(
      error.status || 500
    ).json({

      success: false,

      provider:
        'Big Balls Sports Data',

      error:
        error.message ||
        'Unable to retrieve live matches.',

      details:
        error.details || undefined

    });

  }

});

// =====================================================
// UPCOMING MATCHES
//
// GET /api/sports/upcoming
//
// Examples:
//
// /api/sports/upcoming
// /api/sports/upcoming?league=epl
// =====================================================

router.get('/upcoming', async (req, res) => {

  try {

    const league =
      req.query.league
        ? String(req.query.league)
            .trim()
            .toLowerCase()
        : null;

    const limit =
      Number(req.query.limit) || 20;

    const data =
      await getUpcomingMatches(
        league,
        limit
      );

    return res.status(200).json({

      success: true,

      provider:
        'Big Balls Sports Data',

      sport:
        'football',

      results:
        Array.isArray(data.data)
          ? data.data.length
          : 0,

      response:
        Array.isArray(data.data)
          ? data.data
          : [],

      meta:
        data.meta || null,

      error:
        data.error || null

    });

  } catch (error) {

    console.error(
      'SPORTS UPCOMING ERROR:',
      error
    );

    return res.status(
      error.status || 500
    ).json({

      success: false,

      provider:
        'Big Balls Sports Data',

      error:
        error.message ||
        'Unable to retrieve upcoming matches.',

      details:
        error.details || undefined

    });

  }

});

// =====================================================
// LEAGUES
//
// GET /api/sports/leagues
//
// Optional:
// /api/sports/leagues
// /api/sports/leagues?league=epl
// =====================================================

router.get('/leagues', async (req, res) => {

  try {

    const data =
      await getLeagues();

    return res.status(200).json({

      success: true,

      provider:
        'Big Balls Sports Data',

      sport:
        'football',

      results:
        Array.isArray(data.data)
          ? data.data.length
          : 0,

      response:
        Array.isArray(data.data)
          ? data.data
          : [],

      meta:
        data.meta || null,

      error:
        data.error || null

    });

  } catch (error) {

    console.error(
      'SPORTS LEAGUES ERROR:',
      error
    );

    return res.status(
      error.status || 500
    ).json({

      success: false,

      provider:
        'Big Balls Sports Data',

      error:
        error.message ||
        'Unable to retrieve football leagues.',

      details:
        error.details || undefined

    });

  }

});

// =====================================================
// STANDINGS
//
// GET /api/sports/standings?league=epl
//
// IMPORTANT:
// league is REQUIRED.
//
// Examples:
//
// /api/sports/standings?league=epl
// /api/sports/standings?league=laliga
// /api/sports/standings?league=seriea
// /api/sports/standings?league=bundesliga
// /api/sports/standings?league=ligue1
// =====================================================

router.get('/standings', async (req, res) => {

  try {

    const league =
      req.query.league
        ? String(req.query.league)
            .trim()
            .toLowerCase()
        : null;

    if (!league) {

      return res.status(400).json({

        success: false,

        provider:
          'Big Balls Sports Data',

        error:
          'league is required.',

        example:
          '/api/sports/standings?league=epl',

        supportedLeagues:
          DEFAULT_LEAGUES

      });

    }

    const data =
      await getStandings(
        league
      );

    return res.status(200).json({

      success: true,

      provider:
        'Big Balls Sports Data',

      sport:
        'football',

      league,

      results:
        Array.isArray(data.data)
          ? data.data.length
          : 0,

      response:
        Array.isArray(data.data)
          ? data.data
          : [],

      meta:
        data.meta || null,

      error:
        data.error || null

    });

  } catch (error) {

    console.error(
      'SPORTS STANDINGS ERROR:',
      error
    );

    return res.status(
      error.status || 500
    ).json({

      success: false,

      provider:
        'Big Balls Sports Data',

      error:
        error.message ||
        'Unable to retrieve standings.',

      details:
        error.details || undefined

    });

  }

});

// =====================================================
// TOP SCORERS
//
// GET /api/sports/top-scorers?league=epl
//
// IMPORTANT:
// league is REQUIRED.
// =====================================================

router.get(
  '/top-scorers',
  async (req, res) => {

    try {

      const league =
        req.query.league
          ? String(req.query.league)
              .trim()
              .toLowerCase()
          : null;

      if (!league) {

        return res.status(400).json({

          success: false,

          provider:
            'Big Balls Sports Data',

          error:
            'league is required.',

          example:
            '/api/sports/top-scorers?league=epl',

          supportedLeagues:
            DEFAULT_LEAGUES

        });

      }

      const data =
        await getTopScorers(
          league
        );

      return res.status(200).json({

        success: true,

        provider:
          'Big Balls Sports Data',

        sport:
          'football',

        league,

        results:
          Array.isArray(data.data)
            ? data.data.length
            : 0,

        response:
          Array.isArray(data.data)
            ? data.data
            : [],

        meta:
          data.meta || null,

        error:
          data.error || null

      });

    } catch (error) {

      console.error(
        'SPORTS TOP SCORERS ERROR:',
        error
      );

      return res.status(
        error.status || 500
      ).json({

        success: false,

        provider:
          'Big Balls Sports Data',

        error:
          error.message ||
          'Unable to retrieve top scorers.',

        details:
          error.details || undefined

      });

    }

  }
);

// =====================================================
// EXPORT
// =====================================================

module.exports = router;

