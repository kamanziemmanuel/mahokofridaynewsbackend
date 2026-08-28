
// =====================================================
// MFN SPORTS SERVICE
// BIG BALLS SPORTS DATA
// =====================================================

const BBS_API_URL =
  'https://api.bigballsdata.com/v1';

const BBS_API_KEY =
  process.env.BBS_API_KEY;

// =====================================================
// LEAGUE CONFIGURATION
// =====================================================

const LEAGUES = {
  epl: {
    code: 'epl',
    name: 'Premier League'
  },

  laLiga: {
    code: 'laliga',
    name: 'La Liga'
  },

  serieA: {
    code: 'seriea',
    name: 'Serie A'
  },

  bundesliga: {
    code: 'bundesliga',
    name: 'Bundesliga'
  },

  championsLeague: {
    code: 'ucl',
    name: 'UEFA Champions League'
  }
};

const DEFAULT_LEAGUES = [
  'epl',
  'laliga',
  'seriea',
  'bundesliga',
  'ucl'
];

// =====================================================
// BASE REQUEST
// =====================================================

const footballRequest = async (
  endpoint,
  params = {}
) => {

  if (!BBS_API_KEY) {

    const error =
      new Error(
        'BBS_API_KEY is not configured.'
      );

    error.code =
      'BBS_API_NOT_CONFIGURED';

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
      ? `${BBS_API_URL}/${endpoint}?${queryString}`
      : `${BBS_API_URL}/${endpoint}`;

  let response;

  try {

    response =
      await fetch(
        url,
        {
          method: 'GET',

          headers: {

            Authorization:
              `Bearer ${BBS_API_KEY}`,

            Accept:
              'application/json'

          }
        }
      );

  } catch (networkError) {

    const error =
      new Error(
        'Unable to connect to Big Balls Sports Data.'
      );

    error.code =
      'BBS_NETWORK_ERROR';

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
        'Big Balls Sports Data returned an invalid response.'
      );

    error.code =
      'BBS_INVALID_RESPONSE';

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
        data?.error ||
        data?.message ||
        'Big Balls Sports Data request failed.'
      );

    error.code =
      'BBS_HTTP_ERROR';

    error.status =
      response.status;

    error.details =
      data;

    throw error;
  }

  // ---------------------------------------------------
  // API ERROR
  // ---------------------------------------------------

  if (
    data &&
    data.error
  ) {

    const error =
      new Error(
        data.error.message ||
        data.error
      );

    error.code =
      'BBS_API_ERROR';

    error.status =
      502;

    error.details =
      data;

    throw error;
  }

  return data;
};

// =====================================================
// SAFE REQUEST
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
      `BIGBALLS ERROR [${endpoint}]:`,
      error.message
    );

    return {

      success: false,

      data: {

        results: 0,

        response:
          fallback,

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
    'matches',
    {
      sport: 'football',
      ...params
    }
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
    {
      sport: 'football',
      ...params
    }
  );

};

// =====================================================
// STANDINGS
// =====================================================

const getStandings = async (
  league
) => {

  if (!league) {

    throw new Error(
      'league is required.'
    );

  }

  return footballRequest(
    'standings',
    {
      sport: 'football',
      league
    }
  );

};

// =====================================================
// TOP SCORERS
// =====================================================

const getTopScorers = async (
  league
) => {

  if (!league) {

    throw new Error(
      'league is required.'
    );

  }

  return footballRequest(
    'players/stats',
    {
      sport: 'football',
      league,
      sort: 'goals'
    }
  );

};

// =====================================================
// LIVE FIXTURES
// =====================================================

const getLiveFixtures = async () => {

  return footballRequest(
    'matches',
    {
      sport: 'football',
      status: 'live'
    }
  );

};

// =====================================================
// UPCOMING FIXTURES
// =====================================================

const getUpcomingFixtures = async (
  league,
  limit = 20
) => {

  const params = {

    sport: 'football',

    status: 'scheduled',

    limit

  };

  if (league) {

    params.league =
      league;

  }

  return footballRequest(
    'matches',
    params
  );

};

// =====================================================
// NORMALIZE RESPONSE
// =====================================================

const extractArray = (
  result
) => {

  if (
    !result ||
    !result.data
  ) {
    return [];
  }

  const data =
    result.data;

  if (
    Array.isArray(data)
  ) {
    return data;
  }

  if (
    Array.isArray(
      data.data
    )
  ) {
    return data.data;
  }

  if (
    Array.isArray(
      data.response
    )
  ) {
    return data.response;
  }

  if (
    Array.isArray(
      data.matches
    )
  ) {
    return data.matches;
  }

  if (
    Array.isArray(
      data.results
    )
  ) {
    return data.results;
  }

  return [];
};

// =====================================================
// SPORTS UPDATES PACKAGE
// =====================================================
// GET /api/sports/updates
//
// Returns:
//
// live
// fixtures
// leagues
// standings
// topScorers
// errors
// =====================================================

const getSportsUpdates = async ({
  leagues = DEFAULT_LEAGUES
} = {}) => {

  // ---------------------------------------------------
  // SELECT LEAGUES
  // ---------------------------------------------------

  const selectedLeagues =
    Array.isArray(leagues) &&
    leagues.length > 0

      ? leagues

      : DEFAULT_LEAGUES;

  // ---------------------------------------------------
  // LIVE
  // ---------------------------------------------------

  const livePromise =
    safeFootballRequest(
      'matches',
      {
        sport: 'football',
        status: 'live'
      }
    );

  // ---------------------------------------------------
  // UPCOMING
  // ---------------------------------------------------

  const upcomingPromise =
    safeFootballRequest(
      'matches',
      {
        sport: 'football',
        status: 'scheduled',
        limit: 20
      }
    );

  // ---------------------------------------------------
  // LEAGUES
  // ---------------------------------------------------

  const leaguesPromise =
    safeFootballRequest(
      'leagues',
      {
        sport: 'football'
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
              sport: 'football',
              league
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
            'players/stats',
            {
              sport: 'football',
              league,
              sort: 'goals'
            }
          );

        return {

          league,

          ...result

        };

      }
    );

  // ---------------------------------------------------
  // WAIT
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
  // LIVE DATA
  // ---------------------------------------------------

  const liveData =
    extractArray(
      liveResult
    );

  // ---------------------------------------------------
  // FIXTURES DATA
  // ---------------------------------------------------

  const fixturesData =
    extractArray(
      upcomingResult
    );

  // ---------------------------------------------------
  // LEAGUES DATA
  // ---------------------------------------------------

  const leaguesData =
    extractArray(
      leaguesResult
    );

  // ---------------------------------------------------
  // STANDINGS
  // ---------------------------------------------------

  const standings = [];

  const standingsErrors = [];

  standingsData.forEach(
    (item) => {

      const data =
        extractArray(
          item
        );

      if (
        item.success &&
        data.length > 0
      ) {

        standings.push({

          leagueId:
            item.league,

          leagueName:
            LEAGUES[
              Object.keys(
                LEAGUES
              ).find(
                key =>
                  LEAGUES[key].code ===
                  item.league
              )
            ]?.name ||
            item.league,

          data

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
  // TOP SCORERS
  // ---------------------------------------------------

  const topScorers = [];

  const topScorersErrors = [];

  topScorersData.forEach(
    (item) => {

      const data =
        extractArray(
          item
        );

      if (
        item.success &&
        data.length > 0
      ) {

        topScorers.push({

          leagueId:
            item.league,

          leagueName:
            LEAGUES[
              Object.keys(
                LEAGUES
              ).find(
                key =>
                  LEAGUES[key].code ===
                  item.league
              )
            ]?.name ||
            item.league,

          data

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
  // ERRORS
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
  // PROVIDER STATUS
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
  // RETURN
  // ---------------------------------------------------

  return {

    success:
      true,

    provider:
      'Big Balls Sports Data',

    providerAvailable:
      !hasProviderError,

    selectedLeagues,

    updatedAt:
      new Date().toISOString(),

    live: {

      results:
        liveData.length,

      data:
        liveData

    },

    fixtures: {

      results:
        fixturesData.length,

      data:
        fixturesData

    },

    leagues: {

      results:
        leaguesData.length,

      data:
        leaguesData

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

  safeFootballRequest,

  getFixtures,

  getLiveFixtures,

  getUpcomingFixtures,

  getLeagues,

  getStandings,

  getTopScorers,

  getSportsUpdates

};

