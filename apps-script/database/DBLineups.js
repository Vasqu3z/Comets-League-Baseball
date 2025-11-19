// ===== LINEUP BUILDER =====
// Purpose: Interactive baseball field with chemistry visualization and lineup management
// Dependencies: DatabaseConfig.js
// Entry Point(s): getLineupChemistryDataFromJSON(), calculateTeamChemistry(), saveLineup()

// Get chemistry data from JSON (ultra-fast)
function getLineupChemistryDataFromJSON() {
  try {
    var props = PropertiesService.getScriptProperties();
    var dataJson = props.getProperty('CHEMISTRY_DATA');

    // Auto-refresh: Check if cache is missing or stale
    if (!dataJson) {
      var config = getConfig();
      if (config.DEBUG.ENABLE_LOGGING) {
        Logger.log('Chemistry JSON cache missing - reading from sheet and updating cache');
      }
      updateChemistryDataJSON();
      dataJson = props.getProperty('CHEMISTRY_DATA');

      if (!dataJson) {
        return getChemistryLookupData();
      }
    } else {
      // Check if cache is stale
      var freshnessCheck = checkIfChemistryDataNeedsUpdate();
      if (freshnessCheck.needsUpdate) {
        var config = getConfig();
        if (config.DEBUG.ENABLE_LOGGING) {
          Logger.log('Chemistry JSON cache stale - auto-refreshing: ' + freshnessCheck.reason);
        }
        updateChemistryDataJSON();
        dataJson = props.getProperty('CHEMISTRY_DATA');
      }
    }

    var data = JSON.parse(dataJson);
    var chemistryMatrix = {};

    data.players.forEach(function(player) {
      chemistryMatrix[player] = {};
    });

    data.pairs.forEach(function(pair) {
      chemistryMatrix[pair.p1][pair.p2] = pair.v;
      chemistryMatrix[pair.p2][pair.p1] = pair.v;
    });

    return {
      matrix: chemistryMatrix,
      players: data.players,
      thresholds: {
        POSITIVE_MIN: data.thresholds.positive,
        NEGATIVE_MAX: data.thresholds.negative
      },
      timestamp: data.timestamp,
      lastModified: data.lastModified
    };
  } catch (e) {
    var config = getConfig();
    if (config.DEBUG.ENABLE_LOGGING) {
      Logger.log('Error reading JSON: ' + e.toString());
    }
    return getChemistryLookupData();
  }
}

function getChemistryLookupData() {
  var config = getConfig();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var lookupSheet = ss.getSheetByName(config.SHEETS.CHEMISTRY_LOOKUP);

  if (!lookupSheet) {
    throw new Error(config.SHEETS.CHEMISTRY_LOOKUP + ' sheet not found.');
  }

  var lastRow = lookupSheet.getLastRow();

  if (lastRow < 2) {
    throw new Error('Chemistry Lookup sheet is empty.');
  }

  var lookupData = lookupSheet.getRange(2, 1, lastRow - 1, 3).getValues();
  var chemistryMatrix = {};
  var playerSet = {};

  for (var i = 0; i < lookupData.length; i++) {
    var player1 = String(lookupData[i][config.CHEMISTRY_CONFIG.COLUMNS.PLAYER_1]).trim();
    var player2 = String(lookupData[i][config.CHEMISTRY_CONFIG.COLUMNS.PLAYER_2]).trim();
    var chemValue = lookupData[i][config.CHEMISTRY_CONFIG.COLUMNS.CHEMISTRY_VALUE];
    
    if (!player1 || !player2) continue;
    
    playerSet[player1] = true;
    playerSet[player2] = true;
    
    if (!chemistryMatrix[player1]) chemistryMatrix[player1] = {};
    if (!chemistryMatrix[player2]) chemistryMatrix[player2] = {};
    
    chemistryMatrix[player1][player2] = Number(chemValue);
    chemistryMatrix[player2][player1] = Number(chemValue);
  }
  
  var players = Object.keys(playerSet).sort(function(a, b) {
    return a.localeCompare(b);
  });
  
  return {
    matrix: chemistryMatrix,
    players: players,
    thresholds: config.CHEMISTRY_CONFIG.THRESHOLDS
  };
}

function getLineupCharacterList() {
  try {
    var data = getLineupChemistryDataFromJSON();
    if (!data) return [];
    return data.players;
  } catch (e) {
    var config = getConfig();
    if (config.DEBUG.ENABLE_LOGGING) {
      Logger.log('Error in getLineupCharacterList: ' + e.toString());
    }
    throw e;
  }
}

function getLineupChemistryData() {
  try {
    return getLineupChemistryDataFromJSON();
  } catch (e) {
    var config = getConfig();
    if (config.DEBUG.ENABLE_LOGGING) {
      Logger.log('Error in getLineupChemistryData: ' + e.toString());
    }
    throw e;
  }
}

function calculateTeamChemistry(playerNames) {
  try {
    var chemData = getLineupChemistryDataFromJSON();
    if (!chemData) {
      return { total: 0, positive: 0, negative: 0, pairs: [] };
    }
    
    var matrix = chemData.matrix;
    var thresholds = chemData.thresholds;
    var totalChemistry = 0;
    var positiveCount = 0;
    var negativeCount = 0;
    var pairs = [];
    
    for (var i = 0; i < playerNames.length; i++) {
      if (!playerNames[i]) continue;
      
      for (var j = i + 1; j < playerNames.length; j++) {
        if (!playerNames[j]) continue;
        
        var player1 = playerNames[i];
        var player2 = playerNames[j];
        var chemValue = 0;
        
        if (matrix[player1] && matrix[player1][player2] !== undefined) {
          chemValue = matrix[player1][player2];
        }
        
        var chemType = 'neutral';
        if (chemValue >= thresholds.POSITIVE_MIN) {
          chemType = 'positive';
          positiveCount++;
          totalChemistry += chemValue;
        } else if (chemValue <= thresholds.NEGATIVE_MAX) {
          chemType = 'negative';
          negativeCount++;
          totalChemistry += chemValue;
        }
        
        pairs.push({
          player1: player1,
          player2: player2,
          value: chemValue,
          type: chemType
        });
      }
    }
    
    return {
      total: totalChemistry,
      positive: positiveCount,
      negative: negativeCount,
      neutral: pairs.length - positiveCount - negativeCount,
      pairs: pairs
    };
  } catch (e) {
    var config = getConfig();
    if (config.DEBUG.ENABLE_LOGGING) {
      Logger.log('Error in calculateTeamChemistry: ' + e.toString());
    }
    throw e;
  }
}

// Save lineup to ScriptProperties
function saveLineup(lineupData) {
  var props = PropertiesService.getScriptProperties();
  var savedLineups = props.getProperty('SAVED_LINEUPS');
  var lineups = savedLineups ? JSON.parse(savedLineups) : [];
  
  // Remove existing lineup with same name
  lineups = lineups.filter(function(l) { return l.name !== lineupData.name; });
  
  // Add new lineup
  lineups.push(lineupData);
  
  props.setProperty('SAVED_LINEUPS', JSON.stringify(lineups));
}

// Get all saved lineups
function getSavedLineups() {
  var props = PropertiesService.getScriptProperties();
  var savedLineups = props.getProperty('SAVED_LINEUPS');
  return savedLineups ? JSON.parse(savedLineups) : [];
}

// Load specific lineup
function loadLineup(lineupName) {
  var lineups = getSavedLineups();
  return lineups.find(function(l) { return l.name === lineupName; });
}

// Delete lineup
function deleteLineup(lineupName) {
  var props = PropertiesService.getScriptProperties();
  var lineups = getSavedLineups();
  lineups = lineups.filter(function(l) { return l.name !== lineupName; });
  props.setProperty('SAVED_LINEUPS', JSON.stringify(lineups));
}

function checkIfChemistryDataNeedsUpdate() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var config = getConfig();
    var lookupSheet = ss.getSheetByName(config.SHEETS.CHEMISTRY_LOOKUP);
    
    if (!lookupSheet) {
      return { needsUpdate: false, reason: 'No lookup sheet' };
    }
    
    var props = PropertiesService.getScriptProperties();
    var jsonTimestamp = props.getProperty('CHEMISTRY_LOOKUP_TIMESTAMP');
    var storedRowCount = props.getProperty('CHEMISTRY_LOOKUP_ROWCOUNT');
    var storedChecksum = props.getProperty('CHEMISTRY_LOOKUP_CHECKSUM');
    
    if (!jsonTimestamp) {
      return { 
        needsUpdate: true, 
        reason: 'No JSON data found. Please run Update Chemistry Data.' 
      };
    }
    
    // Check row count first (fastest check)
    var currentRowCount = lookupSheet.getLastRow();
    
    if (storedRowCount && parseInt(storedRowCount) !== currentRowCount) {
      return { 
        needsUpdate: true, 
        reason: 'Chemistry data has changed (rows added/removed).' 
      };
    }
    
    // If row count matches, check checksum to detect value changes
    if (storedChecksum) {
      var lastRow = lookupSheet.getLastRow();
      if (lastRow > 1) {
        var lookupData = lookupSheet.getRange(2, 1, lastRow - 1, 3).getValues();
        var currentChecksum = 0;

        for (var i = 0; i < lookupData.length; i++) {
          var player1 = String(lookupData[i][config.CHEMISTRY_CONFIG.COLUMNS.PLAYER_1]).trim();
          var player2 = String(lookupData[i][config.CHEMISTRY_CONFIG.COLUMNS.PLAYER_2]).trim();
          var chemValue = Number(lookupData[i][config.CHEMISTRY_CONFIG.COLUMNS.CHEMISTRY_VALUE]);
          
          for (var j = 0; j < player1.length; j++) {
            currentChecksum += player1.charCodeAt(j);
          }
          for (var k = 0; k < player2.length; k++) {
            currentChecksum += player2.charCodeAt(k);
          }
          currentChecksum += chemValue;
        }
        
        if (currentChecksum !== parseInt(storedChecksum)) {
          return { 
            needsUpdate: true, 
            reason: 'Chemistry values have been modified.' 
          };
        }
      }
    }
    
    return { needsUpdate: false };
  } catch (e) {
    var config = getConfig();
    if (config.DEBUG.ENABLE_LOGGING) {
      Logger.log('Error checking freshness: ' + e.toString());
    }
    return { needsUpdate: false, reason: '' };
  }
}