// ===== RETENTION GRADES - SHEET BUILDING & FORMATTING =====
// Sheet creation, formatting, Team Direction table, and bottom sections
//
// Dependencies: RetentionConfig.js, RetentionCore.js
//
/**
 * BUILD FROM SCRATCH: Full sheet creation with all formatting
 * PRESERVES: Postseason data and Team Direction data if it exists
 */
function buildRetentionSheetFromScratch(retentionGrades) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.RETENTION_SHEET);

  // PRESERVE POSTSEASON DATA before clearing
  var existingPostseasonData = [];
  if (sheet) {
    var postseasonRow = findPostseasonSection(sheet);
    if (postseasonRow > 0) {
      try {
        // Postseason data starts 3 rows after header (header, description, column headers, then data)
        var dataStartRow = postseasonRow + 3;
        var lastRow = sheet.getLastRow();
        var numRows = Math.min(20, lastRow - dataStartRow + 1);  // Read up to 20 teams
        if (numRows > 0) {
          existingPostseasonData = sheet.getRange(dataStartRow, 1, numRows, 3).getValues();  // 3 columns: Team, Finish, Points
          Logger.log("Preserved postseason data: " + numRows + " rows from row " + dataStartRow);
        }
      } catch (e) {
        Logger.log("Could not preserve postseason data: " + e.toString());
      }
    }
  }

  // PRESERVE TEAM DIRECTION DATA before clearing
  var existingDirectionData = [];
  if (sheet) {
    var directionRow = findTeamDirectionSection(sheet);
    if (directionRow > 0) {
      try {
        // Direction data starts 3 rows after header (header, description, column headers, then data)
        var dataStartRow = directionRow + 3;
        var lastRow = sheet.getLastRow();
        var numRows = Math.min(20, lastRow - dataStartRow + 1);  // Read up to 20 teams
        if (numRows > 0) {
          existingDirectionData = sheet.getRange(dataStartRow, 1, numRows, 2).getValues();
          Logger.log("Preserved Team Direction data: " + numRows + " rows from row " + dataStartRow);
        }
      } catch (e) {
        Logger.log("Could not preserve Team Direction data: " + e.toString());
      }
    }
  }

  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.RETENTION_SHEET);
  } else {
    sheet.clear();
  }

  Logger.log("Building Retention Grades v2 sheet from scratch");

  // ===== HEADER SECTION =====
  sheet.getRange(1, 1)
    .setValue("CLB Retention Grade Calculator v2.0")
    .setFontWeight("bold")
    .setFontSize(14)
    .setHorizontalAlignment("left")
    .setBackground(RETENTION_CONFIG.OUTPUT.COLORS.HEADER);

  sheet.getRange(1, 1, 1, RETENTION_CONFIG.OUTPUT.TOTAL_COLUMNS)
    .setBackground(RETENTION_CONFIG.OUTPUT.COLORS.HEADER);

  sheet.getRange(2, 1)
    .setValue("Designed for TOP 3 players per team. Weighted grading on 5-95 scale. " +
              "Auto-flagging detects flight risk for elite players on struggling teams. Draft expectations reward/penalize based on performance vs draft round.")
    .setFontSize(9)
    .setFontStyle("italic")
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);

  sheet.getRange(2, 1, 1, RETENTION_CONFIG.OUTPUT.TOTAL_COLUMNS).merge();

  // ===== DATA TABLE HEADER =====
  var headerRow = RETENTION_CONFIG.OUTPUT.HEADER_ROW;
  var headers = [
    "Player",
    "Team",
    "Draft/Trade\nValue (1-8)",
    "Record\n(0-10)",  
    "Postseason\n(0-10)",      
    "Success\nModifier",            // No validation
    "Success\nGrade",
    "Play Time\nBase (0-20)",
    "Play Time\nModifier",          // No validation
    "Play Time\nGrade",
    "Performance\nBase (0-20)",     // Formerly "Awards"
    "Performance\nModifier",        // No validation
    "Performance\nGrade",
    "Automatic\nGrades (0-60)",
    "Chemistry\nGrade (0-20)",
    "Direction\nGrade (0-20)",      // VLOOKUP from table
    "Manual\nGrades",               // Weighted formula
    "FINAL\nGRADE",                 // Weighted × 5
    "Automatic Grade Details"
  ];

  sheet.getRange(headerRow, 1, 1, headers.length)
    .setValues([headers])
    .setFontWeight("bold")
    .setBackground(RETENTION_CONFIG.OUTPUT.COLORS.HEADER)
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);

  // Set column widths (19 columns)
  var cols = RETENTION_CONFIG.OUTPUT;
  sheet.setColumnWidth(cols.COL_PLAYER, RETENTION_CONFIG.OUTPUT.PLAYER_COL_WIDTH);
  sheet.setColumnWidth(cols.COL_TEAM, RETENTION_CONFIG.OUTPUT.TEAM_COL_WIDTH);
  sheet.setColumnWidth(cols.COL_DRAFT_VALUE, RETENTION_CONFIG.OUTPUT.DRAFT_VALUE_COL_WIDTH);

  // Stats columns (D-N)
  for (var i = cols.COL_REG_SEASON; i <= cols.COL_AUTO_TOTAL; i++) {
    sheet.setColumnWidth(i, RETENTION_CONFIG.OUTPUT.STAT_COL_WIDTH);
  }

  // Manual input columns (O-P)
  sheet.setColumnWidth(cols.COL_CHEMISTRY, RETENTION_CONFIG.OUTPUT.CHEMISTRY_COL_WIDTH);
  sheet.setColumnWidth(cols.COL_DIRECTION, RETENTION_CONFIG.OUTPUT.DIRECTION_COL_WIDTH);

  // Grade columns (Q-R)
  sheet.setColumnWidth(cols.COL_MANUAL_TOTAL, RETENTION_CONFIG.OUTPUT.GRADE_COL_WIDTH);
  sheet.setColumnWidth(cols.COL_FINAL_GRADE, RETENTION_CONFIG.OUTPUT.GRADE_COL_WIDTH);

  // Details column (S)
  sheet.setColumnWidth(cols.COL_DETAILS, RETENTION_CONFIG.OUTPUT.DETAILS_COL_WIDTH);

  // Freeze header rows
  sheet.setFrozenRows(headerRow);

  // Write data
  writePlayerData(sheet, retentionGrades);

  // Add bottom sections (postseason, direction table, instructions)
  addBottomSections(sheet, retentionGrades.length, existingPostseasonData, existingDirectionData);

  Logger.log("Sheet build complete");
}

/**
 * Apply formatting to data rows
 * Uses batch operations for performance
 * Updated for new column layout
 */
function applyDataFormatting(sheet, startRow, numRows) {
  var cols = RETENTION_CONFIG.OUTPUT;

  // Build background color array
  var bgColors = [];
  for (var i = 0; i < numRows; i++) {
    var bgColor = i % 2 === 0 ? "#ffffff" : "#f9f9f9";
    bgColors.push([bgColor]);
  }

  // Apply alternating row colors to auto-calculated columns (batch operation)
  // Updated for split TS columns
  // NOTE: COL_FINAL_GRADE excluded - gets grade-based colors from applyFinalGradeFormatting
  var autoCalcColumns = [
    cols.COL_PLAYER, cols.COL_TEAM,
    cols.COL_REG_SEASON, cols.COL_POSTSEASON, cols.COL_TS_TOTAL,
    cols.COL_PT_BASE, cols.COL_PT_TOTAL,
    cols.COL_PERF_BASE, cols.COL_PERF_TOTAL,
    cols.COL_AUTO_TOTAL, cols.COL_MANUAL_TOTAL,
    cols.COL_DETAILS
  ];

  for (var c = 0; c < autoCalcColumns.length; c++) {
    sheet.getRange(startRow, autoCalcColumns[c] + 1, numRows, 1).setBackgrounds(bgColors);
  }

  // Center-align numeric columns (batch operations)
  // Updated for split TS columns
  var numericColumns = [
    cols.COL_REG_SEASON, cols.COL_POSTSEASON, cols.COL_TS_TOTAL,
    cols.COL_PT_BASE, cols.COL_PT_TOTAL,
    cols.COL_PERF_BASE, cols.COL_PERF_TOTAL,
    cols.COL_AUTO_TOTAL, cols.COL_MANUAL_TOTAL, cols.COL_FINAL_GRADE
  ];

  for (var c = 0; c < numericColumns.length; c++) {
    sheet.getRange(startRow, numericColumns[c] + 1, numRows, 1).setHorizontalAlignment("center");
  }

  // Read all manual input columns at once (batch read)
  var draftValues = sheet.getRange(startRow, cols.COL_DRAFT_VALUE + 1, numRows, 1).getValues();
  var tsModValues = sheet.getRange(startRow, cols.COL_TS_MOD + 1, numRows, 1).getValues();
  var ptModValues = sheet.getRange(startRow, cols.COL_PT_MOD + 1, numRows, 1).getValues();
  var perfModValues = sheet.getRange(startRow, cols.COL_PERF_MOD + 1, numRows, 1).getValues();
  var chemValues = sheet.getRange(startRow, cols.COL_CHEMISTRY + 1, numRows, 1).getValues();
  var dirValues = sheet.getRange(startRow, cols.COL_DIRECTION + 1, numRows, 1).getValues();

  // Prepare arrays for batch writing
  var draftToWrite = [];
  var tsModToWrite = [];
  var ptModToWrite = [];
  var perfModToWrite = [];
  var chemToWrite = [];
  var dirToWrite = [];

  for (var i = 0; i < numRows; i++) {
    // Only set to 0 if empty/null (preserve existing values)
    draftToWrite.push([draftValues[i][0] === "" || draftValues[i][0] === null ? "" : draftValues[i][0]]);
    tsModToWrite.push([tsModValues[i][0] === "" || tsModValues[i][0] === null ? 0 : tsModValues[i][0]]);
    ptModToWrite.push([ptModValues[i][0] === "" || ptModValues[i][0] === null ? 0 : ptModValues[i][0]]);
    perfModToWrite.push([perfModValues[i][0] === "" || perfModValues[i][0] === null ? 0 : perfModValues[i][0]]);
    chemToWrite.push([chemValues[i][0] === "" || chemValues[i][0] === null ? 0 : chemValues[i][0]]);

    // Direction uses VLOOKUP formula (will be set separately)
    dirToWrite.push([dirValues[i][0] === "" || dirValues[i][0] === null ? 0 : dirValues[i][0]]);
  }

  sheet.getRange(startRow, cols.COL_DRAFT_VALUE + 1, numRows, 1).setValues(draftToWrite);
  sheet.getRange(startRow, cols.COL_TS_MOD + 1, numRows, 1).setValues(tsModToWrite);
  sheet.getRange(startRow, cols.COL_PT_MOD + 1, numRows, 1).setValues(ptModToWrite);
  sheet.getRange(startRow, cols.COL_PERF_MOD + 1, numRows, 1).setValues(perfModToWrite);
  sheet.getRange(startRow, cols.COL_CHEMISTRY + 1, numRows, 1).setValues(chemToWrite);

  // Direction column formulas: VLOOKUP to Team Direction table
  var directionFormulas = [];
  for (var i = 0; i < numRows; i++) {
    var row = startRow + i;
    directionFormulas.push(["=IF(B" + row + "=\"\",0,IFERROR(VLOOKUP(B" + row + ",TeamDirection,2,FALSE),0))"]);
  }
  sheet.getRange(startRow, cols.COL_DIRECTION + 1, numRows, 1).setFormulas(directionFormulas);

  // Apply colors to manual input columns (batch operations)
  sheet.getRange(startRow, cols.COL_DRAFT_VALUE + 1, numRows, 1).setBackground(RETENTION_CONFIG.OUTPUT.COLORS.EDITABLE);
  sheet.getRange(startRow, cols.COL_TS_MOD + 1, numRows, 1).setBackground(RETENTION_CONFIG.OUTPUT.COLORS.MODIFIER);
  sheet.getRange(startRow, cols.COL_PT_MOD + 1, numRows, 1).setBackground(RETENTION_CONFIG.OUTPUT.COLORS.MODIFIER);
  sheet.getRange(startRow, cols.COL_PERF_MOD + 1, numRows, 1).setBackground(RETENTION_CONFIG.OUTPUT.COLORS.MODIFIER);
  sheet.getRange(startRow, cols.COL_CHEMISTRY + 1, numRows, 1).setBackground(RETENTION_CONFIG.OUTPUT.COLORS.EDITABLE);
  sheet.getRange(startRow, cols.COL_DIRECTION + 1, numRows, 1).setBackground("#e8f4f8"); // Light blue for VLOOKUP

  // Center-align manual input columns
  sheet.getRange(startRow, cols.COL_DRAFT_VALUE + 1, numRows, 1).setHorizontalAlignment("center");
  sheet.getRange(startRow, cols.COL_TS_MOD + 1, numRows, 1).setHorizontalAlignment("center");
  sheet.getRange(startRow, cols.COL_PT_MOD + 1, numRows, 1).setHorizontalAlignment("center");
  sheet.getRange(startRow, cols.COL_PERF_MOD + 1, numRows, 1).setHorizontalAlignment("center");
  sheet.getRange(startRow, cols.COL_CHEMISTRY + 1, numRows, 1).setHorizontalAlignment("center");
  sheet.getRange(startRow, cols.COL_DIRECTION + 1, numRows, 1).setHorizontalAlignment("center");

  // Add data validation
  // Draft Value validation (1-8 or blank)
  var draftRule = SpreadsheetApp.newDataValidation()
    .requireNumberBetween(1, 8)
    .setAllowInvalid(true)  // Allow blank
    .setHelpText("Enter draft round (1-8) or leave blank")
    .build();

  // Modifier validation (-5 to +5)
  var modifierRule = SpreadsheetApp.newDataValidation()
    .requireNumberBetween(-5, 5)
    .setAllowInvalid(false)
    .setHelpText("Enter a modifier between -5 and +5")
    .build();

  var chemistryRule = SpreadsheetApp.newDataValidation()
    .requireNumberBetween(0, 20)
    .setAllowInvalid(false)
    .setHelpText("Enter a value between 0 and 20")
    .build();

  sheet.getRange(startRow, cols.COL_DRAFT_VALUE + 1, numRows, 1).setDataValidation(draftRule);
  sheet.getRange(startRow, cols.COL_TS_MOD + 1, numRows, 1).setDataValidation(modifierRule);
  sheet.getRange(startRow, cols.COL_PT_MOD + 1, numRows, 1).setDataValidation(modifierRule);
  sheet.getRange(startRow, cols.COL_PERF_MOD + 1, numRows, 1).setDataValidation(modifierRule);
  sheet.getRange(startRow, cols.COL_CHEMISTRY + 1, numRows, 1).setDataValidation(chemistryRule);

  // Direction is VLOOKUP - no validation needed
}

/**
 * Add postseason section, Team Direction table, and instructions at bottom of sheet
 * Auto-populates team lists from player data on sheet
 * Previously entered postseason and direction data (preserves scores)
 */
function addBottomSections(sheet, playerCount, existingPostseasonData, existingDirectionData) {
  var dataStartRow = RETENTION_CONFIG.OUTPUT.DATA_START_ROW;
  var sectionStartRow = dataStartRow + playerCount + RETENTION_CONFIG.OUTPUT.INSTRUCTIONS_ROW_OFFSET;

  // Get unique teams from player list on sheet (Column B)
  var teamList = getUniqueTeamsFromSheet(sheet, dataStartRow, playerCount);

  // ===== TEAM DIRECTION TABLE =====
  var directionStartRow = sectionStartRow;

  sheet.getRange(directionStartRow, 1)
    .setValue(RETENTION_CONFIG.TEAM_DIRECTION_TABLE.HEADER_TEXT)
    .setFontWeight("bold")
    .setFontSize(12)
    .setBackground(RETENTION_CONFIG.OUTPUT.COLORS.HEADER);

  sheet.getRange(directionStartRow, 1, 1, 2).setBackground(RETENTION_CONFIG.OUTPUT.COLORS.HEADER);

  // Description row
  sheet.getRange(directionStartRow + 1, 1)
    .setValue(RETENTION_CONFIG.TEAM_DIRECTION_TABLE.DESCRIPTION)
    .setFontSize(9)
    .setFontStyle("italic")
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);

  sheet.getRange(directionStartRow + 1, 1, 1, 4).merge();

  // Column headers
  sheet.getRange(directionStartRow + 2, 1, 1, 2)
    .setValues([["Team", "Direction Score (0-20)"]])
    .setFontWeight("bold")
    .setBackground(RETENTION_CONFIG.OUTPUT.COLORS.HEADER)
    .setHorizontalAlignment("center");

  // Auto-populate with team list and restore existing direction scores
  var directionDataStart = directionStartRow + 3;
  var numTeams = teamList.length;

  // Build existing direction scores map
  var existingScores = {};
  if (existingDirectionData && existingDirectionData.length > 0) {
    for (var i = 0; i < existingDirectionData.length; i++) {
      var teamName = String(existingDirectionData[i][0]).trim();
      var score = existingDirectionData[i][1];
      if (teamName) {
        existingScores[teamName] = score;
      }
    }
    Logger.log("Preserved Team Direction scores for " + Object.keys(existingScores).length + " teams");
  }

  // Write teams and scores
  for (var i = 0; i < numTeams; i++) {
    var teamName = teamList[i];
    var score = existingScores[teamName] !== undefined ? existingScores[teamName] : 10;  // Default to 10
    sheet.getRange(directionDataStart + i, 1).setValue(teamName);
    sheet.getRange(directionDataStart + i, 2).setValue(score);
  }

  // Apply formatting
  sheet.getRange(directionDataStart, 1, numTeams, 2).setBackground(RETENTION_CONFIG.OUTPUT.COLORS.EDITABLE);
  sheet.getRange(directionDataStart, 2, numTeams, 1).setHorizontalAlignment("center");

  // Add data validation for direction scores
  var directionRule = SpreadsheetApp.newDataValidation()
    .requireNumberBetween(0, 20)
    .setAllowInvalid(false)
    .setHelpText("Enter a direction score between 0 and 20")
    .build();

  sheet.getRange(directionDataStart, 2, numTeams, 1).setDataValidation(directionRule);

  // Create named range for VLOOKUP
  var directionRange = sheet.getRange(directionDataStart, 1, numTeams, 2);
  sheet.getParent().setNamedRange(RETENTION_CONFIG.TEAM_DIRECTION_TABLE.TABLE_NAME, directionRange);

  Logger.log("Created Team Direction table with " + numTeams + " teams at rows " + directionDataStart + "-" + (directionDataStart + numTeams - 1));

  // ===== POSTSEASON INPUT SECTION =====
  var postseasonStartRow = directionDataStart + 10;

  sheet.getRange(postseasonStartRow, 1)
    .setValue(RETENTION_CONFIG.POSTSEASON_SEARCH_TEXT + " (Manual Input)")
    .setFontWeight("bold")
    .setFontSize(12)
    .setBackground(RETENTION_CONFIG.OUTPUT.COLORS.HEADER);

  sheet.getRange(postseasonStartRow, 1, 1, 3).setBackground(RETENTION_CONFIG.OUTPUT.COLORS.HEADER);

  // Description row
  sheet.getRange(postseasonStartRow + 1, 1)
    .setValue("Enter postseason results for each team. All players on that team inherit the score in the points column via VLOOKUP.")
    .setFontSize(9)
    .setFontStyle("italic")
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);

  sheet.getRange(postseasonStartRow + 1, 1, 1, 4).merge();

  // Column headers (3 columns now: Team | Finish | Points)
  sheet.getRange(postseasonStartRow + 2, 1, 1, 3)
    .setValues([["Team", "Finish", "Points (0-10)"]])
    .setFontWeight("bold")
    .setBackground(RETENTION_CONFIG.OUTPUT.COLORS.HEADER)
    .setHorizontalAlignment("center");

  // Auto-populate with team list and restore existing finishes
  var postseasonDataStart = postseasonStartRow + 3;

  // Build existing postseason finishes map
  var existingFinishes = {};
  if (existingPostseasonData && existingPostseasonData.length > 0) {
    for (var i = 0; i < existingPostseasonData.length; i++) {
      var teamName = String(existingPostseasonData[i][0]).trim();
      var finish = existingPostseasonData[i][1];
      if (teamName) {
        existingFinishes[teamName] = finish;
      }
    }
    Logger.log("Preserved postseason finishes for " + Object.keys(existingFinishes).length + " teams");
  }

  // Write teams, finishes, and points formula
  for (var i = 0; i < numTeams; i++) {
    var teamName = teamList[i];
    var finish = existingFinishes[teamName] !== undefined ? existingFinishes[teamName] : "";
    var row = postseasonDataStart + i;

    sheet.getRange(row, 1).setValue(teamName);
    sheet.getRange(row, 2).setValue(finish);

    // Column 3: Formula to convert finish to points
    // Champion/1st=10, Runner-up/2nd=7.5, Semifinal/3rd-4th=5, Quarterfinal/5th-8th=2.5, else 0
    var pointsFormula = '=IF(B' + row + '="","",IF(OR(B' + row + '=1,REGEXMATCH(LOWER(B' + row + '),"champion|1st|first")),10,' +
                        'IF(OR(B' + row + '=2,REGEXMATCH(LOWER(B' + row + '),"runner|2nd|second")),7.5,' +
                        'IF(OR(B' + row + '=3,B' + row + '=4,REGEXMATCH(LOWER(B' + row + '),"semi|3rd|4th")),5,' +
                        'IF(OR(AND(ISNUMBER(B' + row + '),B' + row + '>=5,B' + row + '<=8),REGEXMATCH(LOWER(B' + row + '),"quarter|5th|6th|7th|8th")),2.5,0)))))';
    sheet.getRange(row, 3).setFormula(pointsFormula);
  }

  // Apply formatting
  sheet.getRange(postseasonDataStart, 1, numTeams, 1).setBackground("#f0f0f0");  // Teams are auto-populated (read-only)
  sheet.getRange(postseasonDataStart, 2, numTeams, 1).setBackground(RETENTION_CONFIG.OUTPUT.COLORS.EDITABLE);  // Finish is editable
  sheet.getRange(postseasonDataStart, 3, numTeams, 1).setBackground("#e8f4f8");  // Points is formula (light blue)
  sheet.getRange(postseasonDataStart, 3, numTeams, 1).setHorizontalAlignment("center");

  // Create named range for VLOOKUP (includes all 3 columns)
  var postseasonRange = sheet.getRange(postseasonDataStart, 1, numTeams, 3);
  sheet.getParent().setNamedRange(RETENTION_CONFIG.POSTSEASON_TABLE_NAME, postseasonRange);

  Logger.log("Created Postseason table with " + numTeams + " teams at rows " + postseasonDataStart + "-" + (postseasonDataStart + numTeams - 1));
}

/**
 * Apply color coding to final grade column based on values
 */
function applyFinalGradeFormatting(sheet, startRow, numRows) {
  var finalGradeCol = RETENTION_CONFIG.OUTPUT.COL_FINAL_GRADE;
  var finalGrades = sheet.getRange(startRow, finalGradeCol + 1, numRows, 1).getValues();

  var backgroundColors = [];
  for (var i = 0; i < finalGrades.length; i++) {
    var finalGrade = finalGrades[i][0];

    if (typeof finalGrade === 'number' && !isNaN(finalGrade)) {
      var color = RETENTION_CONFIG.getGradeColor(finalGrade);
      backgroundColors.push([color]);
    } else {
      backgroundColors.push(["#ffffff"]);
    }
  }

  sheet.getRange(startRow, finalGradeCol + 1, numRows, 1).setBackgrounds(backgroundColors);
}

/**
 * REBUILD SHEET: Force full rebuild of formatting
 * Preserves Team Direction data
 */
function rebuildRetentionSheet() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert(
    'Rebuild Sheet Formatting',
    'This will rebuild the Retention Grades sheet from scratch, removing any custom formatting.\n\n' +
    'Player data and manual entries (Draft Value, Chemistry, Modifiers, Team Direction) will be preserved.\n\n' +
    'Continue?',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    return;
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.RETENTION_SHEET);

  calculateRetentionGrades();

  ui.alert('Sheet rebuilt successfully with v2 layout!');
}

/**
 * Refresh formulas in the retention sheet using batch operations
 * Uses weighted formulas with single-pass setFormulas() calls
 */
function refreshRetentionFormulas() {
  var activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = activeSpreadsheet.getSheetByName(CONFIG.RETENTION_SHEET);

  if (!sheet) {
    SpreadsheetApp.getUi().alert("Retention Grades sheet not found. Please run 'Calculate Retention Grades' first.");
    return;
  }

  var lastRow = sheet.getLastRow();
  var dataStartRow = RETENTION_CONFIG.OUTPUT.DATA_START_ROW;
  var cols = RETENTION_CONFIG.OUTPUT;

  if (lastRow < dataStartRow) {
    SpreadsheetApp.getUi().alert("No data found. Please run 'Calculate Retention Grades' first.");
    return;
  }

  var playerNames = sheet.getRange(dataStartRow, 1, lastRow - dataStartRow + 1, 1).getValues();

  var postseasonFormulas = [];
  var tsTotalFormulas = [];
  var ptTotalFormulas = [];
  var perfTotalFormulas = [];
  var manualTotalFormulas = [];
  var directionFormulas = [];
  var finalGradeFormulas = [];

  var rowsUpdated = 0;

  for (var i = 0; i < playerNames.length; i++) {
    var playerName = playerNames[i][0];
    if (!playerName || playerName === "") {
      postseasonFormulas.push([""]);
      tsTotalFormulas.push([""]);
      ptTotalFormulas.push([""]);
      perfTotalFormulas.push([""]);
      manualTotalFormulas.push([""]);
      directionFormulas.push([""]);
      finalGradeFormulas.push([""]);
      continue;
    }

    var row = dataStartRow + i;

    postseasonFormulas.push(["=IF(B" + row + "=\"\",0,IFERROR(VLOOKUP(B" + row + ",PostseasonResults,3,FALSE),0))"]);
    tsTotalFormulas.push(["=MIN(20,MAX(0,D" + row + "+E" + row + "+F" + row + "))"]);
    ptTotalFormulas.push(["=MIN(20,MAX(0,H" + row + "+I" + row + "))"]);
    perfTotalFormulas.push(["=MIN(20,MAX(0,K" + row + "+L" + row + "))"]);
    manualTotalFormulas.push(["=ROUND((O" + row + "*0.12+P" + row + "*0.21)*4.5,1)"]);
    directionFormulas.push(["=IF(B" + row + "=\"\",0,IFERROR(VLOOKUP(B" + row + ",TeamDirection,2,FALSE),0))"]);
    finalGradeFormulas.push(["=ROUND((G" + row + "*0.18+J" + row + "*0.32+M" + row + "*0.17+O" + row + "*0.12+P" + row + "*0.21)*4.5+5,0)"]);

    rowsUpdated++;
  }

  var numRows = playerNames.length;
  if (numRows > 0) {
    sheet.getRange(dataStartRow, cols.COL_POSTSEASON + 1, numRows, 1).setFormulas(postseasonFormulas);
    sheet.getRange(dataStartRow, cols.COL_TS_TOTAL + 1, numRows, 1).setFormulas(tsTotalFormulas);
    sheet.getRange(dataStartRow, cols.COL_PT_TOTAL + 1, numRows, 1).setFormulas(ptTotalFormulas);
    sheet.getRange(dataStartRow, cols.COL_PERF_TOTAL + 1, numRows, 1).setFormulas(perfTotalFormulas);
    sheet.getRange(dataStartRow, cols.COL_MANUAL_TOTAL + 1, numRows, 1).setFormulas(manualTotalFormulas);
    sheet.getRange(dataStartRow, cols.COL_DIRECTION + 1, numRows, 1).setFormulas(directionFormulas);
    sheet.getRange(dataStartRow, cols.COL_FINAL_GRADE + 1, numRows, 1).setFormulas(finalGradeFormulas);
  }

  if (rowsUpdated > 0) {
    applyFinalGradeFormatting(sheet, dataStartRow, rowsUpdated);
  }

  activeSpreadsheet.toast(
    "Formulas refreshed for " + rowsUpdated + " players using v2 weighted system",
    "✅ Refresh Complete",
    5
  );
}

/**
 * Find Team Direction section in sheet
 * Returns row number of header, or -1 if not found
 */
function findTeamDirectionSection(sheet) {
  try {
    var lastRow = sheet.getLastRow();
    var searchRange = sheet.getRange(1, 1, lastRow, 1).getValues();

    for (var i = 0; i < searchRange.length; i++) {
      var cellValue = String(searchRange[i][0]);
      if (cellValue.indexOf(RETENTION_CONFIG.TEAM_DIRECTION_TABLE.SEARCH_TEXT) >= 0) {
        return i + 1;
      }
    }
  } catch (e) {
    Logger.log("Error finding Team Direction section: " + e.toString());
  }

  return -1;
}

/**
 * Get unique teams from player list on sheet
 * Reads from Column B of the retention sheet
 * Returns array of unique team names in alphabetical order
 */
function getUniqueTeamsFromSheet(sheet, startRow, playerCount) {
  try {
    if (playerCount === 0) {
      Logger.log("WARNING: No players on sheet");
      return [];
    }

    // Read team names from Column B
    var cols = RETENTION_CONFIG.OUTPUT;
    var teamData = sheet.getRange(startRow, cols.COL_TEAM + 1, playerCount, 1).getValues();

    // Get unique teams
    var teamSet = {};
    for (var i = 0; i < teamData.length; i++) {
      var teamName = String(teamData[i][0]).trim();
      if (teamName) {
        teamSet[teamName] = true;
      }
    }

    // Convert to sorted array
    var teams = Object.keys(teamSet).sort();

    Logger.log("Found " + teams.length + " unique teams from player list: " + teams.join(", "));
    return teams;

  } catch (e) {
    Logger.log("Error getting teams from sheet: " + e.toString());
    return [];
  }
}
