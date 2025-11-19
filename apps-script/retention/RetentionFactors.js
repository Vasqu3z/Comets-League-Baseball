// ===== RETENTION GRADES - FACTOR CALCULATIONS =====
// Individual factor calculation functions
//
// Dependencies: RetentionConfig.js, RetentionCore.js
//
// ===== FACTOR 1: TEAM SUCCESS (0-20 POINTS) =====
/**
 * Calculate Team Success score
 * Regular season standing (10pts) + postseason finish (10pts)
 * USES STANDINGS FROM LEAGUE HUB (not win%)
 */
function calculateTeamSuccessInternal(player, teamData, standingsData, postseasonData) {
  var config = RETENTION_CONFIG.TEAM_SUCCESS;
  var team = teamData[player.team];

  var breakdown = {
    regularSeason: 0,
    postseason: 0,
    total: 0,
    details: ""
  };

  if (!team) {
    breakdown.details = "Team not found";
    return breakdown;
  }

  // Regular season points (based on final standing, 10-point scale)
  var standing = standingsData[player.team];

  if (standing) {
    var regConfig = config.REGULAR_SEASON;

    switch(standing) {
      case 1:
        breakdown.regularSeason = regConfig.FIRST;
        break;
      case 2:
        breakdown.regularSeason = regConfig.SECOND;
        break;
      case 3:
        breakdown.regularSeason = regConfig.THIRD;
        break;
      case 4:
        breakdown.regularSeason = regConfig.FOURTH;
        break;
      case 5:
        breakdown.regularSeason = regConfig.FIFTH;
        break;
      case 6:
        breakdown.regularSeason = regConfig.SIXTH;
        break;
      case 7:
        breakdown.regularSeason = regConfig.SEVENTH;
        break;
      case 8:
        breakdown.regularSeason = regConfig.EIGHTH;
        break;
      default:
        breakdown.regularSeason = 0;
    }

    breakdown.details = "Reg: " + breakdown.regularSeason.toFixed(1) + " pts (" +
                        standing + getOrdinalSuffix(standing) + " place)";
  } else {
    // Fallback if standings not available
    breakdown.details = "Reg: No standing data";
  }

  // Postseason points (10-point scale)
  if (postseasonData[player.team] !== undefined) {
    breakdown.postseason = postseasonData[player.team];
    breakdown.details += ", Post: " + breakdown.postseason.toFixed(1) + " pts";
  } else {
    breakdown.details += ", Post: 0 pts";
  }

  breakdown.total = breakdown.regularSeason + breakdown.postseason;

  return breakdown;
}

// ===== FACTOR 2: PLAY TIME (0-20 POINTS) =====
/**
 * Calculate Play Time score
 * Games played (10pts) + usage quality (10pts)
 * CRITICAL: Only counts games with CURRENT team (uses lineup data)
 */
function calculatePlayTimeInternal(player, teamData, lineupData) {
  var config = RETENTION_CONFIG.PLAY_TIME;
  var team = teamData[player.team];

  var breakdown = {
    gamesPlayed: 0,
    usageQuality: 0,
    total: 0,
    details: ""
  };

  if (!team) {
    breakdown.details = "Team not found: " + player.team;
    return breakdown;
  }

  var teamGamesPlayed = team.gamesPlayed || 0;
  if (teamGamesPlayed === 0) {
    breakdown.details = "Team has 0 games played";
    return breakdown;
  }

  // CRITICAL FIX: Use lineup data for GP (team-specific)
  var lineupKey = player.name + "|" + player.team;
  var hasLineupData = lineupData && lineupData[lineupKey];

  var playerGamesWithTeam = 0;

  if (hasLineupData) {
    // Use lineup data (most accurate - only counts current team)
    playerGamesWithTeam = lineupData[lineupKey].gamesCount;
  } else {
    // Fallback to hitting GP (may be inflated for traded players)
    playerGamesWithTeam = player.hitting.gp || 0;
  }

  if (playerGamesWithTeam === 0) {
    breakdown.details = "No games played with " + player.team;
    return breakdown;
  }

  // Games played component (0-10 points)
  var gpPct = playerGamesWithTeam / teamGamesPlayed;
  var gpConfig = config.GAMES_PLAYED;

  if (gpPct >= gpConfig.FULL_TIME.threshold) {
    breakdown.gamesPlayed = gpConfig.FULL_TIME.points;
  } else if (gpPct >= gpConfig.REGULAR.threshold) {
    breakdown.gamesPlayed = gpConfig.REGULAR.points;
  } else if (gpPct >= gpConfig.ROTATION.threshold) {
    breakdown.gamesPlayed = gpConfig.ROTATION.points;
  } else if (gpPct >= gpConfig.BENCH.threshold) {
    breakdown.gamesPlayed = gpConfig.BENCH.points;
  } else {
    breakdown.gamesPlayed = gpConfig.MINIMAL.points;
  }

  // Usage quality - lineup position (hitters) or IP/game (pitchers)
  // Increased to 10 points (from 8)
  if (hasLineupData) {
    // METHOD 1: Use actual lineup position from box scores
    var avgLineupPos = lineupData[lineupKey].averagePosition;
    var lineupConfig = config.USAGE_QUALITY.LINEUP_POSITION;

    if (avgLineupPos <= lineupConfig.TOP_THREE.threshold) {
      breakdown.usageQuality = lineupConfig.TOP_THREE.points;
    } else if (avgLineupPos <= lineupConfig.FOUR_FIVE.threshold) {
      breakdown.usageQuality = lineupConfig.FOUR_FIVE.points;
    } else if (avgLineupPos <= lineupConfig.SIX_SEVEN.threshold) {
      breakdown.usageQuality = lineupConfig.SIX_SEVEN.points;
    } else if (avgLineupPos <= lineupConfig.EIGHT_NINE.threshold) {
      breakdown.usageQuality = lineupConfig.EIGHT_NINE.points;
    } else {
      breakdown.usageQuality = lineupConfig.BENCH.points;
    }

    breakdown.details = "GP: " + breakdown.gamesPlayed.toFixed(1) + " pts (" +
                       playerGamesWithTeam + "/" + teamGamesPlayed + " games, " +
                       (gpPct * 100).toFixed(0) + "%), Lineup: " +
                       avgLineupPos.toFixed(1) + " spot (" + breakdown.usageQuality.toFixed(1) + " pts)";
  } else {
    // METHOD 2: Derive from stats (fallback)
    var isPitcher = (player.pitching.ip && player.pitching.ip >= 5.0);

    if (isPitcher) {
      var ipPerGame = player.pitching.ip / teamGamesPlayed;
      var pitchConfig = config.USAGE_QUALITY.PITCHING_USAGE;

      if (ipPerGame >= pitchConfig.ACE.threshold) {
        breakdown.usageQuality = pitchConfig.ACE.points;
      } else if (ipPerGame >= pitchConfig.STARTER.threshold) {
        breakdown.usageQuality = pitchConfig.STARTER.points;
      } else if (ipPerGame >= pitchConfig.SWINGMAN.threshold) {
        breakdown.usageQuality = pitchConfig.SWINGMAN.points;
      } else if (ipPerGame >= pitchConfig.RELIEVER.threshold) {
        breakdown.usageQuality = pitchConfig.RELIEVER.points;
      } else {
        breakdown.usageQuality = pitchConfig.MOP_UP.points;
      }

      breakdown.details = "GP: " + breakdown.gamesPlayed.toFixed(1) + " pts (" +
                         playerGamesWithTeam + "/" + teamGamesPlayed + " games, " +
                         (gpPct * 100).toFixed(0) + "%), IP/G: " +
                         ipPerGame.toFixed(2) + " (" + breakdown.usageQuality.toFixed(1) + " pts)";
    } else {
      var abPerGame = playerGamesWithTeam > 0 ? player.hitting.ab / playerGamesWithTeam : 0;
      var hitConfig = config.USAGE_QUALITY.LINEUP_POSITION;

      if (abPerGame >= 3.5) {
        breakdown.usageQuality = hitConfig.TOP_THREE.points;
      } else if (abPerGame >= 3.0) {
        breakdown.usageQuality = hitConfig.FOUR_FIVE.points;
      } else if (abPerGame >= 2.5) {
        breakdown.usageQuality = hitConfig.SIX_SEVEN.points;
      } else if (abPerGame >= 1.5) {
        breakdown.usageQuality = hitConfig.EIGHT_NINE.points;
      } else {
        breakdown.usageQuality = hitConfig.BENCH.points;
      }

      breakdown.details = "GP: " + breakdown.gamesPlayed.toFixed(1) + " pts (" +
                         playerGamesWithTeam + "/" + teamGamesPlayed + " games, " +
                         (gpPct * 100).toFixed(0) + "%), AB/G: " +
                         abPerGame.toFixed(1) + " (" + breakdown.usageQuality.toFixed(1) + " pts, no lineup data)";
    }
  }

  breakdown.total = breakdown.gamesPlayed + breakdown.usageQuality;

  return breakdown;
}

// ===== FACTOR 3: PERFORMANCE (0-20 POINTS) =====
/**
 * Calculate Performance score
 * Includes auto-flagging for elite players on bad teams
 * Includes draft expectations modifier
 * Offensive (0-14) + Defensive (0-3) + Pitching (0-3)
 * CRITICAL: Uses stats from ALL teams (performance-based)
 */
function calculatePerformanceInternal(player, leagueStats, standingsData, draftValue) {
  var config = RETENTION_CONFIG.PERFORMANCE;

  var breakdown = {
    offensive: 0,
    defensive: 0,
    pitching: 0,
    autoFlaggingPenalty: 0,
    draftExpectationsMod: 0,
    baseTotal: 0,
    total: 0,
    details: ""
  };

  var detailParts = [];

  var avgTeamGames = RETENTION_CONFIG.LEAGUE.GAMES_PER_SEASON;

  try {
    var teamData = getTeamData();
    var teamCount = 0;
    var totalGames = 0;

    for (var team in teamData) {
      if (teamData[team].gamesPlayed && typeof teamData[team].gamesPlayed === 'number') {
        totalGames += teamData[team].gamesPlayed;
        teamCount++;
      }
    }

    if (teamCount > 0 && totalGames > 0) {
      avgTeamGames = totalGames / teamCount;
    }
  } catch (e) {
    Logger.log("Error calculating avg team games: " + e.toString());
  }

  var minAB = RETENTION_CONFIG.getMinABForQualification(avgTeamGames);
  var minIP = RETENTION_CONFIG.getMinIPForQualification(avgTeamGames);
  var minGP = RETENTION_CONFIG.getMinGPForQualification(avgTeamGames);

  // ===== OFFENSIVE CONTRIBUTION (0-14 points) =====
  var offensivePercentile = 0;

  if (player.hitting.ab >= minAB) {
    var percentiles = [];

    if (leagueStats.hitting.avg && leagueStats.hitting.avg.length > 0) {
      percentiles.push(calculatePercentile(player.hitting.avg, leagueStats.hitting.avg));
    }
    if (leagueStats.hitting.obp && leagueStats.hitting.obp.length > 0) {
      percentiles.push(calculatePercentile(player.hitting.obp, leagueStats.hitting.obp));
    }
    if (leagueStats.hitting.slg && leagueStats.hitting.slg.length > 0) {
      percentiles.push(calculatePercentile(player.hitting.slg, leagueStats.hitting.slg));
    }
    if (leagueStats.hitting.ops && leagueStats.hitting.ops.length > 0) {
      percentiles.push(calculatePercentile(player.hitting.ops, leagueStats.hitting.ops));
    }
    if (leagueStats.hitting.hr && leagueStats.hitting.hr.length > 0) {
      percentiles.push(calculatePercentile(player.hitting.hr, leagueStats.hitting.hr));
    }
    if (leagueStats.hitting.rbi && leagueStats.hitting.rbi.length > 0) {
      percentiles.push(calculatePercentile(player.hitting.rbi, leagueStats.hitting.rbi));
    }

    var avgPercentile = 0;
    if (percentiles.length > 0) {
      var sum = 0;
      for (var i = 0; i < percentiles.length; i++) {
        sum += percentiles[i];
      }
      avgPercentile = sum / percentiles.length;
    }

    offensivePercentile = avgPercentile;

    // Log percentile details for troubleshooting
    if (RETENTION_CONFIG.DEBUG.LOG_PERCENTILE_DETAILS && player.name && player.name.indexOf("King") >= 0) {
      Logger.log("DEBUG Hitting Percentiles for " + player.name + ":");
      if (percentiles.length >= 6) {
        Logger.log("  - AVG: " + player.hitting.avg.toFixed(3) + " = " + percentiles[0].toFixed(1) + "%");
        Logger.log("  - OBP: " + player.hitting.obp.toFixed(3) + " = " + percentiles[1].toFixed(1) + "%");
        Logger.log("  - SLG: " + player.hitting.slg.toFixed(3) + " = " + percentiles[2].toFixed(1) + "%");
        Logger.log("  - OPS: " + player.hitting.ops.toFixed(3) + " = " + percentiles[3].toFixed(1) + "%");
        Logger.log("  - HR: " + player.hitting.hr + " = " + percentiles[4].toFixed(1) + "%");
        Logger.log("  - RBI: " + player.hitting.rbi + " = " + percentiles[5].toFixed(1) + "%");
      }
      Logger.log("  - Average: " + avgPercentile.toFixed(1) + "%");
      Logger.log("  - Pool size: " + (leagueStats.hitting.avg ? leagueStats.hitting.avg.length : 0) + " qualified hitters");
    }

    var offConfig = config.OFFENSIVE;
    if (avgPercentile >= offConfig.ELITE.threshold) {
      breakdown.offensive = offConfig.ELITE.points;
    } else if (avgPercentile >= offConfig.EXCELLENT.threshold) {
      breakdown.offensive = offConfig.EXCELLENT.points;
    } else if (avgPercentile >= offConfig.ABOVE_AVG.threshold) {
      breakdown.offensive = offConfig.ABOVE_AVG.points;
    } else if (avgPercentile >= offConfig.GOOD.threshold) {
      breakdown.offensive = offConfig.GOOD.points;
    } else if (avgPercentile >= offConfig.AVERAGE.threshold) {
      breakdown.offensive = offConfig.AVERAGE.points;
    } else if (avgPercentile >= offConfig.BELOW_AVG.threshold) {
      breakdown.offensive = offConfig.BELOW_AVG.points;
    } else if (avgPercentile >= offConfig.POOR.threshold) {
      breakdown.offensive = offConfig.POOR.points;
    } else {
      breakdown.offensive = offConfig.TERRIBLE.points;
    }

    detailParts.push("Hit: " + avgPercentile.toFixed(0) + "% (" + breakdown.offensive.toFixed(1) + " pts)");
  } else {
    detailParts.push("Hit: Not qualified (" + player.hitting.ab + "/" + minAB + " AB)");
  }

  // ===== DEFENSIVE CONTRIBUTION (0-3 points) =====
  if (player.fielding.gp && player.fielding.gp >= minGP) {
    var np = player.fielding.np || 0;
    var e = player.fielding.e || 0;
    var netDefense = (np - e) / player.fielding.gp;

    var defPercentile = 0;
    if (leagueStats.fielding.netDefense && leagueStats.fielding.netDefense.length > 0) {
      defPercentile = calculatePercentile(netDefense, leagueStats.fielding.netDefense);
    }

    // Log fielding details
    if (RETENTION_CONFIG.DEBUG.LOG_PERCENTILE_DETAILS && player.name && player.name.indexOf("King") >= 0) {
      Logger.log("DEBUG Fielding for " + player.name + ":");
      Logger.log("  - NP: " + np);
      Logger.log("  - E: " + e);
      Logger.log("  - GP (fielding): " + player.fielding.gp);
      Logger.log("  - Net Defense: " + netDefense.toFixed(3));
      Logger.log("  - Percentile: " + defPercentile.toFixed(1) + "%");
      Logger.log("  - Pool size: " + leagueStats.fielding.netDefense.length + " qualified fielders");
    }

    var defConfig = config.DEFENSIVE;
    if (defPercentile >= defConfig.GOLD_GLOVE.threshold) {
      breakdown.defensive = defConfig.GOLD_GLOVE.points;
    } else if (defPercentile >= defConfig.EXCELLENT.threshold) {
      breakdown.defensive = defConfig.EXCELLENT.points;
    } else if (defPercentile >= defConfig.STRONG.threshold) {
      breakdown.defensive = defConfig.STRONG.points;
    } else if (defPercentile >= defConfig.SOLID.threshold) {
      breakdown.defensive = defConfig.SOLID.points;
    } else if (defPercentile >= defConfig.NEUTRAL.threshold) {
      breakdown.defensive = defConfig.NEUTRAL.points;
    } else if (defPercentile >= defConfig.BELOW_AVG.threshold) {
      breakdown.defensive = defConfig.BELOW_AVG.points;
    } else {
      breakdown.defensive = defConfig.POOR.points;
    }

    detailParts.push("Def: " + defPercentile.toFixed(0) + "% (" + breakdown.defensive.toFixed(1) + " pts)");
  } else {
    detailParts.push("Def: Not qualified (" + (player.fielding.gp || 0) + "/" + minGP + " GP)");
  }

  // ===== PITCHING CONTRIBUTION (0-3 points) =====
  if (player.pitching.ip && player.pitching.ip >= minIP) {
    var pitchPercentiles = [];

    if (leagueStats.pitching.era && leagueStats.pitching.era.length > 0) {
      var eraPercentile = calculatePercentile(player.pitching.era, leagueStats.pitching.era);
      pitchPercentiles.push(100 - eraPercentile);
    }
    if (leagueStats.pitching.whip && leagueStats.pitching.whip.length > 0) {
      var whipPercentile = calculatePercentile(player.pitching.whip, leagueStats.pitching.whip);
      pitchPercentiles.push(100 - whipPercentile);
    }
    if (leagueStats.pitching.baa && leagueStats.pitching.baa.length > 0) {
      var baaPercentile = calculatePercentile(player.pitching.baa, leagueStats.pitching.baa);
      pitchPercentiles.push(100 - baaPercentile);
    }

    var avgPitchPercentile = 0;
    if (pitchPercentiles.length > 0) {
      var sum = 0;
      for (var i = 0; i < pitchPercentiles.length; i++) {
        sum += pitchPercentiles[i];
      }
      avgPitchPercentile = sum / pitchPercentiles.length;
    }

    var pitchConfig = config.PITCHING;
    if (avgPitchPercentile >= pitchConfig.CY_YOUNG.threshold) {
      breakdown.pitching = pitchConfig.CY_YOUNG.points;
    } else if (avgPitchPercentile >= pitchConfig.EXCELLENT.threshold) {
      breakdown.pitching = pitchConfig.EXCELLENT.points;
    } else if (avgPitchPercentile >= pitchConfig.STRONG.threshold) {
      breakdown.pitching = pitchConfig.STRONG.points;
    } else if (avgPitchPercentile >= pitchConfig.GOOD.threshold) {
      breakdown.pitching = pitchConfig.GOOD.points;
    } else if (avgPitchPercentile >= pitchConfig.AVERAGE.threshold) {
      breakdown.pitching = pitchConfig.AVERAGE.points;
    } else if (avgPitchPercentile >= pitchConfig.BELOW_AVG.threshold) {
      breakdown.pitching = pitchConfig.BELOW_AVG.points;
    } else {
      breakdown.pitching = pitchConfig.POOR.points;
    }

    detailParts.push("Pitch: " + avgPitchPercentile.toFixed(0) + "% (" + breakdown.pitching.toFixed(1) + " pts)");
  } else {
    detailParts.push("Pitch: Not qualified (" + (player.pitching.ip || 0).toFixed(1) + "/" + minIP + " IP)");
  }

  breakdown.baseTotal = breakdown.offensive + breakdown.defensive + breakdown.pitching;

  // ===== AUTO-FLAGGING SYSTEM =====
  // Elite players on struggling teams get performance penalty
  if (RETENTION_CONFIG.AUTO_FLAGGING.ENABLED) {
    var standing = standingsData[player.team];

    if (standing && offensivePercentile > 0) {
      var penalty = applyAutoFlagging(offensivePercentile, standing);

      if (penalty < 0) {
        breakdown.autoFlaggingPenalty = penalty;
        detailParts.push("Auto-Perf Mod: " + penalty + " pts (flight risk)");

        if (RETENTION_CONFIG.DEBUG.LOG_AUTO_FLAGGING) {
          Logger.log("Auto-flagging: " + player.name + " on " + player.team +
                     " (" + standing + getOrdinalSuffix(standing) + " place, " +
                     offensivePercentile.toFixed(0) + "% percentile) = " + penalty + " pts");
        }
      }
    }
  }

  // ===== DRAFT EXPECTATIONS SYSTEM =====
  // Apply modifier based on performance vs draft round expectations
  if (RETENTION_CONFIG.DRAFT_EXPECTATIONS.ENABLED && offensivePercentile > 0) {
    var draftMod = applyDraftExpectations(offensivePercentile, draftValue);

    if (draftMod !== 0) {
      breakdown.draftExpectationsMod = draftMod;
      var modText = draftMod > 0 ? ("+" + draftMod.toFixed(1)) : draftMod.toFixed(1);
      detailParts.push("Auto-Value Mod: " + modText + " pts");
    }
  }

  breakdown.total = breakdown.baseTotal + breakdown.autoFlaggingPenalty + breakdown.draftExpectationsMod;

  // Log performance calculation for troubleshooting
  if (RETENTION_CONFIG.DEBUG.LOG_PERCENTILE_DETAILS && player.name && player.name.indexOf("King") >= 0) {
    Logger.log("DEBUG Performance for " + player.name + ":");
    Logger.log("  - Offensive: " + breakdown.offensive);
    Logger.log("  - Defensive: " + breakdown.defensive);
    Logger.log("  - Pitching: " + breakdown.pitching);
    Logger.log("  - Base Total: " + breakdown.baseTotal);
    Logger.log("  - Auto-flagging penalty: " + breakdown.autoFlaggingPenalty);
    Logger.log("  - Draft expectations mod: " + breakdown.draftExpectationsMod);
    Logger.log("  - Total (before cap): " + breakdown.total);
  }

  // Cap at max points
  if (breakdown.total > config.MAX_POINTS) {
    breakdown.total = config.MAX_POINTS;
  }

  // Don't allow negative
  if (breakdown.total < 0) {
    breakdown.total = 0;
  }

  // Log after capping
  if (RETENTION_CONFIG.DEBUG.LOG_PERCENTILE_DETAILS && player.name && player.name.indexOf("King") >= 0) {
    Logger.log("  - Total (after cap): " + breakdown.total);
  }

  breakdown.details = detailParts.join(" | ");

  return breakdown;
}

// ===== AUTO-FLAGGING LOGIC =====
/**
 * Apply auto-flagging penalty for elite players on struggling teams
 * Returns negative penalty value (0 if no penalty applies)
 */
function applyAutoFlagging(offensivePercentile, standing) {
  var config = RETENTION_CONFIG.AUTO_FLAGGING;

  // Tier 1: Top 25% player on 7th-8th place team
  if (offensivePercentile >= config.TIER_1.PERCENTILE_THRESHOLD &&
      standing >= config.TIER_1.STANDING_MIN &&
      standing <= config.TIER_1.STANDING_MAX) {
    return config.TIER_1.PENALTY_POINTS;
  }

  // Tier 2: Top 40% player on 5th-8th place team
  if (offensivePercentile >= config.TIER_2.PERCENTILE_THRESHOLD &&
      standing >= config.TIER_2.STANDING_MIN &&
      standing <= config.TIER_2.STANDING_MAX) {
    return config.TIER_2.PENALTY_POINTS;
  }

  return 0;
}

// ===== DRAFT EXPECTATIONS LOGIC =====
/**
 * Apply draft expectations modifier
 * 3-tier system based on player's perceived value vs team's perceived value:
 * - High rounds (1-2): Situation-based (good situation = bonus, bad situation = penalty)
 * - Mid rounds (3-5): Self-worth based (overperforming = feels undervalued = penalty, underperforming = bonus)
 * - Late rounds (6-8+): Self-worth based (same as mid but more extreme)
 * NOTE: Requires draft value to be entered in sheet first
 */
function applyDraftExpectations(offensivePercentile, draftValue) {
  if (!draftValue || draftValue === "") return 0;

  var config = RETENTION_CONFIG.DRAFT_EXPECTATIONS;
  if (!config.ENABLED) return 0;

  var draftRound = parseInt(draftValue);
  if (isNaN(draftRound) || draftRound < 1) return 0;

  // High rounds (1-2): Situation-based modifiers
  if (config.HIGH_ROUNDS.ROUNDS.indexOf(draftRound) >= 0) {
    if (offensivePercentile >= config.HIGH_ROUNDS.GOOD_SITUATION_PERCENTILE) {
      // Performing well - good situation
      if (RETENTION_CONFIG.DEBUG.LOG_DRAFT_EXPECTATIONS) {
        Logger.log("Draft expectations: Round " + draftRound + " pick in good situation (" +
                   offensivePercentile.toFixed(0) + "% ≥ " +
                   config.HIGH_ROUNDS.GOOD_SITUATION_PERCENTILE + "%) = " +
                   config.HIGH_ROUNDS.GOOD_SITUATION_MOD + " pts");
      }
      return config.HIGH_ROUNDS.GOOD_SITUATION_MOD;
    } else if (offensivePercentile < config.HIGH_ROUNDS.UNDERPERFORM_PERCENTILE) {
      // Underperforming - bad situation
      if (RETENTION_CONFIG.DEBUG.LOG_DRAFT_EXPECTATIONS) {
        Logger.log("Draft expectations: Round " + draftRound + " pick in bad situation (" +
                   offensivePercentile.toFixed(0) + "% < " +
                   config.HIGH_ROUNDS.UNDERPERFORM_PERCENTILE + "%) = " +
                   config.HIGH_ROUNDS.UNDERPERFORM_MOD + " pts");
      }
      return config.HIGH_ROUNDS.UNDERPERFORM_MOD;
    }
    return 0;
  }

  // Mid rounds (3-5): Self-worth modifiers (flipped logic)
  if (config.MID_ROUNDS.ROUNDS.indexOf(draftRound) >= 0) {
    if (offensivePercentile >= config.MID_ROUNDS.OVERPERFORM_PERCENTILE) {
      // Overperforming - player feels undervalued by team
      if (RETENTION_CONFIG.DEBUG.LOG_DRAFT_EXPECTATIONS) {
        Logger.log("Draft expectations: Round " + draftRound + " pick overperforming (" +
                   offensivePercentile.toFixed(0) + "% ≥ " +
                   config.MID_ROUNDS.OVERPERFORM_PERCENTILE + "%) = " +
                   config.MID_ROUNDS.OVERPERFORM_MOD + " pts (feels undervalued)");
      }
      return config.MID_ROUNDS.OVERPERFORM_MOD;
    } else if (offensivePercentile < config.MID_ROUNDS.UNDERPERFORM_PERCENTILE) {
      // Underperforming - team overvalued player, less flight risk
      if (RETENTION_CONFIG.DEBUG.LOG_DRAFT_EXPECTATIONS) {
        Logger.log("Draft expectations: Round " + draftRound + " pick underperforming (" +
                   offensivePercentile.toFixed(0) + "% < " +
                   config.MID_ROUNDS.UNDERPERFORM_PERCENTILE + "%) = " +
                   config.MID_ROUNDS.UNDERPERFORM_MOD + " pts (team overvalued)");
      }
      return config.MID_ROUNDS.UNDERPERFORM_MOD;
    }
    return 0;
  }

  // Late rounds (6-8+): Self-worth modifiers (more extreme, flipped logic)
  if (draftRound >= 6) {
    if (offensivePercentile >= config.LATE_ROUNDS.OVERPERFORM_PERCENTILE) {
      // Overperforming - player severely undervalued by team
      if (RETENTION_CONFIG.DEBUG.LOG_DRAFT_EXPECTATIONS) {
        Logger.log("Draft expectations: Round " + draftRound + " pick overperforming (" +
                   offensivePercentile.toFixed(0) + "% ≥ " +
                   config.LATE_ROUNDS.OVERPERFORM_PERCENTILE + "%) = " +
                   config.LATE_ROUNDS.OVERPERFORM_MOD + " pts (severely undervalued)");
      }
      return config.LATE_ROUNDS.OVERPERFORM_MOD;
    } else if (offensivePercentile < config.LATE_ROUNDS.UNDERPERFORM_PERCENTILE) {
      // Underperforming - team overvalued player significantly
      if (RETENTION_CONFIG.DEBUG.LOG_DRAFT_EXPECTATIONS) {
        Logger.log("Draft expectations: Round " + draftRound + " pick underperforming (" +
                   offensivePercentile.toFixed(0) + "% < " +
                   config.LATE_ROUNDS.UNDERPERFORM_PERCENTILE + "%) = " +
                   config.LATE_ROUNDS.UNDERPERFORM_MOD + " pts (team overvalued)");
      }
      return config.LATE_ROUNDS.UNDERPERFORM_MOD;
    }
    return 0;
  }

  return 0;
}

// ===== WRAPPER FUNCTIONS FOR CACHED DATA =====
// These wrappers convert teamStats (from cache) into the format expected by the original functions

/**
 * Build standings data from teamStats object
 * Returns object mapping team name to standing (1-8)
 */
function getStandingsFromTeamStats(teamStats) {
  var standings = {};

  // Sort teams by standings (using compareTeamsByStandings function from LeagueUtility.js)
  var teamOrder = [];
  for (var teamName in teamStats) {
    if (teamStats[teamName].gamesPlayed > 0) {
      teamOrder.push(teamName);
    }
  }

  teamOrder.sort(function(teamA, teamB) {
    return compareTeamsByStandings(teamA, teamB, teamStats);
  });

  // Assign standings (1-8)
  for (var i = 0; i < teamOrder.length; i++) {
    standings[teamOrder[i]] = i + 1;
  }

  return standings;
}

/**
 * Convert teamStats to teamData format
 * Extracts gamesPlayed, wins, losses, winPct
 */
function convertTeamStatsToTeamData(teamStats) {
  var teamData = {};

  for (var teamName in teamStats) {
    var stats = teamStats[teamName];
    teamData[teamName] = {
      gamesPlayed: stats.gamesPlayed || 0,
      wins: stats.wins || 0,
      losses: stats.losses || 0,
      winPct: stats.gamesPlayed > 0 ? (stats.wins / stats.gamesPlayed) : 0
    };
  }

  return teamData;
}

/**
 * Calculate Team Success using cached teamStats
 */
function calculateTeamSuccess(player, teamStats) {
  // Convert teamStats to the formats expected by the original function
  var teamData = convertTeamStatsToTeamData(teamStats);
  var standingsData = getStandingsFromTeamStats(teamStats);

  // Read postseason data (still from sheet - not cached)
  var postseasonData = getPostseasonData();

  // Call internal function
  return calculateTeamSuccessInternal(player, teamData, standingsData, postseasonData);
}

/**
 * Calculate Play Time using cached teamStats
 */
function calculatePlayTime(player, teamStats, lineupData) {
  // Convert teamStats to teamData format
  var teamData = convertTeamStatsToTeamData(teamStats);

  // Call internal function
  return calculatePlayTimeInternal(player, teamData, lineupData);
}

/**
 * Calculate Performance using cached teamStats
 */
function calculatePerformance(player, leagueStats, teamStats, draftValue) {
  // Build standings data from teamStats
  var standingsData = getStandingsFromTeamStats(teamStats);

  // Call internal function
  return calculatePerformanceInternal(player, leagueStats, standingsData, draftValue);
}
