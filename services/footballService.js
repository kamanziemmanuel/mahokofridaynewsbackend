
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
//
// IMPORTANT:
// Keep BBS_API_KEY only in the backend .env.
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
//
// Big Balls league slugs:
//
// epl        = Premier League
// laliga     = La Liga
// serie-a    = Serie A
// bundesliga = Bundesliga
// ligue-1    = Ligue 1
// cl         = UEFA Champions League
//
// =====================================================

const DEFAULT_LEAGUES = [
  'epl',
  'laliga',
  'serie-a',
  'bundesliga',
  'ligue-1',
  'cl'
];

// =====================================================
// LEAGUE NAMES
// =====================================================

const LEAGUE_NAMES = {
  epl: 'Premier League',
  laliga: 'La Liga',
  'serie-a': 'Serie A',
  bundesliga: 'Bundesliga',
  'ligue-1': 'Ligue 1',
  cl: 'UEFA Champions League'
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

    const apiError =
      data?.error ||
      data?.message ||
      data?.errors ||
      'Big Balls Sports Data request failed.';

    const error =
      new Error(
        typeof apiError === 'string'
          ? apiError
          : 'Big Balls Sports Data request failed.'
      );

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
    data.error &&
    !data.data
  ) {

    const error =
      new Error(
        typeof data.error === 'string'
          ? data.error
          : 'Big Balls Sports Data returned an API error.'
      );

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
// Prevents one failed endpoint from breaking the
// complete /api/sports/updates package.
//
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
// NORMALIZE RESPONSE DATA
// =====================================================
//
// Big Balls normally returns:
//
// {
//   data: [...],
//   meta: {...}
// }
//
// Some endpoints may return an object inside data.
//
// =====================================================

const extractDataArray = (
  result
) => {

  if (
    !result ||
    !result.data
  ) {

    return [];
  }

  if (
    Array.isArray(
      result.data.data
    )
  ) {

    return result.data.data;
  }

  if (
    Array.isArray(
      result.data
    )
  ) {

    return result.data;
  }

  return [];
};

// =====================================================
// FIXTURES / MATCHES
// =====================================================
//
// Big Balls:
//
// GET /v1/matches
//
// Examples:
//
// ?sport=football
// ?sport=football&league=epl
// ?sport=football&status=live
//
// =====================================================

const getFixtures = async (
  params = {}
) => {

  const requestParams = {

    sport:
      'football',

    ...params

  };

  return bigBallsRequest(
    'matches',
    requestParams
  );
};

// =====================================================
// LEAGUES
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
// STANDINGS
// =====================================================
//
// GET /v1/standings
//
// Required:
//
// sport=football
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
// TOP SCORERS
// =====================================================
//
// Big Balls:
//
// GET /v1/leagues/:id/top-scorers
//
// Example:
//
// /v1/leagues/epl/top-scorers
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
// LIVE FIXTURES
// =====================================================
//
// GET /v1/matches?sport=football&status=live
//
// =====================================================

const getLiveFixtures = async () => {

  return bigBallsRequest(
    'matches',
    {

      sport:
        'football',

      status:
        'live'

    }
  );
};

// =====================================================
// UPCOMING FIXTURES
// =====================================================
//
// Big Balls supports match list filtering.
// We use status=upcoming.
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
// SPORTS UPDATES PACKAGE
// =====================================================
//
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
//
// =====================================================

const getSportsUpdates = async ({
  leagues = [],
  season
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
  // CURRENT SEASON
  // ---------------------------------------------------
  //
  // Big Balls supports season filtering for many
  // stored league endpoints.
  //
  // We intentionally do not force a season on the
  // generic match list unless the caller provides one.
  //
  // This prevents the frontend from receiving empty
  // data when the provider's current-season default
  // is more appropriate.
  //
  // ---------------------------------------------------

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
                ? { season }
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
                ? { season }
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
  // WAIT FOR REQUESTS
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
  // EXTRACT LIVE
  // ===================================================

  const liveData =
    liveResult.data || {};

  const liveMatches =
    extractDataArray(
      liveResult
    );

  // ===================================================
  // EXTRACT UPCOMING
  // ===================================================

  const upcomingData =
    upcomingResult.data || {};

  const upcomingMatches =
    extractDataArray(
      upcomingResult
    );

  // ===================================================
  // EXTRACT LEAGUES
  // ===================================================

  const leaguesData =
    leaguesResult.data || {};

  const leagueList =
    extractDataArray(
      leaguesResult
    );

  // ===================================================
  // NORMALIZE STANDINGS
  // ===================================================

  const standings = [];

  const standingsErrors = [];

  standingsData.forEach(
    (item) => {

      if (
        item.success &&
        item.data
      ) {

        const rows =
          extractDataArray(
            item
          );

        if (
          rows.length > 0
        ) {

          standings.push({

            leagueId:
              item.league,

            league:
              item.league,

            leagueName:
              item.leagueName,

            data:
              rows,

            meta:
              item.data.meta ||
              {}

          });
        }

      }

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

      if (
        item.success &&
        item.data
      ) {

        const rows =
          extractDataArray(
            item
          );

        if (
          rows.length > 0
        ) {

          topScorers.push({

            leagueId:
              item.league,

            league:
              item.league,

            leagueName:
              item.leagueName,

            data:
              rows,

            meta:
              item.data.meta ||
              {}

          });
        }

      }

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
  // PROVIDER METADATA
  // ===================================================

  const liveMeta =
    liveData.meta ||
    {};

  const upcomingMeta =
    upcomingData.meta ||
    {};

  const leaguesMeta =
    leaguesData.meta ||
    {};

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

  const hasProviderError =
    Boolean(

      liveResult.error ||

      upcomingResult.error ||

      leaguesResult.error ||

      standingsErrors.length > 0 ||

      topScorersErrors.length > 0

    );

  // ===================================================
  // RETURN SINGLE SPORTS PACKAGE
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
      season ||
      null,

    selectedLeagues,

    leagueNames:
      selectedLeagues.reduce(
        (acc, league) => {

          acc[league] =
            LEAGUE_NAMES[league] ||
            league;

          return acc;

        },
        {}
      ),

    updatedAt:
      new Date().toISOString(),

    live: {

      results:
        liveMatches.length,

      data:
        liveMatches,

      meta:
        liveMeta

    },

    fixtures: {

      results:
        upcomingMatches.length,

      data:
        upcomingMatches,

      meta:
        upcomingMeta

    },

    leagues: {

      results:
        leagueList.length,

      data:
        leagueList,

      meta:
        leaguesMeta

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

  bigBallsRequest,

  footballRequest:
    bigBallsRequest,

  getFixtures,

  getLiveFixtures,

  getUpcomingFixtures,

  getLeagues,

  getStandings,

  getTopScorers,

  getSportsUpdates

};

