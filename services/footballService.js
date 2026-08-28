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
// .env:
// BBS_API_KEY=your_bigballs_api_key
//
// IMPORTANT:
// Never expose BBS_API_KEY in React/frontend.
// =====================================================

const BBS_API_URL =
  process.env.BBS_API_URL ||
  'https://api.bigballsdata.com/v1';

const BBS_API_KEY =
  process.env.BBS_API_KEY;

// =====================================================
// DEFAULT LEAGUES
// =====================================================

const DEFAULT_LEAGUES = [
  'epl',
  'laliga',
  'seriea',
  'bundesliga',
  'ligue1',
  'ucl'
];

// =====================================================
// LEAGUE NAMES
// =====================================================

const LEAGUE_NAMES = {
  epl: 'Premier League',
  laliga: 'La Liga',
  seriea: 'Serie A',
  bundesliga: 'Bundesliga',
  ligue1: 'Ligue 1',
  ucl: 'UEFA Champions League'
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
  // PROVIDER ERROR
  // ---------------------------------------------------

  if (
    data &&
    data.error &&
    !Array.isArray(data.error)
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
// EXTRACT DATA
// =====================================================
//
// Handles:
//
// { data: [] }
//
// and:
//
// { data: { ... } }
//
// =====================================================

const extractData = (
  result
) => {

  if (!result) {
    return [];
  }

  const payload =
    result.data;

  if (
    payload &&
    Array.isArray(
      payload.data
    )
  ) {

    return payload.data;
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
// EXTRACT META
// =====================================================

const extractMeta = (
  result
) => {

  if (
    result &&
    result.data &&
    result.data.meta
  ) {

    return result.data.meta;
  }

  return {};
};

// =====================================================
// FIXTURES
// =====================================================
//
// GET /v1/matches
//
// Official Big Balls pattern:
// /v1/matches?sport=football&league=epl
//
// This endpoint returns live + scheduled matches.
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
// LIVE MATCHES
// =====================================================
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
// LIVE FIXTURES
// =====================================================
//
// Alias kept for compatibility with sports.js
// =====================================================

const getLiveFixtures = async () => {

  return getLiveMatches();
};

// =====================================================
// UPCOMING / SCHEDULED MATCHES
// =====================================================
//
// IMPORTANT:
//
// Big Balls does NOT require status=upcoming.
//
// The normal /matches endpoint returns scheduled
// and recent matches.
//
// We therefore fetch matches and filter future dates
// locally.
// =====================================================

const getUpcomingFixtures = async (
  league,
  season,
  next = 20
) => {

  const params = {
    sport: 'football',
    limit: Math.max(
      Number(next) || 20,
      20
    )
  };

  if (league) {
    params.league = league;
  }

  if (season) {
    params.season = season;
  }

  const result =
    await bigBallsRequest(
      'matches',
      params
    );

  const matches =
    extractData({
      data: result
    });

  const now =
    Date.now();

  const getMatchDate = (
    match
  ) => {

    return (
      match?.date ||
      match?.start_time ||
      match?.startTime ||
      match?.kickoff ||
      match?.scheduled_at ||
      match?.scheduledAt ||
      null
    );
  };

  const upcoming =
    matches
      .filter(
        (match) => {

          const date =
            getMatchDate(
              match
            );

          if (!date) {
            return false;
          }

          const timestamp =
            new Date(
              date
            ).getTime();

          return (
            !Number.isNaN(
              timestamp
            ) &&
            timestamp > now
          );
        }
      )
      .sort(
        (a, b) => {

          const dateA =
            new Date(
              getMatchDate(a)
            ).getTime();

          const dateB =
            new Date(
              getMatchDate(b)
            ).getTime();

          return dateA - dateB;
        }
      )
      .slice(
        0,
        Number(next) || 20
      );

  return {

    ...result,

    data:
      upcoming,

    results:
      upcoming.length

  };
};

// =====================================================
// LEAGUES
// =====================================================
//
// GET /v1/leagues?sport=football
// =====================================================

const getLeagues = async (
  params = {}
) => {

  return bigBallsRequest(
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
//
// GET /v1/standings?sport=football&league=epl
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
// GET /v1/leagues/:id/top-scorers
//
// Example:
// /v1/leagues/epl/top-scorers
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

    limit:
      Number(limit) || 20

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
// SPORTS UPDATES PACKAGE
// =====================================================
//
// Single package for frontend:
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
  // ALL MATCHES
  // ---------------------------------------------------
  //
  // We do NOT use status=upcoming.
  //
  // Big Balls returns scheduled + recent matches
  // from /matches.
  //
  // ---------------------------------------------------

  const fixturesPromise =
    safeBigBallsRequest(
      'matches',
      {
        sport:
          'football',

        limit:
          100,

        ...(season
          ? { season }
          : {})
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
      async (
        league
      ) => {

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
      async (
        league
      ) => {

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
  // WAIT
  // ---------------------------------------------------

  const [
    liveResult,
    fixturesResult,
    leaguesResult,
    standingsData,
    topScorersData
  ] = await Promise.all([

    livePromise,

    fixturesPromise,

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
    extractData(
      liveResult
    );

  const liveMeta =
    extractMeta(
      liveResult
    );

  // ===================================================
  // FIXTURES DATA
  // ===================================================

  const allFixtures =
    extractData(
      fixturesResult
    );

  const fixturesMeta =
    extractMeta(
      fixturesResult
    );

  // ---------------------------------------------------
  // FIND UPCOMING
  // ---------------------------------------------------

  const now =
    Date.now();

  const getMatchDate = (
    match
  ) => {

    return (
      match?.date ||
      match?.start_time ||
      match?.startTime ||
      match?.kickoff ||
      match?.scheduled_at ||
      match?.scheduledAt ||
      null
    );
  };

  const upcomingMatches =
    allFixtures
      .filter(
        (match) => {

          const date =
            getMatchDate(
              match
            );

          if (!date) {
            return false;
          }

          const timestamp =
            new Date(
              date
            ).getTime();

          return (
            !Number.isNaN(
              timestamp
            ) &&
            timestamp > now
          );
        }
      )
      .sort(
        (a, b) => {

          const aTime =
            new Date(
              getMatchDate(a)
            ).getTime();

          const bTime =
            new Date(
              getMatchDate(b)
            ).getTime();

          return aTime - bTime;
        }
      )
      .slice(
        0,
        20
      );

  // ===================================================
  // LEAGUES
  // ===================================================

  const leagueList =
    extractData(
      leaguesResult
    );

  const leaguesMeta =
    extractMeta(
      leaguesResult
    );

  // ===================================================
  // STANDINGS
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
          extractData(
            item
          );

        standings.push({

          leagueId:
            item.league,

          league:
            item.league,

          leagueName:
            item.leagueName,

          data:
            rows,

          results:
            rows.length,

          meta:
            extractMeta(
              item
            )

        });
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
  // TOP SCORERS
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
          extractData(
            item
          );

        topScorers.push({

          leagueId:
            item.league,

          league:
            item.league,

          leagueName:
            item.leagueName,

          data:
            rows,

          results:
            rows.length,

          meta:
            extractMeta(
              item
            )

        });
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
  // ERRORS
  // ===================================================

  const errors = {

    live:
      liveResult.error ||
      null,

    fixtures:
      fixturesResult.error ||
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

      fixturesResult.error ||

      leaguesResult.error ||

      standingsErrors.length >

      0 ||

      topScorersErrors.length >

      0

    );

  // ===================================================
  // FINAL PACKAGE
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
    // UPCOMING / FIXTURES
    // -------------------------------------------------

    fixtures: {

      results:
        upcomingMatches.length,

      data:
        upcomingMatches,

      meta:
        fixturesMeta

    },

    // -------------------------------------------------
    // ALL FIXTURES
    // -------------------------------------------------

    allFixtures: {

      results:
        allFixtures.length,

      data:
        allFixtures,

      meta:
        fixturesMeta

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

  bigBallsRequest,

  footballRequest:
    bigBallsRequest,

  safeBigBallsRequest,

  getFixtures,

  getLiveMatches,

  getLiveFixtures,

  getUpcomingFixtures,

  getLeagues,

  getStandings,

  getTopScorers,

  getSportsUpdates

};
