const axios = require('axios');

const FOOTBALL_API_URL =
  'https://v3.football.api-sports.io';

const LEAGUES = {
  EPL: 39,
  LA_LIGA: 140,
  SERIE_A: 135,
  BUNDESLIGA: 78,
  LIGUE_1: 61
};

/**
 * Get fixtures for a specific league and season
 */
const getLeagueFixtures = async (leagueId, season) => {
  if (!process.env.FOOTBALL_API_KEY) {
    throw new Error(
      'FOOTBALL_API_KEY is missing from environment variables'
    );
  }

  const response = await axios.get(
    `${FOOTBALL_API_URL}/fixtures`,
    {
      params: {
        league: leagueId,
        season
      },
      headers: {
        'x-apisports-key':
          process.env.FOOTBALL_API_KEY
      },
      timeout: 15000
    }
  );

  return response.data;
};

/**
 * Get fixtures for all configured leagues
 */
const getAllLeagueFixtures = async season => {
  const results = {};

  for (const [name, leagueId] of Object.entries(LEAGUES)) {
    try {
      results[name] = await getLeagueFixtures(
        leagueId,
        season
      );
    } catch (error) {
      console.error(
        `Failed to load ${name}:`,
        error.message
      );

      results[name] = {
        response: [],
        errors: [error.message]
      };
    }
  }

  return results;
};

module.exports = {
  LEAGUES,
  getLeagueFixtures,
  getAllLeagueFixtures
};
