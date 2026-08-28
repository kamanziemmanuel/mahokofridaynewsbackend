
// =====================================================
// MFN SPORTS SERVICE
// API-FOOTBALL
// =====================================================

const FOOTBALL_API_URL =
  'https://v3.football.api-sports.io';

const FOOTBALL_API_KEY =
  process.env.FOOTBALL_API_KEY;

// =====================================================
// BASE REQUEST
// =====================================================

const footballRequest = async (
  endpoint,
  params = {}
) => {

  if (!FOOTBALL_API_KEY) {

    const error =
      new Error(
        'FOOTBALL_API_KEY is not configured.'
      );

    error.code =
      'FOOTBALL_API_NOT_CONFIGURED';

    error.status =
      503;

    throw error;
  }

  const searchParams =
    new URLSearchParams();

  Object.entries(params).forEach(
    ([key, value]) => {

      if (
        value !== undefined &&
        value !== null &&
        value !== ''
      ) {

        searchParams.append(
          key,
          value
        );

      }

    }
  );

  const queryString =
    searchParams.toString();

  const url =
    queryString
      ? `${FOOTBALL_API_URL}/${endpoint}?${queryString}`
      : `${FOOTBALL_API_URL}/${endpoint}`;

  let response;

  try {

    response =
      await fetch(
        url,
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

  } catch (networkError) {

    const error =
      new Error(
        'Unable to connect to API-Football.'
      );

    error.code =
      'FOOTBALL_API_NETWORK_ERROR';

    error.status =
      503;

    error.details =
      networkError.message;

    throw error;
  }

  let data = {};

  try {

    data =
      await response.json();

  } catch (jsonError) {

    const error =
      new Error(
        'API-Football returned an invalid response.'
      );

    error.code =
      'FOOTBALL_API_INVALID_RESPONSE';

    error.status =
      502;

    error.details =
      jsonError.message;

    throw error;
  }

  // ---------------------------------------------------
  // HTTP ERROR
  // ---------------------------------------------------

  if (!response.ok) {

    const error =
      new Error(
        'API-Football request failed.'
      );

    error.status =
      response.status;

    error.details =
      data;

    throw error;
  }

  // ---------------------------------------------------
  // API-FOOTBALL ACCESS ERROR
  // ---------------------------------------------------

  if (
    data &&
    data.errors &&
    Object.keys(data.errors).length > 0
  ) {

    const accessError =
      data.errors.access;

    if (accessError) {

      const error =
        new Error(
          accessError
        );

      error.code =
        'FOOTBALL_API_ACCESS_ERROR';

      error.status =
        403;

      error.details =
        data.errors;

      throw error;
    }

  }

  return data;
};

// =====================================================
// SAFE REQUEST
// =====================================================
//
// This wrapper prevents one failed API request from
// breaking the complete sports package.
// =====================================================

const safeFootballRequest = async (
  endpoint,
  params = {},
  fallback = []
) => {

  try {

    const data =
      await footballRequest(
        endpoint,
        params
      );

    return {

      success: true,

      data,

      error: null

    };

  } catch (error) {

    console.error(
      `API-FOOTBALL ERROR [${endpoint}]:`,
      error.message
    );

    return {

      success: false,

      data: {

        results: 0,

        response: fallback,

        errors: {
          access:
            error.message
        }

      },

      error: {

        message:
          error.message,

        code:
          error.code || null,

        status:
          error.status || 500,

        details:
          error.details || null

      }

    };

  }

};

// =====================================================
// FIXTURES
// =====================================================

const getFixtures = async (
  params = {}
) => {

  return footballRequest(
    'fixtures',
    params
  );

};

// =====================================================
// LEAGUES
// =====================================================

const getLeagues = async (
  params = {}
) => {

  return footballRequest(
    'leagues',
    params
  );

};

// =====================================================
// STANDINGS
// =====================================================

const getStandings = async (
  league,
  season,
  team
) => {

  const params = {

    league,

    season

  };

  if (team) {

    params.team =
      team;

  }

  return footballRequest(
    'standings',
    params
  );

};

// =====================================================
// TOP SCORERS
// =====================================================

const getTopScorers = async (
  league,
  season
) => {

  if (!league || !season) {

    throw new Error(
      'league and season are required.'
    );

  }

  return footballRequest(
    'players/topscorers',
    {
      league,
      season
    }
  );

};

// =====================================================
// LIVE FIXTURES
// =====================================================

const getLiveFixtures = async () => {

  return footballRequest(
    'fixtures',
    {
      live: 'all'
    }
  );

};

// =====================================================
// UPCOMING FIXTURES
// =====================================================

const getUpcomingFixtures = async (
  league,
  season,
  next = 20
) => {

  const params = {

    next

  };

  if (league) {

    params.league =
      league;

  }

  if (season) {

    params.season =
      season;

  }

  return footballRequest(
    'fixtures',
    params
  );

};

// =====================================================
// SPORTS UPDATES PACKAGE
// =====================================================
// GET /api/sports/updates
//
// Returns one complete package:
//
// live
// fixtures
// leagues
// standings
// topScorers
// errors
// =====================================================

const getSportsUpdates = async ({
  leagues = [],
  season = new Date().getFullYear()
} = {}) => {

  // ---------------------------------------------------
  // DEFAULT LEAGUES
  // ---------------------------------------------------

  const selectedLeagues =
    Array.isArray(leagues) &&
    leagues.length > 0

      ? leagues

      : [
          39,   // Premier League
          140,  // La Liga
          135,  // Serie A
          78,   // Bundesliga
          61,   // Ligue 1
          2     // UEFA Champions League
        ];

  // ---------------------------------------------------
  // LIVE
  // ---------------------------------------------------

  const livePromise =
    safeFootballRequest(
      'fixtures',
      {
        live: 'all'
      }
    );

  // ---------------------------------------------------
  // UPCOMING FIXTURES
  // ---------------------------------------------------

  const upcomingPromise =
    safeFootballRequest(
      'fixtures',
      {
        next: 20
      }
    );

  // ---------------------------------------------------
  // LEAGUES
  // ---------------------------------------------------

  const leaguesPromise =
    safeFootballRequest(
      'leagues',
      {
        season
      }
    );

  // ---------------------------------------------------
  // STANDINGS
  // ---------------------------------------------------

  const standingsPromises =
    selectedLeagues.map(
      async (league) => {

        const result =
          await safeFootballRequest(
            'standings',
            {
              league,
              season
            }
          );

        return {

          league,

          ...result

        };

      }
    );

  // ---------------------------------------------------
  // TOP SCORERS
  // ---------------------------------------------------

  const topScorersPromises =
    selectedLeagues.map(
      async (league) => {

        const result =
          await safeFootballRequest(
            'players/topscorers',
            {
              league,
              season
            }
          );

        return {

          league,

          ...result

        };

      }
    );

  // ---------------------------------------------------
  // WAIT FOR EVERYTHING
  // ---------------------------------------------------

  const [
    liveResult,
    upcomingResult,
    leaguesResult,
    standingsData,
    topScorersData
  ] = await Promise.all([

    livePromise,

    upcomingPromise,

    leaguesPromise,

    Promise.all(
      standingsPromises
    ),

    Promise.all(
      topScorersPromises
    )

  ]);

  // ---------------------------------------------------
  // EXTRACT LIVE
  // ---------------------------------------------------

  const liveData =
    liveResult.data || {};

  // ---------------------------------------------------
  // EXTRACT UPCOMING
  // ---------------------------------------------------

  const upcomingData =
    upcomingResult.data || {};

  // ---------------------------------------------------
  // EXTRACT LEAGUES
  // ---------------------------------------------------

  const leaguesData =
    leaguesResult.data || {};

  // ---------------------------------------------------
  // NORMALIZE STANDINGS
  // ---------------------------------------------------

  const standings = [];

  const standingsErrors = [];

  standingsData.forEach(
    (item) => {

      if (
        item.success &&
        item.data &&
        Array.isArray(
          item.data.response
        ) &&
        item.data.response.length > 0
      ) {

        standings.push({

          leagueId:
            item.league,

          data:
            item.data.response

        });

      }

      if (
        !item.success &&
        item.error
      ) {

        standingsErrors.push({

          league:
            item.league,

          error:
            item.error.message,

          code:
            item.error.code,

          status:
            item.error.status

        });

      }

    }
  );

  // ---------------------------------------------------
  // NORMALIZE TOP SCORERS
  // ---------------------------------------------------

  const topScorers = [];

  const topScorersErrors = [];

  topScorersData.forEach(
    (item) => {

      if (
        item.success &&
        item.data &&
        Array.isArray(
          item.data.response
        ) &&
        item.data.response.length > 0
      ) {

        topScorers.push({

          leagueId:
            item.league,

          data:
            item.data.response

        });

      }

      if (
        !item.success &&
        item.error
      ) {

        topScorersErrors.push({

          league:
            item.league,

          error:
            item.error.message,

          code:
            item.error.code,

          status:
            item.error.status

        });

      }

    }
  );

  // ---------------------------------------------------
  // BUILD ERRORS
  // ---------------------------------------------------

  const errors = {

    live:
      liveResult.error || null,

    fixtures:
      upcomingResult.error || null,

    leagues:
      leaguesResult.error || null,

    standings:
      standingsErrors,

    topScorers:
      topScorersErrors

  };

  // ---------------------------------------------------
  // DETECT PROVIDER FAILURE
  // ---------------------------------------------------

  const hasProviderError =
    Boolean(
      liveResult.error ||
      upcomingResult.error ||
      leaguesResult.error ||
      standingsErrors.length > 0 ||
      topScorersErrors.length > 0
    );

  // ---------------------------------------------------
  // RETURN COMPLETE PACKAGE
  // ---------------------------------------------------

  return {

    success:
      true,

    provider:
      'API-Football',

    providerAvailable:
      !hasProviderError,

    season,

    selectedLeagues,

    updatedAt:
      new Date().toISOString(),

    live: {

      results:
        liveData.results || 0,

      data:
        Array.isArray(
          liveData.response
        )
          ? liveData.response
          : []

    },

    fixtures: {

      results:
        upcomingData.results || 0,

      data:
        Array.isArray(
          upcomingData.response
        )
          ? upcomingData.response
          : []

    },

    leagues: {

      results:
        leaguesData.results || 0,

      data:
        Array.isArray(
          leaguesData.response
        )
          ? leaguesData.response
          : []

    },

    standings,

    topScorers,

    errors

  };

};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {

  footballRequest,

  getFixtures,

  getLiveFixtures,

  getUpcomingFixtures,

  getLeagues,

  getStandings,

  getTopScorers,

  getSportsUpdates

};

