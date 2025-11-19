// ===== PLAYER COMPARISON TOOL =====
// Purpose: Provides player comparison dialog with optimized data retrieval
// Dependencies: StatsConfig.js
// Entry Point(s): getPlayerStats

/**
 * Get list of all players sorted alphabetically
 * @returns {Array<object>} Array of player objects with name and team
 */
function getPlayerList() {
  var activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var playerSheet = activeSpreadsheet.getSheetByName(CONFIG.PLAYER_STATS_SHEET);

  if (!playerSheet) return [];

  var lastRow = playerSheet.getLastRow();
  if (lastRow < 2) return [];

  var playerData = playerSheet.getRange(2, 1, lastRow - 1, 2).getValues();
  var players = [];

  for (var i = 0; i < playerData.length; i++) {
    var name = String(playerData[i][0]).trim();
    var team = String(playerData[i][1]).trim();
    if (name) {
      players.push({name: name, team: team});
    }
  }

  players.sort(function(a, b) {
    return a.name.localeCompare(b.name);
  });

  return players;
}

/**
 * Get player stats using Read-Once pattern
 * Reads each stat sheet once and builds an in-memory map
 * @param {Array<string>} playerNames - Array of player names to retrieve stats for
 * @returns {Array<object>} Array of player stat objects
 */
function getPlayerStats(playerNames) {
  var activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var playerDataSheet = activeSpreadsheet.getSheetByName(CONFIG.PLAYER_STATS_SHEET);

  var playerStatsMap = {};

  if (!playerDataSheet) {
    Logger.log("WARNING: Player Data sheet not found");
    var results = [];
    for (var i = 0; i < playerNames.length; i++) {
      results.push({
        name: playerNames[i],
        hitting: {},
        pitching: {},
        fielding: {}
      });
    }
    return results;
  }

  var lastRow = playerDataSheet.getLastRow();
  if (lastRow < 2) {
    Logger.log("WARNING: No player data found");
    var results = [];
    for (var i = 0; i < playerNames.length; i++) {
      results.push({
        name: playerNames[i],
        hitting: {},
        pitching: {},
        fielding: {}
      });
    }
    return results;
  }

  // Read all player data (columns A-Y)
  // A: Player, B: Team, C: GP, D-L: Hitting (9), M-O: WLS (3), P-V: Pitching (7), W-Y: Fielding (3)
  var data = playerDataSheet.getRange(2, 1, lastRow - 1, 25).getValues();

  for (var i = 0; i < data.length; i++) {
    var playerName = String(data[i][0]).trim();
    if (!playerName) continue;

    var team = String(data[i][1]).trim();
    var gp = data[i][2] || 0;
    var ab = data[i][3] || 0;
    var h = data[i][4] || 0;
    var hr = data[i][5] || 0;
    var rbi = data[i][6] || 0;
    var bb = data[i][7] || 0;
    var k = data[i][8] || 0;
    var rob = data[i][9] || 0;
    var dp = data[i][10] || 0;
    var tb = data[i][11] || 0;
    var w = data[i][12] || 0;
    var l = data[i][13] || 0;
    var sv = data[i][14] || 0;
    var ip = data[i][15] || 0;
    var bf = data[i][16] || 0;
    var pHits = data[i][17] || 0;
    var pHR = data[i][18] || 0;
    var r = data[i][19] || 0;
    var pBB = data[i][20] || 0;
    var pK = data[i][21] || 0;
    var np = data[i][22] || 0;
    var e = data[i][23] || 0;
    var sb = data[i][24] || 0;

    // Calculate derived stats
    var avg = ab > 0 ? h / ab : 0;
    var obp = (ab + bb) > 0 ? (h + bb) / (ab + bb) : 0;
    var slg = ab > 0 ? tb / ab : 0;
    var ops = obp + slg;
    var era = ip > 0 ? (r * 7) / ip : 0;
    var whip = ip > 0 ? (pHits + pBB) / ip : 0;
    var baa = bf > 0 ? pHits / bf : 0;

    playerStatsMap[playerName] = {
      name: playerName,
      hitting: {
        team: team,
        gp: gp,
        ab: ab,
        h: h,
        hr: hr,
        rbi: rbi,
        bb: bb,
        k: k,
        rob: rob,
        dp: dp,
        tb: tb,
        avg: avg,
        obp: obp,
        slg: slg,
        ops: ops
      },
      pitching: {
        gp: gp,
        w: w,
        l: l,
        sv: sv,
        era: era,
        ip: ip,
        bf: bf,
        h: pHits,
        hr: pHR,
        r: r,
        bb: pBB,
        k: pK,
        baa: baa,
        whip: whip
      },
      fielding: {
        gp: gp,
        np: np,
        e: e,
        sb: sb
      }
    };
  }

  var results = [];
  for (var playerIndex = 0; playerIndex < playerNames.length; playerIndex++) {
    var playerName = playerNames[playerIndex];
    if (playerStatsMap[playerName]) {
      results.push(playerStatsMap[playerName]);
    } else {
      results.push({
        name: playerName,
        hitting: {},
        pitching: {},
        fielding: {}
      });
    }
  }

  return results;
}
