// ===== TRANSACTION TRACKING SYSTEM =====
// All transaction-related functions

function initializeTransactionLog() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var transactionSheet = ss.getSheetByName(CONFIG.TRANSACTIONS_SHEET);
  
  if (!transactionSheet) {
    transactionSheet = ss.insertSheet(CONFIG.TRANSACTIONS_SHEET);
    transactionSheet.getRange(1, 1, 1, 4).setValues([["Date", "Week", "Type", "Description"]]);
    transactionSheet.getRange(1, 1, 1, 4).setFontWeight("bold").setBackground("#e8e8e8");
    transactionSheet.setFrozenRows(1);
    transactionSheet.setColumnWidth(1, 120);
    transactionSheet.setColumnWidth(2, 60);
    transactionSheet.setColumnWidth(3, 80);
    transactionSheet.setColumnWidth(4, 500);
  }
  
  return transactionSheet;
}

function savePlayerTeamSnapshot() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var playerSheet = ss.getSheetByName(CONFIG.PLAYER_STATS_SHEET);
  
  if (!playerSheet) return;
  
  var lastRow = playerSheet.getLastRow();
  if (lastRow < 2) return;
  
  var playerData = playerSheet.getRange(2, 1, lastRow - 1, 2).getValues();
  var snapshot = {};

  for (var playerIndex = 0; playerIndex < playerData.length; playerIndex++) {
    var playerName = String(playerData[playerIndex][0]).trim();
    var team = String(playerData[playerIndex][1]).trim();
    if (playerName) {
      snapshot[playerName] = team;
    }
  }
  
  PropertiesService.getScriptProperties().setProperty(
    CONFIG.PLAYER_TEAM_SNAPSHOT_PROPERTY,
    JSON.stringify(snapshot)
  );
  
  logInfo("Transaction Tracking", "Saved player team snapshot");
}

function getPlayerTeamSnapshot() {
  var props = PropertiesService.getScriptProperties();
  var stored = props.getProperty(CONFIG.PLAYER_TEAM_SNAPSHOT_PROPERTY);
  
  if (!stored) {
    return {};
  }
  
  try {
    return JSON.parse(stored);
  } catch (e) {
    logError("Transaction Tracking", "Failed to parse snapshot: " + e.toString(), "N/A");
    return {};
  }
}

function detectMissingTransactions() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var playerSheet = ss.getSheetByName(CONFIG.PLAYER_STATS_SHEET);
  
  if (!playerSheet) {
    return;
  }
  
  var lastRow = playerSheet.getLastRow();
  if (lastRow < 2) {
    return;
  }
  
  var currentData = playerSheet.getRange(2, 1, lastRow - 1, 2).getValues();
  var snapshot = getPlayerTeamSnapshot();
  var changes = [];

  for (var playerIndex = 0; playerIndex < currentData.length; playerIndex++) {
    var playerName = String(currentData[playerIndex][0]).trim();
    var currentTeam = String(currentData[playerIndex][1]).trim();

    if (playerName && snapshot[playerName]) {
      var previousTeam = snapshot[playerName];
      if (currentTeam !== previousTeam) {
        changes.push({
          player: playerName,
          from: previousTeam,
          to: currentTeam
        });
      }
    }
  }
  
  if (changes.length === 0) {
    savePlayerTeamSnapshot();
    return;
  }
  
  var message = "Detected " + changes.length + " unlogged transaction(s):\n\n";
  for (var changeIndex = 0; changeIndex < changes.length; changeIndex++) {
    message += "• " + changes[changeIndex].player + ": " + changes[changeIndex].from + " → " + changes[changeIndex].to + "\n";
  }
  message += "\nWould you like to record these?";
  
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert("Unlogged Transactions Found", message, ui.ButtonSet.YES_NO);
  
  if (response === ui.Button.YES) {
    var weekResponse = ui.prompt(
      "Transaction Week",
      "Enter week number for these transactions:",
      ui.ButtonSet.OK_CANCEL
    );
    
    if (weekResponse.getSelectedButton() === ui.Button.OK) {
      var week = weekResponse.getResponseText().trim();
      
      if (!week) {
        ui.alert("Week number required!");
        return;
      }
      
      var transactionSheet = initializeTransactionLog();
      var timestamp = new Date();

      for (var changeIndex = 0; changeIndex < changes.length; changeIndex++) {
        var description = changes[changeIndex].player + ": " + changes[changeIndex].from + " → " + changes[changeIndex].to;
        transactionSheet.appendRow([timestamp, week, "Auto-Detected", description]);
      }
      
      savePlayerTeamSnapshot();
      ui.alert("Logged " + changes.length + " transaction(s)!");
      logInfo("Transaction Tracking", "Auto-logged " + changes.length + " transactions");
    }
  } else {
    savePlayerTeamSnapshot();
  }
}

function recordTransaction() {
  var ui = SpreadsheetApp.getUi();
  
  var htmlType = HtmlService.createHtmlOutput(
    '<style>' +
    'body{font-family:Arial;padding:30px;text-align:center;background:#f5f5f5}' +
    'h2{color:#1a73e8;margin-bottom:30px}' +
    'button{padding:15px 30px;margin:10px;font-size:16px;border:none;border-radius:4px;cursor:pointer;min-width:150px}' +
    '.trade{background:#1a73e8;color:white}' +
    '.cut{background:#ea4335;color:white}' +
    '.sign{background:#34a853;color:white}' +
    'button:hover{opacity:0.9}' +
    '</style>' +
    '<h2>Select Transaction Type</h2>' +
    '<button class="trade" onclick="selectType(\'Trade\')">📊 Trade</button><br>' +
    '<button class="cut" onclick="selectType(\'Cut\')">✂️ Cut Player</button><br>' +
    '<button class="sign" onclick="selectType(\'Sign\')">✍️ Sign Player</button>' +
    '<script>' +
    'function selectType(type) {' +
    '  google.script.run.withSuccessHandler(function(){google.script.host.close()}).showTransactionForm(type);' +
    '}' +
    '</script>'
  ).setWidth(400).setHeight(300);
  
  ui.showModalDialog(htmlType, 'Record Transaction');
}

function showTransactionForm(transactionType) {
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  var playerSheet = ss.getSheetByName(CONFIG.PLAYER_STATS_SHEET);
  var teamStatsSheet = ss.getSheetByName(CONFIG.TEAM_STATS_SHEET);
  
  var playerData = playerSheet.getRange(2, 1, playerSheet.getLastRow() - 1, 2).getValues();
  var playerList = [];
  var playerTeamMap = {};

  for (var playerIndex = 0; playerIndex < playerData.length; playerIndex++) {
    var name = String(playerData[playerIndex][0]).trim();
    var team = String(playerData[playerIndex][1]).trim();
    if (name) {
      playerList.push(name);
      playerTeamMap[name] = team;
    }
  }
  playerList.sort();
  
  var teamList = [];
  if (teamStatsSheet) {
    var teamData = teamStatsSheet.getRange(2, 1, teamStatsSheet.getLastRow() - 1, 1).getValues();
    for (var teamIndex = 0; teamIndex < teamData.length; teamIndex++) {
      var teamName = String(teamData[teamIndex][0]).trim();
      if (teamName) teamList.push(teamName);
    }
  }
  teamList.sort();
  
  var html = '';
  
  if (transactionType === "Trade") {
    html = '<style>' +
      'body{font-family:Arial;padding:20px;background:#f5f5f5}' +
      '.form-group{margin:15px 0;background:white;padding:15px;border-radius:4px}' +
      'label{font-weight:bold;display:block;margin-bottom:5px;color:#333}' +
      'select,input{width:100%;padding:8px;margin:5px 0;border:1px solid #ddd;border-radius:4px;box-sizing:border-box}' +
      'button{padding:12px 24px;background:#1a73e8;color:white;border:none;border-radius:4px;cursor:pointer;font-size:14px;margin-top:10px}' +
      'button:hover{background:#1557b0}' +
      '.hint{font-size:12px;color:#666;margin-top:5px}' +
      '</style>' +
      '<h3>📊 Record Trade</h3>' +
      '<div class="form-group">' +
      '<label>Week Number:</label>' +
      '<input type="number" id="week" placeholder="e.g., 7" min="1">' +
      '</div>' +
      '<div class="form-group">' +
      '<label>Team 1:</label>' +
      '<select id="team1" onchange="filterPlayers()"><option value="">-- Select Team --</option>' +
      teamList.map(function(t) { return '<option value="' + t + '">' + t + '</option>'; }).join('') +
      '</select>' +
      '</div>' +
      '<div class="form-group">' +
      '<label>Players from Team 1 going to Team 2:</label>' +
      '<select id="players1" multiple size="6"></select>' +
      '<div class="hint">Hold Ctrl (Cmd on Mac) to select multiple</div>' +
      '</div>' +
      '<div class="form-group">' +
      '<label>Team 2:</label>' +
      '<select id="team2" onchange="filterPlayers()"><option value="">-- Select Team --</option>' +
      teamList.map(function(t) { return '<option value="' + t + '">' + t + '</option>'; }).join('') +
      '</select>' +
      '</div>' +
      '<div class="form-group">' +
      '<label>Players from Team 2 going to Team 1:</label>' +
      '<select id="players2" multiple size="6"></select>' +
      '<div class="hint">Hold Ctrl (Cmd on Mac) to select multiple</div>' +
      '</div>' +
      '<button onclick="submitTrade()">Record Trade</button>' +
      '<script>' +
      'var allPlayers = ' + JSON.stringify(playerList) + ';' +
      'var playerTeams = ' + JSON.stringify(playerTeamMap) + ';' +
      'function filterPlayers() {' +
      '  var team1 = document.getElementById("team1").value;' +
      '  var team2 = document.getElementById("team2").value;' +
      '  var players1Select = document.getElementById("players1");' +
      '  var players2Select = document.getElementById("players2");' +
      '  players1Select.innerHTML = "";' +
      '  players2Select.innerHTML = "";' +
      '  if(team1) {' +
      '    allPlayers.forEach(function(p) {' +
      '      if(playerTeams[p] === team1) {' +
      '        players1Select.innerHTML += "<option value=\\"" + p + "\\">" + p + "</option>";' +
      '      }' +
      '    });' +
      '  }' +
      '  if(team2) {' +
      '    allPlayers.forEach(function(p) {' +
      '      if(playerTeams[p] === team2) {' +
      '        players2Select.innerHTML += "<option value=\\"" + p + "\\">" + p + "</option>";' +
      '      }' +
      '    });' +
      '  }' +
      '}' +
      'function submitTrade() {' +
      '  var week = document.getElementById("week").value;' +
      '  var team1 = document.getElementById("team1").value;' +
      '  var team2 = document.getElementById("team2").value;' +
      '  var p1 = Array.from(document.getElementById("players1").selectedOptions).map(function(o){return o.value});' +
      '  var p2 = Array.from(document.getElementById("players2").selectedOptions).map(function(o){return o.value});' +
      '  if(!week || !team1 || !team2 || p1.length===0 || p2.length===0){alert("Please fill all fields");return;}' +
      '  google.script.run.withSuccessHandler(function(){google.script.host.close()}).processTradeSelection(p1,p2,team1,team2,week);' +
      '}' +
      '</script>';
      
  } else if (transactionType === "Cut") {
    html = '<style>' +
      'body{font-family:Arial;padding:20px;background:#f5f5f5}' +
      '.form-group{margin:15px 0;background:white;padding:15px;border-radius:4px}' +
      'label{font-weight:bold;display:block;margin-bottom:5px;color:#333}' +
      'select,input{width:100%;padding:8px;margin:5px 0;border:1px solid #ddd;border-radius:4px;box-sizing:border-box}' +
      'button{padding:12px 24px;background:#ea4335;color:white;border:none;border-radius:4px;cursor:pointer;font-size:14px;margin-top:10px}' +
      'button:hover{background:#c5221f}' +
      '</style>' +
      '<h3>✂️ Cut Player</h3>' +
      '<div class="form-group">' +
      '<label>Week Number:</label>' +
      '<input type="number" id="week" placeholder="e.g., 7" min="1">' +
      '</div>' +
      '<div class="form-group">' +
      '<label>Team:</label>' +
      '<select id="team" onchange="filterPlayers()"><option value="">-- Select Team --</option>' +
      teamList.map(function(t) { return '<option value="' + t + '">' + t + '</option>'; }).join('') +
      '</select>' +
      '</div>' +
      '<div class="form-group">' +
      '<label>Player to Cut:</label>' +
      '<select id="player"><option value="">-- Select Player --</option></select>' +
      '</div>' +
      '<button onclick="submitCut()">Cut Player</button>' +
      '<script>' +
      'var allPlayers = ' + JSON.stringify(playerList) + ';' +
      'var playerTeams = ' + JSON.stringify(playerTeamMap) + ';' +
      'function filterPlayers() {' +
      '  var team = document.getElementById("team").value;' +
      '  var playerSelect = document.getElementById("player");' +
      '  playerSelect.innerHTML = "<option value=\\"\\">-- Select Player --</option>";' +
      '  allPlayers.forEach(function(p) {' +
      '    if(playerTeams[p] === team) {' +
      '      playerSelect.innerHTML += "<option value=\\"" + p + "\\">" + p + "</option>";' +
      '    }' +
      '  });' +
      '}' +
      'function submitCut() {' +
      '  var week = document.getElementById("week").value;' +
      '  var team = document.getElementById("team").value;' +
      '  var player = document.getElementById("player").value;' +
      '  if(!week || !team || !player){alert("Please fill all fields");return;}' +
      '  google.script.run.withSuccessHandler(function(){google.script.host.close()}).processCutSelection(player,team,week);' +
      '}' +
      '</script>';
      
  } else if (transactionType === "Sign") {
    html = '<style>' +
      'body{font-family:Arial;padding:20px;background:#f5f5f5}' +
      '.form-group{margin:15px 0;background:white;padding:15px;border-radius:4px}' +
      'label{font-weight:bold;display:block;margin-bottom:5px;color:#333}' +
      'select,input{width:100%;padding:8px;margin:5px 0;border:1px solid #ddd;border-radius:4px;box-sizing:border-box}' +
      'button{padding:12px 24px;background:#34a853;color:white;border:none;border-radius:4px;cursor:pointer;font-size:14px;margin-top:10px}' +
      'button:hover{background:#2d8e47}' +
      '</style>' +
      '<h3>✍️ Sign Player</h3>' +
      '<div class="form-group">' +
      '<label>Week Number:</label>' +
      '<input type="number" id="week" placeholder="e.g., 7" min="1">' +
      '</div>' +
      '<div class="form-group">' +
      '<label>Team:</label>' +
      '<select id="team"><option value="">-- Select Team --</option>' +
      teamList.map(function(t) { return '<option value="' + t + '">' + t + '</option>'; }).join('') +
      '</select>' +
      '</div>' +
      '<div class="form-group">' +
      '<label>Player to Sign:</label>' +
      '<select id="player"><option value="">-- Select Player --</option>' +
      playerList.map(function(p) { return '<option value="' + p + '">' + p + ' (' + playerTeamMap[p] + ')</option>'; }).join('') +
      '</select>' +
      '</div>' +
      '<button onclick="submitSign()">Sign Player</button>' +
      '<script>' +
      'function submitSign() {' +
      '  var week = document.getElementById("week").value;' +
      '  var team = document.getElementById("team").value;' +
      '  var player = document.getElementById("player").value;' +
      '  if(!week || !team || !player){alert("Please fill all fields");return;}' +
      '  google.script.run.withSuccessHandler(function(){google.script.host.close()}).processSignSelection(player,team,week);' +
      '}' +
      '</script>';
  }
  
  var dialog = HtmlService.createHtmlOutput(html).setWidth(500).setHeight(600);
  ui.showModalDialog(dialog, 'Record ' + transactionType);
}

function processTradeSelection(players1, players2, team1, team2, week) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var playerSheet = ss.getSheetByName(CONFIG.PLAYER_STATS_SHEET);
  var transactionSheet = initializeTransactionLog();
  
  if (playerSheet) {
    var lastRow = playerSheet.getLastRow();
    if (lastRow > 1) {
      var playerData = playerSheet.getRange(2, 1, lastRow - 1, 2).getValues();

      for (var playerIndex = 0; playerIndex < playerData.length; playerIndex++) {
        var playerName = String(playerData[playerIndex][0]).trim();

        if (players1.indexOf(playerName) !== -1) {
          playerSheet.getRange(playerIndex + 2, 2).setValue(team2);
        } else if (players2.indexOf(playerName) !== -1) {
          playerSheet.getRange(playerIndex + 2, 2).setValue(team1);
        }
      }
    }
  }
  
  var description = team1 + " ⇄ " + team2 + ": " + players1.join(", ") + " ↔ " + players2.join(", ");
  var lastRow = Math.max(transactionSheet.getLastRow(), 2);
  transactionSheet.getRange(lastRow + 1, 1, 1, 4).setValues([[new Date(), week, "Trade", description]]);
  savePlayerTeamSnapshot();
  
  SpreadsheetApp.getUi().alert("Trade recorded successfully!");
  logInfo("Transaction Tracking", "Recorded Trade: " + description);
}

function processCutSelection(player, team, week) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var playerSheet = ss.getSheetByName(CONFIG.PLAYER_STATS_SHEET);
  var transactionSheet = initializeTransactionLog();
  
  if (playerSheet) {
    var lastRow = playerSheet.getLastRow();
    if (lastRow > 1) {
      var playerData = playerSheet.getRange(2, 1, lastRow - 1, 2).getValues();

      for (var playerIndex = 0; playerIndex < playerData.length; playerIndex++) {
        var playerName = String(playerData[playerIndex][0]).trim();
        if (playerName === player) {
          playerSheet.getRange(playerIndex + 2, 2).clearContent();
          break;
        }
      }
    }
  }

  var description = team + " released " + player;
  var lastRow = Math.max(transactionSheet.getLastRow(), 2);
  transactionSheet.getRange(lastRow + 1, 1, 1, 4).setValues([[new Date(), week, "Cut", description]]);
  savePlayerTeamSnapshot();
  
  SpreadsheetApp.getUi().alert("Cut recorded successfully!");
  logInfo("Transaction Tracking", "Recorded Cut: " + description);
}

function processSignSelection(player, team, week) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var playerSheet = ss.getSheetByName(CONFIG.PLAYER_STATS_SHEET);
  var transactionSheet = initializeTransactionLog();
  
  if (playerSheet) {
    var lastRow = playerSheet.getLastRow();
    if (lastRow > 1) {
      var playerData = playerSheet.getRange(2, 1, lastRow - 1, 2).getValues();

      for (var playerIndex = 0; playerIndex < playerData.length; playerIndex++) {
        var playerName = String(playerData[playerIndex][0]).trim();
        if (playerName === player) {
          playerSheet.getRange(playerIndex + 2, 2).setValue(team);
          break;
        }
      }
    }
  }

  var description = team + " signed " + player;
  var lastRow = Math.max(transactionSheet.getLastRow(), 2);
  transactionSheet.getRange(lastRow + 1, 1, 1, 4).setValues([[new Date(), week, "Sign", description]]);
  savePlayerTeamSnapshot();
  
  SpreadsheetApp.getUi().alert("Sign recorded successfully!");
  logInfo("Transaction Tracking", "Recorded Sign: " + description);
}

function viewTransactionLog() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var transactionSheet = ss.getSheetByName(CONFIG.TRANSACTIONS_SHEET);
  
  if (!transactionSheet) {
    SpreadsheetApp.getUi().alert("No transactions logged yet!");
    return;
  }
  
  var lastRow = transactionSheet.getLastRow();
  if (lastRow < 3) {
    SpreadsheetApp.getUi().alert("No transactions logged yet!");
    return;
  }
  
  ss.setActiveSheet(transactionSheet);
  SpreadsheetApp.getUi().alert("Transaction Log displayed. You can manually edit or delete rows as needed.");
}