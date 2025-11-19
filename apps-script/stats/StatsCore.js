// ===== STATS - CORE SCRIPT =====
// Core functionality: Menu and Update All orchestrator

// ===== MENU =====
function onOpen() {
  var ui = SpreadsheetApp.getUi();

  // Player Stats Menu (League Hub operations)
  ui.createMenu('Player Stats')
      .addItem('🧮 Process Regular Season', 'updateAll')
      .addItem('🏆 Process Postseason', 'updateAllPlayoffs')
      .addSeparator()
      // Transactions (collapsed)
      .addSubMenu(ui.createMenu('💰 Transactions')
          .addItem('📝 Record Transaction', 'recordTransaction')
          .addItem('📋 View/Edit Transaction Log', 'viewTransactionLog')
          .addItem('⚠️ Detect Missing Transactions', 'detectMissingTransactions'))
      // Retention (collapsed)
      .addSubMenu(ui.createMenu('⭐ Retention')
          .addItem('🏆 Calculate Retention Grades', 'calculateFinalRetentionGrades')
          .addSeparator()
          .addItem('Refresh Formulas', 'refreshRetentionFormulas')
          .addItem('Rebuild Sheet Formatting', 'rebuildRetentionSheet'))
      // Archive & Maintenance (collapsed)
      .addSubMenu(ui.createMenu('📦 Archive & Maintenance')
          .addItem('Archive Current Season', 'archiveCurrentSeason'))
      .addToUi();

  // CLB Tools Menu (Database/Character tools - consolidated from Database spreadsheet)
  ui.createMenu('🎮 CLB Tools')
      .addItem('🔐 Admin: Comparison with Averages', 'showAttributeComparisonAdmin')
      .addSeparator()
      .addSubMenu(ui.createMenu('🔧 Chemistry Tools')
          .addItem('✏️ Visual Chemistry Editor', 'showChemistryEditor')
          .addItem('📊 Update Chemistry JSON Cache', 'updateChemistryDataJSON')
          .addItem('🧹 Clear JSON Cache', 'clearChemistryCache'))
      .addSubMenu(ui.createMenu('📦 Stats Preset Import/Export')
          .addItem('📥 Import Full Preset', 'importChemistryFromStatsPreset')
          .addItem('📤 Export Full Preset', 'exportChemistryToStatsPreset'))
      .addToUi();
}

// ===== UPDATE ALL =====
function updateAll() {
  var startTime = new Date();
  logInfo("Update All", "Starting full update process");

  try {
    // Check for missing transactions before starting
    detectMissingTransactions();

    // ===== Process all game sheets ONCE =====
    SpreadsheetApp.getActiveSpreadsheet().toast("Processing regular season game sheets...", "Update Regular Season", -1);
    var processingStart = new Date();

    var gameData = processAllGameSheetsOnce();
    if (!gameData) {
      SpreadsheetApp.getUi().alert("Failed to process game sheets. Check Error Log for details.");
      return;
    }

    // Cache the processed data
    _spreadsheetCache.gameData = gameData;

    var processingTime = ((new Date() - processingStart) / 1000).toFixed(1);
    logInfo("Update All", "Game processing completed in " + processingTime + "s");
    SpreadsheetApp.flush();

    // ===== STEP 1: Update player stats (using cached data) =====
    SpreadsheetApp.getActiveSpreadsheet().toast("Step 1 of 4: Updating players' season stats...", "Update Regular Season", -1);
    var step1Start = new Date();
    updateAllPlayerStatsFromCache(gameData.playerStats);
    var step1Time = ((new Date() - step1Start) / 1000).toFixed(1);
    SpreadsheetApp.flush();

    // ===== STEP 2: Update team stats (using cached data) =====
    SpreadsheetApp.getActiveSpreadsheet().toast("Step 2 of 4: Updating teams' season stats...", "Update Regular Season", -1);
    var step2Start = new Date();
    updateAllTeamStatsFromCache(gameData.teamStats);
    var step2Time = ((new Date() - step2Start) / 1000).toFixed(1);
    SpreadsheetApp.flush();

    // ===== STEP 3: Update schedule =====
    SpreadsheetApp.getActiveSpreadsheet().toast("Step 3 of 4: Updating season schedule...", "Update Regular Season", -1);
    var step3Start = new Date();
    writeGameResultsToSeasonSchedule(gameData.scheduleData);
    var step3Time = ((new Date() - step3Start) / 1000).toFixed(1);
    SpreadsheetApp.flush();

    // ===== STEP 4: Update standings (using cached data) =====
    SpreadsheetApp.getActiveSpreadsheet().toast("Step 4 of 4: Updating season standings...", "Update Regular Season", -1);
    var step4Start = new Date();
    // Pass full gameData object for in-memory performance
    updateLeagueHubFromCache(gameData);
    var step4Time = ((new Date() - step4Start) / 1000).toFixed(1);
    SpreadsheetApp.flush();

    var totalTime = ((new Date() - startTime) / 1000).toFixed(1);

    // Concise message that fits in toast
    var stepsTime = (parseFloat(step1Time) + parseFloat(step2Time) +
                     parseFloat(step3Time) + parseFloat(step4Time)).toFixed(1);

    var message = "✅ Update Complete!\n\n" +
                  "Game Processing: " + processingTime + "s\n" +
                  "Steps 1-4: " + stepsTime + "s\n" +
                  "─────────────\n" +
                  "Total: " + totalTime + "s";

    SpreadsheetApp.getActiveSpreadsheet().toast(message, "✅ Update Complete", 10);
    logInfo("Update All", "Completed successfully in " + totalTime + "s");

    // Cache final data for Retention suite
    cacheCurrentSeasonStats(gameData);

    // ===== PHASE 1: Website & Discord Integration =====
    invalidateWebsiteCache();
    notifyDiscordStatsUpdated(gameData);
    // ===== End Phase 1 Integration =====

  } catch (e) {
    logError("Update All", e.toString(), "N/A");
    SpreadsheetApp.getUi().alert("Error during update: " + e.toString());
  }

  // Clear cache after completion
  clearCache();
}

// ===== UPDATE ALL PLAYOFFS =====
function updateAllPlayoffs() {
  var startTime = new Date();
  logInfo("Update Playoffs", "Starting playoff update process");

  try {
    // ===== Process all playoff game sheets ONCE =====
    SpreadsheetApp.getActiveSpreadsheet().toast("Processing postseason game sheets...", "Update Postseason", -1);
    var processingStart = new Date();

    var playoffGameData = processAllPlayoffGameSheetsOnce();
    if (!playoffGameData) {
      SpreadsheetApp.getUi().alert("Failed to process playoff game sheets. Check Error Log for details.");
      return;
    }

    // Cache the processed data
    _spreadsheetCache.playoffGameData = playoffGameData;

    var processingTime = ((new Date() - processingStart) / 1000).toFixed(1);
    logInfo("Update Playoffs", "Playoff game processing completed in " + processingTime + "s");
    SpreadsheetApp.flush();

    // ===== STEP 1: Update playoff player stats (using cached data) =====
    SpreadsheetApp.getActiveSpreadsheet().toast("Step 1 of 3: Updating players' postseason stats...", "Update Postseason", -1);
    var step1Start = new Date();
    updateAllPlayoffPlayerStatsFromCache(playoffGameData.playerStats);
    var step1Time = ((new Date() - step1Start) / 1000).toFixed(1);
    SpreadsheetApp.flush();

    // ===== STEP 2: Update playoff team stats (using cached data) =====
    SpreadsheetApp.getActiveSpreadsheet().toast("Step 2 of 3: Updating teams' postseason stats...", "Update Postseason", -1);
    var step2Start = new Date();
    updateAllPlayoffTeamStatsFromCache(playoffGameData.teamStats);
    var step2Time = ((new Date() - step2Start) / 1000).toFixed(1);
    SpreadsheetApp.flush();

    // ===== STEP 3: Update playoff schedule =====
    SpreadsheetApp.getActiveSpreadsheet().toast("Step 3 of 3: Updating playoff schedule...", "Update Postseason", -1);
    var step3Start = new Date();

    // Always update playoff schedule structure to propagate series winners
    // This function handles both initial seeding AND advancing winners to next rounds
    // Note: Seeds are read from standings sheet (fast) or preserved from existing schedule
    updatePlayoffScheduleStructure(playoffGameData.scheduleData);

    // Write completed game results to the schedule
    writeGameResultsToPlayoffSchedule(playoffGameData.scheduleData);
    var step3Time = ((new Date() - step3Start) / 1000).toFixed(1);
    SpreadsheetApp.flush();

    var totalTime = ((new Date() - startTime) / 1000).toFixed(1);

    // Concise message that fits in toast
    var stepsTime = (parseFloat(step1Time) + parseFloat(step2Time) +
                     parseFloat(step3Time)).toFixed(1);

    var message = "✅ Update Complete!\n\n" +
                  "Game Processing: " + processingTime + "s\n" +
                  "Steps 1-3: " + stepsTime + "s\n" +
                  "─────────────\n" +
                  "Total: " + totalTime + "s";

    SpreadsheetApp.getActiveSpreadsheet().toast(message, "✅ Update Complete", 10);
    logInfo("Update Playoffs", "Completed successfully in " + totalTime + "s");

    // ===== PHASE 1: Website & Discord Integration =====
    invalidateWebsiteCache();
    notifyDiscordStatsUpdated(playoffGameData);
    // ===== End Phase 1 Integration =====

  } catch (e) {
    logError("Update Playoffs", e.toString(), "N/A");
    SpreadsheetApp.getUi().alert("Error during playoff update: " + e.toString());
  }

  // Clear cache after completion
  clearCache();
}

// ===== QUICK UPDATE (INCREMENTAL) =====
function quickUpdate() {
  var startTime = new Date();
  
  // Check if cache exists (first-time setup)
  var hasCache = false;
  try {
    var stored = PropertiesService.getScriptProperties().getProperty('gameHashes');
    hasCache = (stored && stored !== "");
  } catch (e) {}
  
  if (!hasCache) {
    var ui = SpreadsheetApp.getUi();
    var response = ui.alert(
      'First Time Setup',
      'No cache found. This is normal for the first run or after copying the spreadsheet.\n\n' +
      'Quick Update will now process all games to build the cache (~45 seconds).\n\n' +
      'After this, future updates will be much faster!\n\n' +
      'Continue?',
      ui.ButtonSet.YES_NO
    );
    
    if (response !== ui.Button.YES) {
      return;
    }
  }
  
  logInfo("Quick Update", "Starting incremental update");
  
  try {
    detectMissingTransactions();
    
    SpreadsheetApp.getActiveSpreadsheet().toast("Checking for new/modified games...", "Quick Update", -1);
    var processingStart = new Date();
    
    var gameData = processNewAndModifiedGamesOnly();
    if (!gameData) {
      return;
    }
    
    _spreadsheetCache.gameData = gameData;
    
    var processingTime = ((new Date() - processingStart) / 1000).toFixed(1);
    logInfo("Quick Update", "Game processing completed in " + processingTime + "s");
    SpreadsheetApp.flush();
    
    SpreadsheetApp.getActiveSpreadsheet().toast("Step 1 of 3: Updating player stats...", "Quick Update", -1);
    var step1Start = new Date();
    updateAllPlayerStatsFromCache(gameData.playerStats);
    var step1Time = ((new Date() - step1Start) / 1000).toFixed(1);
    SpreadsheetApp.flush();

    SpreadsheetApp.getActiveSpreadsheet().toast("Step 2 of 3: Updating team stats...", "Quick Update", -1);
    var step2Start = new Date();
    updateAllTeamStatsFromCache(gameData.teamStats);
    var step2Time = ((new Date() - step2Start) / 1000).toFixed(1);
    SpreadsheetApp.flush();

    // Write game results to Schedule
    logInfo("QuickUpdate", "Writing game results to Schedule");
    writeGameResultsToSeasonSchedule(gameData.scheduleData);

    SpreadsheetApp.getActiveSpreadsheet().toast("Step 3 of 3: Updating standings...", "Quick Update", -1);
    var step3Start = new Date();
    // Pass full gameData object for in-memory performance
    updateLeagueHubFromCache(gameData);
    var step3Time = ((new Date() - step3Start) / 1000).toFixed(1);
    SpreadsheetApp.flush();

    var totalTime = ((new Date() - startTime) / 1000).toFixed(1);

    // Concise message that fits in toast
    var stepsTime = (parseFloat(step1Time) + parseFloat(step2Time) +
                     parseFloat(step3Time)).toFixed(1);

    var message = "⚡ Quick Update Complete!\n\n" +
                  "Game Processing: " + processingTime + "s\n" +
                  "Steps 1-3: " + stepsTime + "s\n" +
                  "─────────────\n" +
                  "Total: " + totalTime + "s";
    
    SpreadsheetApp.getActiveSpreadsheet().toast(message, "Quick Update Complete", 10);
    logInfo("Quick Update", "Completed successfully in " + totalTime + "s");

    // ===== PHASE 1: Website & Discord Integration =====
    invalidateWebsiteCache();
    notifyDiscordStatsUpdated(gameData);
    // ===== End Phase 1 Integration =====

  } catch (e) {
    logError("Quick Update", e.toString(), "N/A");
    SpreadsheetApp.getUi().alert("Error during quick update: " + e.toString());
  }

  clearCache();
}

// ===== ADVANCED: FORCE FULL REFRESH =====
function forceFullRefresh() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert(
    'Force Full Refresh',
    'This will clear the game cache and process ALL games on the next update.\n\n' +
    'Use this if:\n' +
    '• Stats seem incorrect\n' +
    '• You made major changes to old games\n' +
    '• You copied this spreadsheet\n\n' +
    'Continue?',
    ui.ButtonSet.YES_NO
  );
  
  if (response === ui.Button.YES) {
    try {
      PropertiesService.getScriptProperties().deleteProperty('gameHashes');
      ui.alert('✅ Cache Cleared!\n\nNext "Quick Update" or "Update All" will process all games.');
      logInfo("Force Refresh", "Game hash cache cleared");
    } catch (e) {
      ui.alert('Error clearing cache: ' + e.toString());
      logError("Force Refresh", "Error clearing cache: " + e.toString(), "N/A");
    }
  }
}

// ===== ADVANCED: VIEW CACHE STATUS =====
function viewCacheStatus() {
  try {
    var stored = PropertiesService.getScriptProperties().getProperty('gameHashes');
    
    if (!stored) {
      SpreadsheetApp.getUi().alert(
        'Cache Status',
        'No cache found.\n\n' +
        'The next "Quick Update" will process all games and create the cache.',
        SpreadsheetApp.getUi().ButtonSet.OK
      );
      return;
    }
    
    var hashes = JSON.parse(stored);
    var gameCount = Object.keys(hashes).length;
    
    var gameList = Object.keys(hashes).sort().join('\n');
    
    SpreadsheetApp.getUi().alert(
      'Cache Status',
      'Cached games: ' + gameCount + '\n\n' +
      'Games in cache:\n' + gameList.substring(0, 500) + 
      (gameList.length > 500 ? '\n...(and more)' : ''),
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    
  } catch (e) {
    SpreadsheetApp.getUi().alert('Error reading cache: ' + e.toString());
    logError("View Cache", "Error reading cache: " + e.toString(), "N/A");
  }
}

// ===== INDIVIDUAL STEP WRAPPERS (for manual execution) =====
// These allow running individual steps from the menu

function updateAllPlayerStats() {
  // Manual execution - process games fresh
  var gameData = processAllGameSheetsOnce();
  if (gameData) {
    updateAllPlayerStatsFromCache(gameData.playerStats);
  }
}

function updateAllTeamStats() {
  // Manual execution - process games fresh
  var gameData = processAllGameSheetsOnce();
  if (gameData) {
    updateAllTeamStatsFromCache(gameData.teamStats);
  }
}

function updateLeagueHub() {
  // Manual execution - process games fresh
  var gameData = processAllGameSheetsOnce();
  if (gameData) {
    // Pass full gameData object for in-memory performance
    updateLeagueHubFromCache(gameData);
  }
}

// ===== RETENTION GRADE CONTROLLER =====
/**
 * Calculate Final Retention Grades
 * Reads from cached season data for optimal performance
 */
function calculateFinalRetentionGrades() {
  var ui = SpreadsheetApp.getUi();

  // Confirm this high-stakes operation
  var response = ui.alert(
    '🚀 Calculate Final Retention Grades',
    'This will calculate retention grades using the cached final season data.\n\n' +
    '⚠️ IMPORTANT: Make sure you have run "Update All" first to ensure the data is current.\n\n' +
    'This is a once-per-season operation. Continue?',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    return;
  }

  try {
    // Load cached final season data
    var jsonData = PropertiesService.getScriptProperties().getProperty('CURRENT_SEASON_STATS');

    if (!jsonData) {
      ui.alert(
        '❌ No Cached Data Found',
        'Current season stats not found in cache.\n\n' +
        'Please run "🚀 Update All" first to cache the season data, then try again.',
        ui.ButtonSet.OK
      );
      logError("Retention", "No cached season data found", "N/A");
      return;
    }

    // Parse the cached data
    var loadedGameData = JSON.parse(jsonData);
    logInfo("Retention", "Loaded cached season data successfully");

    // Call the retention calculation with cached data
    SpreadsheetApp.getActiveSpreadsheet().toast("Calculating retention grades from cached data...", "Retention", -1);
    calculateRetentionGrades(loadedGameData);

    ui.alert(
      '✅ Retention Grades Complete',
      'Retention grades have been calculated successfully using cached season data!',
      ui.ButtonSet.OK
    );

  } catch (e) {
    logError("Retention", "Error calculating retention grades: " + e.toString(), "N/A");
    ui.alert(
      '❌ Error',
      'Failed to calculate retention grades:\n\n' + e.toString(),
      ui.ButtonSet.OK
    );
  }

}

