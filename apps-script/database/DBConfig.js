// ===== CONFIGURATION =====
// Purpose: Central configuration for all CLB Tools (sheet names, column mappings, thresholds, debug settings)
// Dependencies: None (foundational config file)
// Entry Point(s): getConfig()

var DATABASE_CONFIG_DEFAULTS = {
  // Sheet Names (consolidated into League Hub)
  SHEETS: {
    ATTRIBUTES: '🎮 Attributes',
    CHEMISTRY: 'Player Chemistry Matrix',
    MII_COLOR_CHEMISTRY: 'Mii Chemistry Matrix',
    CHEMISTRY_LOOKUP: '🎮 Chemistry',
    CHARACTER_NAME_MAPPING: '📋 Player Registry', // Merged into Player Registry (DATABASE_ID column A)
    CHEMISTRY_CHANGE_LOG: 'Chemistry Change Log'
  },
  
  // Attribute Sheet Configuration
  ATTRIBUTES_CONFIG: {
    // Column mappings (0-indexed, for array access)
    COLUMNS: {
      NAME: 0,                // Column A (1) - Character name
      CHARACTER_CLASS: 1,     // Column B (2) - Preset index 2
      CAPTAIN: 2,             // Column C (3) - Preset index 5
      MII: 3,                 // Column D (4) - Manual entry (not from preset)
      MII_COLOR: 4,           // Column E (5) - Manual entry (not from preset)
      ARM_SIDE: 5,            // Column F (6) - Preset index 0 (pitching arm)
      BATTING_SIDE: 6,        // Column G (7) - Preset index 1
      WEIGHT: 7,              // Column H (8) - Preset index 4
      ABILITY: 8,             // Column I (9) - Combined: Preset index 8 OR 9
      PITCHING_OVERALL: 9,    // Column J (10) - Preset index 18
      BATTING_OVERALL: 10,    // Column K (11) - Preset index 19
      FIELDING_OVERALL: 11,   // Column L (12) - Preset index 20
      SPEED_OVERALL: 12,      // Column M (13) - Preset index 21
      STAR_SWING: 13,         // Column N (14) - Preset index 7
      HIT_CURVE: 14,          // Column O (15) - Preset index 27
      HITTING_TRAJECTORY: 15, // Column P (16) - Preset index 26
      SLAP_HIT_CONTACT: 16,   // Column Q (17) - Preset index 10
      CHARGE_HIT_CONTACT: 17, // Column R (18) - Preset index 11
      SLAP_HIT_POWER: 18,     // Column S (19) - Preset index 12
      CHARGE_HIT_POWER: 19,   // Column T (20) - Preset index 13
      SPEED: 20,              // Column U (21) - Preset index 15
      BUNTING: 21,            // Column V (22) - Preset index 14
      FIELDING: 22,           // Column W (23) - Preset index 17
      THROWING_SPEED: 23,     // Column X (24) - Preset index 16
      PRE_CHARGE: 24,         // Column Y (25) - Custom field (not from preset)
      STAR_PITCH: 25,         // Column Z (26) - Combined: Preset index 6 + 29
      FASTBALL_SPEED: 26,     // Column AA (27) - Preset index 23
      CURVEBALL_SPEED: 27,    // Column AB (28) - Preset index 22
      CURVE: 28,              // Column AC (29) - Preset index 24
      STAMINA: 29             // Column AD (30) - Preset index 28
    },
    FIRST_DATA_ROW: 2,      // First row of data (after headers)
    TOTAL_COLUMNS: 30       // Total columns to read (A through AD)
  },
  
  // Chemistry Sheet Configuration
  CHEMISTRY_CONFIG: {
    // Column mappings for Chemistry Lookup sheet (0-indexed, for array access)
    COLUMNS: {
      PLAYER_1: 0,          // Column A (1)
      PLAYER_2: 1,          // Column B (2)
      CHEMISTRY_VALUE: 2    // Column C (3)
    },
    FIRST_DATA_ROW: 2,      // First row with character names in column A
    FIRST_DATA_COLUMN: 2,   // First column with chemistry values (column B)
    HEADER_ROW: 1,          // Row with character names across the top
    NAME_COLUMN: 1,         // Column with character names (column A)

    // Chemistry value thresholds
    THRESHOLDS: {
      POSITIVE_MIN: 100,    // Values >= 100 are positive chemistry
      NEGATIVE_MAX: -100,   // Values <= -100 are negative chemistry
      POSITIVE_PRESET: 2,   // Preset file value for positive chemistry
      NEUTRAL_PRESET: 1,    // Preset file value for neutral chemistry
      NEGATIVE_PRESET: 0    // Preset file value for negative chemistry
    },

    // Column widths for Chemistry Lookup sheet
    COLUMN_WIDTHS: {
      PLAYER_1: 150,
      PLAYER_2: 150,
      CHEMISTRY_VALUE: 100
    }
  },

  // Character Name Mapping Configuration
  CHARACTER_NAME_MAPPING_CONFIG: {
    COLUMNS: {
      PYTHON_NAME: 0,       // Column A (1) - Python tool name
      CUSTOM_NAME: 1        // Column B (2) - Custom formatted name
    },
    FIRST_DATA_ROW: 2,
    COLUMN_WIDTHS: {
      PYTHON_NAME: 200,
      CUSTOM_NAME: 200
    }
  },

  // Chemistry Change Log Configuration
  CHEMISTRY_CHANGE_LOG_CONFIG: {
    COLUMNS: {
      TIMESTAMP: 0,         // Column A (1)
      CHARACTER_1: 1,       // Column B (2)
      CHARACTER_2: 2,       // Column C (3)
      OLD_VALUE: 3,         // Column D (4)
      NEW_VALUE: 4,         // Column E (5)
      NOTES: 5              // Column F (6)
    },
    FIRST_DATA_ROW: 2,
    COLUMN_WIDTHS: {
      TIMESTAMP: 150,
      CHARACTER_1: 150,
      CHARACTER_2: 150,
      OLD_VALUE: 100,
      NEW_VALUE: 100,
      NOTES: 300
    }
  },

  // UI Formatting Colors
  COLORS: {
    HEADER_BACKGROUND: '#667eea',
    HEADER_TEXT: '#ffffff',
    POSITIVE_HIGHLIGHT: '#d4edda',
    NEGATIVE_HIGHLIGHT: '#f8d7da',
    NEUTRAL_HIGHLIGHT: '#e2e3e5',
    IMPORT_EXPORT_HIGHLIGHT: '#cfe2ff'
  },

  // Debug Configuration
  DEBUG: {
    ENABLE_LOGGING: true
  },
  
  // Tool Display Names
  TOOL_NAMES: {
    ATTRIBUTE_COMPARISON: 'Player Attribute Comparison',
    CHEMISTRY_TOOL: 'Player Chemistry Tool',
    ADMIN_COMPARISON: 'Admin: Comparison with Averages'
  },
  
  // Menu Configuration
  MENU: {
    NAME: '🎮 CLB Tools',
    ICONS: {
      ATTRIBUTES: '⚾',
      CHEMISTRY: '⚡',
      ADMIN: '🔐',
      ABOUT: '📋'
    }
  }
};

var DATABASE_CONFIG_OVERRIDES = {
  'SHEETS.ATTRIBUTES': ['CLB_ATTRIBUTES_SHEET_NAME', 'DATABASE_ATTRIBUTES_SHEET', 'SHEETS.ATTRIBUTES'],
  'SHEETS.CHEMISTRY': ['CLB_CHEMISTRY_MATRIX_SHEET_NAME', 'DATABASE_CHEMISTRY_SHEET'],
  'SHEETS.MII_COLOR_CHEMISTRY': ['CLB_MII_CHEMISTRY_SHEET_NAME'],
  'SHEETS.CHEMISTRY_LOOKUP': ['CLB_CHEMISTRY_LOOKUP_SHEET_NAME'],
  'SHEETS.CHARACTER_NAME_MAPPING': ['CLB_PLAYER_REGISTRY_SHEET_NAME'],
  'SHEETS.CHEMISTRY_CHANGE_LOG': ['CLB_CHEMISTRY_CHANGE_LOG_SHEET_NAME'],
  'DEBUG.ENABLE_LOGGING': ['CLB_DEBUG_LOGGING_ENABLED', 'DATABASE_DEBUG_LOGGING']
};

var _databaseConfigCache = null;

// Helper function to get config values
function getConfig() {
  if (!_databaseConfigCache) {
    _databaseConfigCache = buildDatabaseConfig();
  }
  return _databaseConfigCache;
}

function buildDatabaseConfig() {
  var config = JSON.parse(JSON.stringify(DATABASE_CONFIG_DEFAULTS));
  var shared = {};

  if (typeof getSharedConfig === 'function') {
    try {
      shared = getSharedConfig();
    } catch (e) {
      Logger.log('WARNING: Unable to read shared config for DatabaseConfig: ' + e.toString());
    }
  }

  applySharedConfigOverrides(config, DATABASE_CONFIG_OVERRIDES, shared);
  config.SHARED = shared;
  return config;
}

function refreshDatabaseConfigCache() {
  _databaseConfigCache = null;
  return getConfig();
}
