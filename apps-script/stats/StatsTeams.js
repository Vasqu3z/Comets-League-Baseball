// ===== TEAM STATS MODULE =====
// Purpose: Updates team statistics from cached game data
// Dependencies: StatsConfig.js
// Entry Point(s): updateAllTeamStatsFromCache

/**
 * Update team stats from cached game data
 * @param {object} teamStats - The teamStats object from the master gameData
 */
function updateAllTeamStatsFromCache(teamStats) {
  var activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var teamStatsSheet = activeSpreadsheet.getSheetByName(CONFIG.TEAM_STATS_SHEET);

  if (!teamStatsSheet) {
    if (CONFIG.DEBUG.ENABLE_LOGGING) {
      Logger.log("ERROR [Step 2]: Sheet not found (Entity: " + CONFIG.TEAM_STATS_SHEET + ")");
    }
    SpreadsheetApp.getUi().alert(CONFIG.TEAM_STATS_SHEET + " sheet not found!");
    return;
  }

  if (CONFIG.DEBUG.ENABLE_LOGGING) {
    Logger.log("INFO [Step 2]: Writing team stats from cached data");
  }

  var lastRow = teamStatsSheet.getLastRow();
  if (lastRow < 2) {
    if (CONFIG.DEBUG.ENABLE_LOGGING) {
      Logger.log("ERROR [Step 2]: No teams found in sheet (Entity: " + CONFIG.TEAM_STATS_SHEET + ")");
    }
    SpreadsheetApp.getUi().alert("No teams found!");
    return;
  }

  var layout = CONFIG.SHEET_STRUCTURE.TEAM_STATS_SHEET;

  var teamNamesData = teamStatsSheet.getRange(
    layout.DATA_START_ROW,
    layout.TEAM_NAME_COL + 1,
    lastRow - 1,
    1
  ).getValues();

  var teamOrder = [];
  for (var teamIndex = 0; teamIndex < teamNamesData.length; teamIndex++) {
    var teamName = String(teamNamesData[teamIndex][0]).trim();
    if (teamName && teamName !== "") {
      teamOrder.push(teamName);
    }
  }

  if (CONFIG.DEBUG.ENABLE_LOGGING) {
    Logger.log("INFO [Step 2]: Writing stats for " + teamOrder.length + " teams");
  }

  var allGPWL = [];
  var allHitting = [];
  var allPitching = [];
  var allFielding = [];

  for (var teamIndex = 0; teamIndex < teamOrder.length; teamIndex++) {
    var stats = teamStats[teamOrder[teamIndex]];

    if (!stats) {
      allGPWL.push([0, 0, 0]);
      allHitting.push([0, 0, 0, 0, 0, 0, 0, 0, 0]);
      allPitching.push([0, 0, 0, 0, 0, 0, 0, 0]); // IP, BF, H, HR, R, BB, K, SV
      allFielding.push([0, 0, 0]);
      continue;
    }

    allGPWL.push([stats.gamesPlayed, stats.wins, stats.losses]);
    allHitting.push(stats.hitting);
    allPitching.push(stats.pitching);
    allFielding.push(stats.fielding);
  }

  var numTeams = teamOrder.length;
  teamStatsSheet.getRange(layout.DATA_START_ROW, layout.GPWL_START_COL + 1, numTeams, layout.GPWL_NUM_COLS).setValues(allGPWL);
  teamStatsSheet.getRange(layout.DATA_START_ROW, layout.HITTING_START_COL + 1, numTeams, layout.HITTING_NUM_COLS).setValues(allHitting);
  teamStatsSheet.getRange(layout.DATA_START_ROW, layout.PITCHING_START_COL + 1, numTeams, layout.PITCHING_NUM_COLS).setValues(allPitching);
  teamStatsSheet.getRange(layout.DATA_START_ROW, layout.FIELDING_START_COL + 1, numTeams, layout.FIELDING_NUM_COLS).setValues(allFielding);

  if (CONFIG.DEBUG.ENABLE_LOGGING) {
    Logger.log("INFO [Step 2]: Updated " + numTeams + " teams");
  }
  SpreadsheetApp.getActiveSpreadsheet().toast("Updated " + numTeams + " teams!", "Step 2 Complete", 3);
}

/**
 * Legacy function for manual execution
 * Processes games fresh and updates team stats
 */
function updateAllTeamStats() {
  var gameData = processAllGameSheetsOnce();
  if (gameData) {
    updateAllTeamStatsFromCache(gameData.teamStats);
  }
}

// ===== PLAYOFF TEAM STATISTICS =====

/**
 * Update playoff team stats from cached game data
 * @param {object} teamStats - The teamStats object from the master playoff gameData
 */
function updateAllPlayoffTeamStatsFromCache(teamStats) {
  var activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var teamStatsSheet = activeSpreadsheet.getSheetByName(CONFIG.PLAYOFF_TEAM_STATS_SHEET);

  if (!teamStatsSheet) {
    if (CONFIG.DEBUG.ENABLE_LOGGING) {
      Logger.log("ERROR [Playoff Step 2]: Sheet not found (Entity: " + CONFIG.PLAYOFF_TEAM_STATS_SHEET + ")");
    }
    SpreadsheetApp.getUi().alert(CONFIG.PLAYOFF_TEAM_STATS_SHEET + " sheet not found!");
    return;
  }

  if (CONFIG.DEBUG.ENABLE_LOGGING) {
    Logger.log("INFO [Playoff Step 2]: Writing playoff team stats from cached data");
  }

  var lastRow = teamStatsSheet.getLastRow();
  if (lastRow < 2) {
    if (CONFIG.DEBUG.ENABLE_LOGGING) {
      Logger.log("ERROR [Playoff Step 2]: No teams found in sheet (Entity: " + CONFIG.PLAYOFF_TEAM_STATS_SHEET + ")");
    }
    SpreadsheetApp.getUi().alert("No teams found in playoff sheet!");
    return;
  }

  var layout = CONFIG.SHEET_STRUCTURE.TEAM_STATS_SHEET;

  var teamNamesData = teamStatsSheet.getRange(
    layout.DATA_START_ROW,
    layout.TEAM_NAME_COL + 1,
    lastRow - 1,
    1
  ).getValues();

  var teamOrder = [];
  for (var teamIndex = 0; teamIndex < teamNamesData.length; teamIndex++) {
    var teamName = String(teamNamesData[teamIndex][0]).trim();
    if (teamName && teamName !== "") {
      teamOrder.push(teamName);
    }
  }

  if (CONFIG.DEBUG.ENABLE_LOGGING) {
    Logger.log("INFO [Playoff Step 2]: Writing stats for " + teamOrder.length + " playoff teams");
  }

  var allGPWL = [];
  var allHitting = [];
  var allPitching = [];
  var allFielding = [];

  for (var teamIndex = 0; teamIndex < teamOrder.length; teamIndex++) {
    var stats = teamStats[teamOrder[teamIndex]];

    if (!stats) {
      allGPWL.push([0, 0, 0]);
      allHitting.push([0, 0, 0, 0, 0, 0, 0, 0, 0]);
      allPitching.push([0, 0, 0, 0, 0, 0, 0, 0]); // IP, BF, H, HR, R, BB, K, SV
      allFielding.push([0, 0, 0]);
      continue;
    }

    allGPWL.push([stats.gamesPlayed, stats.wins, stats.losses]);
    allHitting.push(stats.hitting);
    allPitching.push(stats.pitching);
    allFielding.push(stats.fielding);
  }

  var numTeams = teamOrder.length;
  teamStatsSheet.getRange(layout.DATA_START_ROW, layout.GPWL_START_COL + 1, numTeams, layout.GPWL_NUM_COLS).setValues(allGPWL);
  teamStatsSheet.getRange(layout.DATA_START_ROW, layout.HITTING_START_COL + 1, numTeams, layout.HITTING_NUM_COLS).setValues(allHitting);
  teamStatsSheet.getRange(layout.DATA_START_ROW, layout.PITCHING_START_COL + 1, numTeams, layout.PITCHING_NUM_COLS).setValues(allPitching);
  teamStatsSheet.getRange(layout.DATA_START_ROW, layout.FIELDING_START_COL + 1, numTeams, layout.FIELDING_NUM_COLS).setValues(allFielding);

  if (CONFIG.DEBUG.ENABLE_LOGGING) {
    Logger.log("INFO [Playoff Step 2]: Updated " + numTeams + " playoff teams");
  }
  SpreadsheetApp.getActiveSpreadsheet().toast("Updated " + numTeams + " playoff teams!", "Playoff Step 2 Complete", 3);
}
