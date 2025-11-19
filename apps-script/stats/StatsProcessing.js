// ===== GAME PROCESSOR MODULE =====
// Master game sheet processor - reads all games once and returns all needed data
// 100% config-driven I/O, no hardcoded ranges

/**
 * Processes all regular season game sheets in a single pass
 * Reads all game data once and returns consolidated stats for players, teams, and schedule
 * @returns {object} Game data object containing playerStats, teamStats, teamStatsWithH2H, scheduleData, and boxScoreUrl
 */
function processAllGameSheetsOnce() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var boxScoreSS = getBoxScoreSpreadsheet();
  if (!boxScoreSS) return null;
  
  var gameSheets = getGameSheets(boxScoreSS);
  if (gameSheets.length === 0) {
    logError("Game Processor", "No game sheets found", "Game sheet prefix: " + CONFIG.GAME_SHEET_PREFIX);
    return null;
  }
  
  logInfo("Game Processor", "Processing " + gameSheets.length + " game sheets (single pass)");
  
  var result = {
    playerStats: initializePlayerStats(ss),
    teamStats: initializeTeamStats(ss),
    teamStatsWithH2H: initializeTeamStatsWithH2H(ss),
    gamesByWeek: {},
    scheduleData: initializeScheduleData(ss, boxScoreSS),
    boxScoreUrl: boxScoreSS.getUrl()
  };
  
  // ===== Single read per game =====
  for (var gameIndex = 0; gameIndex < gameSheets.length; gameIndex++) {
    var sheet = gameSheets[gameIndex];
    var sheetName = sheet.getName();

    try {
      // Single batch read of entire game sheet: B3:R50 (48 rows × 17 columns = 816 cells)
      // Consolidated read eliminates redundant I/O operations
      var batchData = sheet.getRange("B3:R50").getValues();

      // ===== Extract team info from batch (rows 3-4 in sheet = indices 0-1 in batch) =====
      // Team info is at B3:F4 (columns B-F = indices 0-4)
      var awayTeam = String(batchData[0][0]).trim();  // B3
      var homeTeam = String(batchData[1][0]).trim();  // B4
      var awayRuns = batchData[0][4];                 // F3
      var homeRuns = batchData[1][4];                 // F4

      // ===== Extract hitting data from batch =====
      // Hitting starts at row 30 (index 27 in batch, since batch starts at row 3)
      // We need rows 30-50 (21 rows), columns B-K (10 columns, indices 0-9)
      var hittingStartIndex = CONFIG.BOX_SCORE_HITTING_START_ROW + 1 - 3; // +1 for header skip, -3 for batch offset
      var hittingData = [];
      for (var hitterIndex = 0; hitterIndex < CONFIG.BOX_SCORE_HITTING_NUM_ROWS - 1; hitterIndex++) {
        hittingData.push(batchData[hittingStartIndex + hitterIndex].slice(0, CONFIG.BOX_SCORE_HITTING_NUM_COLS));
      }

      // ===== Extract pitching/fielding data from batch =====
      // Pitching/fielding starts at row 7 (index 4 in batch)
      // We need rows 7-27 (21 rows), columns B-R (17 columns, indices 0-16)
      var pitchFieldStartIndex = CONFIG.BOX_SCORE_PITCHING_FIELDING_START_ROW + 1 - 3; // +1 for header skip, -3 for batch offset
      var pitchFieldData = [];
      for (var pitcherIndex = 0; pitcherIndex < CONFIG.BOX_SCORE_PITCHING_FIELDING_NUM_ROWS - 1; pitcherIndex++) {
        pitchFieldData.push(batchData[pitchFieldStartIndex + pitcherIndex].slice(0, CONFIG.BOX_SCORE_PITCHING_FIELDING_NUM_COLS));
      }

      // ===== Extract team totals from batch =====
      // Team1 totals (Away) at row 39 (index 36 in batch), columns C-R (indices 1-16)
      // Team2 totals (Home) at row 50 (index 47 in batch), columns C-R (indices 1-16)
      var team1Totals = batchData[36].slice(1, 17);  // Row 39 = Away
      var team2Totals = batchData[47].slice(1, 17);  // Row 50 = Home

      // ===== Extract team pitching/fielding totals from batch =====
      // Team1 pitching (Away) at row 16 (index 13 in batch), columns I-R (indices 7-16)
      // Team2 pitching (Home) at row 27 (index 24 in batch), columns I-R (indices 7-16)
      var team1PitchField = batchData[13].slice(7, 17);  // Row 16 = Away
      var team2PitchField = batchData[24].slice(7, 17);  // Row 27 = Home

      // ===== Extract W/L/S data from batch =====
      // WLS data at rows 48-50 (indices 45-47 in batch), columns M-R (indices 11-16)
      var winningPitcher = String(batchData[46][12]).trim();  // N49 (index 46, col 12)
      var losingPitcher = String(batchData[47][15]).trim();   // R50 (index 47, col 15)
      var savePitcher = String(batchData[46][15]).trim();     // R49 (index 46, col 15)

      // ===== Extract MVP from cell Q48 =====
      // Q48 is row 48, column Q (column 17 in sheet, index 15 in batch since batch starts at B)
      // Row 48 in sheet = index 45 in batch (48 - 3)
      // Batch is B3:R50, so Q (col 17) = batch index 15 (17 - 2)
      var gameMVP = String(batchData[45][15]).trim();  // Q48 (index 45, col 15)

      // Create gameData object
      var gameData = {
        awayTeam: awayTeam,
        homeTeam: homeTeam,
        awayRuns: awayRuns,
        homeRuns: homeRuns,
        hittingData: hittingData,
        pitchFieldData: pitchFieldData,
        awayTeamTotals: team1Totals,        // team1 = Away (row 39)
        homeTeamTotals: team2Totals,        // team2 = Home (row 50)
        awayTeamPitchField: team1PitchField, // team1 = Away (row 16)
        homeTeamPitchField: team2PitchField, // team2 = Home (row 27)
        winningPitcher: winningPitcher,
        losingPitcher: losingPitcher,
        savePitcher: savePitcher,
        gameMVP: gameMVP                     // NEW: Game MVP from Q48
      };

      // ===== PHASE 1: Validate players against registry =====
      try {
        if (typeof validateGamePlayers === 'function') {
          validateGamePlayers(gameData, sheetName);
        }
      } catch (validationError) {
        // Log but don't stop processing
        logError("Game Validation", "Validation failed for " + sheetName, validationError.toString());
      }
      // ===== End Phase 1 Validation =====

      // Extract week number
      var weekMatch = sheetName.match(/W(\d+)/);
      var weekNum = weekMatch ? parseInt(weekMatch[1]) : 999;
      var weekKey = "Week " + weekNum;

      if (!result.gamesByWeek[weekKey]) result.gamesByWeek[weekKey] = [];

      // Determine winner/loser
      var team1 = gameData.homeTeam;
      var team2 = gameData.awayTeam;
      var runs1 = gameData.homeRuns;
      var runs2 = gameData.awayRuns;
      
      var winner = "", loser = "";
      if (typeof runs1 === 'number' && typeof runs2 === 'number' && !isNaN(runs1) && !isNaN(runs2)) {
        if (runs1 > runs2) { winner = team1; loser = team2; }
        else if (runs2 > runs1) { winner = team2; loser = team1; }
      }
      
      // Process all stats using pre-read data
      processPlayerStatsFromData(gameData, result.playerStats);
      processTeamStatsFromData(gameData, result.teamStats, team1, team2, winner, loser);
      processTeamStatsWithH2HFromGame(result.teamStatsWithH2H, team1, team2, winner, loser, runs1, runs2);
      
      result.gamesByWeek[weekKey].push({
        sheetName: sheetName,
        sheetId: sheet.getSheetId(),
        team1: team1,
        team2: team2,
        runs1: runs1,
        runs2: runs2,
        winner: winner,
        loser: loser,
        weekNum: weekNum
      });
      
      updateScheduleDataFromGame(result.scheduleData, sheet, team1, team2, runs1, runs2, winner, loser, gameData, weekNum);
      
      // Progress update
      if ((gameIndex + 1) % CONFIG.PROGRESS_UPDATE_FREQUENCY === 0) {
        SpreadsheetApp.getActiveSpreadsheet().toast(
          "Processed " + (gameIndex + 1) + " of " + gameSheets.length + " games...",
          "Game Processor",
          2
        );
      }
      
    } catch (e) {
      logError("Game Processor", "Error processing game sheet: " + e.toString(), sheet.getName());
    }
  }
  
  logInfo("Game Processor", "Completed processing all game sheets");
  return result;
}

// ===== MASTER FUNCTION: Process all PLAYOFF game sheets once =====
function processAllPlayoffGameSheetsOnce() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var boxScoreSS = getBoxScoreSpreadsheet();
  if (!boxScoreSS) return null;

  var playoffGameSheets = getPlayoffGameSheets(boxScoreSS);
  if (playoffGameSheets.length === 0) {
    logError("Playoff Game Processor", "No playoff game sheets found", "Game sheet prefix: " + CONFIG.PLAYOFF_GAME_PREFIX);
    return null;
  }

  logInfo("Playoff Game Processor", "Processing " + playoffGameSheets.length + " playoff game sheets (single pass)");

  var result = {
    playerStats: initializePlayoffPlayerStats(ss),
    teamStats: initializePlayoffTeamStats(ss),
    scheduleData: initializePlayoffScheduleData(ss, boxScoreSS),
    boxScoreUrl: boxScoreSS.getUrl()
  };

  // ===== Single read per game (same logic as regular season) =====
  for (var gameIndex = 0; gameIndex < playoffGameSheets.length; gameIndex++) {
    var sheet = playoffGameSheets[gameIndex];
    var sheetName = sheet.getName();

    try {
      // Single batch read of entire game sheet: B3:R50 (48 rows × 17 columns = 816 cells)
      var batchData = sheet.getRange("B3:R50").getValues();

      // ===== Extract team info from batch =====
      var awayTeam = String(batchData[0][0]).trim();  // B3
      var homeTeam = String(batchData[1][0]).trim();  // B4
      var awayRuns = batchData[0][4];                 // F3
      var homeRuns = batchData[1][4];                 // F4

      // ===== Extract hitting data from batch =====
      var hittingStartIndex = CONFIG.BOX_SCORE_HITTING_START_ROW + 1 - 3;
      var hittingData = [];
      for (var hitterIndex = 0; hitterIndex < CONFIG.BOX_SCORE_HITTING_NUM_ROWS - 1; hitterIndex++) {
        hittingData.push(batchData[hittingStartIndex + hitterIndex].slice(0, CONFIG.BOX_SCORE_HITTING_NUM_COLS));
      }

      // ===== Extract pitching/fielding data from batch =====
      var pitchFieldStartIndex = CONFIG.BOX_SCORE_PITCHING_FIELDING_START_ROW + 1 - 3;
      var pitchFieldData = [];
      for (var pitcherIndex = 0; pitcherIndex < CONFIG.BOX_SCORE_PITCHING_FIELDING_NUM_ROWS - 1; pitcherIndex++) {
        pitchFieldData.push(batchData[pitchFieldStartIndex + pitcherIndex].slice(0, CONFIG.BOX_SCORE_PITCHING_FIELDING_NUM_COLS));
      }

      // ===== Extract team totals from batch =====
      var team1Totals = batchData[36].slice(1, 17);  // Row 39 = Away
      var team2Totals = batchData[47].slice(1, 17);  // Row 50 = Home

      // ===== Extract team pitching/fielding totals from batch =====
      var team1PitchField = batchData[13].slice(7, 17);  // Row 16 = Away
      var team2PitchField = batchData[24].slice(7, 17);  // Row 27 = Home

      // ===== Extract W/L/S data from batch =====
      var winningPitcher = String(batchData[46][12]).trim();  // N49
      var losingPitcher = String(batchData[47][15]).trim();   // R50
      var savePitcher = String(batchData[46][15]).trim();     // R49

      // ===== Extract MVP from cell Q48 =====
      var gameMVP = String(batchData[45][15]).trim();  // Q48

      // Extract playoff code from sheet name (only the code part after *)
      // Examples: *CS1-A → "CS1-A", *CS1-A | extra text → "CS1-A", *KC2 → "KC2"
      // Matches: * followed by letters, numbers, and optional dash-letter, stops at space or |
      var playoffCodeMatch = sheetName.match(/\*([A-Z]+\d+(?:-[A-Z])?)/);
      var playoffCode = playoffCodeMatch ? playoffCodeMatch[1].trim() : "";

      // Create gameData object
      var gameData = {
        awayTeam: awayTeam,
        homeTeam: homeTeam,
        awayRuns: awayRuns,
        homeRuns: homeRuns,
        hittingData: hittingData,
        pitchFieldData: pitchFieldData,
        awayTeamTotals: team1Totals,
        homeTeamTotals: team2Totals,
        awayTeamPitchField: team1PitchField,
        homeTeamPitchField: team2PitchField,
        winningPitcher: winningPitcher,
        losingPitcher: losingPitcher,
        savePitcher: savePitcher,
        gameMVP: gameMVP
      };

      // ===== PHASE 1: Validate players against registry =====
      try {
        if (typeof validateGamePlayers === 'function') {
          validateGamePlayers(gameData, sheetName);
        }
      } catch (validationError) {
        // Log but don't stop processing
        logError("Game Validation", "Validation failed for " + sheetName, validationError.toString());
      }
      // ===== End Phase 1 Validation =====

      // Determine winner/loser
      var team1 = gameData.homeTeam;
      var team2 = gameData.awayTeam;
      var runs1 = gameData.homeRuns;
      var runs2 = gameData.awayRuns;

      var winner = "", loser = "";
      if (typeof runs1 === 'number' && typeof runs2 === 'number' && !isNaN(runs1) && !isNaN(runs2)) {
        if (runs1 > runs2) { winner = team1; loser = team2; }
        else if (runs2 > runs1) { winner = team2; loser = team1; }
      }

      // Process all stats using pre-read data
      processPlayerStatsFromData(gameData, result.playerStats);
      processTeamStatsFromData(gameData, result.teamStats, team1, team2, winner, loser);

      updatePlayoffScheduleDataFromGame(result.scheduleData, sheet, team1, team2, runs1, runs2, winner, loser, gameData, playoffCode);

      // Progress update
      if ((gameIndex + 1) % CONFIG.PROGRESS_UPDATE_FREQUENCY === 0) {
        SpreadsheetApp.getActiveSpreadsheet().toast(
          "Processed " + (gameIndex + 1) + " of " + playoffGameSheets.length + " playoff games...",
          "Playoff Game Processor",
          2
        );
      }

    } catch (e) {
      logError("Playoff Game Processor", "Error processing playoff game sheet: " + e.toString(), sheet.getName());
    }
  }

  logInfo("Playoff Game Processor", "Completed processing all playoff game sheets");
  return result;
}

// ===== INITIALIZATION FUNCTIONS =====

function initializePlayerStats(ss) {
  var playerStatsSheet = ss.getSheetByName(CONFIG.PLAYER_STATS_SHEET);
  if (!playerStatsSheet) return {};
  
  var lastRow = playerStatsSheet.getLastRow();
  if (lastRow < 2) return {};
  
  var playerNamesData = playerStatsSheet.getRange(2, 1, lastRow - 1, 1).getValues();
  var playerStats = {};

  for (var playerIndex = 0; playerIndex < playerNamesData.length; playerIndex++) {
    var playerName = String(playerNamesData[playerIndex][0]).trim();
    if (playerName && playerName !== "") {
      playerStats[playerName] = {
        gamesPlayed: 0, wins: 0, losses: 0, saves: 0,
        hitting: [0,0,0,0,0,0,0,0,0], // AB, H, HR, RBI, BB, K, ROB, DP, TB
        pitching: [0,0,0,0,0,0,0], // IP, BF, H, HR, R, BB, K
        fielding: [0,0,0] // Nice Plays, Errors, SB
      };
    }
  }
  
  return playerStats;
}

function initializeTeamStats(ss) {
  var teamStatsSheet = ss.getSheetByName(CONFIG.TEAM_STATS_SHEET);
  if (!teamStatsSheet) return {};
  
  var lastRow = teamStatsSheet.getLastRow();
  if (lastRow < 2) return {};
  
  var teamNamesData = teamStatsSheet.getRange(2, 1, lastRow - 1, 1).getValues();
  var teamStats = {};

  for (var teamIndex = 0; teamIndex < teamNamesData.length; teamIndex++) {
    var teamName = String(teamNamesData[teamIndex][0]).trim();
    if (teamName && teamName !== "") {
      teamStats[teamName] = {
        gamesPlayed: 0, wins: 0, losses: 0,
        hitting: [0,0,0,0,0,0,0,0,0], // AB, H, HR, RBI, BB, K, ROB, DP, TB
        pitching: [0,0,0,0,0,0,0,0], // IP, BF, H, HR, R, BB, K, SV
        fielding: [0,0,0] // Nice Plays, Errors, SB
      };
    }
  }
  
  return teamStats;
}

function initializeTeamStatsWithH2H(ss) {
  var teamStatsSheet = ss.getSheetByName(CONFIG.TEAM_STATS_SHEET);
  if (!teamStatsSheet) return {};
  
  var lastRow = teamStatsSheet.getLastRow();
  if (lastRow < 2) return {};
  
  var allTeamNames = teamStatsSheet.getRange(2, 1, lastRow - 1, 1).getValues();
  var teamStats = {};

  // Initialize all teams
  for (var teamIndex = 0; teamIndex < allTeamNames.length; teamIndex++) {
    var tn = String(allTeamNames[teamIndex][0]).trim();
    if (tn && tn !== "") {
      teamStats[tn] = {
        gamesPlayed: 0, wins: 0, losses: 0,
        runsScored: 0, runsAllowed: 0,
        headToHead: {}
      };
    }
  }
  
  // Initialize head-to-head records
  for (var team1 in teamStats) {
    for (var team2 in teamStats) {
      if (team1 !== team2) {
        teamStats[team1].headToHead[team2] = { wins: 0, losses: 0 };
      }
    }
  }
  
  return teamStats;
}

function initializeScheduleData(ss, boxScoreSS) {
  var scheduleSheet = ss.getSheetByName(CONFIG.SCHEDULE_SHEET);
  if (!scheduleSheet || scheduleSheet.getLastRow() < 2) {
    return [];
  }

  var scheduleData = scheduleSheet.getRange(2, 1, scheduleSheet.getLastRow() - 1, 3).getValues();
  var schedule = [];

  for (var gameIndex = 0; gameIndex < scheduleData.length; gameIndex++) {
    var week = scheduleData[gameIndex][0];
    // Column order: A=Week, B=Away Team, C=Home Team
    var awayTeam = String(scheduleData[gameIndex][1]).trim();
    var homeTeam = String(scheduleData[gameIndex][2]).trim();
    
    if (week && homeTeam && awayTeam) {
      schedule.push({
        week: week,
        homeTeam: homeTeam,
        awayTeam: awayTeam,
        played: false,
        homeScore: null,
        awayScore: null,
        winner: null,
        sheetId: null
      });
    }
  }
  
  return schedule;
}

// ===== PLAYOFF INITIALIZATION FUNCTIONS =====

function initializePlayoffPlayerStats(ss) {
  var playerStatsSheet = ss.getSheetByName(CONFIG.PLAYOFF_PLAYER_STATS_SHEET);
  if (!playerStatsSheet) return {};

  var lastRow = playerStatsSheet.getLastRow();
  if (lastRow < 2) return {};

  var playerNamesData = playerStatsSheet.getRange(2, 1, lastRow - 1, 1).getValues();
  var playerStats = {};

  for (var playerIndex = 0; playerIndex < playerNamesData.length; playerIndex++) {
    var playerName = String(playerNamesData[playerIndex][0]).trim();
    if (playerName && playerName !== "") {
      playerStats[playerName] = {
        gamesPlayed: 0, wins: 0, losses: 0, saves: 0,
        hitting: [0,0,0,0,0,0,0,0,0], // AB, H, HR, RBI, BB, K, ROB, DP, TB
        pitching: [0,0,0,0,0,0,0], // IP, BF, H, HR, R, BB, K
        fielding: [0,0,0] // Nice Plays, Errors, SB
      };
    }
  }

  return playerStats;
}

function initializePlayoffTeamStats(ss) {
  var teamStatsSheet = ss.getSheetByName(CONFIG.PLAYOFF_TEAM_STATS_SHEET);
  if (!teamStatsSheet) return {};

  var lastRow = teamStatsSheet.getLastRow();
  if (lastRow < 2) return {};

  var teamNamesData = teamStatsSheet.getRange(2, 1, lastRow - 1, 1).getValues();
  var teamStats = {};

  for (var teamIndex = 0; teamIndex < teamNamesData.length; teamIndex++) {
    var teamName = String(teamNamesData[teamIndex][0]).trim();
    if (teamName && teamName !== "") {
      teamStats[teamName] = {
        gamesPlayed: 0, wins: 0, losses: 0,
        hitting: [0,0,0,0,0,0,0,0,0], // AB, H, HR, RBI, BB, K, ROB, DP, TB
        pitching: [0,0,0,0,0,0,0,0], // IP, BF, H, HR, R, BB, K, SV
        fielding: [0,0,0] // Nice Plays, Errors, SB
      };
    }
  }

  return teamStats;
}

function initializePlayoffScheduleData(ss, boxScoreSS) {
  var scheduleSheet = ss.getSheetByName(CONFIG.PLAYOFF_SCHEDULE_SHEET);
  if (!scheduleSheet || scheduleSheet.getLastRow() < 2) {
    return [];
  }

  var scheduleData = scheduleSheet.getRange(2, 1, scheduleSheet.getLastRow() - 1, 3).getValues();
  var schedule = [];

  for (var gameIndex = 0; gameIndex < scheduleData.length; gameIndex++) {
    var week = scheduleData[gameIndex][0];
    // Column order: A=Week (code like Q1, S1-A, F1), B=Away Team, C=Home Team
    var awayTeam = String(scheduleData[gameIndex][1]).trim();
    var homeTeam = String(scheduleData[gameIndex][2]).trim();

    if (week && homeTeam && awayTeam) {
      schedule.push({
        week: week,
        homeTeam: homeTeam,
        awayTeam: awayTeam,
        played: false,
        homeScore: null,
        awayScore: null,
        winner: null,
        sheetId: null
      });
    }
  }

  return schedule;
}

// ===== GAME PROCESSING FUNCTIONS =====

function processPlayerStatsFromData(gameData, playerStats) {
  var playersInThisGame = {};

  // Process hitting stats
  // Data format: [PlayerName, AB, H, HR, RBI, BB, K, ROB, DP, TB]
  for (var rowIndex = 0; rowIndex < gameData.hittingData.length; rowIndex++) {
    var playerName = String(gameData.hittingData[rowIndex][0]).trim();
    if (playerName && playerStats[playerName]) {
      playersInThisGame[playerName] = true;
      // Hitting stats are at indices 1-9 (9 stats: AB, H, HR, RBI, BB, K, ROB, DP, TB)
      for (var statIndex = 0; statIndex < CONFIG.SHEET_STRUCTURE.PLAYER_STATS_SHEET.HITTING_STATS_COUNT; statIndex++) {
        var val = gameData.hittingData[rowIndex][statIndex + 1];
        if (typeof val === 'number' && !isNaN(val)) {
          playerStats[playerName].hitting[statIndex] += val;
        }
      }
    }
  }

  // Process pitching and fielding stats
  // Box score columns: B=Name, C-H=unused, I-O=Pitching (7 cols), P-R=Fielding (3 cols)
  // After reading from box score starting at col B with 17 cols total:
  //   Index 0 = PlayerName (col B)
  //   Indices 1-6 = Unused cols (C-H)
  //   Indices 7-13 = Pitching stats (cols I-O): IP, BF, H, HR, R, BB, K
  //   Indices 14-16 = Fielding stats (cols P-R): NP, E, SB
  for (var rowIndex = 0; rowIndex < gameData.pitchFieldData.length; rowIndex++) {
    var playerName = String(gameData.pitchFieldData[rowIndex][0]).trim();
    if (playerName && playerStats[playerName]) {
      playersInThisGame[playerName] = true;

      // Pitching stats start at column I (index 7 in our 17-column read)
      for (var statIndex = 0; statIndex < CONFIG.SHEET_STRUCTURE.PLAYER_STATS_SHEET.PITCHING_STATS_COUNT; statIndex++) {
        var val = gameData.pitchFieldData[rowIndex][statIndex + 7];
        if (typeof val === 'number' && !isNaN(val)) {
          playerStats[playerName].pitching[statIndex] += val;
        }
      }

      // Fielding stats start at column P (index 14 in our 17-column read)
      for (var statIndex = 0; statIndex < CONFIG.SHEET_STRUCTURE.PLAYER_STATS_SHEET.FIELDING_STATS_COUNT; statIndex++) {
        var val = gameData.pitchFieldData[rowIndex][statIndex + 14];
        if (typeof val === 'number' && !isNaN(val)) {
          playerStats[playerName].fielding[statIndex] += val;
        }
      }

      // Win/Loss/Save tracking
      if (playerName === gameData.winningPitcher) playerStats[playerName].wins++;
      if (playerName === gameData.losingPitcher) playerStats[playerName].losses++;
      if (playerName === gameData.savePitcher) playerStats[playerName].saves++;
    }
  }

  // Count games played
  for (var playerName in playersInThisGame) {
    playerStats[playerName].gamesPlayed++;
  }
}

function processTeamStatsFromData(gameData, teamStats, team1, team2, winner, loser) {
  // Process home team (team1)
  if (team1 && teamStats[team1]) {
    teamStats[team1].gamesPlayed++;
    if (team1 === winner) {
      teamStats[team1].wins++;
      // Track team save if this team won and there was a save pitcher
      if (gameData.savePitcher) {
        teamStats[team1].pitching[7]++; // SV is index 7
      }
    }
    if (team1 === loser) teamStats[team1].losses++;

    // Hitting stats
    for (var statIndex = 0; statIndex < CONFIG.SHEET_STRUCTURE.PLAYER_STATS_SHEET.HITTING_STATS_COUNT; statIndex++) {
      var val = gameData.homeTeamTotals[statIndex];
      if (typeof val === 'number' && !isNaN(val)) {
        teamStats[team1].hitting[statIndex] += val;
      }
    }

    // Pitching stats (indices 0-6)
    for (var statIndex = 0; statIndex < CONFIG.SHEET_STRUCTURE.PLAYER_STATS_SHEET.PITCHING_STATS_COUNT; statIndex++) {
      var val = gameData.homeTeamPitchField[statIndex];
      if (typeof val === 'number' && !isNaN(val)) {
        teamStats[team1].pitching[statIndex] += val;
      }
    }

    // Fielding stats (indices 7-9)
    for (var statIndex = 0; statIndex < CONFIG.SHEET_STRUCTURE.PLAYER_STATS_SHEET.FIELDING_STATS_COUNT; statIndex++) {
      var val = gameData.homeTeamPitchField[statIndex + 7];
      if (typeof val === 'number' && !isNaN(val)) {
        teamStats[team1].fielding[statIndex] += val;
      }
    }
  }
  
  // Process away team (team2)
  if (team2 && teamStats[team2]) {
    teamStats[team2].gamesPlayed++;
    if (team2 === winner) {
      teamStats[team2].wins++;
      // Track team save if this team won and there was a save pitcher
      if (gameData.savePitcher) {
        teamStats[team2].pitching[7]++; // SV is index 7
      }
    }
    if (team2 === loser) teamStats[team2].losses++;

    // Hitting stats
    for (var statIndex = 0; statIndex < CONFIG.SHEET_STRUCTURE.PLAYER_STATS_SHEET.HITTING_STATS_COUNT; statIndex++) {
      var val = gameData.awayTeamTotals[statIndex];
      if (typeof val === 'number' && !isNaN(val)) {
        teamStats[team2].hitting[statIndex] += val;
      }
    }

    // Pitching stats (indices 0-6)
    for (var statIndex = 0; statIndex < CONFIG.SHEET_STRUCTURE.PLAYER_STATS_SHEET.PITCHING_STATS_COUNT; statIndex++) {
      var val = gameData.awayTeamPitchField[statIndex];
      if (typeof val === 'number' && !isNaN(val)) {
        teamStats[team2].pitching[statIndex] += val;
      }
    }

    // Fielding stats (indices 7-9)
    for (var statIndex = 0; statIndex < CONFIG.SHEET_STRUCTURE.PLAYER_STATS_SHEET.FIELDING_STATS_COUNT; statIndex++) {
      var val = gameData.awayTeamPitchField[statIndex + 7];
      if (typeof val === 'number' && !isNaN(val)) {
        teamStats[team2].fielding[statIndex] += val;
      }
    }
  }
}

function processTeamStatsWithH2HFromGame(teamStats, team1, team2, winner, loser, runs1, runs2) {
  if (team1 && teamStats[team1]) {
    teamStats[team1].gamesPlayed++;
    if (typeof runs1 === 'number') teamStats[team1].runsScored += runs1;
    if (typeof runs2 === 'number') teamStats[team1].runsAllowed += runs2;
    if (team1 === winner) {
      teamStats[team1].wins++;
      if (team2 && teamStats[team1].headToHead[team2]) {
        teamStats[team1].headToHead[team2].wins++;
      }
    } else if (team1 === loser) {
      teamStats[team1].losses++;
      if (team2 && teamStats[team1].headToHead[team2]) {
        teamStats[team1].headToHead[team2].losses++;
      }
    }
  }
  
  if (team2 && teamStats[team2]) {
    teamStats[team2].gamesPlayed++;
    if (typeof runs2 === 'number') teamStats[team2].runsScored += runs2;
    if (typeof runs1 === 'number') teamStats[team2].runsAllowed += runs1;
    if (team2 === winner) {
      teamStats[team2].wins++;
      if (team1 && teamStats[team2].headToHead[team1]) {
        teamStats[team2].headToHead[team1].wins++;
      }
    } else if (team2 === loser) {
      teamStats[team2].losses++;
      if (team1 && teamStats[team2].headToHead[team1]) {
        teamStats[team2].headToHead[team1].losses++;
      }
    }
  }
}

function updateScheduleDataFromGame(scheduleData, sheet, team1, team2, runs1, runs2, winner, loser, gameData, weekNum) {
  for (var scheduleIndex = 0; scheduleIndex < scheduleData.length; scheduleIndex++) {
    // Match by week number to ensure correct game assignment (prevents swapping when teams play multiple times)
    if (scheduleData[scheduleIndex].week == weekNum && scheduleData[scheduleIndex].homeTeam === team1 && scheduleData[scheduleIndex].awayTeam === team2) {
      scheduleData[scheduleIndex].played = true;
      scheduleData[scheduleIndex].homeScore = runs1;
      scheduleData[scheduleIndex].awayScore = runs2;
      scheduleData[scheduleIndex].winner = winner;
      scheduleData[scheduleIndex].loser = loser;
      scheduleData[scheduleIndex].sheetId = sheet.getSheetId();

      // NEW: Add MVP and pitcher data
      scheduleData[scheduleIndex].mvp = gameData.gameMVP || "";
      scheduleData[scheduleIndex].winningPitcher = gameData.winningPitcher || "";
      scheduleData[scheduleIndex].losingPitcher = gameData.losingPitcher || "";
      scheduleData[scheduleIndex].savePitcher = gameData.savePitcher || "";

      break;
    }
  }
}

// ===== WRITE GAME RESULTS BACK TO SCHEDULE =====
function writeGameResultsToSeasonSchedule(scheduleData) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var scheduleSheet = ss.getSheetByName(CONFIG.SCHEDULE_SHEET);

  if (!scheduleSheet) {
    logError("Write Game Results", "Schedule sheet not found", "");
    return;
  }

  // Add headers if they don't exist yet (columns D-L)
  var headers = scheduleSheet.getRange(1, 1, 1, 13).getValues()[0];

  if (!headers[3] || headers[3] === "") {
    // Write new column headers
    scheduleSheet.getRange(1, 4, 1, 9).setValues([[
      "Away Score", "Home Score", "Winning Team", "Losing Team", "Game MVP",
      "Winning Pitcher", "Losing Pitcher", "Saving Pitcher", "Box Score Link"
    ]]);
    scheduleSheet.getRange(1, 4, 1, 9).setFontWeight("bold").setBackground("#e8e8e8");
  }

  // Write game results for each completed game
  for (var gameIndex = 0; gameIndex < scheduleData.length; gameIndex++) {
    var game = scheduleData[gameIndex];

    if (game.played && game.sheetId) {
      var rowNum = gameIndex + 2; // +2 because data starts at row 2 (row 1 is headers)

      // Build box score URL
      var boxScoreUrl = "";
      if (game.sheetId) {
        try {
          var boxScoreSS = getBoxScoreSpreadsheet();
          if (boxScoreSS) {
            boxScoreUrl = boxScoreSS.getUrl() + "#gid=" + game.sheetId;
          }
        } catch (e) {
          logWarning("Write Game Results", "Could not build box score URL", e.toString());
        }
      }

      // Write game results to columns D-L
      var gameResults = [
        game.awayScore !== undefined && game.awayScore !== null ? game.awayScore : "",
        game.homeScore !== undefined && game.homeScore !== null ? game.homeScore : "",
        game.winner || "",
        game.loser || "",
        game.mvp || "",
        game.winningPitcher || "",
        game.losingPitcher || "",
        game.savePitcher || "",
        boxScoreUrl
      ];

      // Write game results (columns D-L)
      // Column L already contains the plain URL, which the website will render as a clickable link
      scheduleSheet.getRange(rowNum, 4, 1, 9).setValues([gameResults]);
    }
  }

  logInfo("Write Game Results", "Wrote " + scheduleData.filter(function(g) { return g.played; }).length + " completed games to Schedule");
}

// ===== PLAYOFF SCHEDULE FUNCTIONS =====

/**
 * Updates or creates a playoff game entry in the in-memory scheduleData array
 * Matches by playoff code only (teams may be placeholders until series winners determined)
 * @param {Array} scheduleData - In-memory array of playoff games
 * @param {Sheet} sheet - Game sheet object
 * @param {string} team1 - Home team name
 * @param {string} team2 - Away team name
 * @param {number} runs1 - Home team runs
 * @param {number} runs2 - Away team runs
 * @param {string} winner - Winning team name
 * @param {string} loser - Losing team name
 * @param {object} gameData - Game metadata (MVP, pitchers)
 * @param {string} playoffCode - Playoff game code (e.g., "CS1-A", "KC2")
 */
function updatePlayoffScheduleDataFromGame(scheduleData, sheet, team1, team2, runs1, runs2, winner, loser, gameData, playoffCode) {
  var foundIndex = -1;
  for (var scheduleIndex = 0; scheduleIndex < scheduleData.length; scheduleIndex++) {
    if (scheduleData[scheduleIndex].week == playoffCode) {
      foundIndex = scheduleIndex;
      break;
    }
  }

  if (foundIndex >= 0) {
    scheduleData[foundIndex].played = true;
    scheduleData[foundIndex].homeScore = runs1;
    scheduleData[foundIndex].awayScore = runs2;
    scheduleData[foundIndex].winner = winner;
    scheduleData[foundIndex].loser = loser;
    scheduleData[foundIndex].sheetId = sheet.getSheetId();

    // Update team names from actual game (may differ from placeholder teams in schedule)
    scheduleData[foundIndex].homeTeam = team1;
    scheduleData[foundIndex].awayTeam = team2;

    // Add MVP and pitcher data
    scheduleData[foundIndex].mvp = gameData.gameMVP || "";
    scheduleData[foundIndex].winningPitcher = gameData.winningPitcher || "";
    scheduleData[foundIndex].losingPitcher = gameData.losingPitcher || "";
    scheduleData[foundIndex].savePitcher = gameData.savePitcher || "";
  } else {
    scheduleData.push({
      week: playoffCode,
      homeTeam: team1,
      awayTeam: team2,
      played: true,
      homeScore: runs1,
      awayScore: runs2,
      winner: winner,
      loser: loser,
      sheetId: sheet.getSheetId(),
      mvp: gameData.gameMVP || "",
      winningPitcher: gameData.winningPitcher || "",
      losingPitcher: gameData.losingPitcher || "",
      savePitcher: gameData.savePitcher || ""
    });
    logInfo("Update Playoff Schedule Data", "Added new game to schedule data", playoffCode + ": " + team2 + " @ " + team1);
  }
}

/**
 * Helper function to get the seed number for a team
 * @param {Object} seeds - Object mapping seed numbers to team names (e.g., {1: "Muscles", 2: "Comets"})
 * @param {string} teamName - Team name to look up
 * @returns {number|null} Seed number if found, null otherwise
 */
function getSeedNumber(seeds, teamName) {
  if (!teamName || !seeds) return null;

  var trimmedName = String(teamName).trim();
  for (var seedNum in seeds) {
    if (seeds.hasOwnProperty(seedNum)) {
      if (String(seeds[seedNum]).trim() === trimmedName) {
        return parseInt(seedNum);
      }
    }
  }
  return null;
}

/**
 * Auto-generates playoff schedule structure with team seeds and winner propagation
 * Called before writing game results to ensure all games are present
 * Only generates games needed based on series status (doesn't create unnecessary games)
 * Updates placeholders with actual team names when series winners are determined
 * @param {Array} scheduleData - Completed playoff games data for determining winners and series status
 */
function updatePlayoffScheduleStructure(scheduleData) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var scheduleSheet = ss.getSheetByName(CONFIG.PLAYOFF_SCHEDULE_SHEET);

  // Create sheet if it doesn't exist
  if (!scheduleSheet) {
    scheduleSheet = ss.insertSheet(CONFIG.PLAYOFF_SCHEDULE_SHEET);
    logInfo("Update Playoff Schedule", "Created new playoff schedule sheet");
  }

  var existingSeeds = {};
  if (scheduleSheet.getLastRow() >= 2) {
    var existingData = scheduleSheet.getRange(2, 1, Math.min(scheduleSheet.getLastRow() - 1, 20), 3).getValues();
    for (var rowIndex = 0; rowIndex < existingData.length; rowIndex++) {
      var code = String(existingData[rowIndex][0] || "").trim();
      var away = String(existingData[rowIndex][1] || "").trim();
      var home = String(existingData[rowIndex][2] || "").trim();

      if (code === "CS1-A" && away && home && away !== "TBD" && !away.startsWith("Winner")) {
        existingSeeds[4] = away;
        existingSeeds[1] = home;
      } else if (code === "CS1-B" && away && home && away !== "TBD" && !away.startsWith("Winner")) {
        existingSeeds[3] = away;
        existingSeeds[2] = home;
      }
    }
  }

  var seeds = {};
  if (Object.keys(existingSeeds).length >= 4) {
    seeds = existingSeeds;
    logInfo("Update Playoff Schedule", "Using existing playoff seeds from schedule");
  } else {
    seeds = getPlayoffSeedsFromStandings();
    logInfo("Update Playoff Schedule", "Read playoff seeds from standings sheet");
  }

  // Determine series winners from completed games
  var wcWinner = getSeriesWinner(scheduleData, CONFIG.WILDCARD_ROUND_PREFIX);
  var cs1Winner = getSeriesWinner(scheduleData, CONFIG.SEMIFINAL_ROUND_PREFIX, 'A');
  var cs2Winner = getSeriesWinner(scheduleData, CONFIG.SEMIFINAL_ROUND_PREFIX, 'B');

  // Build playoff schedule structure
  var schedule = [];

  // Add header row
  schedule.push(["Game Code", "Away Team", "Home Team"]);

  // Wildcard Round (Best of 3) - if enabled
  if (CONFIG.ENABLE_WILDCARD_ROUND) {
    var wcWinsNeeded = CONFIG.QUARTERFINALS_WINS_REQUIRED;
    var wcStatus = getSeriesStatus(scheduleData, CONFIG.WILDCARD_ROUND_PREFIX, null, wcWinsNeeded);
    var wcGamesNeeded = Math.min(wcStatus.gamesPlayed + 1, (wcWinsNeeded * 2) - 1);
    if (!wcStatus.isComplete) {
      wcGamesNeeded = Math.min(wcGamesNeeded, (wcWinsNeeded * 2) - 1);
    }

    for (var wcGameNum = 1; wcGameNum <= wcGamesNeeded; wcGameNum++) {
      var wcHome = (wcGameNum % 2 === 1) ? seeds[4] : seeds[5];
      var wcAway = (wcGameNum % 2 === 1) ? seeds[5] : seeds[4];
      schedule.push(["WC" + wcGameNum, wcAway || "TBD", wcHome || "TBD"]);
    }
  }

  // Castle Series - Series A (Best of X based on config)
  var cs1WinsNeeded = CONFIG.SEMIFINALS_WINS_REQUIRED;
  var cs1Status = getSeriesStatus(scheduleData, CONFIG.SEMIFINAL_ROUND_PREFIX, 'A', cs1WinsNeeded);
  var cs1GamesNeeded = Math.min(cs1Status.gamesPlayed + 1, (cs1WinsNeeded * 2) - 1);
  if (!cs1Status.isComplete) {
    cs1GamesNeeded = Math.min(cs1GamesNeeded, (cs1WinsNeeded * 2) - 1);
  }

  var cs1Away, cs1Home;
  if (CONFIG.ENABLE_WILDCARD_ROUND) {
    cs1Away = wcWinner || "Winner of WC";
    cs1Home = seeds[1] || "TBD";
  } else {
    cs1Away = seeds[4] || "TBD";
    cs1Home = seeds[1] || "TBD";
  }

  for (var cs1GameNum = 1; cs1GameNum <= cs1GamesNeeded; cs1GameNum++) {
    var cs1GameHome = (cs1GameNum % 2 === 1) ? cs1Home : cs1Away;
    var cs1GameAway = (cs1GameNum % 2 === 1) ? cs1Away : cs1Home;
    schedule.push(["CS" + cs1GameNum + "-A", cs1GameAway, cs1GameHome]);
  }

  // Castle Series - Series B (Best of X based on config)
  var cs2WinsNeeded = CONFIG.SEMIFINALS_WINS_REQUIRED;
  var cs2Status = getSeriesStatus(scheduleData, CONFIG.SEMIFINAL_ROUND_PREFIX, 'B', cs2WinsNeeded);
  var cs2GamesNeeded = Math.min(cs2Status.gamesPlayed + 1, (cs2WinsNeeded * 2) - 1);
  if (!cs2Status.isComplete) {
    cs2GamesNeeded = Math.min(cs2GamesNeeded, (cs2WinsNeeded * 2) - 1);
  }

  var cs2Away = seeds[3] || "TBD";
  var cs2Home = seeds[2] || "TBD";

  for (var cs2GameNum = 1; cs2GameNum <= cs2GamesNeeded; cs2GameNum++) {
    var cs2GameHome = (cs2GameNum % 2 === 1) ? cs2Home : cs2Away;
    var cs2GameAway = (cs2GameNum % 2 === 1) ? cs2Away : cs2Home;
    schedule.push(["CS" + cs2GameNum + "-B", cs2GameAway, cs2GameHome]);
  }

  // Kingdom Cup Finals (Best of X based on config)
  var kcWinsNeeded = CONFIG.FINALS_WINS_REQUIRED;
  var kcStatus = getSeriesStatus(scheduleData, CONFIG.FINALS_ROUND_PREFIX, null, kcWinsNeeded);
  var kcGamesNeeded = Math.min(kcStatus.gamesPlayed + 1, (kcWinsNeeded * 2) - 1);
  if (!kcStatus.isComplete) {
    kcGamesNeeded = Math.min(kcGamesNeeded, (kcWinsNeeded * 2) - 1);
  }

  // Determine KC home/away based on seed ranking (higher seed = home court advantage)
  var kc1Away, kc1Home;
  if (cs1Winner && cs2Winner) {
    // Both series complete - determine home/away by seed
    var cs1Seed = getSeedNumber(seeds, cs1Winner);
    var cs2Seed = getSeedNumber(seeds, cs2Winner);

    // Lower seed number = higher seed = home court advantage
    if (cs1Seed && cs2Seed) {
      if (cs1Seed < cs2Seed) {
        kc1Home = cs1Winner;
        kc1Away = cs2Winner;
      } else {
        kc1Home = cs2Winner;
        kc1Away = cs1Winner;
      }
    } else {
      // Fallback if seeds not found
      kc1Home = cs1Winner;
      kc1Away = cs2Winner;
    }
  } else {
    // Series not complete yet - use placeholders
    kc1Away = cs2Winner || "Winner of CS-B";
    kc1Home = cs1Winner || "Winner of CS-A";
  }

  for (var kcGameNum = 1; kcGameNum <= kcGamesNeeded; kcGameNum++) {
    var kcGameHome = (kcGameNum % 2 === 1) ? kc1Home : kc1Away;
    var kcGameAway = (kcGameNum % 2 === 1) ? kc1Away : kc1Home;
    schedule.push(["KC" + kcGameNum, kcGameAway, kcGameHome]);
  }

  // Access playoff schedule config with defensive check
  if (!CONFIG || !CONFIG.SHEET_STRUCTURE || !CONFIG.SHEET_STRUCTURE.PLAYOFF_SCHEDULE) {
    logError("Update Playoff Schedule", "CONFIG.SHEET_STRUCTURE.PLAYOFF_SCHEDULE is not defined",
             "Please ensure LeagueConfig.js is loaded");
    return;
  }

  var scheduleConfig = CONFIG.SHEET_STRUCTURE.PLAYOFF_SCHEDULE;
  var headerRow = scheduleConfig.HEADER_ROW;
  var dataStartRow = scheduleConfig.DATA_START_ROW;
  var numBasicCols = scheduleConfig.NUM_BASIC_COLS;
  var codeCol = scheduleConfig.GAME_CODE_COL;
  var awayCol = scheduleConfig.AWAY_TEAM_COL;
  var homeCol = scheduleConfig.HOME_TEAM_COL;

  var existingLastRow = scheduleSheet.getLastRow();
  var hasHeaders = existingLastRow > 0 && scheduleSheet.getRange(headerRow, headerRow).getValue() !== "";

  if (!hasHeaders) {
    // Initial creation - batch write full schedule including headers
    scheduleSheet.getRange(headerRow, headerRow, schedule.length, numBasicCols).setValues(schedule);

    scheduleSheet.getRange(headerRow, headerRow, headerRow, numBasicCols)
      .setFontWeight("bold")
      .setBackground("#e8e8e8")
      .setHorizontalAlignment("center");

    logInfo("Update Playoff Schedule", "Created initial schedule with " + (schedule.length - 1) + " games");
  } else {
    // Smart update - batch read existing, modify in memory, batch write
    var existingData = [];
    if (existingLastRow >= dataStartRow) {
      existingData = scheduleSheet.getRange(dataStartRow, headerRow, existingLastRow - headerRow, numBasicCols).getValues();
    }

    // Build code-to-index mapping for fast lookup
    var codeToIndex = {};
    for (var existingIndex = 0; existingIndex < existingData.length; existingIndex++) {
      var code = String(existingData[existingIndex][codeCol] || "").trim();
      if (code) {
        codeToIndex[code] = existingIndex;
      }
    }

    // Update existing rows in memory and collect new rows
    var updatedCount = 0;
    var newRows = [];

    for (var schedIndex = 1; schedIndex < schedule.length; schedIndex++) {
      var gameCode = schedule[schedIndex][codeCol];
      var awayTeam = schedule[schedIndex][awayCol];
      var homeTeam = schedule[schedIndex][homeCol];

      if (codeToIndex[gameCode] !== undefined) {
        // Update existing row in memory (columns B and C only)
        existingData[codeToIndex[gameCode]][awayCol] = awayTeam;
        existingData[codeToIndex[gameCode]][homeCol] = homeTeam;
        updatedCount++;
      } else {
        // Collect new row for batch append
        newRows.push([gameCode, awayTeam, homeTeam]);
      }
    }

    // Batch write updated existing data (single write operation)
    if (existingData.length > 0) {
      scheduleSheet.getRange(dataStartRow, headerRow, existingData.length, numBasicCols).setValues(existingData);
    }

    // Batch append new rows (single write operation)
    if (newRows.length > 0) {
      var appendStartRow = scheduleSheet.getLastRow() + 1;
      scheduleSheet.getRange(appendStartRow, headerRow, newRows.length, numBasicCols).setValues(newRows);
    }

    logInfo("Update Playoff Schedule", "Smart update: " + updatedCount + " updated, " + newRows.length + " added");
  }
}

/**
 * Gets the current status of a playoff series (games played, wins by team, completion status)
 * @param {Array} scheduleData - Array of completed playoff games
 * @param {string} roundCode - Round prefix (WC, CS, KC)
 * @param {string} seriesLetter - Optional series identifier for parallel series (A, B)
 * @param {number} winsNeeded - Number of wins needed to clinch the series
 * @returns {object} - Object with gamesPlayed, isComplete, and teamWins properties
 */
function getSeriesStatus(scheduleData, roundCode, seriesLetter, winsNeeded) {
  if (!scheduleData || scheduleData.length === 0) {
    return { gamesPlayed: 0, isComplete: false, teamWins: {} };
  }

  var seriesGames = [];
  for (var gameIndex = 0; gameIndex < scheduleData.length; gameIndex++) {
    var game = scheduleData[gameIndex];
    if (!game.week) continue;

    var code = String(game.week).toUpperCase();

    if (code.indexOf(roundCode) !== 0) continue;

    if (seriesLetter) {
      if (code.indexOf('-' + seriesLetter) === -1) continue;
    }

    seriesGames.push(game);
  }

  var teamWins = {};
  var gamesPlayed = 0;

  for (var seriesGameIndex = 0; seriesGameIndex < seriesGames.length; seriesGameIndex++) {
    var game = seriesGames[seriesGameIndex];
    if (game.played && game.winner) {
      gamesPlayed++;
      var winner = String(game.winner).trim();
      teamWins[winner] = (teamWins[winner] || 0) + 1;
    }
  }

  // Check if series is complete
  var isComplete = false;
  for (var team in teamWins) {
    if (teamWins[team] >= winsNeeded) {
      isComplete = true;
      break;
    }
  }

  return {
    gamesPlayed: gamesPlayed,
    isComplete: isComplete,
    teamWins: teamWins
  };
}

/**
 * Determines the winner of a playoff series based on completed games
 * @param {Array} scheduleData - Array of completed playoff games
 * @param {string} roundCode - Round prefix (WC, CS, KC)
 * @param {string} seriesLetter - Optional series identifier for parallel series (A, B)
 * @returns {string|null} - Winning team name or null if series incomplete
 */
function getSeriesWinner(scheduleData, roundCode, seriesLetter) {
  if (!scheduleData || scheduleData.length === 0) return null;

  var seriesGames = [];
  for (var gameIndex = 0; gameIndex < scheduleData.length; gameIndex++) {
    var game = scheduleData[gameIndex];
    if (!game.week) continue;

    var code = String(game.week).toUpperCase();

    if (code.indexOf(roundCode) !== 0) continue;

    if (seriesLetter) {
      if (code.indexOf('-' + seriesLetter) === -1) continue;
    }

    seriesGames.push(game);
  }

  if (seriesGames.length === 0) return null;

  var teamWins = {};
  for (var seriesGameIndex = 0; seriesGameIndex < seriesGames.length; seriesGameIndex++) {
    var game = seriesGames[seriesGameIndex];
    if (game.played && game.winner) {
      var winner = String(game.winner).trim();
      teamWins[winner] = (teamWins[winner] || 0) + 1;
    }
  }

  // Determine wins needed based on round
  var winsNeeded;
  if (roundCode === CONFIG.WILDCARD_ROUND_PREFIX) {
    winsNeeded = CONFIG.QUARTERFINALS_WINS_REQUIRED; // Best of 3 = 2 wins
  } else if (roundCode === CONFIG.SEMIFINAL_ROUND_PREFIX) {
    winsNeeded = CONFIG.SEMIFINALS_WINS_REQUIRED; // Best of 5 = 3 wins
  } else if (roundCode === CONFIG.FINALS_ROUND_PREFIX) {
    winsNeeded = CONFIG.FINALS_WINS_REQUIRED; // Best of 7 = 4 wins
  } else {
    return null;
  }

  // Check if any team has won the series
  for (var team in teamWins) {
    if (teamWins[team] >= winsNeeded) {
      return team;
    }
  }

  return null;
}

/**
 * Writes completed playoff game results to the Playoff Schedule sheet
 * Updates columns D-L with scores, winners, MVPs, and pitchers for completed games
 * @param {Array} scheduleData - In-memory array of completed playoff games
 */
function writeGameResultsToPlayoffSchedule(scheduleData) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var scheduleSheet = ss.getSheetByName(CONFIG.PLAYOFF_SCHEDULE_SHEET);

  if (!scheduleSheet) {
    logError("Write Playoff Game Results", "Playoff Schedule sheet not found", "");
    return;
  }

  var headers = scheduleSheet.getRange(1, 1, 1, 13).getValues()[0];

  if (!headers[3] || headers[3] === "") {
    scheduleSheet.getRange(1, 4, 1, 9).setValues([[
      "Away Score", "Home Score", "Winning Team", "Losing Team", "Game MVP",
      "Winning Pitcher", "Losing Pitcher", "Saving Pitcher", "Box Score Link"
    ]]);
    scheduleSheet.getRange(1, 4, 1, 9).setFontWeight("bold").setBackground("#e8e8e8");
  }

  var lastRow = scheduleSheet.getLastRow();
  if (lastRow < 2) {
    logWarning("Write Playoff Game Results", "No schedule data found in sheet", "");
    return;
  }

  var currentSchedule = scheduleSheet.getRange(2, 1, lastRow - 1, 3).getValues();

  for (var gameIndex = 0; gameIndex < scheduleData.length; gameIndex++) {
    var game = scheduleData[gameIndex];

    if (game.played && game.sheetId) {
      // Find the row where this game appears in the current schedule structure
      var rowNum = findPlayoffGameRow(currentSchedule, game.week, game.awayTeam, game.homeTeam);

      if (rowNum < 0) {
        logWarning("Write Playoff Game Results", "Could not find matching row for game", game.week + ": " + game.awayTeam + " @ " + game.homeTeam);
        continue;
      }

      // Build box score URL
      var boxScoreUrl = "";
      if (game.sheetId) {
        try {
          var boxScoreSS = getBoxScoreSpreadsheet();
          if (boxScoreSS) {
            boxScoreUrl = boxScoreSS.getUrl() + "#gid=" + game.sheetId;
          }
        } catch (e) {
          logWarning("Write Playoff Game Results", "Could not build box score URL", e.toString());
        }
      }

      // Write game results to columns D-L
      var gameResults = [
        game.awayScore !== undefined && game.awayScore !== null ? game.awayScore : "",
        game.homeScore !== undefined && game.homeScore !== null ? game.homeScore : "",
        game.winner || "",
        game.loser || "",
        game.mvp || "",
        game.winningPitcher || "",
        game.losingPitcher || "",
        game.savePitcher || "",
        boxScoreUrl
      ];

      // Write game results (columns D-L)
      scheduleSheet.getRange(rowNum, 4, 1, 9).setValues([gameResults]);
    }
  }

  logInfo("Write Playoff Game Results", "Wrote " + scheduleData.filter(function(g) { return g.played; }).length + " completed playoff games to Playoff Schedule");
}

/**
 * Find the row number for a playoff game in the current schedule structure
 * @param {Array<Array>} currentSchedule - Current schedule data from sheet (columns A-C)
 * @param {string} code - Game code (e.g., "CS1-A", "KC2")
 * @param {string} awayTeam - Away team name (not used - kept for compatibility)
 * @param {string} homeTeam - Home team name (not used - kept for compatibility)
 * @returns {number} Row number (1-indexed), or -1 if not found
 */
function findPlayoffGameRow(currentSchedule, code, awayTeam, homeTeam) {
  for (var rowIndex = 0; rowIndex < currentSchedule.length; rowIndex++) {
    var rowCode = String(currentSchedule[rowIndex][0] || "").trim();

    // Match by code ONLY
    // Each playoff code is unique (CS1-A, CS2-B, KC1, etc.)
    // Don't match by teams - they may have been updated by winner propagation
    if (rowCode === String(code).trim()) {
      return rowIndex + 2; // +2 because data starts at row 2 (row 1 is headers)
    }
  }

  return -1; // Not found
}
