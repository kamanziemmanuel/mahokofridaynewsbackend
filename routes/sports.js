// =====================================================
// MFN SPORTS ROUTES
// API-FOOTBALL
// =====================================================

const express = require('express');

const router = express.Router();

const {
  getFixtures,
  getLiveFixtures,
  getUpcomingFixtures,
  getLeagues,
  getStandings,
  getTopScorers,
  getSportsUpdates
} = require('../services/footballService');

// =====================================================
// SPORTS HOME / STATUS
// GET /api/sports
// =====================================================

router.get('/', async (req, res) => {
  return res.status(200).json({
    success: true,
    service: 'MFN Sports API',
    provider: 'API-Football',
    endpoints: {
      fixtures: '/api/sports/fixtures',
      live: '/api/sports/live',
      upcoming: '/api/sports/upcoming',
      leagues: '/api/sports/leagues',
      standings: '/api/sports/standings',
      topScorers: '/api/sports/top-scorers'
    }
  });
});

// =====================================================
// FIXTURES
// GET /api/sports/fixtures
//
// Examples:
// /api/sports/fixtures?league=39&season=2026
// /api/sports/fixtures?date=2026-08-28
// /api/sports/fixtures?team=33
// =====================================================

router.get('/fixtures', async (req, res) => {
  try {
    const {
      league,
      season,
      date,
      from,
      to,
      status,
      team,
      ids,
      next,
      last
    } = req.query;

    const params = {};

    if (league) params.league = league;
    if (season) params.season = season;
    if (date) params.date = date;
    if (from) params.from = from;
    if (to) params.to = to;
    if (status) params.status = status;
    if (team) params.team = team;
    if (ids) params.ids = ids;
    if (next) params.next = next;
    if (last) params.last = last;

    const data =
      await getFixtures(params);

    return res.status(200).json({
      success: true,
      provider: 'API-Football',
      results: data.results || 0,
      response: data.response || [],
      errors: data.errors || []
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
// GET /api/sports/live
// =====================================================

router.get('/live', async (req, res) => {
  try {

    const data =
      await getLiveFixtures();

    return res.status(200).json({
      success: true,
      provider: 'API-Football',
      results: data.results || 0,
      response: data.response || [],
      errors: data.errors || []
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
// GET /api/sports/upcoming
//
// Examples:
// /api/sports/upcoming?next=20
// /api/sports/upcoming?league=39&season=2026&next=20
// =====================================================

router.get('/upcoming', async (req, res) => {
  try {

    const {
      league,
      season,
      next
    } = req.query;

    const params = {
      next: next || 20
    };

    if (league) {
      params.league = league;
    }

    if (season) {
      params.season = season;
    }

    const data =
      await getUpcomingFixtures(params);

    return res.status(200).json({
      success: true,
      provider: 'API-Football',
      results: data.results || 0,
      response: data.response || [],
      errors: data.errors || []
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
// GET /api/sports/leagues
//
// Examples:
// /api/sports/leagues
// /api/sports/leagues?id=39
// /api/sports/leagues?country=England
// =====================================================

router.get('/leagues', async (req, res) => {
  try {

    const {
      id,
      season,
      country,
      type,
      search
    } = req.query;

    const params = {};

    if (id) params.id = id;
    if (season) params.season = season;
    if (country) params.country = country;
    if (type) params.type = type;
    if (search) params.search = search;

    const data =
      await getLeagues(params);

    return res.status(200).json({
      success: true,
      provider: 'API-Football',
      results: data.results || 0,
      response: data.response || [],
      errors: data.errors || []
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
// GET /api/sports/standings
//
// Required:
// league
// season
//
// Example:
// /api/sports/standings?league=39&season=2026
// =====================================================

router.get('/standings', async (req, res) => {
  try {

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

    const data =
      await getStandings(
        league,
        season,
        team
      );

    return res.status(200).json({
      success: true,
      provider: 'API-Football',
      results: data.results || 0,
      response: data.response || [],
      errors: data.errors || []
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
// GET /api/sports/top-scorers
//
// Required:
// league
// season
//
// Example:
// /api/sports/top-scorers?league=39&season=2026
// =====================================================

router.get(
  '/top-scorers',
  async (req, res) => {

    try {

      const {
        league,
        season
      } = req.query;

      if (!league || !season) {

        return res.status(400).json({
          success: false,
          error:
            'league and season are required.'
        });
      }

      const data =
        await getTopScorers(
          league,
          season
        );

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
        'SPORTS TOP SCORERS ERROR:',
        error
      );

      return res.status(
        error.status || 500
      ).json({
        success: false,
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
// SPORTS UPDATES PACKAGE
// GET /api/sports/updates
//
// Single endpoint for frontend.
//
// Example:
// /api/sports/updates
//
// Optional:
// /api/sports/updates?season=2026
//
// Multiple leagues:
// /api/sports/updates?season=2026&leagues=39,140,135
// =====================================================

router.get(
  '/updates',
  async (req, res) => {

    try {

      const season =
        Number(
          req.query.season
        ) ||
        new Date().getFullYear();

      // -----------------------------------------------
      // Parse league IDs
      // -----------------------------------------------

      let leagues = [];

      if (req.query.leagues) {

        leagues =
          String(
            req.query.leagues
          )
            .split(',')
            .map(
              (id) =>
                Number(
                  id.trim()
                )
            )
            .filter(
              (id) =>
                Number.isInteger(id) &&
                id > 0
            );

      }

      // -----------------------------------------------
      // Get complete sports package
      // -----------------------------------------------

      const data =
        await getSportsUpdates({
          leagues,
          season
        });

      // -----------------------------------------------
      // Response
      // -----------------------------------------------

      return res.status(200).json(
        data
      );

    } catch (error) {

      console.error(
        'SPORTS UPDATES ERROR:',
        error
      );

      return res.status(
        error.status || 500
      ).json({

        success: false,

        error:
          error.message ||
          'Unable to retrieve sports updates.',

        details:
          error.details || undefined

      });

    }
  }
);

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;
