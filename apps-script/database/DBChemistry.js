// ===== PLAYER CHEMISTRY TOOL (JSON-BASED, MULTI-PLAYER) =====
// Display chemistry for up to 5 selected players for comparison

/**
 * Get all available players from JSON cache
 */
function getPlayerList() {
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
        throw new Error('Chemistry data not found. Please run "Update Chemistry JSON" from the Chemistry Tools menu.');
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
    return data.players || [];
  } catch (e) {
    var config = getConfig();
    if (config.DEBUG.ENABLE_LOGGING) {
      Logger.log('Error in getPlayerList: ' + e.toString());
    }
    throw e;
  }
}

/**
 * Get chemistry data for multiple players (for side-by-side comparison)
 * @param {Array<string>} playerNames - Array of 1-5 player names
 * @returns {Object} Complete chemistry data with team analysis
 */
function getMultiplePlayerChemistry(playerNames) {
  try {
    if (!playerNames || playerNames.length === 0) {
      return {
        players: [],
        teamAnalysis: null
      };
    }
    
    // Get chemistry data from JSON
    var props = PropertiesService.getScriptProperties();
    var dataJson = props.getProperty('CHEMISTRY_DATA');
    
    if (!dataJson) {
      throw new Error('Chemistry data not found. Please run "Update Chemistry JSON" from the Chemistry Tools menu.');
    }
    
    var data = JSON.parse(dataJson);
    var thresholds = data.thresholds;
    
    // Build chemistry matrix for quick lookups
    var chemistryMatrix = {};
    data.players.forEach(function(player) {
      chemistryMatrix[player] = {};
    });
    
    data.pairs.forEach(function(pair) {
      chemistryMatrix[pair.p1][pair.p2] = pair.v;
      chemistryMatrix[pair.p2][pair.p1] = pair.v;
    });
    
    // Get chemistry for each player
    var results = [];
    
    playerNames.forEach(function(playerName) {
      var positive = [];
      var negative = [];
      
      // Get all chemistry for this player
      if (chemistryMatrix[playerName]) {
        Object.keys(chemistryMatrix[playerName]).forEach(function(otherPlayer) {
          var value = chemistryMatrix[playerName][otherPlayer];
          
          if (value >= thresholds.positive) {
            positive.push(otherPlayer);
          } else if (value <= thresholds.negative) {
            negative.push(otherPlayer);
          }
        });
      }
      
      positive.sort();
      negative.sort();
      
      results.push({
        name: playerName,
        positive: positive,
        negative: negative,
        posCount: positive.length,
        negCount: negative.length
      });
    });
    
    // Calculate team analysis if 2+ players selected
    var teamAnalysis = null;
    
    if (playerNames.length >= 2) {
      teamAnalysis = calculateTeamAnalysis(playerNames, chemistryMatrix, thresholds);
    }
    
    return {
      players: results,
      teamAnalysis: teamAnalysis
    };

  } catch (e) {
    var config = getConfig();
    if (config.DEBUG.ENABLE_LOGGING) {
      Logger.log('Error in getMultiplePlayerChemistry: ' + e.toString());
    }
    throw e;
  }
}

/**
 * Calculate team analysis for selected players
 */
function calculateTeamAnalysis(playerNames, chemistryMatrix, thresholds) {
  var internalPositive = 0;
  var internalNegative = 0;
  var connections = [];
  var sharedPositive = {}; // Characters that appear in multiple positive lists
  var sharedNegative = {}; // Characters that appear in multiple negative lists
  var mixed = {}; // Characters that are positive for some, negative for others
  
  // Track which players have chemistry with each character
  var characterAppearances = {};
  
  playerNames.forEach(function(playerName) {
    if (!chemistryMatrix[playerName]) return;
    
    Object.keys(chemistryMatrix[playerName]).forEach(function(otherPlayer) {
      var value = chemistryMatrix[playerName][otherPlayer];
      
      if (!characterAppearances[otherPlayer]) {
        characterAppearances[otherPlayer] = {
          positive: [],
          negative: []
        };
      }
      
      if (value >= thresholds.positive) {
        characterAppearances[otherPlayer].positive.push(playerName);
      } else if (value <= thresholds.negative) {
        characterAppearances[otherPlayer].negative.push(playerName);
      }
    });
  });
  
  // Identify shared chemistry
  Object.keys(characterAppearances).forEach(function(character) {
    var posCount = characterAppearances[character].positive.length;
    var negCount = characterAppearances[character].negative.length;
    
    // Shared positive (appears in 2+ positive lists, no negative)
    if (posCount >= 2 && negCount === 0) {
      sharedPositive[character] = characterAppearances[character].positive;
    }
    // Shared negative (appears in 2+ negative lists, no positive)
    else if (negCount >= 2 && posCount === 0) {
      sharedNegative[character] = characterAppearances[character].negative;
    }
    // Mixed (appears in both positive and negative)
    else if (posCount >= 1 && negCount >= 1) {
      mixed[character] = characterAppearances[character];
    }
  });
  
  // Calculate internal team chemistry (between selected players)
  for (var i = 0; i < playerNames.length; i++) {
    for (var j = i + 1; j < playerNames.length; j++) {
      var p1 = playerNames[i];
      var p2 = playerNames[j];
      
      var chemValue = 0;
      if (chemistryMatrix[p1] && chemistryMatrix[p1][p2] !== undefined) {
        chemValue = chemistryMatrix[p1][p2];
      }
      
      if (chemValue >= thresholds.positive) {
        internalPositive++;
        connections.push({
          player1: p1,
          player2: p2,
          type: 'positive'
        });
      } else if (chemValue <= thresholds.negative) {
        internalNegative++;
        connections.push({
          player1: p1,
          player2: p2,
          type: 'negative'
        });
      }
    }
  }
  
  return {
    internalPositive: internalPositive,
    internalNegative: internalNegative,
    totalConnections: connections.length,
    connections: connections,
    sharedPositive: sharedPositive,
    sharedNegative: sharedNegative,
    mixed: mixed
  };
}

/**
 * Update JSON cache and sync freshness for LineupBuilder
 * Reads Chemistry Lookup sheet and stores as JSON in script properties
 */
function updateChemistryDataJSON() {
  const config = getConfig();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const lookupSheet = ss.getSheetByName(config.SHEETS.CHEMISTRY_LOOKUP);
  if (!lookupSheet) throw new Error('Chemistry Lookup sheet not found');
  const lastRow = lookupSheet.getLastRow();
  if (lastRow < 2) return;

  const data = lookupSheet.getRange(2, 1, lastRow - 1, 3).getValues();
  const playerSet = {};
  const pairs = [];

  data.forEach(([p1r, p2r, chemVal]) => {
    const p1 = String(p1r).trim();
    const p2 = String(p2r).trim();
    const chem = Math.round(chemVal);
    if (!p1 || !p2) return;
    playerSet[p1] = true;
    playerSet[p2] = true;
    pairs.push({ p1, p2, v: chem });
  });

  const players = Object.keys(playerSet).sort();
  const jsonData = {
    players,
    pairs,
    thresholds: {
      positive: config.CHEMISTRY_CONFIG.THRESHOLDS.POSITIVE_MIN,
      negative: config.CHEMISTRY_CONFIG.THRESHOLDS.NEGATIVE_MAX
    },
    timestamp: new Date().toISOString(),
    lastModified: new Date().toISOString()
  };

  const props = PropertiesService.getScriptProperties();
  props.setProperty('CHEMISTRY_DATA', JSON.stringify(jsonData));
  props.setProperty('CHEMISTRY_DATA_TIMESTAMP', jsonData.timestamp);

  // --- Freshness sync for LineupBuilder ---
  let checksum = 0;
  data.forEach(([p1, p2, v]) => {
    const s = (String(p1) + String(p2));
    for (let i = 0; i < s.length; i++) checksum += s.charCodeAt(i);
    checksum += Number(v);
  });

  props.setProperty('CHEMISTRY_LOOKUP_TIMESTAMP', jsonData.timestamp);
  props.setProperty('CHEMISTRY_LOOKUP_ROWCOUNT', lastRow);
  props.setProperty('CHEMISTRY_LOOKUP_CHECKSUM', checksum);
}