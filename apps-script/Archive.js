// ===== ARCHIVE & MAINTENANCE MODULE =====
// Season archiving functions

function archiveCurrentSeason() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ui = SpreadsheetApp.getUi();
  
  // Prompt for season name
  var seasonResponse = ui.prompt(
    "Archive Current Season",
    "Enter a name for this season (e.g., 'Season 2024' or 'Fall 2024'):",
    ui.ButtonSet.OK_CANCEL
  );
  
  if (seasonResponse.getSelectedButton() !== ui.Button.OK) {
    return;
  }
  
  var seasonName = seasonResponse.getResponseText().trim();
  
  if (!seasonName) {
    ui.alert("Season name is required!");
    return;
  }
  
  // Confirm archiving
  var confirmResponse = ui.alert(
    "Confirm Archive",
    "This will:\n\n" +
    "1. Create archived copies of all stat sheets with prefix '" + seasonName + " - '\n" +
    "2. Clear all player and team stats (keeping the player/team lists)\n" +
    "3. Clear the Standings\n\n" +
    "This action cannot be undone. Continue?",
    ui.ButtonSet.YES_NO
  );
  
  if (confirmResponse !== ui.Button.YES) {
    return;
  }
  
  logInfo("Archive Season", "Starting archive for: " + seasonName);
  
  try {
    // Archive each sheet
    for (var sheetIndex = 0; sheetIndex < CONFIG.ARCHIVE_SHEETS.length; sheetIndex++) {
      var sheetName = CONFIG.ARCHIVE_SHEETS[sheetIndex];
      var sheet = ss.getSheetByName(sheetName);

      if (!sheet) {
        logWarning("Archive Season", "Sheet not found, skipping", sheetName);
        continue;
      }

      // Create archived copy
      var archivedName = seasonName + " - " + sheetName;
      var archivedSheet = sheet.copyTo(ss);
      archivedSheet.setName(archivedName);

      // Move archived sheet to end
      ss.moveActiveSheet(ss.getNumSheets());

      logInfo("Archive Season", "Archived sheet: " + sheetName + " → " + archivedName);
    }
    
    // Clear current season data
    clearPlayerStats();
    clearTeamStats();
    clearLeagueHub();
    
    // Clear transaction log
    var transactionSheet = ss.getSheetByName(CONFIG.TRANSACTIONS_SHEET);
    if (transactionSheet) {
      var lastRow = transactionSheet.getLastRow();
      if (lastRow > 1) {
        transactionSheet.getRange(2, 1, lastRow - 1, transactionSheet.getLastColumn()).clearContent();
        logInfo("Archive Season", "Cleared transaction log");
      }
    }
    
    // Clear player team snapshot
    PropertiesService.getScriptProperties().deleteProperty(CONFIG.PLAYER_TEAM_SNAPSHOT_PROPERTY);
    logInfo("Archive Season", "Cleared player team snapshot");
    
    ui.alert(
      "Archive Complete!",
      "Season '" + seasonName + "' has been archived.\n\n" +
      "All stat sheets have been copied with the '" + seasonName + " - ' prefix.\n" +
      "Current season data has been cleared and is ready for the new season.",
      ui.ButtonSet.OK
    );
    
    logInfo("Archive Season", "Archive completed successfully");
    
  } catch (e) {
    logError("Archive Season", "Error during archive: " + e.toString(), seasonName);
    ui.alert("Error during archive: " + e.toString());
  }
}

function clearPlayerStats() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var playerSheet = ss.getSheetByName(CONFIG.PLAYER_STATS_SHEET);
  
  if (!playerSheet) return;
  
  var lastRow = playerSheet.getLastRow();
  if (lastRow < 2) return;
  
  // Clear stats columns (C onwards) but keep player names and teams (A:B)
  var statCols = playerSheet.getLastColumn() - 2; // All columns except A and B
  if (statCols > 0) {
    playerSheet.getRange(2, 3, lastRow - 1, statCols).clearContent();
    logInfo("Archive Season", "Cleared player stats");
  }
}

function clearTeamStats() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var teamSheet = ss.getSheetByName(CONFIG.TEAM_STATS_SHEET);
  
  if (!teamSheet) return;
  
  var lastRow = teamSheet.getLastRow();
  if (lastRow < 2) return;
  
  // Clear stats columns (C onwards) but keep team names (A:B)
  var statCols = teamSheet.getLastColumn() - 2;
  if (statCols > 0) {
    teamSheet.getRange(2, 3, lastRow - 1, statCols).clearContent();
    logInfo("Archive Season", "Cleared team stats");
  }
  
  // Delete individual team sheets
  var teamNames = teamSheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var teamIndex = 0; teamIndex < teamNames.length; teamIndex++) {
    var teamName = String(teamNames[teamIndex][0]).trim();
    if (teamName) {
      var teamSheetObj = ss.getSheetByName(teamName);
      if (teamSheetObj) {
        ss.deleteSheet(teamSheetObj);
        logInfo("Archive Season", "Deleted team sheet: " + teamName);
      }
    }
  }
}

function clearLeagueHub() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var leagueHub = ss.getSheetByName(CONFIG.STANDINGS_SHEET);
  
  if (leagueHub) {
    leagueHub.clear();
    leagueHub.getRange(1, 1).setValue("Run 'Update All' to populate standings and scores");
    logInfo("Archive Season", "Cleared Standings");
  }
}