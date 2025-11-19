// ===== STATS PRESET IMPORT/EXPORT =====
// Purpose: Import/export chemistry data from Mario Super Sluggers Stats Editor preset format
// Dependencies: DatabaseConfig.js
// Entry Point(s): importChemistryFromStatsPreset(), exportChemistryToStatsPreset(), showChemistryEditor()

/**
 * Character list in game order (positions 0-100)
 * Extracted from Mario Super Sluggers Stat Editor.py
 * This is the canonical order used in stats preset files
 */
const GAME_CHARACTER_ORDER = [
  "Mario", "Luigi", "Donkey Kong", "Diddy Kong", "Peach", "Daisy",
  "Green Yoshi", "Baby Mario", "Baby Luigi", "Bowser", "Wario",
  "Waluigi", "Green Koopa Troopa", "Red Toad", "Boo", "Toadette",
  "Red Shy Guy", "Birdo", "Monty Mole", "Bowser Jr.",
  "Red Koopa Paratroopa", "Blue Pianta", "Red Pianta",
  "Yellow Pianta", "Blue Noki", "Red Noki", "Green Noki",
  "Hammer Bro", "Toadsworth", "Blue Toad", "Yellow Toad",
  "Green Toad", "Purple Toad", "Blue Magikoopa", "Red Magikoopa",
  "Green Magikoopa", "Yellow Magikoopa", "King Boo", "Petey Piranha",
  "Dixie Kong", "Goomba", "Paragoomba", "Red Koopa Troopa",
  "Green Koopa Paratroopa", "Blue Shy Guy", "Yellow Shy Guy",
  "Green Shy Guy", "Gray Shy Guy", "Gray Dry Bones",
  "Green Dry Bones", "Dark Bones", "Blue Dry Bones", "Fire Bro",
  "Boomerang Bro", "Wiggler", "Blooper", "Funky Kong", "Tiny Kong",
  "Green Kritter", "Blue Kritter", "Red Kritter", "Brown Kritter",
  "King K. Rool", "Baby Peach", "Baby Daisy", "Baby DK", "Red Yoshi",
  "Blue Yoshi", "Yellow Yoshi", "Light Blue Yoshi", "Pink Yoshi",
  "Unused Yoshi 2", "Unused Yoshi", "Unused Toad", "Unused Pianta",
  "Unused Kritter", "Unused Koopa", "Red Mii (M)", "Orange Mii (M)",
  "Yellow Mii (M)", "Light Green Mii (M)", "Green Mii (M)",
  "Blue Mii (M)", "Light Blue Mii (M)", "Pink Mii (M)",
  "Purple Mii (M)", "Brown Mii (M)", "White Mii (M)", "Black Mii (M)",
  "Red Mii (F)", "Orange Mii (F)", "Yellow Mii (F)",
  "Light Green Mii (F)", "Green Mii (F)", "Blue Mii (F)",
  "Light Blue Mii (F)", "Pink Mii (F)", "Purple Mii (F)",
  "Brown Mii (F)", "White Mii (F)", "Black Mii (F)"
];

/**
 * Lookup tables from Mario Super Sluggers Stats Editor
 * Used for converting between numeric IDs and human-readable names
 */
const FIELDING_ABILITIES = ["None","Super Dive","Super Jump","Tongue Catch","Suction Catch",
  "Magical Catch","Piranha Catch","Hammer Throw","Keeper Catch",
  "Clamber","Ball Dash","Laser Beam","Quick Throw"];

const BASERUNNING_ABILITIES = ["None","Scatter Dive","Ink Dive","Angry Attack",
  "Teleport","Spin Attack","Burrow","Enlarge"];

const CHARACTER_CLASSES = ["Balanced","Power","Speed","Technique"];

const STAR_PITCHES = ["Standard","Fireball","Tornado Ball","Barrel Ball","Banana Ball",
  "Heart Ball","Flower Ball","Phony Ball","Liar Ball",
  "Rainbow Ball","Suction Ball", "Killer Ball","Graffiti Ball"];

const STAR_SWINGS = ["Standard","Fire Swing","Tornado Swing","Barrel Swing","Banana Swing",
  "Heart Swing","Flower Swing","Phony Swing","Liar Swing",
  "Egg Swing","Cannon Swing","Breath Swing","Graffiti Swing"];

const STAR_PITCH_TYPES = ["None","Breaking Ball","Fastball","Change-Up"];

const ARM_SIDES = ["Right","Left"];

// Default trajectory names - overridden by imported config if available
const DEFAULT_TRAJECTORY_TYPES = ["Medium","High","Low"];

const HIT_CURVE_TYPES = ["Disabled","Enabled"];

/**
 * Get trajectory type names from imported config, or defaults if not available
 * @returns {string[]} Array of trajectory names (first 3 used trajectories)
 */
function getTrajectoryTypes() {
  try {
    const props = PropertiesService.getScriptProperties();
    const trajectoryDataJson = props.getProperty('TRAJECTORY_DATA');

    if (trajectoryDataJson) {
      const trajectoryData = JSON.parse(trajectoryDataJson);
      // Return only the used trajectories (filter by usage array)
      const usedTrajectories = [];
      for (let i = 0; i < 6; i++) {
        if (trajectoryData.usage[i] === 1) {
          usedTrajectories.push(trajectoryData.names[i]);
        }
      }
      // If we have at least 3 used trajectories, return them
      if (usedTrajectories.length >= 3) {
        return usedTrajectories.slice(0, 3);
      }
    }
  } catch (e) {
    Logger.log('Could not load trajectory names from config: ' + e.message);
  }

  // Fall back to defaults if config not available
  return DEFAULT_TRAJECTORY_TYPES;
}

/**
 * Client-facing wrapper for getTrajectoryTypes()
 * Used by Admin tools to populate trajectory dropdowns
 * @returns {string[]} Array of trajectory names
 */
function getTrajectoryTypesForClient() {
  return getTrajectoryTypes();
}

/**
 * Generate custom character name from Python format
 * Only converts characters that are actual variants (based on Python tool's comboList)
 * Example: "Red Toad" → "Toad (Red)", but "Baby Mario" stays "Baby Mario"
 * @param {string} pythonName - Name from Python tool
 * @returns {string} Custom formatted name
 */
function generateCustomName(pythonName) {
  // Define variant groups (from Python tool's comboList)
  // Only these characters should be converted to variant format

  const variantGroups = {
    'Bro': ['Boomerang Bro', 'Fire Bro', 'Hammer Bro'],
    'Dry Bones': ['Dark Bones', 'Blue Dry Bones', 'Gray Dry Bones', 'Green Dry Bones'],
    'Koopa Paratroopa': ['Green Koopa Paratroopa', 'Red Koopa Paratroopa'],
    'Koopa Troopa': ['Green Koopa Troopa', 'Red Koopa Troopa'],
    'Kritter': ['Green Kritter', 'Blue Kritter', 'Red Kritter', 'Brown Kritter'],
    'Magikoopa': ['Blue Magikoopa', 'Green Magikoopa', 'Red Magikoopa', 'Yellow Magikoopa'],
    'Noki': ['Blue Noki', 'Red Noki', 'Green Noki'],
    'Pianta': ['Blue Pianta', 'Red Pianta', 'Yellow Pianta'],
    'Shy Guy': ['Blue Shy Guy', 'Gray Shy Guy', 'Green Shy Guy', 'Red Shy Guy', 'Yellow Shy Guy'],
    'Toad': ['Blue Toad', 'Green Toad', 'Purple Toad', 'Red Toad', 'Yellow Toad'],
    'Yoshi': ['Blue Yoshi', 'Light Blue Yoshi', 'Green Yoshi', 'Pink Yoshi', 'Red Yoshi', 'Yellow Yoshi']
  };

  // Check each variant group
  for (const [baseName, variants] of Object.entries(variantGroups)) {
    if (variants.includes(pythonName)) {
      // Extract the color/variant prefix
      const prefix = pythonName.substring(0, pythonName.length - baseName.length - 1);
      return baseName + ' (' + prefix + ')';
    }
  }

  // Handle Miis - they have a special format "Color Mii (Gender)"
  if (pythonName.includes('Mii')) {
    const miiMatch = pythonName.match(/^(.+) Mii \((M|F)\)$/);
    if (miiMatch) {
      const color = miiMatch[1];
      const gender = miiMatch[2];
      return 'Mii (' + color + ', ' + gender + ')';
    }
  }

  // Not a variant - return original name unchanged
  return pythonName;
}

/**
 * Create or update Character Name Mapping sheet
 * @param {Spreadsheet} ss - Active spreadsheet
 * @param {Object} config - Configuration object
 */
function createCharacterNameMappingSheet(ss, config) {
  const sheetName = config.SHEETS.CHARACTER_NAME_MAPPING;
  let mappingSheet = ss.getSheetByName(sheetName);

  if (!mappingSheet) {
    mappingSheet = ss.insertSheet(sheetName);

    mappingSheet.getRange(1, 1, 1, 2).setValues([
      ['Python Name', 'Custom Name']
    ]);

    const headerRange = mappingSheet.getRange(1, 1, 1, 2);
    headerRange.setBackground(config.COLORS.HEADER_BACKGROUND);
    headerRange.setFontColor(config.COLORS.HEADER_TEXT);
    headerRange.setFontWeight('bold');
    headerRange.setHorizontalAlignment('center');

    const mappingConfig = config.CHARACTER_NAME_MAPPING_CONFIG;
    mappingSheet.setColumnWidth(1, mappingConfig.COLUMN_WIDTHS.PYTHON_NAME);
    mappingSheet.setColumnWidth(2, mappingConfig.COLUMN_WIDTHS.CUSTOM_NAME);

    mappingSheet.setFrozenRows(1);

    const mappingData = [];
    for (let i = 0; i < GAME_CHARACTER_ORDER.length; i++) {
      const pythonName = GAME_CHARACTER_ORDER[i];
      const customName = generateCustomName(pythonName);
      mappingData.push([pythonName, customName]);
    }

    mappingSheet.getRange(2, 1, mappingData.length, 2).setValues(mappingData);
    mappingSheet.getRange(1, 2).setNote(
      'Edit these names to match your custom naming convention.\n\n' +
      'Pattern-based conversions applied for VARIANTS ONLY:\n' +
      '• "Red Toad" → "Toad (Red)"\n' +
      '• "Blue Yoshi" → "Yoshi (Blue)"\n' +
      '• "Fire Bro" → "Bro (Fire)"\n' +
      '• "Red Mii (M)" → "Mii (Red, M)"\n\n' +
      'Non-variants (Baby Mario, Funky Kong, King Boo, etc.)\n' +
      'are left unchanged.\n\n' +
      'Review and adjust as needed!'
    );
  }

  return mappingSheet;
}

/**
 * Load all character name mappings into memory for fast lookups
 * @param {Sheet} mappingSheet - Character Name Mapping sheet
 * @returns {Object} Map of Python name → Custom name
 */
function loadCharacterNameMappings(mappingSheet) {
  const mappings = {};

  if (!mappingSheet) {
    // No mapping sheet, return empty map
    return mappings;
  }

  try {
    const lastRow = mappingSheet.getLastRow();
    if (lastRow < 2) return mappings;

    const data = mappingSheet.getRange(2, 1, lastRow - 1, 2).getValues();

    for (let i = 0; i < data.length; i++) {
      const pythonName = String(data[i][0]).trim();
      const customName = String(data[i][1]).trim();
      if (pythonName && customName) {
        mappings[pythonName] = customName;
      }
    }
  } catch (e) {
    // Error reading mappings, return empty map
  }

  return mappings;
}

/**
 * Get custom character name from pre-loaded mapping
 * @param {Object} mappings - Pre-loaded name mappings
 * @param {string} pythonName - Python format name to look up
 * @returns {string} Custom name, or Python name if not found
 */
function getCustomCharacterName(mappings, pythonName) {
  return mappings[pythonName] || pythonName;
}

/**
 * Show file upload dialog for importing stats preset
 */
function importChemistryFromStatsPreset() {
  const html = HtmlService.createHtmlOutputFromFile('DatabaseImportApp')
    .setWidth(550)
    .setHeight(300);
  SpreadsheetApp.getUi().showModalDialog(html, 'Import Stats Preset');
}

/**
 * Parse full stats preset file (228 lines) and populate all sheets
 * @param {string} fileContent - Raw .txt file content from stats preset
 * @returns {Object} Import results with statistics
 */
function parseFullStatsPreset(fileContent) {
  try {
    const lines = fileContent.split('\n');

    // Validate we have enough lines for a complete preset
    if (lines.length < 228) {
      throw new Error(`Invalid preset file: Expected at least 228 lines, found ${lines.length}`);
    }

    const config = getConfig();
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    const mappingSheet = createCharacterNameMappingSheet(ss, config);
    const nameMappings = loadCharacterNameMappings(mappingSheet);

    // ===== SECTION 1: CHEMISTRY (Lines 0-100) =====
    const chemistryResult = parseChemistrySection(lines.slice(0, 101), ss, config, nameMappings);

    // ===== SECTION 2: STATS (Lines 101-201) =====
    const statsResult = parseStatsSection(lines.slice(101, 202), ss, config, nameMappings);

    // ===== SECTION 3: TRAJECTORY (Lines 202-227) =====
    const trajectoryResult = parseTrajectorySection(lines.slice(202, 228), ss, config);

    // Log the import event
    logImportEvent({
      chemistryPairs: chemistryResult.totalPairs,
      statsUpdated: statsResult.charactersUpdated,
      trajectoryStored: trajectoryResult.stored
    });

    return {
      success: true,
      chemistry: chemistryResult,
      stats: statsResult,
      trajectory: trajectoryResult
    };

  } catch (e) {
    const config = getConfig();
    if (config.DEBUG.ENABLE_LOGGING) {
      Logger.log('Error in parseFullStatsPreset: ' + e.toString());
    }
    return {
      success: false,
      error: e.toString()
    };
  }
}

/**
 * Parse chemistry section (lines 0-100, 101x101 matrix)
 */
function parseChemistrySection(chemistryLines, ss, config, nameMappings) {
  const matrix = [];
  for (let i = 0; i < 101; i++) {
    const row = chemistryLines[i].split(',').map(v => {
      const val = parseInt(v.trim());
      if (isNaN(val)) {
        throw new Error(`Invalid chemistry value at row ${i + 1}: "${v}"`);
      }
      return val;
    });

    if (row.length !== 101) {
      throw new Error(`Invalid chemistry row ${i + 1}: Expected 101 values, found ${row.length}`);
    }

    matrix.push(row);
  }

  const pairs = [];
  let positiveCount = 0;
  let negativeCount = 0;

  for (let i = 0; i < 101; i++) {
    for (let j = i + 1; j < 101; j++) {
      const value = matrix[i][j];

      // Convert preset values (0/1/2) to chemistry values using config thresholds
      const thresholds = config.CHEMISTRY_CONFIG.THRESHOLDS;
      let chemistry = null;
      if (value === thresholds.NEGATIVE_PRESET) {
        chemistry = thresholds.NEGATIVE_MAX;
        negativeCount++;
      } else if (value === thresholds.NEUTRAL_PRESET) {
        chemistry = null; // Neutral - don't store
      } else if (value === thresholds.POSITIVE_PRESET) {
        chemistry = thresholds.POSITIVE_MIN;
        positiveCount++;
      }

      // Only store non-neutral chemistry (negative or positive)
      if (chemistry !== null) {
        const pythonName1 = GAME_CHARACTER_ORDER[i];
        const pythonName2 = GAME_CHARACTER_ORDER[j];
        pairs.push({
          player1: getCustomCharacterName(nameMappings, pythonName1),
          player2: getCustomCharacterName(nameMappings, pythonName2),
          chemistry: chemistry
        });
      }
    }
  }

  let lookupSheet = ss.getSheetByName(config.SHEETS.CHEMISTRY_LOOKUP);

  if (!lookupSheet) {
    lookupSheet = ss.insertSheet(config.SHEETS.CHEMISTRY_LOOKUP);
  }

  writeToChemistryLookup(lookupSheet, pairs);
  updateChemistryDataJSON();

  return {
    totalPairs: pairs.length,
    positiveCount: positiveCount,
    negativeCount: negativeCount
  };
}

/**
 * Parse stats section (lines 101-201, 101x30 matrix)
 */
function parseStatsSection(statsLines, ss, config, nameMappings) {
  const statsMatrix = [];
  for (let i = 0; i < 101; i++) {
    const row = statsLines[i].split(',').map(v => parseInt(v.trim()));

    if (row.length !== 30) {
      throw new Error(`Invalid stats row ${i + 102}: Expected 30 values, found ${row.length}`);
    }

    statsMatrix.push(row);
  }

  let attributesSheet = ss.getSheetByName(config.SHEETS.ATTRIBUTES);

  if (!attributesSheet) {
    attributesSheet = ss.insertSheet(config.SHEETS.ATTRIBUTES);

    const headers = [
      'Name', 'Character Class', 'Captain', 'Mii', 'Mii Color', 'Arm Side', 'Batting Side', 'Weight',
      'Ability', 'Pitching Overall', 'Batting Overall', 'Fielding Overall', 'Speed Overall',
      'Star Swing', 'Hit Curve', 'Hitting Trajectory', 'Slap Hit Contact', 'Charge Hit Contact',
      'Slap Hit Power', 'Charge Hit Power', 'Speed', 'Bunting', 'Fielding', 'Throwing Speed',
      'Pre-Charge', 'Star Pitch', 'Fastball Speed', 'Curveball Speed', 'Curve', 'Stamina'
    ];
    attributesSheet.getRange(1, 1, 1, config.ATTRIBUTES_CONFIG.TOTAL_COLUMNS).setValues([headers]);

    const headerRange = attributesSheet.getRange(1, 1, 1, config.ATTRIBUTES_CONFIG.TOTAL_COLUMNS);
    headerRange.setBackground(config.COLORS.HEADER_BACKGROUND);
    headerRange.setFontColor(config.COLORS.HEADER_TEXT);
    headerRange.setFontWeight('bold');
    headerRange.setHorizontalAlignment('center');
    attributesSheet.setFrozenRows(1);
  }

  const existingCustomData = {};
  if (attributesSheet.getLastRow() >= config.ATTRIBUTES_CONFIG.FIRST_DATA_ROW) {
    const lastRow = attributesSheet.getLastRow();
    const firstRow = config.ATTRIBUTES_CONFIG.FIRST_DATA_ROW;
    const totalCols = config.ATTRIBUTES_CONFIG.TOTAL_COLUMNS;
    const existingData = attributesSheet.getRange(firstRow, 1, lastRow - firstRow + 1, totalCols).getValues();

    const cols = config.ATTRIBUTES_CONFIG.COLUMNS;
    for (let i = 0; i < existingData.length; i++) {
      const characterName = String(existingData[i][cols.NAME]).trim();
      if (characterName) {
        existingCustomData[characterName] = {
          mii: existingData[i][cols.MII],
          miiColor: existingData[i][cols.MII_COLOR],
          preCharge: existingData[i][cols.PRE_CHARGE]
        };
      }
    }
  }

  // Load trajectory names from imported config
  const trajectoryTypes = getTrajectoryTypes();

  const sheetData = [];

  for (let i = 0; i < 101; i++) {
    const presetRow = statsMatrix[i];
    const pythonName = GAME_CHARACTER_ORDER[i];
    const characterName = getCustomCharacterName(nameMappings, pythonName);

    const customData = existingCustomData[characterName] || { mii: '', miiColor: '', preCharge: '' };

    const sheetRow = [
      characterName,
      CHARACTER_CLASSES[presetRow[2]] || '',
      presetRow[5] === 1 ? 'Yes' : 'No',
      customData.mii,
      customData.miiColor,
      ARM_SIDES[presetRow[0]] || '',
      ARM_SIDES[presetRow[1]] || '',
      presetRow[4],
      combineAbilityField(presetRow[8], presetRow[9]),
      presetRow[18],
      presetRow[19],
      presetRow[20],
      presetRow[21],
      STAR_SWINGS[presetRow[7]] || '',
      HIT_CURVE_TYPES[presetRow[27]] || '',
      trajectoryTypes[presetRow[26]] || '',
      presetRow[10],
      presetRow[11],
      presetRow[12],
      presetRow[13],
      presetRow[15],
      presetRow[14],
      presetRow[17],
      presetRow[16],
      customData.preCharge,
      combineStarPitchField(presetRow[6], presetRow[29]),
      presetRow[23],
      presetRow[22],
      presetRow[24],
      presetRow[28]
    ];

    sheetData.push(sheetRow);
  }

  attributesSheet.getRange(
    config.ATTRIBUTES_CONFIG.FIRST_DATA_ROW,
    1,
    sheetData.length,
    config.ATTRIBUTES_CONFIG.TOTAL_COLUMNS
  ).setValues(sheetData);

  return {
    charactersUpdated: sheetData.length
  };
}

/**
 * Combine fielding ability (index 8) OR baserunning ability (index 9)
 * Show whichever is non-zero
 */
function combineAbilityField(fieldingIndex, baserunningIndex) {
  if (baserunningIndex > 0) {
    return BASERUNNING_ABILITIES[baserunningIndex] || '';
  }
  if (fieldingIndex > 0) {
    return FIELDING_ABILITIES[fieldingIndex] || '';
  }
  return 'None';
}

/**
 * Combine star pitch (index 6) + star pitch type (index 29)
 * Non-standard pitch takes priority, otherwise show type
 */
function combineStarPitchField(starPitchIndex, starPitchTypeIndex) {
  // If non-standard pitch (index > 0), show the special pitch name
  if (starPitchIndex > 0) {
    return STAR_PITCHES[starPitchIndex] || '';
  }
  // Otherwise show the pitch type
  return STAR_PITCH_TYPES[starPitchTypeIndex] || 'None';
}

/**
 * Parse trajectory section (lines 202-227) and store in script properties
 */
function parseTrajectorySection(trajectoryLines, ss, config) {
  // Lines 202-225: 24x25 trajectory matrix
  const trajectoryMatrix = [];
  for (let i = 0; i < 24; i++) {
    const row = trajectoryLines[i].split(',').map(v => parseInt(v.trim()));
    if (row.length !== 25) {
      throw new Error(`Invalid trajectory row ${i + 203}: Expected 25 values, found ${row.length}`);
    }
    trajectoryMatrix.push(row);
  }

  // Line 226: 6 trajectory names (comma-separated strings)
  const trajectoryNames = trajectoryLines[24].split(',').map(s => s.trim());
  if (trajectoryNames.length !== 6) {
    throw new Error(`Invalid trajectory names: Expected 6, found ${trajectoryNames.length}`);
  }

  // Line 227: 6 trajectory usage flags (0/1)
  const trajectoryUsage = trajectoryLines[25].split(',').map(v => parseInt(v.trim()));
  if (trajectoryUsage.length !== 6) {
    throw new Error(`Invalid trajectory usage: Expected 6, found ${trajectoryUsage.length}`);
  }

  // Store in script properties (passthrough - no editing in sheets)
  const trajectoryData = {
    matrix: trajectoryMatrix,
    names: trajectoryNames,
    usage: trajectoryUsage
  };

  const props = PropertiesService.getScriptProperties();
  props.setProperty('TRAJECTORY_DATA', JSON.stringify(trajectoryData));

  return {
    stored: true,
    matrixRows: 24,
    names: 6,
    usage: 6
  };
}

/**
 * Log import event to Chemistry Change Log
 */
function logImportEvent(stats) {
  try {
    const config = getConfig();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = config.SHEETS.CHEMISTRY_CHANGE_LOG;
    let logSheet = ss.getSheetByName(sheetName);

    if (!logSheet) {
      logSheet = ss.insertSheet(sheetName);

      logSheet.getRange(1, 1, 1, 6).setValues([
        ['Timestamp', 'Character 1', 'Character 2', 'Old Value', 'New Value', 'Notes']
      ]);

      const headerRange = logSheet.getRange(1, 1, 1, 6);
      headerRange.setBackground(config.COLORS.HEADER_BACKGROUND);
      headerRange.setFontColor(config.COLORS.HEADER_TEXT);
      headerRange.setFontWeight('bold');
      headerRange.setHorizontalAlignment('center');

      const logConfig = config.CHEMISTRY_CHANGE_LOG_CONFIG;
      logSheet.setColumnWidth(1, logConfig.COLUMN_WIDTHS.TIMESTAMP);
      logSheet.setColumnWidth(2, logConfig.COLUMN_WIDTHS.CHARACTER_1);
      logSheet.setColumnWidth(3, logConfig.COLUMN_WIDTHS.CHARACTER_2);
      logSheet.setColumnWidth(4, logConfig.COLUMN_WIDTHS.OLD_VALUE);
      logSheet.setColumnWidth(5, logConfig.COLUMN_WIDTHS.NEW_VALUE);
      logSheet.setColumnWidth(6, logConfig.COLUMN_WIDTHS.NOTES);

      logSheet.setFrozenRows(1);
    }

    const timestamp = new Date();
    const newRow = [
      timestamp,
      '*** IMPORT ***',
      `${stats.chemistryPairs} chemistry pairs`,
      `${stats.statsUpdated} characters`,
      stats.trajectoryStored ? 'Trajectory stored' : 'No trajectory',
      ''
    ];

    logSheet.appendRow(newRow);

    const lastRow = logSheet.getLastRow();
    logSheet.getRange(lastRow, 1).setNumberFormat('yyyy-mm-dd hh:mm:ss');
    logSheet.getRange(lastRow, 1, 1, 6).setBorder(true, true, true, true, true, true);
    logSheet.getRange(lastRow, 1, 1, 6).setBackground(config.COLORS.IMPORT_EXPORT_HIGHLIGHT);

  } catch (e) {
    const config = getConfig();
    if (config.DEBUG.ENABLE_LOGGING) {
      Logger.log('Error in logImportEvent: ' + e.toString());
    }
    // Don't throw - logging failure shouldn't break the import
  }
}

/**
 * Legacy function name for backward compatibility
 * Redirects to parseFullStatsPreset
 */
function parseStatsPresetChemistry(fileContent) {
  return parseFullStatsPreset(fileContent);
}

/**
 * Export complete stats preset (228 lines) including chemistry, stats, and trajectory
 */
function exportChemistryToStatsPreset() {
  try {
    const config = getConfig();
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    const chemistryLines = exportChemistrySection(ss, config);
    const statsLines = exportStatsSection(ss, config);
    const trajectoryLines = exportTrajectorySection(ss, config);

    const allLines = [...chemistryLines, ...statsLines, ...trajectoryLines];
    const content = allLines.join('\n');

    logExportEvent({
      chemistryExported: true,
      statsExported: true,
      trajectoryExported: trajectoryLines.length > 0
    });

    const html = HtmlService.createHtmlOutput(`
      <!DOCTYPE html>
      <html>
      <head>
        <base target="_top">
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            text-align: center;
          }
          button {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 12px 24px;
            font-size: 16px;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 20px;
          }
          button:hover {
            background: #45a049;
          }
          .info {
            background: #f0f0f0;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
          }
          .success {
            color: #155724;
            background: #d4edda;
            padding: 10px;
            border-radius: 4px;
            margin: 15px 0;
          }
        </style>
      </head>
      <body>
        <h2>Export Complete</h2>
        <div class="success">
          ✅ Full stats preset ready (228 lines)
        </div>
        <div class="info">
          <p><strong>Included:</strong></p>
          <p>• Chemistry (101 lines)</p>
          <p>• Stats (101 lines)</p>
          <p>• Trajectory (26 lines)</p>
        </div>
        <button onclick="downloadFile()">Download Stats Preset</button>
        <script>
          const content = ${JSON.stringify(content)};

          function downloadFile() {
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const timestamp = new Date().toISOString().slice(0, 10);
            a.download = 'stats_preset_' + timestamp + '.txt';
            a.click();
            URL.revokeObjectURL(url);
          }
        </script>
      </body>
      </html>
    `)
    .setWidth(450)
    .setHeight(300);

    SpreadsheetApp.getUi().showModalDialog(html, 'Export Stats Preset');

  } catch (e) {
    const config = getConfig();
    if (config.DEBUG.ENABLE_LOGGING) {
      Logger.log('Error in exportChemistryToStatsPreset: ' + e.toString());
    }
    SpreadsheetApp.getUi().alert('Export Error', e.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Export chemistry section (101 lines)
 */
function exportChemistrySection(ss, config) {
  const lookupSheet = ss.getSheetByName(config.SHEETS.CHEMISTRY_LOOKUP);

  if (!lookupSheet) {
    throw new Error('Chemistry Lookup sheet not found');
  }

  const matrix = Array(101).fill(null).map(() => Array(101).fill(1));

  const nameToIndex = {};
  GAME_CHARACTER_ORDER.forEach((name, idx) => {
    nameToIndex[name] = idx;
  });

  const lastRow = lookupSheet.getLastRow();
  if (lastRow > 1) {
    const data = lookupSheet.getRange(2, 1, lastRow - 1, 3).getValues();

    const thresholds = config.CHEMISTRY_CONFIG.THRESHOLDS;

    data.forEach(([p1, p2, chemVal]) => {
      const player1 = String(p1).trim();
      const player2 = String(p2).trim();
      const chem = Math.round(chemVal);

      const idx1 = nameToIndex[player1];
      const idx2 = nameToIndex[player2];

      if (idx1 !== undefined && idx2 !== undefined) {
        let value = thresholds.NEUTRAL_PRESET;
        if (chem <= thresholds.NEGATIVE_MAX) value = thresholds.NEGATIVE_PRESET;
        else if (chem >= thresholds.POSITIVE_MIN) value = thresholds.POSITIVE_PRESET;

        matrix[idx1][idx2] = value;
        matrix[idx2][idx1] = value;
      }
    });
  }

  return matrix.map(row => row.join(','));
}

/**
 * Export stats section (101 lines, 30 columns each)
 */
function exportStatsSection(ss, config) {
  const attributesSheet = ss.getSheetByName(config.SHEETS.ATTRIBUTES);

  if (!attributesSheet || attributesSheet.getLastRow() < config.ATTRIBUTES_CONFIG.FIRST_DATA_ROW) {
    throw new Error('Advanced Attributes sheet not found or empty');
  }

  const sheetData = attributesSheet.getRange(
    config.ATTRIBUTES_CONFIG.FIRST_DATA_ROW,
    1,
    101,
    config.ATTRIBUTES_CONFIG.TOTAL_COLUMNS
  ).getValues();

  const nameToIndex = {};
  GAME_CHARACTER_ORDER.forEach((name, idx) => {
    nameToIndex[name] = idx;
  });

  const presetMatrix = Array(101).fill(null).map(() => Array(30).fill(0));

  const cols = config.ATTRIBUTES_CONFIG.COLUMNS;

  // Load trajectory names from imported config
  const trajectoryTypes = getTrajectoryTypes();

  sheetData.forEach((row, idx) => {
    const characterName = String(row[cols.NAME]).trim();
    const charIndex = nameToIndex[characterName];

    if (charIndex === undefined) {
      return;
    }

    const presetRow = presetMatrix[charIndex];

    presetRow[0] = ARM_SIDES.indexOf(row[cols.ARM_SIDE]) || 0;
    presetRow[1] = ARM_SIDES.indexOf(row[cols.BATTING_SIDE]) || 0;
    presetRow[2] = CHARACTER_CLASSES.indexOf(row[cols.CHARACTER_CLASS]) || 0;
    presetRow[3] = 0;
    presetRow[4] = Number(row[cols.WEIGHT]) || 0;
    presetRow[5] = row[cols.CAPTAIN] === 'Yes' ? 1 : 0;

    const starPitchSplit = splitStarPitchField(row[cols.STAR_PITCH]);
    presetRow[6] = starPitchSplit.starPitchIndex;
    presetRow[29] = starPitchSplit.starPitchTypeIndex;

    presetRow[7] = STAR_SWINGS.indexOf(row[cols.STAR_SWING]) || 0;

    const abilitySplit = splitAbilityField(row[cols.ABILITY]);
    presetRow[8] = abilitySplit.fieldingIndex;
    presetRow[9] = abilitySplit.baserunningIndex;

    presetRow[10] = Number(row[cols.SLAP_HIT_CONTACT]) || 0;
    presetRow[11] = Number(row[cols.CHARGE_HIT_CONTACT]) || 0;
    presetRow[12] = Number(row[cols.SLAP_HIT_POWER]) || 0;
    presetRow[13] = Number(row[cols.CHARGE_HIT_POWER]) || 0;
    presetRow[14] = Number(row[cols.BUNTING]) || 0;
    presetRow[15] = Number(row[cols.SPEED]) || 0;
    presetRow[16] = Number(row[cols.THROWING_SPEED]) || 0;
    presetRow[17] = Number(row[cols.FIELDING]) || 0;
    presetRow[18] = Number(row[cols.PITCHING_OVERALL]) || 0;
    presetRow[19] = Number(row[cols.BATTING_OVERALL]) || 0;
    presetRow[20] = Number(row[cols.FIELDING_OVERALL]) || 0;
    presetRow[21] = Number(row[cols.SPEED_OVERALL]) || 0;
    presetRow[22] = Number(row[cols.CURVEBALL_SPEED]) || 0;
    presetRow[23] = Number(row[cols.FASTBALL_SPEED]) || 0;
    presetRow[24] = Number(row[cols.CURVE]) || 0;
    presetRow[25] = 0;
    presetRow[26] = trajectoryTypes.indexOf(row[cols.HITTING_TRAJECTORY]) >= 0 ? trajectoryTypes.indexOf(row[cols.HITTING_TRAJECTORY]) : 0;
    presetRow[27] = HIT_CURVE_TYPES.indexOf(row[cols.HIT_CURVE]) >= 0 ? HIT_CURVE_TYPES.indexOf(row[cols.HIT_CURVE]) : 0;
    presetRow[28] = Number(row[cols.STAMINA]) || 0;
  });

  return presetMatrix.map(row => row.join(','));
}

/**
 * Split combined ABILITY field back into fielding (index 8) and baserunning (index 9)
 */
function splitAbilityField(abilityValue) {
  const ability = String(abilityValue).trim();

  const baserunningIndex = BASERUNNING_ABILITIES.indexOf(ability);
  if (baserunningIndex > 0) {
    return { fieldingIndex: 0, baserunningIndex: baserunningIndex };
  }

  const fieldingIndex = FIELDING_ABILITIES.indexOf(ability);
  if (fieldingIndex > 0) {
    return { fieldingIndex: fieldingIndex, baserunningIndex: 0 };
  }

  return { fieldingIndex: 0, baserunningIndex: 0 };
}

/**
 * Split combined STAR_PITCH field back into star pitch (index 6) and type (index 29)
 */
function splitStarPitchField(starPitchValue) {
  const starPitch = String(starPitchValue).trim();

  const specialPitchIndex = STAR_PITCHES.indexOf(starPitch);
  if (specialPitchIndex > 0) {
    return { starPitchIndex: specialPitchIndex, starPitchTypeIndex: 0 };
  }

  const pitchTypeIndex = STAR_PITCH_TYPES.indexOf(starPitch);
  if (pitchTypeIndex >= 0) {
    return { starPitchIndex: 0, starPitchTypeIndex: pitchTypeIndex };
  }

  return { starPitchIndex: 0, starPitchTypeIndex: 0 };
}

/**
 * Export trajectory section (26 lines) from script properties
 */
function exportTrajectorySection(ss, config) {
  const props = PropertiesService.getScriptProperties();
  const trajectoryDataJson = props.getProperty('TRAJECTORY_DATA');

  if (!trajectoryDataJson) {
    throw new Error('Trajectory data not found. Please import a stats preset first.');
  }

  const trajectoryData = JSON.parse(trajectoryDataJson);

  // Lines 202-225: 24x25 matrix
  const matrixLines = trajectoryData.matrix.map(row => row.join(','));

  // Line 226: 6 trajectory names
  const namesLine = trajectoryData.names.join(',');

  // Line 227: 6 trajectory usage flags
  const usageLine = trajectoryData.usage.join(',');

  return [...matrixLines, namesLine, usageLine];
}

/**
 * Log export event to Chemistry Change Log
 */
function logExportEvent(stats) {
  try {
    const config = getConfig();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = config.SHEETS.CHEMISTRY_CHANGE_LOG;
    let logSheet = ss.getSheetByName(sheetName);

    if (!logSheet) {
      logSheet = ss.insertSheet(sheetName);

      logSheet.getRange(1, 1, 1, 6).setValues([
        ['Timestamp', 'Character 1', 'Character 2', 'Old Value', 'New Value', 'Notes']
      ]);

      const headerRange = logSheet.getRange(1, 1, 1, 6);
      headerRange.setBackground(config.COLORS.HEADER_BACKGROUND);
      headerRange.setFontColor(config.COLORS.HEADER_TEXT);
      headerRange.setFontWeight('bold');
      headerRange.setHorizontalAlignment('center');

      const logConfig = config.CHEMISTRY_CHANGE_LOG_CONFIG;
      logSheet.setColumnWidth(1, logConfig.COLUMN_WIDTHS.TIMESTAMP);
      logSheet.setColumnWidth(2, logConfig.COLUMN_WIDTHS.CHARACTER_1);
      logSheet.setColumnWidth(3, logConfig.COLUMN_WIDTHS.CHARACTER_2);
      logSheet.setColumnWidth(4, logConfig.COLUMN_WIDTHS.OLD_VALUE);
      logSheet.setColumnWidth(5, logConfig.COLUMN_WIDTHS.NEW_VALUE);
      logSheet.setColumnWidth(6, logConfig.COLUMN_WIDTHS.NOTES);

      logSheet.setFrozenRows(1);
    }

    const timestamp = new Date();
    const newRow = [
      timestamp,
      '*** EXPORT ***',
      'Full stats preset',
      '228 lines',
      stats.trajectoryExported ? 'With trajectory' : 'No trajectory',
      ''
    ];

    logSheet.appendRow(newRow);

    const lastRow = logSheet.getLastRow();
    logSheet.getRange(lastRow, 1).setNumberFormat('yyyy-mm-dd hh:mm:ss');
    logSheet.getRange(lastRow, 1, 1, 6).setBorder(true, true, true, true, true, true);
    logSheet.getRange(lastRow, 1, 1, 6).setBackground(config.COLORS.POSITIVE_HIGHLIGHT);

  } catch (e) {
    const config = getConfig();
    if (config.DEBUG.ENABLE_LOGGING) {
      Logger.log('Error in logExportEvent: ' + e.toString());
    }
    // Don't throw - logging failure shouldn't break the export
  }
}

/**
 * Show visual chemistry editor
 */
function showChemistryEditor() {
  const html = HtmlService.createHtmlOutputFromFile('DatabaseChemistryEditor')
    .setWidth(1200)
    .setHeight(650);
  SpreadsheetApp.getUi().showModalDialog(html, 'Chemistry Matrix Editor');
}

/**
 * Get full chemistry matrix for editor
 * Returns 101x101 matrix with character names
 */
function getChemistryMatrix() {
  try {
    const config = getConfig();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const lookupSheet = ss.getSheetByName(config.SHEETS.CHEMISTRY_LOOKUP);

    const mappingSheet = ss.getSheetByName(config.SHEETS.CHARACTER_NAME_MAPPING);
    const nameMappings = loadCharacterNameMappings(mappingSheet);

    const customNames = GAME_CHARACTER_ORDER.map(pythonName =>
      getCustomCharacterName(nameMappings, pythonName)
    );

    const matrix = Array(101).fill(null).map(() => Array(101).fill(1));

    const nameToIndex = {};
    customNames.forEach((name, idx) => {
      nameToIndex[name] = idx;
    });

    if (lookupSheet && lookupSheet.getLastRow() > 1) {
      const data = lookupSheet.getRange(2, 1, lookupSheet.getLastRow() - 1, 3).getValues();
      const thresholds = config.CHEMISTRY_CONFIG.THRESHOLDS;

      data.forEach(([p1, p2, chemVal]) => {
        const player1 = String(p1).trim();
        const player2 = String(p2).trim();
        const chem = Math.round(chemVal);

        const idx1 = nameToIndex[player1];
        const idx2 = nameToIndex[player2];

        if (idx1 !== undefined && idx2 !== undefined) {
          let value = thresholds.NEUTRAL_PRESET;
          if (chem <= thresholds.NEGATIVE_MAX) value = thresholds.NEGATIVE_PRESET;
          else if (chem >= thresholds.POSITIVE_MIN) value = thresholds.POSITIVE_PRESET;

          matrix[idx1][idx2] = value;
          matrix[idx2][idx1] = value;
        }
      });
    }

    return {
      matrix: matrix,
      characters: customNames
    };

  } catch (e) {
    const config = getConfig();
    if (config.DEBUG.ENABLE_LOGGING) {
      Logger.log('Error in getChemistryMatrix: ' + e.toString());
    }
    throw e;
  }
}

/**
 * Update chemistry matrix from editor
 * @param {Array<Array<number>>} matrix - 101x101 matrix of chemistry values (0/1/2)
 * @param {Array<Object>} changes - Array of change objects with char1, char2, oldValue, newValue
 */
function updateChemistryMatrix(matrix, changes) {
  try {
    if (changes && changes.length > 0) {
      changes.forEach(change => {
        logChemistryChange(
          change.char1,
          change.char2,
          change.oldValue,
          change.newValue
        );
      });
    }

    const config = getConfig();
    const thresholds = config.CHEMISTRY_CONFIG.THRESHOLDS;
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    const mappingSheet = ss.getSheetByName(config.SHEETS.CHARACTER_NAME_MAPPING);
    const nameMappings = loadCharacterNameMappings(mappingSheet);

    const customNames = GAME_CHARACTER_ORDER.map(pythonName =>
      getCustomCharacterName(nameMappings, pythonName)
    );

    const pairs = [];

    for (let i = 0; i < 101; i++) {
      for (let j = i + 1; j < 101; j++) {
        const value = matrix[i][j];

        let chemistry = null;
        if (value === thresholds.NEGATIVE_PRESET) chemistry = thresholds.NEGATIVE_MAX;
        else if (value === thresholds.NEUTRAL_PRESET) chemistry = null;
        else if (value === thresholds.POSITIVE_PRESET) chemistry = thresholds.POSITIVE_MIN;

        if (chemistry !== null) {
          pairs.push({
            player1: customNames[i],
            player2: customNames[j],
            chemistry: chemistry
          });
        }
      }
    }

    let lookupSheet = ss.getSheetByName(config.SHEETS.CHEMISTRY_LOOKUP);

    if (!lookupSheet) {
      lookupSheet = ss.insertSheet(config.SHEETS.CHEMISTRY_LOOKUP);
    }

    writeToChemistryLookup(lookupSheet, pairs);
    updateChemistryDataJSON();

    return { success: true, totalPairs: pairs.length, changesLogged: changes ? changes.length : 0 };

  } catch (e) {
    const config = getConfig();
    if (config.DEBUG.ENABLE_LOGGING) {
      Logger.log('Error in updateChemistryMatrix: ' + e.toString());
    }
    return { success: false, error: e.toString() };
  }
}

/**
 * Get all chemistry relationships for a specific character
 * @param {string} characterName - Name of character
 * @returns {Object} Character's chemistry data
 */
function getCharacterChemistry(characterName) {
  try {
    const matrixData = getChemistryMatrix();
    const idx = matrixData.characters.indexOf(characterName);

    if (idx === -1) {
      throw new Error('Character not found: ' + characterName);
    }

    const row = matrixData.matrix[idx];

    const relationships = [];
    for (let i = 0; i < 101; i++) {
      if (i !== idx && row[i] !== 0) {
        relationships.push({
          character: matrixData.characters[i],
          value: row[i]
        });
      }
    }

    return {
      character: characterName,
      relationships: relationships,
      positiveCount: relationships.filter(r => r.value === 1).length,
      strongPositiveCount: relationships.filter(r => r.value === 2).length
    };

  } catch (e) {
    const config = getConfig();
    if (config.DEBUG.ENABLE_LOGGING) {
      Logger.log('Error in getCharacterChemistry: ' + e.toString());
    }
    throw e;
  }
}

/**
 * Log a chemistry change to the Chemistry Change Log sheet
 * @param {string} char1 - First character name
 * @param {string} char2 - Second character name
 * @param {number} oldValue - Old chemistry value (0/1/2)
 * @param {number} newValue - New chemistry value (0/1/2)
 */
function logChemistryChange(char1, char2, oldValue, newValue) {
  try {
    const config = getConfig();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = config.SHEETS.CHEMISTRY_CHANGE_LOG;
    let logSheet = ss.getSheetByName(sheetName);

    if (!logSheet) {
      logSheet = ss.insertSheet(sheetName);

      logSheet.getRange(1, 1, 1, 6).setValues([
        ['Timestamp', 'Character 1', 'Character 2', 'Old Value', 'New Value', 'Notes']
      ]);

      const headerRange = logSheet.getRange(1, 1, 1, 6);
      headerRange.setBackground(config.COLORS.HEADER_BACKGROUND);
      headerRange.setFontColor(config.COLORS.HEADER_TEXT);
      headerRange.setFontWeight('bold');
      headerRange.setHorizontalAlignment('center');

      const logConfig = config.CHEMISTRY_CHANGE_LOG_CONFIG;
      logSheet.setColumnWidth(1, logConfig.COLUMN_WIDTHS.TIMESTAMP);
      logSheet.setColumnWidth(2, logConfig.COLUMN_WIDTHS.CHARACTER_1);
      logSheet.setColumnWidth(3, logConfig.COLUMN_WIDTHS.CHARACTER_2);
      logSheet.setColumnWidth(4, logConfig.COLUMN_WIDTHS.OLD_VALUE);
      logSheet.setColumnWidth(5, logConfig.COLUMN_WIDTHS.NEW_VALUE);
      logSheet.setColumnWidth(6, logConfig.COLUMN_WIDTHS.NOTES);

      logSheet.setFrozenRows(1);
    }

    const thresholds = config.CHEMISTRY_CONFIG.THRESHOLDS;
    const valueToText = function(val) {
      if (val === thresholds.NEGATIVE_PRESET) return 'Negative';
      if (val === thresholds.NEUTRAL_PRESET) return 'Neutral';
      if (val === thresholds.POSITIVE_PRESET) return 'Positive';
      return 'Unknown';
    };

    const timestamp = new Date();
    const newRow = [
      timestamp,
      char1,
      char2,
      valueToText(oldValue),
      valueToText(newValue),
      ''
    ];

    logSheet.appendRow(newRow);

    const lastRow = logSheet.getLastRow();
    logSheet.getRange(lastRow, 1).setNumberFormat('yyyy-mm-dd hh:mm:ss');
    logSheet.getRange(lastRow, 1, 1, 6).setBorder(true, true, true, true, true, true);

    const valueRange = logSheet.getRange(lastRow, 4, 1, 2);
    if (newValue === thresholds.POSITIVE_PRESET) {
      valueRange.setBackground(config.COLORS.POSITIVE_HIGHLIGHT);
    } else if (newValue === thresholds.NEGATIVE_PRESET) {
      valueRange.setBackground(config.COLORS.NEGATIVE_HIGHLIGHT);
    } else {
      valueRange.setBackground(config.COLORS.NEUTRAL_HIGHLIGHT);
    }

  } catch (e) {
    const config = getConfig();
    if (config.DEBUG.ENABLE_LOGGING) {
      Logger.log('Error in logChemistryChange: ' + e.toString());
    }
    // Don't throw - logging failure shouldn't break the editor
  }
}

/**
 * Write chemistry pairs to Chemistry Lookup sheet
 * @param {Sheet} sheet - The Chemistry Lookup sheet
 * @param {Array<Object>} pairs - Array of {player1, player2, chemistry} objects
 */
function writeToChemistryLookup(sheet, pairs) {
  const config = getConfig();

  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).clear();
  }

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, 3).setValues([
      ['Player 1', 'Player 2', 'Chemistry']
    ]);

    const headerRange = sheet.getRange(1, 1, 1, 3);
    headerRange.setBackground(config.COLORS.HEADER_BACKGROUND);
    headerRange.setFontColor(config.COLORS.HEADER_TEXT);
    headerRange.setFontWeight('bold');
    headerRange.setHorizontalAlignment('center');

    const chemConfig = config.CHEMISTRY_CONFIG;
    sheet.setColumnWidth(1, chemConfig.COLUMN_WIDTHS.PLAYER_1);
    sheet.setColumnWidth(2, chemConfig.COLUMN_WIDTHS.PLAYER_2);
    sheet.setColumnWidth(3, chemConfig.COLUMN_WIDTHS.CHEMISTRY_VALUE);

    sheet.setFrozenRows(1);
  }

  if (pairs.length > 0) {
    const data = pairs.map(p => [p.player1, p.player2, p.chemistry]);
    sheet.getRange(2, 1, pairs.length, 3).setValues(data);
  }
}
