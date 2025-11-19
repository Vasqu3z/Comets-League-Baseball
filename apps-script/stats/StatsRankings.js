// ===== RANKINGS MODULE =====
// Step 3: Update standings

// ===== Update from cached data (called by updateAll) =====
// Now accepts full gameData object for in-memory performance
function updateLeagueHubFromCache(gameData) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Extract variables from gameData object
  var teamStatsWithH2H = gameData.teamStatsWithH2H;

  logInfo("Step 3", "Building simplified Rankings (standings only)");
  
  var standingsSheet = ss.getSheetByName(CONFIG.STANDINGS_SHEET);
  if (!standingsSheet) {
    standingsSheet = ss.insertSheet(CONFIG.STANDINGS_SHEET);
  }

  // Targeted Clear - preserve user formatting outside managed columns
  // Clear only the data-managed zones instead of entire sheet
  var layout = CONFIG.SHEET_STRUCTURE.LEAGUE_HUB;
  var maxRows = standingsSheet.getMaxRows();

  // Clear Standings zone (Columns A-H from row 1 to end)
  // Note: League leaders are now handled by the website reading directly from Player Data
  if (maxRows > 0) {
    standingsSheet.getRange(1, layout.STANDINGS.START_COL + 1, maxRows, layout.STANDINGS.NUM_COLS)
      .clearContent().clearFormat().clearNote();
  }

  var currentRow = 1;
  
  // Sort teams by standings
  var teamOrder = [];
  for (var teamName in teamStatsWithH2H) {
    if (teamStatsWithH2H[teamName].gamesPlayed > 0) {
      teamOrder.push(teamName);
    }
  }
  
  teamOrder.sort(function(teamA, teamB) {
    return compareTeamsByStandings(teamA, teamB, teamStatsWithH2H);
  });

  // ===== HEADERS =====
  standingsSheet.getRange(currentRow, layout.STANDINGS.START_COL + 1, 1, 8).merge()
    .setValue("Standings")
    .setFontWeight("bold")
    .setFontSize(12)
    .setVerticalAlignment("middle");
  currentRow += 2;
  
  // ===== STANDINGS TABLE HEADER =====
  standingsSheet.getRange(currentRow, layout.STANDINGS.START_COL + 1, 1, layout.STANDINGS.NUM_COLS)
    .setValues([["Rank", "Team", "W", "L", "Win%", "RS", "RA", "Diff"]])
    .setFontWeight("bold")
    .setBackground("#e8e8e8")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle");
  standingsSheet.getRange(currentRow, layout.STANDINGS.START_COL + 1, 1, layout.STANDINGS.NUM_COLS)
    .setBorder(false, false, true, false, false, false, "#000000", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

  currentRow++;

  var standingsStartRow = currentRow;
  
  // ===== BATCH ALL STANDINGS DATA =====
  var standingsValues = [];
  var standingsBackgrounds = [];
  var standingsFontWeights = [];
  var standingsAlignments = [];
  var standingsTooltips = [];
  
  var currentRank = 1;
  
  for (var teamIndex = 0; teamIndex < teamOrder.length; teamIndex++) {
    var teamName = teamOrder[teamIndex];
    var stats = teamStatsWithH2H[teamName];
    if (stats.gamesPlayed === 0) continue;
    
    var winPct = stats.gamesPlayed > 0 ? stats.wins / stats.gamesPlayed : 0;
    var winPctFormatted = winPct.toFixed(3).substring(1);
    var diff = stats.runsScored - stats.runsAllowed;
    var rankDisplay = "";
    
    if (standingsValues.length === 0) {
      rankDisplay = "1";
      currentRank = 1;
    } else {
      var prevData = standingsValues[standingsValues.length - 1];
      var prevWinPct = parseFloat("0" + prevData[4]); // Convert back from formatted string
      var prevWins = prevData[2];
      var prevLosses = prevData[3];
      var prevRunDiff = prevData[7];
      
      var isMathematicallyTied = (winPct === prevWinPct && stats.wins === prevWins && stats.losses === prevLosses);
      
      if (!isMathematicallyTied) {
        currentRank = standingsValues.length + 1;
        rankDisplay = currentRank.toString();
      } else {
        var prevTeamName = prevData[1];
        var h2hA = stats.headToHead[prevTeamName];
        var h2hB = teamStatsWithH2H[prevTeamName] ? teamStatsWithH2H[prevTeamName].headToHead[teamName] : null;
        var hasMeaningfulH2H = false;
        
        if (h2hA && h2hB && (h2hA.wins + h2hA.losses) > 0) {
          var h2hWinPctA = h2hA.wins / (h2hA.wins + h2hA.losses);
          var h2hWinPctB = h2hB.wins / (h2hB.wins + h2hB.losses);
          if (h2hWinPctA !== h2hWinPctB) {
            hasMeaningfulH2H = true;
          }
        }
        
        var hasDifferentRunDiff = (diff !== prevRunDiff);
        
        if (hasMeaningfulH2H || hasDifferentRunDiff) {
          currentRank = standingsValues.length + 1;
          rankDisplay = currentRank.toString();
        } else {
          rankDisplay = "T-" + currentRank;
        }
      }
    }
    
    standingsValues.push([rankDisplay, teamName, stats.wins, stats.losses, winPctFormatted, stats.runsScored, stats.runsAllowed, diff]);
    
    // Build tooltip
    var tooltip = "Head-to-Head Records:\n\n";
    var h2hRecords = [];
    
    for (var opp in stats.headToHead) {
      var record = stats.headToHead[opp];
      if (record.wins + record.losses > 0) {
        h2hRecords.push("vs " + opp + ": " + record.wins + "-" + record.losses);
      }
    }
    
    if (h2hRecords.length > 0) {
      tooltip += h2hRecords.join("\n");
    } else {
      tooltip = "No head-to-head games played yet";
    }
    standingsTooltips.push(tooltip);
    
    // Build formatting arrays
    var rowBg = [];
    var rowFw = [];
    var rowAlign = [];
    
    for (var columnIndex = 0; columnIndex < 8; columnIndex++) {
      rowBg.push(teamIndex % 2 === 1 ? "#f3f3f3" : "#ffffff");
      rowFw.push(columnIndex === 1 ? "bold" : "normal");
      rowAlign.push(columnIndex < 2 ? "left" : "right");
    }
    
    standingsBackgrounds.push(rowBg);
    standingsFontWeights.push(rowFw);
    standingsAlignments.push(rowAlign);
  }
  
  // ===== WRITE ALL STANDINGS AT ONCE =====
  if (standingsValues.length > 0) {
    var standingsRange = standingsSheet.getRange(standingsStartRow, layout.STANDINGS.START_COL + 1, standingsValues.length, layout.STANDINGS.NUM_COLS);
    standingsRange.setValues(standingsValues);
    standingsRange.setBackgrounds(standingsBackgrounds);
    standingsRange.setFontWeights(standingsFontWeights);
    standingsRange.setHorizontalAlignments(standingsAlignments);
    standingsRange.setVerticalAlignment("middle");

    // Add tooltips
    for (var tooltipIndex = 0; tooltipIndex < standingsTooltips.length; tooltipIndex++) {
      standingsSheet.getRange(standingsStartRow + tooltipIndex, layout.STANDINGS.START_COL + 2).setNote(standingsTooltips[tooltipIndex]);
    }
  }

  // Rankings sheet is now simplified - only shows standings
  // Schedule information is available on the website's schedule page
  // ===== SET COLUMN WIDTHS =====
  standingsSheet.setColumnWidth(layout.STANDINGS.START_COL + 1, layout.STANDINGS.RANK_WIDTH);
  standingsSheet.setColumnWidth(layout.STANDINGS.START_COL + 2, layout.STANDINGS.TEAM_WIDTH);
  standingsSheet.setColumnWidth(layout.STANDINGS.START_COL + 3, 40);
  standingsSheet.setColumnWidth(layout.STANDINGS.START_COL + 4, 40);
  standingsSheet.setColumnWidth(layout.STANDINGS.START_COL + 5, 60);
  standingsSheet.setColumnWidth(layout.STANDINGS.START_COL + 6, 50);
  standingsSheet.setColumnWidth(layout.STANDINGS.START_COL + 7, 50);
  standingsSheet.setColumnWidth(layout.STANDINGS.START_COL + 8, 50);
  
  logInfo("Step 3", "Updated " + CONFIG.STANDINGS_SHEET);
  SpreadsheetApp.getActiveSpreadsheet().toast(CONFIG.STANDINGS_SHEET + " updated!", "Step 3 Complete", 3);
}

/**
 * Manual execution entry point for League Hub updates
 */
function updateLeagueHub() {
  var gameData = processAllGameSheetsOnce();
  if (gameData) {
    updateLeagueHubFromCache(gameData);
  }
}

/**
 * Legacy function name for backwards compatibility
 */
function updateStandingsAndScoreboard() {
  updateLeagueHub();
}