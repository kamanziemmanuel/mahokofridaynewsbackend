
// =====================================================
// MFN SPORTS SERVICE
// BIG BALLS SPORTS DATA
// =====================================================
//
// Provider:
// https://bigballsdata.com
//
// API:
// https://api.bigballsdata.com/v1
//
// Environment:
// BBS_API_KEY=your_bigballs_api_key
// BBS_API_URL=https://api.bigballsdata.com/v1
//
// IMPORTANT:
// Keep BBS_API_KEY only in backend .env.
// NEVER expose it in React/frontend.
// =====================================================

const BBS_API_URL =
  process.env.BBS_API_URL ||
  'https://api.bigballsdata.com/v1';

const BBS_API_KEY =
  process.env.BBS_API_KEY;

// =====================================================
// DEFAULT FOOTBALL LEAGUES
// =====================================================

const DEFAULT_LEAGUES = [
  'epl',
  'laliga',
  'seriea',
  'bundesliga',
  'ligue1'
];

// =====================================================
// LEAGUE NAMES
// =====================================================

const LEAGUE_NAMES = {
  epl: 'Premier League',
  laliga: 'La Liga',
  seriea: 'Serie A',
  bundesliga: 'Bundesliga',
  ligue1: 'Ligue 1'
};

// =====================================================
// BASE REQUEST
// =====================================================

const bigBallsRequest = async (
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

  const cleanEndpoint =
    String(endpoint)
      .replace(/^\/+/, '');

  const url =
    queryString
      ? `${BBS_API_URL}/${cleanEndpoint}?${queryString}`
      : `${BBS_API_URL}/${cleanEndpoint}`;

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

    let message =
      'Big Balls Sports Data request failed.';

    if (
      typeof data?.error === 'string'
    ) {

      message =
        data.error;

    } else if (
      typeof data?.message === 'string'
    ) {

      message =
        data.message;

    } else if (
      typeof data?.errors === 'string'
    ) {

      message =
        data.errors;
    }

    const error =
      new Error(message);

    error.code =
      data?.code ||
      data?.error_code ||
      'BBS_API_ERROR';

    error.status =
      response.status;

    error.details =
      data;

    throw error;
  }

  // ---------------------------------------------------
  // API ERROR ENVELOPE
  // ---------------------------------------------------

  if (
    data &&
    data.success === false
  ) {

    const message =
      typeof data.error === 'string'
        ? data.error
        : 'Big Balls Sports Data returned an API error.';

    const error =
      new Error(message);

    error.code =
      data.code ||
      'BBS_API_ERROR';

    error.status =
      data.status ||
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
//
// One failed endpoint does not break the complete
// /api/sports/updates package.
// =====================================================

const safeBigBallsRequest = async (
  endpoint,
  params = {},
  fallback = []
) => {

  try {

    const data =
      await bigBallsRequest(
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

        success: false,

        results: 0,

        response: fallback,

        data: fallback,

        meta: {}

      },

      error: {

        message:
          error.message,

        code:
          error.code ||
          null,

        status:
          error.status ||
          500,

        details:
          error.details ||
          null

      }

    };
  }
};

// =====================================================
// EXTRACT ARRAY
// =====================================================
//
// Supports responses such as:
//
// {
//   response: []
// }
//
// OR
//
// {
//   data: []
// }
//
// OR
//
// {
//   data: {
//      data: []
//   }
// }
//
// =====================================================

const extractDataArray = (
  result
) => {

  if (!result) {
    return [];
  }

  const payload =
    result.data;

  if (!payload) {
    return [];
  }

  if (
    Array.isArray(
      payload.response
    )
  ) {

    return payload.response;
  }

  if (
    Array.isArray(
      payload.data
    )
  ) {

    return payload.data;
  }

  if (
    payload.data &&
    Array.isArray(
      payload.data.data
    )
  ) {

    return payload.data.data;
  }

  if (
    Array.isArray(
      payload
    )
  ) {

    return payload;
  }

  return [];
};

// =====================================================
// GET FIXTURES
// =====================================================
//
// GET /v1/matches
//
// =====================================================

const getFixtures = async (
  params = {}
) => {

  return bigBallsRequest(
    'matches',
    {
      sport: 'football',
      ...params
    }
  );
};

// =====================================================
// GET LIVE MATCHES
// =====================================================
//
// Big Balls:
//
// GET /v1/matches?sport=football&status=live
//
// =====================================================

const getLiveMatches = async () => {

  return bigBallsRequest(
    'matches',
    {
      sport: 'football',
      status: 'live'
    }
  );
};

// =====================================================
// ALIAS
// =====================================================
//
// Some older routes use getLiveFixtures.
// Keep both names available.
// =====================================================

const getLiveFixtures = async () => {

  return getLiveMatches();

};

// =====================================================
// GET UPCOMING MATCHES
// =====================================================
//
// GET /v1/matches
//
// =====================================================

const getUpcomingFixtures = async (
  league,
  season,
  next = 20
) => {

  const params = {

    sport:
      'football',

    status:
      'upcoming',

    limit:
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

  return bigBallsRequest(
    'matches',
    params
  );
};

// =====================================================
// GET LEAGUES
// =====================================================
//
// GET /v1/leagues?sport=football
//
// =====================================================

const getLeagues = async (
  params = {}
) => {

  return bigBallsRequest(
    'leagues',
    {
      sport:
        'football',

      ...params
    }
  );
};

// =====================================================
// GET STANDINGS
// =====================================================
//
// GET /v1/standings
//
// Required:
//
// league=epl
//
// =====================================================

const getStandings = async (
  league,
  season
) => {

  if (!league) {

    throw new Error(
      'league is required.'
    );
  }

  const params = {

    sport:
      'football',

    league

  };

  if (season) {

    params.season =
      season;
  }

  return bigBallsRequest(
    'standings',
    params
  );
};

// =====================================================
// GET TOP SCORERS
// =====================================================
//
// Verified Big Balls endpoint:
//
// /v1/leagues/epl/top-scorers
//
// Example:
//
// /api/sports/top-scorers?league=epl
//
// =====================================================

const getTopScorers = async (
  league,
  season,
  limit = 20
) => {

  if (!league) {

    throw new Error(
      'league is required.'
    );
  }

  const params = {

    limit

  };

  if (season) {

    params.season =
      season;
  }

  return bigBallsRequest(
    `leagues/${encodeURIComponent(
      league
    )}/top-scorers`,
    params
  );
};

// =====================================================
// GET SPORTS UPDATES
// =====================================================
//
// Single package for frontend:
//
// live
// fixtures
// leagues
// standings
// topScorers
//
// =====================================================

const getSportsUpdates = async ({
  leagues = [],
  season = null
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
    safeBigBallsRequest(
      'matches',
      {
        sport:
          'football',

        status:
          'live'
      }
    );

  // ---------------------------------------------------
  // UPCOMING
  // ---------------------------------------------------

  const upcomingPromise =
    safeBigBallsRequest(
      'matches',
      {
        sport:
          'football',

        status:
          'upcoming',

        limit:
          20
      }
    );

  // ---------------------------------------------------
  // LEAGUES
  // ---------------------------------------------------

  const leaguesPromise =
    safeBigBallsRequest(
      'leagues',
      {
        sport:
          'football'
      }
    );

  // ---------------------------------------------------
  // STANDINGS
  // ---------------------------------------------------

  const standingsPromises =
    selectedLeagues.map(
      async (league) => {

        const result =
          await safeBigBallsRequest(
            'standings',
            {
              sport:
                'football',

              league,

              ...(season
                ? {
                    season
                  }
                : {})
            }
          );

        return {

          league,

          leagueName:
            LEAGUE_NAMES[league] ||
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
          await safeBigBallsRequest(
            `leagues/${encodeURIComponent(
              league
            )}/top-scorers`,
            {
              limit:
                20,

              ...(season
                ? {
                    season
                  }
                : {})
            }
          );

        return {

          league,

          leagueName:
            LEAGUE_NAMES[league] ||
            league,

          ...result

        };
      }
    );

  // ---------------------------------------------------
  // WAIT FOR ALL
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

  // ===================================================
  // LIVE DATA
  // ===================================================

  const liveMatches =
    extractDataArray(
      liveResult
    );

  const liveMeta =
    liveResult.data?.meta ||
    {};

  // ===================================================
  // UPCOMING DATA
  // ===================================================

  const upcomingMatches =
    extractDataArray(
      upcomingResult
    );

  const upcomingMeta =
    upcomingResult.data?.meta ||
    {};

  // ===================================================
  // LEAGUES DATA
  // ===================================================

  const leagueList =
    extractDataArray(
      leaguesResult
    );

  const leaguesMeta =
    leaguesResult.data?.meta ||
    {};

  // ===================================================
  // NORMALIZE STANDINGS
  // ===================================================

  const standings = [];

  const standingsErrors = [];

  standingsData.forEach(
    (item) => {

      const rows =
        extractDataArray(
          item
        );

      // -------------------------------------------------
      // IMPORTANT:
      // results=0 is NOT treated as provider failure.
      // It simply means no stored standings are available.
      // -------------------------------------------------

      standings.push({

        leagueId:
          item.league,

        league:
          item.league,

        leagueName:
          item.leagueName,

        results:
          rows.length,

        data:
          rows,

        meta:
          item.data?.meta ||
          {},

        available:
          rows.length > 0

      });

      if (
        !item.success &&
        item.error
      ) {

        standingsErrors.push({

          league:
            item.league,

          leagueName:
            item.leagueName,

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

  // ===================================================
  // NORMALIZE TOP SCORERS
  // ===================================================

  const topScorers = [];

  const topScorersErrors = [];

  topScorersData.forEach(
    (item) => {

      const rows =
        extractDataArray(
          item
        );

      topScorers.push({

        leagueId:
          item.league,

        league:
          item.league,

        leagueName:
          item.leagueName,

        results:
          rows.length,

        data:
          rows,

        meta:
          item.data?.meta ||
          {},

        available:
          rows.length > 0

      });

      if (
        !item.success &&
        item.error
      ) {

        topScorersErrors.push({

          league:
            item.league,

          leagueName:
            item.leagueName,

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

  // ===================================================
  // ERRORS
  // ===================================================

  const errors = {

    live:
      liveResult.error ||
      null,

    fixtures:
      upcomingResult.error ||
      null,

    leagues:
      leaguesResult.error ||
      null,

    standings:
      standingsErrors,

    topScorers:
      topScorersErrors

  };

  // ===================================================
  // PROVIDER STATUS
  // ===================================================
  //
  // Empty standings are NOT automatically a provider
  // failure.
  //
  // ===================================================

  const hasProviderError =
    Boolean(

      liveResult.error ||

      upcomingResult.error ||

      leaguesResult.error ||

      standingsErrors.length > 0 ||

      topScorersErrors.length > 0

    );

  // ===================================================
  // RETURN
  // ===================================================

  return {

    success:
      true,

    provider:
      'Big Balls Sports Data',

    providerAvailable:
      !hasProviderError,

    sport:
      'football',

    season:
      season,

    selectedLeagues,

    leagueNames:
      selectedLeagues.reduce(
        (
          accumulator,
          league
        ) => {

          accumulator[league] =
            LEAGUE_NAMES[league] ||
            league;

          return accumulator;

        },
        {}
      ),

    updatedAt:
      new Date().toISOString(),

    // -------------------------------------------------
    // LIVE
    // -------------------------------------------------

    live: {

      results:
        liveMatches.length,

      data:
        liveMatches,

      meta:
        liveMeta

    },

    // -------------------------------------------------
    // UPCOMING
    // -------------------------------------------------

    fixtures: {

      results:
        upcomingMatches.length,

      data:
        upcomingMatches,

      meta:
        upcomingMeta

    },

    // -------------------------------------------------
    // LEAGUES
    // -------------------------------------------------

    leagues: {

      results:
        leagueList.length,

      data:
        leagueList,

      meta:
        leaguesMeta

    },

    // -------------------------------------------------
    // STANDINGS
    // -------------------------------------------------

    standings,

    // -------------------------------------------------
    // TOP SCORERS
    // -------------------------------------------------

    topScorers,

    // -------------------------------------------------
    // ERRORS
    // -------------------------------------------------

    errors

  };
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {

  // Base request
  bigBallsRequest,

  // Backward-compatible name
  footballRequest:
    bigBallsRequest,

  // Fixtures
  getFixtures,

  // Live
  getLiveMatches,
  getLiveFixtures,

  // Upcoming
  getUpcomingFixtures,

  // Leagues
  getLeagues,

  // Standings
  getStandings,

  // Top scorers
  getTopScorers,

  // Complete package
  getSportsUpdates

};

