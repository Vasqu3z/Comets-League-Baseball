// ===== PLAYER ATTRIBUTE COMPARISON =====
// Purpose: Retrieve and compare player attributes with in-memory caching for performance
// Dependencies: DatabaseConfig.js
// Entry Point(s): getPlayerAttributes(), getPlayerAttributesWithAverages()

function showAttributeComparisonAdmin() {
  var html = HtmlService.createHtmlOutputFromFile('DatabaseAttributesAdmin')
    .setWidth(1100)
    .setHeight(700)
    .setTitle('Player Attribute Comparison (Admin)');
  SpreadsheetApp.getUi().showModalDialog(html, 'Player Attribute Comparison (Admin)');
}

// Cache to store the attribute data
var attributeCache = null;
var attributeCacheTimestamp = null;
var ATTRIBUTE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getAttributeData() {
  var now = new Date().getTime();
  
  // Return cached data if it's still valid
  if (attributeCache && attributeCacheTimestamp && (now - attributeCacheTimestamp < ATTRIBUTE_CACHE_DURATION)) {
    return attributeCache;
  }
  
  var config = getConfig();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var attributeSheet = ss.getSheetByName(config.SHEETS.ATTRIBUTES);
  
  if (!attributeSheet) {
    throw new Error(config.SHEETS.ATTRIBUTES + ' sheet not found');
  }
  
  var lastRow = attributeSheet.getLastRow();
  if (lastRow < config.ATTRIBUTES_CONFIG.FIRST_DATA_ROW) {
    return null;
  }
  
  // Read all attribute data
  var allData = attributeSheet.getRange(
    config.ATTRIBUTES_CONFIG.FIRST_DATA_ROW,
    1,
    lastRow - config.ATTRIBUTES_CONFIG.FIRST_DATA_ROW + 1,
    config.ATTRIBUTES_CONFIG.TOTAL_COLUMNS
  ).getValues();

  // Build map of player name to attributes
  var playerMap = {};
  var playerNames = [];

  for (var i = 0; i < allData.length; i++) {
    var name = String(allData[i][0]).trim();
    if (!name) continue;

    playerNames.push(name);
    playerMap[name] = allData[i];
  }

  playerNames.sort(function(a, b) {
    return a.localeCompare(b);
  });

  attributeCache = {
    map: playerMap,
    players: playerNames,
    config: config
  };
  attributeCacheTimestamp = now;
  
  return attributeCache;
}

function getPlayerAttributeList() {
  try {
    var data = getAttributeData();
    if (!data) return [];
    return data.players;
  } catch (e) {
    var config = getConfig();
    if (config.DEBUG.ENABLE_LOGGING) {
      Logger.log('Error in getPlayerAttributeList: ' + e.toString());
    }
    throw e;
  }
}

function getPlayerAttributes(playerNames) {
  try {
    var data = getAttributeData();
    if (!data) return [];

    var config = data.config;
    var COLS = config.ATTRIBUTES_CONFIG.COLUMNS;
    var results = [];

    for (var p = 0; p < playerNames.length; p++) {
      var playerName = playerNames[p];
      var row = data.map[playerName];

      if (!row) continue;

      var playerData = {
        name: playerName,
        characterClass: row[COLS.CHARACTER_CLASS],
        captain: row[COLS.CAPTAIN],
        mii: row[COLS.MII],
        miiColor: row[COLS.MII_COLOR],
        armSide: row[COLS.ARM_SIDE],
        battingSide: row[COLS.BATTING_SIDE],
        weight: row[COLS.WEIGHT],
        ability: row[COLS.ABILITY],

        // Overall stats
        pitchingOverall: row[COLS.PITCHING_OVERALL],
        battingOverall: row[COLS.BATTING_OVERALL],
        fieldingOverall: row[COLS.FIELDING_OVERALL],
        speedOverall: row[COLS.SPEED_OVERALL],

        // Pitching attributes
        starPitch: row[COLS.STAR_PITCH],
        fastballSpeed: row[COLS.FASTBALL_SPEED],
        curveballSpeed: row[COLS.CURVEBALL_SPEED],
        curve: row[COLS.CURVE],
        stamina: row[COLS.STAMINA],

        // Hitting attributes
        starSwing: row[COLS.STAR_SWING],
        hitCurve: row[COLS.HIT_CURVE],
        hittingTrajectory: row[COLS.HITTING_TRAJECTORY],
        slapHitContact: row[COLS.SLAP_HIT_CONTACT],
        chargeHitContact: row[COLS.CHARGE_HIT_CONTACT],
        slapHitPower: row[COLS.SLAP_HIT_POWER],
        chargeHitPower: row[COLS.CHARGE_HIT_POWER],
        preCharge: row[COLS.PRE_CHARGE],

        // Fielding attributes
        fielding: row[COLS.FIELDING],
        throwingSpeed: row[COLS.THROWING_SPEED],

        // Running attributes
        speed: row[COLS.SPEED],
        bunting: row[COLS.BUNTING]
      };

      results.push(playerData);
    }

    return results;
  } catch (e) {
    var config = getConfig();
    if (config.DEBUG.ENABLE_LOGGING) {
      Logger.log('Error in getPlayerAttributes: ' + e.toString());
    }
    throw e;
  }
}

// ===== ADMIN VERSION FUNCTIONS =====

/**
 * Calculate averages for a specific character class
 * @param {string} characterClass - The class to calculate averages for (Balanced, Power, Speed, Technique)
 * @param {boolean} excludeMiis - Whether to exclude Mii characters from averages (default: true)
 * @returns {Object} Object with average values for each stat for the class
 */
function getClassAverages(characterClass, excludeMiis) {
  // Default to excluding Miis
  if (excludeMiis === undefined || excludeMiis === null) {
    excludeMiis = true;
  }

  try {
    var data = getAttributeData();
    if (!data) return null;

    var config = data.config;
    var COLS = config.ATTRIBUTES_CONFIG.COLUMNS;

    // Collect all numeric stats from players in this class
    var statTotals = {
      weight: 0,
      pitchingOverall: 0,
      battingOverall: 0,
      fieldingOverall: 0,
      speedOverall: 0,
      fastballSpeed: 0,
      curveballSpeed: 0,
      curve: 0,
      stamina: 0,
      slapHitContact: 0,
      chargeHitContact: 0,
      slapHitPower: 0,
      chargeHitPower: 0,
      fielding: 0,
      throwingSpeed: 0,
      speed: 0,
      bunting: 0
    };

    var playerCount = 0;

    for (var playerName in data.map) {
      if (data.map.hasOwnProperty(playerName)) {
        var row = data.map[playerName];

        if (excludeMiis && row[COLS.MII] === 'Yes') {
          continue;
        }

        if (row[COLS.CHARACTER_CLASS] === characterClass) {
          statTotals.weight += row[COLS.WEIGHT] || 0;
          statTotals.pitchingOverall += row[COLS.PITCHING_OVERALL] || 0;
          statTotals.battingOverall += row[COLS.BATTING_OVERALL] || 0;
          statTotals.fieldingOverall += row[COLS.FIELDING_OVERALL] || 0;
          statTotals.speedOverall += row[COLS.SPEED_OVERALL] || 0;
          statTotals.fastballSpeed += row[COLS.FASTBALL_SPEED] || 0;
          statTotals.curveballSpeed += row[COLS.CURVEBALL_SPEED] || 0;
          statTotals.curve += row[COLS.CURVE] || 0;
          statTotals.stamina += row[COLS.STAMINA] || 0;
          statTotals.slapHitContact += row[COLS.SLAP_HIT_CONTACT] || 0;
          statTotals.chargeHitContact += row[COLS.CHARGE_HIT_CONTACT] || 0;
          statTotals.slapHitPower += row[COLS.SLAP_HIT_POWER] || 0;
          statTotals.chargeHitPower += row[COLS.CHARGE_HIT_POWER] || 0;
          statTotals.fielding += row[COLS.FIELDING] || 0;
          statTotals.throwingSpeed += row[COLS.THROWING_SPEED] || 0;
          statTotals.speed += row[COLS.SPEED] || 0;
          statTotals.bunting += row[COLS.BUNTING] || 0;
          playerCount++;
        }
      }
    }

    if (playerCount === 0) return null;

    var averages = {};
    for (var stat in statTotals) {
      if (statTotals.hasOwnProperty(stat)) {
        averages[stat] = (statTotals[stat] / playerCount).toFixed(2);
      }
    }

    // Calculate derived averages
    averages.pitchingAverage = (
      (parseFloat(averages.curveballSpeed) / 2) +
      (parseFloat(averages.fastballSpeed) / 2) +
      parseFloat(averages.curve) +
      parseFloat(averages.stamina)
    ) / 4;
    averages.pitchingAverage = averages.pitchingAverage.toFixed(2);

    averages.battingAverage = (
      parseFloat(averages.slapHitContact) +
      parseFloat(averages.chargeHitContact) +
      parseFloat(averages.slapHitPower) +
      parseFloat(averages.chargeHitPower)
    ) / 4;
    averages.battingAverage = averages.battingAverage.toFixed(2);

    averages.fieldingAverage = (
      parseFloat(averages.throwingSpeed) +
      parseFloat(averages.fielding)
    ) / 2;
    averages.fieldingAverage = averages.fieldingAverage.toFixed(2);

    return averages;

  } catch (e) {
    var config = getConfig();
    if (config.DEBUG.ENABLE_LOGGING) {
      Logger.log('ERROR [DatabaseAttributes/getClassAverages]: ' + e.toString());
    }
    return null;
  }
}

/**
 * Calculate league-wide averages for all numeric stats
 * @param {boolean} excludeMiis - Whether to exclude Mii characters from averages (default: true)
 * @returns {Object} Object with average values for each stat
 */
function getLeagueAverages(excludeMiis) {
  // Default to excluding Miis
  if (excludeMiis === undefined || excludeMiis === null) {
    excludeMiis = true;
  }

  try {
    var data = getAttributeData();
    if (!data) return null;

    var config = data.config;
    var COLS = config.ATTRIBUTES_CONFIG.COLUMNS;

    // Collect all numeric stats from all players
    var statTotals = {
      weight: 0,
      pitchingOverall: 0,
      battingOverall: 0,
      fieldingOverall: 0,
      speedOverall: 0,
      fastballSpeed: 0,
      curveballSpeed: 0,
      curve: 0,
      stamina: 0,
      slapHitContact: 0,
      chargeHitContact: 0,
      slapHitPower: 0,
      chargeHitPower: 0,
      fielding: 0,
      throwingSpeed: 0,
      speed: 0,
      bunting: 0
    };

    var playerCount = 0;

    for (var playerName in data.map) {
      if (data.map.hasOwnProperty(playerName)) {
        var row = data.map[playerName];

        if (excludeMiis && row[COLS.MII] === 'Yes') {
          continue;
        }

        statTotals.weight += row[COLS.WEIGHT] || 0;
        statTotals.pitchingOverall += row[COLS.PITCHING_OVERALL] || 0;
        statTotals.battingOverall += row[COLS.BATTING_OVERALL] || 0;
        statTotals.fieldingOverall += row[COLS.FIELDING_OVERALL] || 0;
        statTotals.speedOverall += row[COLS.SPEED_OVERALL] || 0;
        statTotals.fastballSpeed += row[COLS.FASTBALL_SPEED] || 0;
        statTotals.curveballSpeed += row[COLS.CURVEBALL_SPEED] || 0;
        statTotals.curve += row[COLS.CURVE] || 0;
        statTotals.stamina += row[COLS.STAMINA] || 0;
        statTotals.slapHitContact += row[COLS.SLAP_HIT_CONTACT] || 0;
        statTotals.chargeHitContact += row[COLS.CHARGE_HIT_CONTACT] || 0;
        statTotals.slapHitPower += row[COLS.SLAP_HIT_POWER] || 0;
        statTotals.chargeHitPower += row[COLS.CHARGE_HIT_POWER] || 0;
        statTotals.fielding += row[COLS.FIELDING] || 0;
        statTotals.throwingSpeed += row[COLS.THROWING_SPEED] || 0;
        statTotals.speed += row[COLS.SPEED] || 0;
        statTotals.bunting += row[COLS.BUNTING] || 0;
        playerCount++;
      }
    }

    var averages = {};
    for (var stat in statTotals) {
      if (statTotals.hasOwnProperty(stat)) {
        averages[stat] = (statTotals[stat] / playerCount).toFixed(2);
      }
    }

    // Calculate derived averages
    averages.pitchingAverage = (
      (parseFloat(averages.curveballSpeed) / 2) +
      (parseFloat(averages.fastballSpeed) / 2) +
      parseFloat(averages.curve) +
      parseFloat(averages.stamina)
    ) / 4;
    averages.pitchingAverage = averages.pitchingAverage.toFixed(2);

    averages.battingAverage = (
      parseFloat(averages.slapHitContact) +
      parseFloat(averages.chargeHitContact) +
      parseFloat(averages.slapHitPower) +
      parseFloat(averages.chargeHitPower)
    ) / 4;
    averages.battingAverage = averages.battingAverage.toFixed(2);

    averages.fieldingAverage = (
      parseFloat(averages.throwingSpeed) +
      parseFloat(averages.fielding)
    ) / 2;
    averages.fieldingAverage = averages.fieldingAverage.toFixed(2);

    return averages;

  } catch (e) {
    var config = getConfig();
    if (config.DEBUG.ENABLE_LOGGING) {
      Logger.log('ERROR [DatabaseAttributes/getLeagueAverages]: ' + e.toString());
    }
    return null;
  }
}

function getPlayerAttributesWithAverages(playerNames) {
  try {
    var data = getAttributeData();
    if (!data) return [];

    var config = data.config;
    var COLS = config.ATTRIBUTES_CONFIG.COLUMNS;
    var results = [];

    for (var p = 0; p < playerNames.length; p++) {
      var playerName = playerNames[p];
      var row = data.map[playerName];

      if (!row) continue;

      var playerData = {
        name: playerName,
        characterClass: row[COLS.CHARACTER_CLASS],
        captain: row[COLS.CAPTAIN],
        mii: row[COLS.MII],
        miiColor: row[COLS.MII_COLOR],
        armSide: row[COLS.ARM_SIDE],
        battingSide: row[COLS.BATTING_SIDE],
        weight: row[COLS.WEIGHT],
        ability: row[COLS.ABILITY],

        // Overall stats
        pitchingOverall: row[COLS.PITCHING_OVERALL],
        battingOverall: row[COLS.BATTING_OVERALL],
        fieldingOverall: row[COLS.FIELDING_OVERALL],
        speedOverall: row[COLS.SPEED_OVERALL],

        // Pitching attributes
        starPitch: row[COLS.STAR_PITCH],
        fastballSpeed: row[COLS.FASTBALL_SPEED],
        curveballSpeed: row[COLS.CURVEBALL_SPEED],
        curve: row[COLS.CURVE],
        stamina: row[COLS.STAMINA],

        // Hitting attributes
        starSwing: row[COLS.STAR_SWING],
        hitCurve: row[COLS.HIT_CURVE],
        hittingTrajectory: row[COLS.HITTING_TRAJECTORY],
        slapHitContact: row[COLS.SLAP_HIT_CONTACT],
        chargeHitContact: row[COLS.CHARGE_HIT_CONTACT],
        slapHitPower: row[COLS.SLAP_HIT_POWER],
        chargeHitPower: row[COLS.CHARGE_HIT_POWER],
        preCharge: row[COLS.PRE_CHARGE],

        // Fielding attributes
        fielding: row[COLS.FIELDING],
        throwingSpeed: row[COLS.THROWING_SPEED],

        // Running attributes
        speed: row[COLS.SPEED],
        bunting: row[COLS.BUNTING]
      };
      
      // Calculate individual player averages
      // Pitching Average: ((Curveball Speed / 2) + (Fastball Speed / 2) + Curve + Stamina) / 4
      playerData.pitchingAverage = (
        (playerData.curveballSpeed / 2) + 
        (playerData.fastballSpeed / 2) + 
        playerData.curve + 
        playerData.stamina
      ) / 4;
      
      // Batting Average: (Slap Contact + Charge Contact + Slap Power + Charge Power) / 4
      playerData.battingAverage = (
        playerData.slapHitContact + 
        playerData.chargeHitContact + 
        playerData.slapHitPower + 
        playerData.chargeHitPower
      ) / 4;
      
      // Fielding Average: (Throwing Speed + Fielding) / 2
      playerData.fieldingAverage = (
        playerData.throwingSpeed + 
        playerData.fielding
      ) / 2;
      
      results.push(playerData);
    }
    
    return results;
  } catch (e) {
    var config = getConfig();
    if (config.DEBUG.ENABLE_LOGGING) {
      Logger.log('Error in getPlayerAttributesWithAverages: ' + e.toString());
    }
    throw e;
  }
}

/**
 * Save character attribute changes to the database
 * @param {string} playerName - Name of the player to update
 * @param {Object} modifiedFields - Object mapping field labels to new values
 * @returns {Object} Success/error result
 */
function saveCharacterAttributes(playerName, modifiedFields) {
  try {
    var config = getConfig();
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var attributeSheet = ss.getSheetByName(config.SHEETS.ATTRIBUTES);

    if (!attributeSheet) {
      throw new Error(config.SHEETS.ATTRIBUTES + ' sheet not found');
    }

    var COLS = config.ATTRIBUTES_CONFIG.COLUMNS;

    // Read current player row from sheet
    var lastRow = attributeSheet.getLastRow();
    var nameColumn = COLS.NAME + 1;
    var names = attributeSheet.getRange(config.ATTRIBUTES_CONFIG.FIRST_DATA_ROW, nameColumn,
                                        lastRow - config.ATTRIBUTES_CONFIG.FIRST_DATA_ROW + 1, 1).getValues();

    // Find the character's current row
    var rowNumber = -1;
    for (var i = 0; i < names.length; i++) {
      if (names[i][0] === playerName) {
        rowNumber = config.ATTRIBUTES_CONFIG.FIRST_DATA_ROW + i;
        break;
      }
    }

    if (rowNumber === -1) {
      throw new Error('Player not found in sheet: ' + playerName);
    }

    // Map field labels to column indices
    var fieldToColumn = {
      'Weight': COLS.WEIGHT + 1,
      'Curve': COLS.CURVE + 1,
      'Curveball Speed': COLS.CURVEBALL_SPEED + 1,
      'Fastball Speed': COLS.FASTBALL_SPEED + 1,
      'Stamina': COLS.STAMINA + 1,
      'Slap Hit Contact Size': COLS.SLAP_HIT_CONTACT + 1,
      'Charge Hit Contact Size': COLS.CHARGE_HIT_CONTACT + 1,
      'Slap Hit Power': COLS.SLAP_HIT_POWER + 1,
      'Charge Hit Power': COLS.CHARGE_HIT_POWER + 1,
      'Bunting': COLS.BUNTING + 1,
      'Speed': COLS.SPEED + 1,
      'Throwing Speed': COLS.THROWING_SPEED + 1,
      'Fielding': COLS.FIELDING + 1,
      'Pitching Overall': COLS.PITCHING_OVERALL + 1,
      'Batting Overall': COLS.BATTING_OVERALL + 1,
      'Fielding Overall': COLS.FIELDING_OVERALL + 1,
      'Speed Overall': COLS.SPEED_OVERALL + 1,
      'Captain': COLS.CAPTAIN + 1,
      'Hit Curve': COLS.HIT_CURVE + 1,
      'Pre-Charge': COLS.PRE_CHARGE + 1,
      'Mii': COLS.MII + 1,
      'Throwing Side': COLS.ARM_SIDE + 1,
      'Batting Side': COLS.BATTING_SIDE + 1,
      'Hitting Trajectory': COLS.HITTING_TRAJECTORY + 1,
      'Star Swing': COLS.STAR_SWING + 1,
      'Star Pitch': COLS.STAR_PITCH + 1,
      'Ability': COLS.ABILITY + 1,
      'Mii Color': COLS.MII_COLOR + 1
    };

    // Batch all attribute updates
    var a1Notations = [];
    var valuesToUpdate = [];

    for (var fieldLabel in modifiedFields) {
      if (modifiedFields.hasOwnProperty(fieldLabel)) {
        var columnNumber = fieldToColumn[fieldLabel];
        if (!columnNumber) {
          if (config.DEBUG.ENABLE_LOGGING) {
            Logger.log('WARNING [DatabaseAttributes/saveCharacterAttributes]: Unknown field label: ' + fieldLabel);
          }
          continue;
        }

        var newValue = modifiedFields[fieldLabel];

        if (fieldLabel === 'Ability') {
          newValue = newValue.replace(' (Fielding)', '').replace(' (Baserunning)', '');
        }

        if (typeof newValue === 'string' && !isNaN(newValue)) {
          newValue = Number(newValue);
        }

        a1Notations.push(attributeSheet.getRange(rowNumber, columnNumber).getA1Notation());
        valuesToUpdate.push([[newValue]]);
      }
    }

    // Write all updates to sheet
    if (a1Notations.length > 0) {
      attributeSheet.getRangeList(a1Notations).setValues(valuesToUpdate);
    }

    clearAttributeCache();

    return { success: true, message: 'Character attributes updated successfully' };

  } catch (e) {
    if (config.DEBUG.ENABLE_LOGGING) {
      Logger.log('ERROR [DatabaseAttributes/saveCharacterAttributes]: ' + e.toString());
    }
    throw new Error('Failed to save character attributes: ' + e.message);
  }
}

// Function to manually clear cache if needed
function clearAttributeCache() {
  attributeCache = null;
  attributeCacheTimestamp = null;
}

// Function to clear all caches
function clearAllCaches() {
  clearAttributeCache();
  if (typeof clearChemistryCache === 'function') {
    clearChemistryCache();
  }
}