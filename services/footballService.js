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
    throw new Error(
      'FOOTBALL_API_KEY is not configured.'
    );
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

  const url =
    `${FOOTBALL_API_URL}/${endpoint}?${searchParams.toString()}`;

  const response = await fetch(
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

  const data =
    await response.json();

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

  return data;
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
  params = {}
) => {

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
    params.league = league;
  }

  if (season) {
    params.season = season;
  }

  return footballRequest(
    'fixtures',
    params
  );

};
// =====================================================
// SPORTS UPDATES PACKAGE
// =====================================================

const getSportsUpdates = async ({
  leagues = [],
  season = new Date().getFullYear()
} = {}) => {

  // ---------------------------------------------------
  // Default leagues
  // ---------------------------------------------------
  //
  // API-Football common league IDs:
  //
  // 39  = Premier League
  // 140 = La Liga
  // 135 = Serie A
  // 78  = Bundesliga
  // 61  = Ligue 1
  // 2   = UEFA Champions League
  //
  // We use a smaller default set to avoid
  // unnecessary API requests.
  // ---------------------------------------------------

  const selectedLeagues =
    leagues.length > 0
      ? leagues
      : [
          39,
          140,
          135,
          78,
          61,
          2
        ];

  // ---------------------------------------------------
  // Run independent API requests in parallel
  // ---------------------------------------------------

  const livePromise =
    getLiveFixtures();

  const upcomingPromise =
    getUpcomingFixtures({
      next: 20
    });

  const leaguesPromise =
    getLeagues({
      season
    });

  // ---------------------------------------------------
  // Standings
  // ---------------------------------------------------

  const standingsPromises =
    selectedLeagues.map(
      (league) =>
        getStandings(
          league,
          season
        ).catch((error) => ({
          success: false,
          league,
          error:
            error.message
        }))
    );

  // ---------------------------------------------------
  // Top scorers
  // ---------------------------------------------------

  const topScorersPromises =
    selectedLeagues.map(
      (league) =>
        getTopScorers(
          league,
          season
        ).catch((error) => ({
          success: false,
          league,
          error:
            error.message
        }))
    );

  // ---------------------------------------------------
  // Wait for all requests
  // ---------------------------------------------------

  const [
    liveData,
    upcomingData,
    leaguesData,
    standingsData,
    topScorersData
  ] = await Promise.all([
    livePromise,
    upcomingPromise,
    leaguesPromise,
    Promise.all(standingsPromises),
    Promise.all(topScorersPromises)
  ]);

  // ---------------------------------------------------
  // Normalize standings
  // ---------------------------------------------------

  const standings = [];

  standingsData.forEach(
    (data, index) => {

      const leagueId =
        selectedLeagues[index];

      if (
        data &&
        data.response &&
        data.response.length > 0
      ) {

        standings.push({
          leagueId,
          data: data.response
        });

      }

    }
  );

  // ---------------------------------------------------
  // Normalize top scorers
  // ---------------------------------------------------

  const topScorers = [];

  topScorersData.forEach(
    (data, index) => {

      const leagueId =
        selectedLeagues[index];

      if (
        data &&
        data.response &&
        data.response.length > 0
      ) {

        topScorers.push({
          leagueId,
          data: data.response
        });

      }

    }
  );

  // ---------------------------------------------------
  // Return single package
  // ---------------------------------------------------

  return {

    success: true,

    provider: 'API-Football',

    season,

    updatedAt:
      new Date().toISOString(),

    live: {
      results:
        liveData.results || 0,

      data:
        liveData.response || []
    },

    fixtures: {
      results:
        upcomingData.results || 0,

      data:
        upcomingData.response || []
    },

    leagues: {
      results:
        leaguesData.results || 0,

      data:
        leaguesData.response || []
    },

    standings,

    topScorers,

    errors: {

      live:
        liveData.errors || [],

      fixtures:
        upcomingData.errors || [],

      leagues:
        leaguesData.errors || [],

      standings:
        standingsData
          .filter(
            (item) =>
              item &&
              item.success === false
          )
          .map(
            (item) => ({
              league:
                item.league,

              error:
                item.error
            })
          ),

      topScorers:
        topScorersData
          .filter(
            (item) =>
              item &&
              item.success === false
          )
          .map(
            (item) => ({
              league:
                item.league,

              error:
                item.error
            })
          )
    }
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
