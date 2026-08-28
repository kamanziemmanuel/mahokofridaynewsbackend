
// =====================================================
// MFN SPORTS ROUTES
// BIG BALLS SPORTS DATA
// =====================================================
//
// Base route:
// /api/sports
//
// Provider:
// Big Balls Sports Data
//
// Frontend-compatible endpoints:
// /api/sports
// /api/sports/fixtures
// /api/sports/live
// /api/sports/upcoming
// /api/sports/leagues
// /api/sports/standings
// /api/sports/top-scorers
// /api/sports/updates
//
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
// HELPER
// =====================================================

const sendProviderError = (
  res,
  error,
  fallbackMessage
) => {

  console.error(
    'MFN SPORTS ERROR:',
    error
  );

  return res.status(
    error?.status || 500
  ).json({

    success: false,

    provider:
      'Big Balls Sports Data',

    error:
      error?.message ||
      fallbackMessage,

    code:
      error?.code ||
      null,

    details:
      error?.details ||
      undefined

  });
};

// =====================================================
// SPORTS HOME / STATUS
// GET /api/sports
// =====================================================

router.get('/', async (req, res) => {

  return res.status(200).json({

    success: true,

    service:
      'MFN Sports API',

    provider:
      'Big Balls Sports Data',

    sport:
      'football',

    endpoints: {

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

      updates:
        '/api/sports/updates'

    }

  });

});

// =====================================================
// FIXTURES
// GET /api/sports/fixtures
// =====================================================
//
// Examples:
//
// /api/sports/fixtures
//
// /api/sports/fixtures?league=epl
//
// /api/sports/fixtures?status=live
//
// /api/sports/fixtures?status=upcoming
//
// /api/sports/fixtures?league=epl&status=upcoming
//
// =====================================================

router.get(
  '/fixtures',
  async (req, res) => {

    try {

      const {
        league,
        season,
        status,
        team,
        date,
        from,
        to,
        limit
      } = req.query;

      const params = {};

      if (league) {
        params.league =
          league;
      }

      if (season) {
        params.season =
          season;
      }

      if (status) {
        params.status =
          status;
      }

      if (team) {
        params.team =
          team;
      }

      if (date) {
        params.date =
          date;
      }

      if (from) {
        params.from =
          from;
      }

      if (to) {
        params.to =
          to;
      }

      if (limit) {
        params.limit =
          limit;
      }

      const data =
        await getFixtures(
          params
        );

      return res.status(200).json({

        success: true,

        provider:
          'Big Balls Sports Data',

        sport:
          'football',

        results:
          Array.isArray(data?.data)
            ? data.data.length
            : Array.isArray(data)
              ? data.length
              : 0,

        response:
          Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data)
              ? data
              : [],

        meta:
          data?.meta ||
          {},

        errors:
          data?.errors ||
          []

      });

    } catch (error) {

      return sendProviderError(
        res,
        error,
        'Unable to retrieve football fixtures.'
      );

    }

  }
);

// =====================================================
// LIVE MATCHES
// GET /api/sports/live
// =====================================================

router.get(
  '/live',
  async (req, res) => {

    try {

      const data =
        await getLiveFixtures();

      const matches =
        Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
            ? data
            : [];

      return res.status(200).json({

        success: true,

        provider:
          'Big Balls Sports Data',

        sport:
          'football',

        results:
          matches.length,

        response:
          matches,

        meta:
          data?.meta ||
          {},

        errors:
          data?.errors ||
          []

      });

    } catch (error) {

      return sendProviderError(
        res,
        error,
        'Unable to retrieve live football matches.'
      );

    }

  }
);

// =====================================================
// UPCOMING MATCHES
// GET /api/sports/upcoming
// =====================================================
//
// Examples:
//
// /api/sports/upcoming
//
// /api/sports/upcoming?next=20
//
// /api/sports/upcoming?league=epl
//
// /api/sports/upcoming?league=epl&season=2026
//
// =====================================================

router.get(
  '/upcoming',
  async (req, res) => {

    try {

      const {
        league,
        season,
        next
      } = req.query;

      const limit =
        Number(next) > 0
          ? Number(next)
          : 20;

      const data =
        await getUpcomingFixtures(
          league,
          season,
          limit
        );

      const matches =
        Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
            ? data
            : [];

      return res.status(200).json({

        success: true,

        provider:
          'Big Balls Sports Data',

        sport:
          'football',

        results:
          matches.length,

        response:
          matches,

        meta:
          data?.meta ||
          {},

        errors:
          data?.errors ||
          []

      });

    } catch (error) {

      return sendProviderError(
        res,
        error,
        'Unable to retrieve upcoming football matches.'
      );

    }

  }
);

// =====================================================
// LEAGUES
// GET /api/sports/leagues
// =====================================================
//
// Examples:
//
// /api/sports/leagues
//
// /api/sports/leagues?search=Premier
//
// /api/sports/leagues?country=England
//
// =====================================================

router.get(
  '/leagues',
  async (req, res) => {

    try {

      const {
        search,
        country,
        season
      } = req.query;

      const params = {};

      if (search) {
        params.search =
          search;
      }

      if (country) {
        params.country =
          country;
      }

      if (season) {
        params.season =
          season;
      }

      const data =
        await getLeagues(
          params
        );

      const leagues =
        Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
            ? data
            : [];

      return res.status(200).json({

        success: true,

        provider:
          'Big Balls Sports Data',

        sport:
          'football',

        results:
          leagues.length,

        response:
          leagues,

        meta:
          data?.meta ||
          {},

        errors:
          data?.errors ||
          []

      });

    } catch (error) {

      return sendProviderError(
        res,
        error,
        'Unable to retrieve football leagues.'
      );

    }

  }
);

// =====================================================
// STANDINGS
// GET /api/sports/standings
// =====================================================
//
// Required:
//
// league
//
// Examples:
//
// /api/sports/standings?league=epl
//
// /api/sports/standings?league=epl&season=2026
//
// =====================================================

router.get(
  '/standings',
  async (req, res) => {

    try {

      const {
        league,
        season
      } = req.query;

      if (!league) {

        return res.status(400).json({

          success: false,

          provider:
            'Big Balls Sports Data',

          error:
            'league is required.'

        });

      }

      const data =
        await getStandings(
          league,
          season
        );

      const standings =
        Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
            ? data
            : [];

      return res.status(200).json({

        success: true,

        provider:
          'Big Balls Sports Data',

        sport:
          'football',

        league,

        results:
          standings.length,

        response:
          standings,

        meta:
          data?.meta ||
          {},

        errors:
          data?.errors ||
          []

      });

    } catch (error) {

      return sendProviderError(
        res,
        error,
        'Unable to retrieve football standings.'
      );

    }

  }
);

// =====================================================
// TOP SCORERS
// GET /api/sports/top-scorers
// =====================================================
//
// Required:
//
// league
//
// Examples:
//
// /api/sports/top-scorers?league=epl
//
// /api/sports/top-scorers?league=epl&season=2026
//
// /api/sports/top-scorers?league=laliga
//
// =====================================================

router.get(
  '/top-scorers',
  async (req, res) => {

    try {

      const {
        league,
        season,
        limit
      } = req.query;

      if (!league) {

        return res.status(400).json({

          success: false,

          provider:
            'Big Balls Sports Data',

          error:
            'league is required.'

        });

      }

      const scorerLimit =
        Number(limit) > 0
          ? Number(limit)
          : 20;

      const data =
        await getTopScorers(
          league,
          season,
          scorerLimit
        );

      const scorers =
        Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
            ? data
            : [];

      return res.status(200).json({

        success: true,

        provider:
          'Big Balls Sports Data',

        sport:
          'football',

        league,

        results:
          scorers.length,

        response:
          scorers,

        meta:
          data?.meta ||
          {},

        errors:
          data?.errors ||
          []

      });

    } catch (error) {

      return sendProviderError(
        res,
        error,
        'Unable to retrieve football top scorers.'
      );

    }

  }
);

// =====================================================
// SPORTS UPDATES PACKAGE
// GET /api/sports/updates
// =====================================================
//
// THIS IS THE MAIN ENDPOINT FOR THE FRONTEND.
//
// Returns:
//
// live
// fixtures
// leagues
// standings
// topScorers
// errors
//
// Examples:
//
// /api/sports/updates
//
// /api/sports/updates?season=2026
//
// /api/sports/updates?leagues=epl,laliga,serie-a
//
// /api/sports/updates?season=2026&leagues=epl,laliga
//
// =====================================================

router.get(
  '/updates',
  async (req, res) => {

    try {

      // -----------------------------------------------
      // Season
      // -----------------------------------------------

      const season =
        req.query.season
          ? Number(
              req.query.season
            )
          : undefined;

      // -----------------------------------------------
      // Validate season
      // -----------------------------------------------

      if (
        season !== undefined &&
        (
          !Number.isInteger(
            season
          ) ||
          season < 1900 ||
          season > 2200
        )
      ) {

        return res.status(400).json({

          success: false,

          provider:
            'Big Balls Sports Data',

          error:
            'Invalid season. Use a valid year such as 2026.'

        });

      }

      // -----------------------------------------------
      // Parse leagues
      // -----------------------------------------------

      let leagues = [];

      if (req.query.leagues) {

        leagues =
          String(
            req.query.leagues
          )
            .split(',')

            .map(
              (league) =>
                league
                  .trim()
                  .toLowerCase()
            )

            .filter(
              Boolean
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
      // Return package
      // -----------------------------------------------

      return res.status(200).json(
        data
      );

    } catch (error) {

      return sendProviderError(
        res,
        error,
        'Unable to retrieve sports updates.'
      );

    }

  }
);

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;

