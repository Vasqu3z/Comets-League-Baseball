// ===== PLAYER STATS MODULE =====
// Purpose: Updates player statistics from cached game data
// Dependencies: StatsConfig.js
// Entry Point(s): updateAllPlayerStatsFromCache

/**
 * Update player stats from cached game data
 * @param {object} playerStats - The playerStats object from the master gameData
 */
function updateAllPlayerStatsFromCache(playerStats) {
  var activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var playerStatsSheet = activeSpreadsheet.getSheetByName(CONFIG.PLAYER_STATS_SHEET);

  if (!playerStatsSheet) {
    if (CONFIG.DEBUG.ENABLE_LOGGING) {
      Logger.log("ERROR [Step 1]: Sheet not found (Entity: " + CONFIG.PLAYER_STATS_SHEET + ")");
    }
    SpreadsheetApp.getUi().alert(CONFIG.PLAYER_STATS_SHEET + " sheet not found!");
    return;
  }

  if (CONFIG.DEBUG.ENABLE_LOGGING) {
    Logger.log("INFO [Step 1]: Writing player stats from cached data");
  }

  var lastRow = playerStatsSheet.getLastRow();
  if (lastRow < 2) {
    if (CONFIG.DEBUG.ENABLE_LOGGING) {
      Logger.log("ERROR [Step 1]: No players found in sheet (Entity: " + CONFIG.PLAYER_STATS_SHEET + ")");
    }
    SpreadsheetApp.getUi().alert("No players found!");
    return;
  }

  var layout = CONFIG.SHEET_STRUCTURE.PLAYER_STATS_SHEET;

  var playerNamesData = playerStatsSheet.getRange(
    layout.DATA_START_ROW,
    layout.PLAYER_NAME_COL + 1,
    lastRow - layout.HEADER_ROW,
    1
  ).getValues();

  var playerOrder = [];
  for (var playerIndex = 0; playerIndex < playerNamesData.length; playerIndex++) {
    var playerName = String(playerNamesData[playerIndex][0]).trim();
    if (playerName && playerName !== "") {
      playerOrder.push(playerName);
    }
  }

  for (var playerIndex = 0; playerIndex < playerOrder.length; playerIndex++) {
    if (playerStats[playerOrder[playerIndex]]) {
      validatePlayerStats(playerOrder[playerIndex], playerStats[playerOrder[playerIndex]], null);
    }
  }

  var allPlayerData = [];
  for (var playerIndex = 0; playerIndex < playerOrder.length; playerIndex++) {
    var stats = playerStats[playerOrder[playerIndex]];
    if (!stats) {
      var emptyRow = [0, 0,0,0,0,0,0,0,0,0, 0,0,0, 0,0,0,0,0,0,0, 0,0,0];
      allPlayerData.push(emptyRow);
      continue;
    }

    var row = [stats.gamesPlayed];
    row = row.concat(stats.hitting);
    row = row.concat([stats.wins, stats.losses, stats.saves]);
    row = row.concat(stats.pitching);
    row = row.concat(stats.fielding);
    allPlayerData.push(row);
  }

  var numPlayers = playerOrder.length;
  if (numPlayers > 0) {
    playerStatsSheet.getRange(
      layout.DATA_START_ROW,
      layout.DATA_START_COL + 1,
      numPlayers,
      layout.TOTAL_STAT_COLUMNS
    ).setValues(allPlayerData);
  }

  if (CONFIG.DEBUG.ENABLE_LOGGING) {
    Logger.log("INFO [Step 1]: Updated " + numPlayers + " players");
  }
  SpreadsheetApp.getActiveSpreadsheet().toast("Updated " + numPlayers + " players!", "Step 1 Complete", 3);
}

/**
 * Legacy function for manual execution
 * Processes games fresh and updates player stats
 */
function updateAllPlayerStats() {
  var gameData = processAllGameSheetsOnce();
  if (gameData) {
    updateAllPlayerStatsFromCache(gameData.playerStats);
  }
}

// ===== PLAYOFF PLAYER STATISTICS =====

/**
 * Update playoff player stats from cached game data
 * @param {object} playerStats - The playerStats object from the master playoff gameData
 */
function updateAllPlayoffPlayerStatsFromCache(playerStats) {
  var activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var playerStatsSheet = activeSpreadsheet.getSheetByName(CONFIG.PLAYOFF_PLAYER_STATS_SHEET);

  if (!playerStatsSheet) {
    if (CONFIG.DEBUG.ENABLE_LOGGING) {
      Logger.log("ERROR [Playoff Step 1]: Sheet not found (Entity: " + CONFIG.PLAYOFF_PLAYER_STATS_SHEET + ")");
    }
    SpreadsheetApp.getUi().alert(CONFIG.PLAYOFF_PLAYER_STATS_SHEET + " sheet not found!");
    return;
  }

  if (CONFIG.DEBUG.ENABLE_LOGGING) {
    Logger.log("INFO [Playoff Step 1]: Writing playoff player stats from cached data");
  }

  var lastRow = playerStatsSheet.getLastRow();
  if (lastRow < 2) {
    if (CONFIG.DEBUG.ENABLE_LOGGING) {
      Logger.log("ERROR [Playoff Step 1]: No players found in sheet (Entity: " + CONFIG.PLAYOFF_PLAYER_STATS_SHEET + ")");
    }
    SpreadsheetApp.getUi().alert("No players found in playoff sheet!");
    return;
  }

  var layout = CONFIG.SHEET_STRUCTURE.PLAYER_STATS_SHEET;

  var playerNamesData = playerStatsSheet.getRange(
    layout.DATA_START_ROW,
    layout.PLAYER_NAME_COL + 1,
    lastRow - layout.HEADER_ROW,
    1
  ).getValues();

  var playerOrder = [];
  for (var playerIndex = 0; playerIndex < playerNamesData.length; playerIndex++) {
    var playerName = String(playerNamesData[playerIndex][0]).trim();
    if (playerName && playerName !== "") {
      playerOrder.push(playerName);
    }
  }

  for (var playerIndex = 0; playerIndex < playerOrder.length; playerIndex++) {
    if (playerStats[playerOrder[playerIndex]]) {
      validatePlayerStats(playerOrder[playerIndex], playerStats[playerOrder[playerIndex]], null);
    }
  }

  var allPlayerData = [];
  for (var playerIndex = 0; playerIndex < playerOrder.length; playerIndex++) {
    var stats = playerStats[playerOrder[playerIndex]];
    if (!stats) {
      var emptyRow = [0, 0,0,0,0,0,0,0,0,0, 0,0,0, 0,0,0,0,0,0,0, 0,0,0];
      allPlayerData.push(emptyRow);
      continue;
    }

    var row = [stats.gamesPlayed];
    row = row.concat(stats.hitting);
    row = row.concat([stats.wins, stats.losses, stats.saves]);
    row = row.concat(stats.pitching);
    row = row.concat(stats.fielding);
    allPlayerData.push(row);
  }

  var numPlayers = playerOrder.length;
  if (numPlayers > 0) {
    playerStatsSheet.getRange(
      layout.DATA_START_ROW,
      layout.DATA_START_COL + 1,
      numPlayers,
      layout.TOTAL_STAT_COLUMNS
    ).setValues(allPlayerData);
  }

  if (CONFIG.DEBUG.ENABLE_LOGGING) {
    Logger.log("INFO [Playoff Step 1]: Updated " + numPlayers + " playoff players");
  }
  SpreadsheetApp.getActiveSpreadsheet().toast("Updated " + numPlayers + " playoff players!", "Playoff Step 1 Complete", 3);
}
