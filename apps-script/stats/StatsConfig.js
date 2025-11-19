// ===== LEAGUE HUB - CONFIGURATION =====
// Purpose: Centralized configuration for all CLB League Hub modules
// Dependencies: None (base configuration file)
// Entry Point(s): Accessed by all modules via CONFIG object

var LEAGUE_CONFIG_DEFAULTS = {
  // ===== SHEET NAMES =====
  ERROR_LOG_SHEET: "Error Log",
  IMAGE_URLS_SHEET: "Image URLs",
  PLAYER_STATS_SHEET: "🧮 Players",
  TEAM_STATS_SHEET: "🧮 Teams",
  SCHEDULE_SHEET: "📅 Schedule",
  STANDINGS_SHEET: "🥇 Standings",
  ROSTERS_SHEET: "Rosters",
  TRANSACTIONS_SHEET: "Transactions",
  STAR_POINTS_SHEET: "Star Points",
  RETENTION_SHEET: "🎲 Retention",

  // Playoff sheet names
  PLAYOFF_PLAYER_STATS_SHEET: "🏆 Players",
  PLAYOFF_TEAM_STATS_SHEET: "🏆 Teams",
  PLAYOFF_SCHEDULE_SHEET: "🏆 Schedule",
  PLAYOFF_BRACKET_SHEET: "🏆 Bracket",

  // External spreadsheet containing box scores (game sheets)
  BOX_SCORE_SPREADSHEET_ID: "17x5VoZxGV88RYAiHEcq0M-rxSyZ0fp66OktmJk2AaEU",

  // Prefix for game sheets in the box score spreadsheet
  GAME_SHEET_PREFIX: "#W",

  // Prefix for playoff game sheets
  PLAYOFF_GAME_PREFIX: "*",

  // ===== DEBUG SETTINGS =====
  DEBUG: {
    ENABLE_LOGGING: true
  },

  // Column widths
  PLAYER_COLUMN_WIDTH: 175,
  LEAGUE_HUB_RANK_WIDTH: 50,
  LEAGUE_HUB_TEAM_WIDTH: 175,

  // Progress update frequency
  PROGRESS_UPDATE_FREQUENCY: 4,

  // Recent schedule weeks to show on League Hub
  RECENT_SCHEDULE_WEEKS: 1,

  // Data validation thresholds
  MAX_GAMES_PER_SEASON: 14,
  MAX_AB_PER_GAME: 6,
  MAX_IP_PER_GAME: 7.0,
  MAX_HITS_PER_GAME: 6,
  MAX_HR_PER_GAME: 6,

  // Playoff configuration
  PLAYOFF_TEAMS: 4,
  ENABLE_WILDCARD_ROUND: false,    // True = 5-team playoffs (1,2,3 + 4v5) // False = 4-team playoffs (1v4, 2v3)
  QUARTERFINALS_WINS_REQUIRED: 2,  // Default: 2 (Best of 3)
  SEMIFINALS_WINS_REQUIRED: 2,     // Default: 3 (Best of 5)
  FINALS_WINS_REQUIRED: 2,         // Default: 4 (Best of 7)

  // Playoff round prefixes (used in game sheet names and schedule)
  WILDCARD_ROUND_PREFIX: "WC",      // Quarterfinals/Wildcard (*Q1, *Q2)
  SEMIFINAL_ROUND_PREFIX: "CS",     // Semifinals (*S1-A, *S2-B)
  FINALS_ROUND_PREFIX: "KC",        // Finals (*F1, *F2)

  // Title qualification multipliers
  MIN_AB_MULTIPLIER: 2.1,
  MIN_IP_MULTIPLIER: 1.0,

  // Team roster settings
  MAX_PLAYERS_PER_ROSTER: 11,
  WARN_ON_ROSTER_OVERFLOW: true,

  // ===== BOX SCORE CELL LOCATIONS =====
  BOX_SCORE_MASTER_RANGE: "B3:R50",
  BOX_SCORE_TEAM_INFO: "B3:F4",
  BOX_SCORE_WLS_DATA: "M48:R50",
  BOX_SCORE_MVP_CELL: "Q48",
  BOX_SCORE_WINNER_DATA: "N48:N50",
  BOX_SCORE_HITTING_START_ROW: 29,
  BOX_SCORE_HITTING_START_COL: 2,
  BOX_SCORE_HITTING_NUM_ROWS: 22,
  BOX_SCORE_HITTING_NUM_COLS: 10,
  BOX_SCORE_PITCHING_FIELDING_START_ROW: 6,
  BOX_SCORE_PITCHING_FIELDING_START_COL: 2,
  BOX_SCORE_PITCHING_FIELDING_NUM_ROWS: 22,
  BOX_SCORE_PITCHING_FIELDING_NUM_COLS: 17,
  BOX_SCORE_TEAM1_TOTALS: "C39:R39",
  BOX_SCORE_TEAM2_TOTALS: "C50:R50",
  BOX_SCORE_TEAM1_PITCHING: "I16:R16",
  BOX_SCORE_TEAM2_PITCHING: "I27:R27",

  // Box score lineup positions (for Retention and other systems)
  // Hitting data structure:
  // - Row 29: Header row
  // - Rows 30-38: Away team lineup (9 batters)
  // - Row 39: Away team totals (skip)
  // - Row 40: Header for home team (skip)
  // - Rows 41-49: Home team lineup (9 batters)
  // - Row 50: Home team totals (skip)
  BOX_SCORE_AWAY_LINEUP_START_OFFSET: 1,        // Start 1 row after header (row 30)
  BOX_SCORE_AWAY_LINEUP_PLAYER_COUNT: 9,        // 9 batters in lineup
  BOX_SCORE_HOME_LINEUP_START_OFFSET: 12,       // Start 12 rows after header (row 41 = 29 + 12)
  BOX_SCORE_HOME_LINEUP_PLAYER_COUNT: 9,        // 9 batters in lineup

  // Game sheet validation settings
  VALIDATE_TEAM_NAMES: true,
  VALIDATE_RUNS: true,
  VALIDATE_WLS_DATA: true,
  VALIDATE_PLAYER_DATA: true,
  MIN_PLAYERS_PER_TEAM: 1,

  // Season archiving settings
  ARCHIVE_SHEETS: [
    "Player Data",
    "Team Data",
    "Schedule",
    "Standings",
    "Rosters",
    "Transactions"
  ],

  // Transaction tracking
  PLAYER_TEAM_SNAPSHOT_PROPERTY: "playerTeamSnapshot",

  // ===== STATS SHEET COLUMN MAPPINGS (0-BASED INDEXING) =====
  // All column indices are 0-based to eliminate [col - 1] offsets
  STATS_COLUMN_MAPS: {
    HITTING_COLUMNS: {
      PLAYER_NAME: 0,    // Column A (1)
      TEAM: 1,           // Column B (2)
      GP: 2,             // Column C (3) - Games Played
      AB: 3,             // Column D (4) - At Bats
      H: 4,              // Column E (5) - Hits
      HR: 5,             // Column F (6) - Home Runs
      RBI: 6,            // Column G (7) - Runs Batted In
      BB: 7,             // Column H (8) - Walks
      K: 8,              // Column I (9) - Strikeouts
      ROB: 9,            // Column J (10) - Reached on Base
      DP: 10,            // Column K (11) - Double Plays
      TB: 11,            // Column L (12) - Total Bases
      AVG: 12,           // Column M (13) - Batting Average
      OBP: 13,           // Column N (14) - On-Base Percentage
      SLG: 14,           // Column O (15) - Slugging Percentage
      OPS: 15            // Column P (16) - On-Base Plus Slugging
    },

    PITCHING_COLUMNS: {
      PLAYER_NAME: 0,    // Column A (1)
      TEAM: 1,           // Column B (2)
      GP: 2,             // Column C (3) - Games Played
      W: 3,              // Column D (4) - Wins
      L: 4,              // Column E (5) - Losses
      SV: 5,             // Column F (6) - Saves
      ERA: 6,            // Column G (7) - Earned Run Average
      IP: 7,             // Column H (8) - Innings Pitched
      BF: 8,             // Column I (9) - Batters Faced
      H: 9,              // Column J (10) - Hits Allowed
      HR: 10,            // Column K (11) - Home Runs Allowed
      R: 11,             // Column L (12) - Runs Allowed
      BB: 12,            // Column M (13) - Walks Allowed
      K: 13,             // Column N (14) - Strikeouts
      BAA: 14,           // Column O (15) - Batting Average Against
      WHIP: 15           // Column P (16) - Walks + Hits per IP
    },

    FIELDING_COLUMNS: {
      PLAYER_NAME: 0,    // Column A (1)
      TEAM: 1,           // Column B (2)
      GP: 2,             // Column C (3) - Games Played
      NP: 3,             // Column D (4) - Nice Plays
      E: 4,              // Column E (5) - Errors
      SB: 5              // Column F (6) - Stolen Bases
    }
  },

  // ===== SHEET STRUCTURE LAYOUTS (0-BASED INDEXING) =====
  // All column numbers are 0-based to eliminate magic offsets
  SHEET_STRUCTURE: {
    // Team Data/Stats sheet layout
    TEAM_STATS_SHEET: {
      DATA_START_ROW: 2,
      TEAM_NAME_COL: 0,           // Column A (1)
      CAPTAIN_COL: 1,             // Column B (2) - Captain Name
      GP_COL: 2,                  // Column C (3) - Games Played
      WINS_COL: 3,                // Column D (4) - Wins
      LOSSES_COL: 4,              // Column E (5) - Losses
      GPWL_START_COL: 2,          // Column C (3) - GP, W, L (for range operations)
      GPWL_NUM_COLS: 3,
      HITTING_START_COL: 5,       // Column F (6) - Hitting stats
      HITTING_NUM_COLS: 9,
      PITCHING_START_COL: 14,     // Column O (15) - Pitching stats
      PITCHING_NUM_COLS: 8,       // IP, BF, H, HR, R, BB, K, SV
      FIELDING_START_COL: 22,     // Column W (23) - Fielding stats
      FIELDING_NUM_COLS: 3
    },

    // Standings sheet layout
    LEAGUE_HUB: {
      HEADER_ROW: 1,
      STANDINGS_HEADER_ROW: 3,
      STANDINGS_START_ROW: 4,
      STANDINGS: {
        START_COL: 0,             // Column A (1)
        NUM_COLS: 8,              // Rank, Team, W, L, Win%, RS, RA, Diff
        RANK_WIDTH: 50,
        TEAM_WIDTH: 175
      },
      LEADERS_BATTING: {
        START_COL: 9,             // Column J (10)
        WIDTH: 300
      },
      LEADERS_PITCHING: {
        START_COL: 11,            // Column L (12)
        WIDTH: 300
      },
      LEADERS_FIELDING: {
        START_COL: 13,            // Column N (14)
        WIDTH: 300
      }
    },

    // Player Data sheet layout
    PLAYER_STATS_SHEET: {
      HEADER_ROW: 1,
      DATA_START_ROW: 2,
      PLAYER_NAME_COL: 0,         // Column A (1)
      TEAM_NAME_COL: 1,           // Column B (2)
      DATA_START_COL: 2,          // Column C (3) - First stat (GP)
      TOTAL_STAT_COLUMNS: 23,     // GP (1) + Hitting (9) + WLS (3) + Pitching (7) + Fielding (3)
      HITTING_STATS_COUNT: 9,     // AB, H, HR, RBI, BB, K, ROB, DP, TB
      PITCHING_STATS_COUNT: 7,    // IP, BF, H, HR, R, BB, K (no SV in array)
      FIELDING_STATS_COUNT: 3     // NP, E, SB
    },

    // Team Sheets layout
    TEAM_SHEETS: {
      HEADER_ROW: 1,
      DATA_START_ROW: 2,
      PLAYER_COL_WIDTH: 175,
      STANDINGS_START_ROW: 4,
      STANDINGS_START_COL: 16,    // Column Q (17)
      STANDINGS_NUM_COLS: 7,
      SCHEDULE_START_COL: 16,     // Column Q (17)
      SCHEDULE_NUM_COLS: 7
    },

    // Playoff Schedule sheet layout
    PLAYOFF_SCHEDULE: {
      HEADER_ROW: 1,
      DATA_START_ROW: 2,
      GAME_CODE_COL: 0,           // Column A - Game code (WC1, CS1-A, KC1, etc.)
      AWAY_TEAM_COL: 1,           // Column B - Away team name
      HOME_TEAM_COL: 2,           // Column C - Home team name
      NUM_BASIC_COLS: 3           // Number of columns in basic structure (Code, Away, Home)
    },

    // Player Comparison sheet layout
    PLAYER_COMPARISON: {
      // Maps stat keys to their 0-based index in the Hitting sheet
      HITTING_MAP: {
        team: 1, gp: 2, ab: 3, h: 4, hr: 5, rbi: 6, bb: 7, k: 8,
        rob: 9, dp: 10, tb: 11, avg: 12, obp: 13, slg: 14, ops: 15
      },
      // Maps stat keys to their 0-based index in the Pitching sheet
      PITCHING_MAP: {
        gp: 2, w: 3, l: 4, sv: 5, era: 6, ip: 7, bf: 8, h: 9,
        hr: 10, r: 11, bb: 12, k: 13, baa: 14, whip: 15
      },
      // Maps stat keys to their 0-based index in the Fielding sheet
      FIELDING_MAP: {
        gp: 2, np: 3, e: 4, sb: 5
      }
    },

    // ===== PHASE 1: PLAYER & TEAM REGISTRY LAYOUTS =====
    // Player Registry sheet layout (single source of truth for players)
    PLAYER_REGISTRY: {
      DATA_START_ROW: 2,
      COLUMNS: {
        DATABASE_ID: 0,      // Column A
        PLAYER_NAME: 1,      // Column B
        TEAM: 2,             // Column C
        STATUS: 3,           // Column D
        IMAGE_URL: 4,        // Column E
        HAS_ATTRIBUTES: 5    // Column F (formula)
      }
    },

    // Team Registry sheet layout (single source of truth for teams)
    TEAM_REGISTRY: {
      DATA_START_ROW: 2,
      COLUMNS: {
        TEAM_NAME: 0,        // Column A
        CAPTAIN: 1,          // Column B
        ABBR: 2,             // Column C
        STATUS: 3,           // Column D
        COLOR: 4,            // Column E
        LOGO_URL: 5,         // Column F
        EMBLEM_URL: 6,       // Column G
        DISCORD_ROLE_ID: 7   // Column H
      }
    }
  }
};

var LEAGUE_CONFIG_OVERRIDES = {
  'PLAYER_STATS_SHEET': ['PLAYER_STATS_SHEET', 'LEAGUE_PLAYER_STATS_SHEET_NAME'],
  'TEAM_STATS_SHEET': ['TEAM_STATS_SHEET', 'LEAGUE_TEAM_STATS_SHEET_NAME'],
  'SCHEDULE_SHEET': ['SCHEDULE_SHEET', 'LEAGUE_SCHEDULE_SHEET_NAME'],
  'STANDINGS_SHEET': ['STANDINGS_SHEET', 'LEAGUE_STANDINGS_SHEET_NAME'],
  'ROSTERS_SHEET': ['ROSTERS_SHEET', 'LEAGUE_ROSTERS_SHEET_NAME'],
  'TRANSACTIONS_SHEET': ['TRANSACTIONS_SHEET', 'LEAGUE_TRANSACTIONS_SHEET_NAME'],
  'STAR_POINTS_SHEET': ['STAR_POINTS_SHEET'],
  'RETENTION_SHEET': ['RETENTION_SHEET'],
  'PLAYOFF_PLAYER_STATS_SHEET': ['PLAYOFF_PLAYER_STATS_SHEET'],
  'PLAYOFF_TEAM_STATS_SHEET': ['PLAYOFF_TEAM_STATS_SHEET'],
  'PLAYOFF_SCHEDULE_SHEET': ['PLAYOFF_SCHEDULE_SHEET'],
  'PLAYOFF_BRACKET_SHEET': ['PLAYOFF_BRACKET_SHEET'],
  'BOX_SCORE_SPREADSHEET_ID': ['BOX_SCORE_SPREADSHEET_ID'],
  'GAME_SHEET_PREFIX': ['GAME_SHEET_PREFIX'],
  'PLAYOFF_GAME_PREFIX': ['PLAYOFF_GAME_PREFIX'],
  'WILDCARD_ROUND_PREFIX': ['WILDCARD_ROUND_PREFIX'],
  'SEMIFINAL_ROUND_PREFIX': ['SEMIFINAL_ROUND_PREFIX'],
  'FINALS_ROUND_PREFIX': ['FINALS_ROUND_PREFIX'],
  'PLAYOFF_TEAMS': ['PLAYOFF_TEAMS'],
  'ENABLE_WILDCARD_ROUND': ['ENABLE_WILDCARD_ROUND'],
  'QUARTERFINALS_WINS_REQUIRED': ['QUARTERFINALS_WINS_REQUIRED'],
  'SEMIFINALS_WINS_REQUIRED': ['SEMIFINALS_WINS_REQUIRED'],
  'FINALS_WINS_REQUIRED': ['FINALS_WINS_REQUIRED'],
  'PLAYER_COLUMN_WIDTH': ['PLAYER_COLUMN_WIDTH'],
  'LEAGUE_HUB_RANK_WIDTH': ['LEAGUE_HUB_RANK_WIDTH'],
  'LEAGUE_HUB_TEAM_WIDTH': ['LEAGUE_HUB_TEAM_WIDTH'],
  'PROGRESS_UPDATE_FREQUENCY': ['PROGRESS_UPDATE_FREQUENCY'],
  'RECENT_SCHEDULE_WEEKS': ['RECENT_SCHEDULE_WEEKS'],
  'MAX_GAMES_PER_SEASON': ['MAX_GAMES_PER_SEASON'],
  'MAX_AB_PER_GAME': ['MAX_AB_PER_GAME'],
  'MAX_IP_PER_GAME': ['MAX_IP_PER_GAME'],
  'MAX_HITS_PER_GAME': ['MAX_HITS_PER_GAME'],
  'MAX_HR_PER_GAME': ['MAX_HR_PER_GAME'],
  'MIN_AB_MULTIPLIER': ['MIN_AB_MULTIPLIER'],
  'MIN_IP_MULTIPLIER': ['MIN_IP_MULTIPLIER'],
  'MAX_PLAYERS_PER_ROSTER': ['MAX_PLAYERS_PER_ROSTER'],
  'WARN_ON_ROSTER_OVERFLOW': ['WARN_ON_ROSTER_OVERFLOW'],
  'DEBUG.ENABLE_LOGGING': ['LEAGUE_DEBUG_LOGGING_ENABLED']
};

var CONFIG = buildLeagueConfig();

function buildLeagueConfig() {
  var config = JSON.parse(JSON.stringify(LEAGUE_CONFIG_DEFAULTS));
  var shared = {};

  if (typeof getSharedConfig === 'function') {
    try {
      shared = getSharedConfig();
    } catch (e) {
      Logger.log('WARNING: Unable to read shared config for LeagueConfig: ' + e.toString());
    }
  }

  applySharedConfigOverrides(config, LEAGUE_CONFIG_OVERRIDES, shared);
  config.SHARED = shared;
  return config;
}

function refreshLeagueConfigCache() {
  CONFIG = buildLeagueConfig();
  return CONFIG;
}

// ===== GLOBAL CACHE =====
var _spreadsheetCache = {
  boxScoreSpreadsheet: null,
  gameSheets: null,
  playoffGameSheets: null,
  gameData: null
};
