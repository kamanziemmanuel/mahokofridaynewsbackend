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
// EXPORTS
// =====================================================

module.exports = {
  footballRequest,
  getFixtures,
  getLeagues,
  getStandings,
  getTopScorers,
  getLiveFixtures,
  getUpcomingFixtures
};
