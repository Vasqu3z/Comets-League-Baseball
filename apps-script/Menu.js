// ===== MENU MODULE =====
// Core functionality: Navigation Bar Menu

// ===== MENU =====
function onOpen() {
  var ui = SpreadsheetApp.getUi();

  // Player Stats Menu (League Hub operations)
  ui.createMenu('📊 Player Stats')
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
  ui.createMenu('📝 Editing Tools')
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