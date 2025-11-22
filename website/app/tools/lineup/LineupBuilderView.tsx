'use client';

import { useState, useEffect, useMemo } from 'react';
import { ChemistryMatrix } from '@/lib/sheets';
import PlayerSelectModal from '@/components/PlayerSelectModal';
import FadeIn from '@/components/animations/FadeIn';
import LiveStatsIndicator from '@/components/LiveStatsIndicator';
import SurfaceCard from '@/components/SurfaceCard';

interface Props {
  chemistryMatrix: ChemistryMatrix;
  playerNames: string[];
}

const POSITIVE_MIN = 100;
const NEGATIVE_MAX = -100;

const POSITIONS = [
  { id: 0, label: 'P', name: 'Pitcher', x: 50, y: 63 },
  { id: 1, label: 'C', name: 'Catcher', x: 50, y: 78 },
  { id: 2, label: '1B', name: 'First Base', x: 72, y: 72 },
  { id: 3, label: '2B', name: 'Second Base', x: 65, y: 50 },
  { id: 4, label: '3B', name: 'Third Base', x: 28, y: 72 },
  { id: 5, label: 'SS', name: 'Shortstop', x: 35, y: 50 },
  { id: 6, label: 'LF', name: 'Left Field', x: 15, y: 25 },
  { id: 7, label: 'CF', name: 'Center Field', x: 50, y: 15 },
  { id: 8, label: 'RF', name: 'Right Field', x: 85, y: 25 },
];

interface SavedLineup {
  name: string;
  players: (string | null)[]; // Field positions
  battingOrder: (string | null)[]; // Batting order 1-9
  chemistry: number;
  timestamp: number;
}

export default function LineupBuilderView({ chemistryMatrix, playerNames }: Props) {
  const [lineup, setLineup] = useState<(string | null)[]>(Array(9).fill(null));
  const [battingOrder, setBattingOrder] = useState<(string | null)[]>(Array(9).fill(null));
  const [savedLineups, setSavedLineups] = useState<SavedLineup[]>([]);
  const [draggedPlayer, setDraggedPlayer] = useState<string | null>(null);
  const [draggedFromPosition, setDraggedFromPosition] = useState<number | null>(null);
  const [draggedFromBattingOrder, setDraggedFromBattingOrder] = useState<number | null>(null);
  const [saveLineupName, setSaveLineupName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importText, setImportText] = useState('');
  const [isPlayerSelectOpen, setIsPlayerSelectOpen] = useState(false);
  const [selectingPosition, setSelectingPosition] = useState<number | null>(null);
  const [selectingBattingSlot, setSelectingBattingSlot] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load saved lineups from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('clb-saved-lineups');
    if (saved) {
      try {
        setSavedLineups(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load saved lineups:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (!statusMessage) return;
    const timeout = setTimeout(() => setStatusMessage(null), 4000);
    return () => clearTimeout(timeout);
  }, [statusMessage]);

  const showStatusMessage = (type: 'success' | 'error', message: string) => {
    setStatusMessage({ type, message });
  };

  // Calculate total chemistry
  const totalChemistry = useMemo(() => {
    const players = lineup.filter((p): p is string => p !== null);
    let total = 0;

    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const player1 = players[i];
        const player2 = players[j];
        const value = chemistryMatrix[player1]?.[player2] || 0;
        total += value;
      }
    }

    return total;
  }, [lineup, chemistryMatrix]);

  // Get chemistry connections for visualization
  const chemistryConnections = useMemo(() => {
    const connections: Array<{
      pos1: number;
      pos2: number;
      value: number;
      type: 'positive' | 'negative' | 'neutral';
    }> = [];

    for (let i = 0; i < lineup.length; i++) {
      for (let j = i + 1; j < lineup.length; j++) {
        const player1 = lineup[i];
        const player2 = lineup[j];

        if (!player1 || !player2) continue;

        const value = chemistryMatrix[player1]?.[player2] || 0;

        if (value !== 0) {
          const type =
            value >= POSITIVE_MIN ? 'positive' : value <= NEGATIVE_MAX ? 'negative' : 'neutral';

          if (type !== 'neutral') {
            connections.push({ pos1: i, pos2: j, value, type });
          }
        }
      }
    }

    return connections;
  }, [lineup, chemistryMatrix]);

  // Get available players (not in lineup or batting order)
  const availablePlayers = playerNames.filter(name => !lineup.includes(name) && !battingOrder.includes(name));

  // Drag handlers
  const handleDragStart = (
    event: React.DragEvent,
    player: string,
    fromPosition?: number,
    fromBattingOrder?: number
  ) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', player);
    setDraggedPlayer(player);
    setDraggedFromPosition(fromPosition ?? null);
    setDraggedFromBattingOrder(fromBattingOrder ?? null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnPosition = (position: number) => {
    if (!draggedPlayer) return;

    const newLineup = [...lineup];
    const newBattingOrder = [...battingOrder];

    // If dragging from another position, clear that position
    if (draggedFromPosition !== null) {
      newLineup[draggedFromPosition] = null;
    }

    // If dragging from batting order, clear that slot
    if (draggedFromBattingOrder !== null) {
      newBattingOrder[draggedFromBattingOrder] = null;
    }

    // Place player in field position
    newLineup[position] = draggedPlayer;

    // Auto-add to batting order if not already in it
    if (!newBattingOrder.includes(draggedPlayer)) {
      const nextAvailableSlot = newBattingOrder.findIndex(p => p === null);
      if (nextAvailableSlot !== -1) {
        newBattingOrder[nextAvailableSlot] = draggedPlayer;
      }
    }

    setLineup(newLineup);
    setBattingOrder(newBattingOrder);
    setDraggedPlayer(null);
    setDraggedFromPosition(null);
    setDraggedFromBattingOrder(null);
  };

  const handleDropOnBattingOrder = (position: number) => {
    if (!draggedPlayer) return;

    const newLineup = [...lineup];
    const newBattingOrder = [...battingOrder];

    // If dragging from field position, clear that position
    if (draggedFromPosition !== null) {
      newLineup[draggedFromPosition] = null;
    }

    // If dragging from another batting order slot, clear that slot
    if (draggedFromBattingOrder !== null) {
      newBattingOrder[draggedFromBattingOrder] = null;
    }

    // Place player in batting order
    newBattingOrder[position] = draggedPlayer;

    // Auto-add to field if not already in it (place in next available position)
    if (!newLineup.includes(draggedPlayer)) {
      const nextAvailablePosition = newLineup.findIndex(p => p === null);
      if (nextAvailablePosition !== -1) {
        newLineup[nextAvailablePosition] = draggedPlayer;
      }
    }

    setLineup(newLineup);
    setBattingOrder(newBattingOrder);
    setDraggedPlayer(null);
    setDraggedFromPosition(null);
    setDraggedFromBattingOrder(null);
  };

  const handleRemoveFromPosition = (position: number) => {
    const player = lineup[position];
    if (!player) return;

    const newLineup = [...lineup];
    const newBattingOrder = [...battingOrder];

    // Remove from field
    newLineup[position] = null;

    // Also remove from batting order
    const battingIndex = newBattingOrder.indexOf(player);
    if (battingIndex !== -1) {
      newBattingOrder[battingIndex] = null;
    }

    setLineup(newLineup);
    setBattingOrder(newBattingOrder);
  };

  const handleRemoveFromBattingOrder = (position: number) => {
    const player = battingOrder[position];
    if (!player) return;

    const newLineup = [...lineup];
    const newBattingOrder = [...battingOrder];

    // Remove from batting order
    newBattingOrder[position] = null;

    // Also remove from field
    const fieldIndex = newLineup.indexOf(player);
    if (fieldIndex !== -1) {
      newLineup[fieldIndex] = null;
    }

    setLineup(newLineup);
    setBattingOrder(newBattingOrder);
  };

  const handleClearLineup = () => {
    setLineup(Array(9).fill(null));
    setBattingOrder(Array(9).fill(null));
  };

  const handleSaveLineup = () => {
    if (!saveLineupName.trim()) return;

    const newSavedLineup: SavedLineup = {
      name: saveLineupName.trim(),
      players: [...lineup],
      battingOrder: [...battingOrder],
      chemistry: totalChemistry,
      timestamp: Date.now(),
    };

    const updatedLineups = [...savedLineups, newSavedLineup];
    setSavedLineups(updatedLineups);
    localStorage.setItem('clb-saved-lineups', JSON.stringify(updatedLineups));

    setSaveLineupName('');
    setShowSaveDialog(false);
    showStatusMessage('success', 'Lineup saved to your browser.');
  };

  const handleLoadLineup = (savedLineup: SavedLineup) => {
    setLineup([...savedLineup.players]);
    setBattingOrder([...savedLineup.battingOrder]);
  };

  const handleDeleteLineup = (index: number) => {
    const updatedLineups = savedLineups.filter((_, i) => i !== index);
    setSavedLineups(updatedLineups);
    localStorage.setItem('clb-saved-lineups', JSON.stringify(updatedLineups));
    showStatusMessage('success', 'Saved lineup deleted.');
  };

  const handleExport = async () => {
    const exportData = {
      name: 'Exported Lineup',
      players: lineup,
      battingOrder: battingOrder,
      chemistry: totalChemistry,
      timestamp: Date.now(),
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    try {
      await navigator.clipboard.writeText(jsonString);
      showStatusMessage('success', 'Lineup copied to clipboard!');
    } catch {
      showStatusMessage('error', 'Unable to copy lineup. Please try again.');
    }
  };

  const handleImport = () => {
    try {
      const imported = JSON.parse(importText);
      if (imported.players && Array.isArray(imported.players)) {
        setLineup(imported.players);
        setBattingOrder(imported.battingOrder || Array(9).fill(null));
        setShowImportDialog(false);
        setImportText('');
        showStatusMessage('success', 'Lineup imported successfully.');
      } else {
        showStatusMessage('error', 'Invalid lineup format.');
      }
    } catch (e) {
      showStatusMessage('error', 'Failed to import lineup. Please check the format.');
    }
  };

  // Modal handlers
  const handleOpenPositionSelect = (position: number) => {
    setSelectingPosition(position);
    setSelectingBattingSlot(null);
    setIsPlayerSelectOpen(true);
  };

  const handleOpenBattingSlotSelect = (slot: number) => {
    setSelectingBattingSlot(slot);
    setSelectingPosition(null);
    setIsPlayerSelectOpen(true);
  };

  const handlePlayerSelected = (player: string) => {
    const newLineup = [...lineup];
    const newBattingOrder = [...battingOrder];

    if (selectingPosition !== null) {
      // Add to field position
      newLineup[selectingPosition] = player;

      // Auto-add to batting order if not already in it
      if (!newBattingOrder.includes(player)) {
        const nextAvailableSlot = newBattingOrder.findIndex(p => p === null);
        if (nextAvailableSlot !== -1) {
          newBattingOrder[nextAvailableSlot] = player;
        }
      }
    } else if (selectingBattingSlot !== null) {
      // Add to batting order
      newBattingOrder[selectingBattingSlot] = player;

      // Auto-add to field if not already in it
      if (!newLineup.includes(player)) {
        const nextAvailablePosition = newLineup.findIndex(p => p === null);
        if (nextAvailablePosition !== -1) {
          newLineup[nextAvailablePosition] = player;
        }
      }
    }

    setLineup(newLineup);
    setBattingOrder(newBattingOrder);
    setSelectingPosition(null);
    setSelectingBattingSlot(null);
  };

  const handleCloseModal = () => {
    setIsPlayerSelectOpen(false);
    setSelectingPosition(null);
    setSelectingBattingSlot(null);
  };

  // Get modal title based on what's being selected
  const modalTitle = selectingPosition !== null
    ? `Select ${POSITIONS[selectingPosition].name}`
    : selectingBattingSlot !== null
    ? `Select Batter #${selectingBattingSlot + 1}`
    : '';

  return (
    <div className="space-y-8">
      <FadeIn delay={0.1} direction="up">
        <div className="relative">
          {/* Baseball stitching accent */}
          <div className="absolute -left-4 top-0 w-1 h-24 bg-gradient-to-b from-solar-gold/50 to-transparent rounded-full" />

          <h1 className="text-4xl lg:text-5xl font-display font-bold mb-3 bg-gradient-to-r from-solar-gold via-comet-yellow to-nebula-orange bg-clip-text text-transparent drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
            Lineup Builder
          </h1>
          <p className="text-star-gray font-mono text-lg mb-3">
            Click on positions to select players and build your optimal lineup with chemistry visualization
          </p>
          <LiveStatsIndicator />
        </div>
      </FadeIn>

      <FadeIn delay={0.2} direction="up">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Baseball Field */}
          <div className="xl:col-span-2 space-y-6">
            <SurfaceCard className="p-6">
              {/* Chemistry Score */}
              <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-display font-bold text-star-white">
                    Team Chemistry:
                    <span className={`ml-2 ${
                      totalChemistry > 0 ? 'text-green-400' : totalChemistry < 0 ? 'text-red-400' : 'text-star-gray'
                    }`}>
                      {totalChemistry > 0 ? '+' : ''}{totalChemistry}
                    </span>
                  </h2>
                  <p className="text-sm text-star-gray font-mono">
                    {lineup.filter(p => p !== null).length}/9 field positions filled
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleExport}
                    disabled={lineup.filter(p => p !== null).length === 0}
                    className="px-4 py-2 bg-green-500/20 text-green-400 border border-green-400/50 rounded-lg hover:bg-green-500/30 disabled:bg-space-blue/20 disabled:text-star-dim disabled:border-cosmic-border disabled:cursor-not-allowed font-display font-semibold transition-all duration-300"
                  >
                    📋 Export
                  </button>
                  <button
                    onClick={() => setShowImportDialog(true)}
                    className="px-4 py-2 bg-nebula-cyan/20 text-nebula-cyan border border-nebula-cyan/50 rounded-lg hover:bg-nebula-cyan/30 font-display font-semibold transition-all duration-300"
                  >
                    📥 Import
                  </button>
                  <button
                    onClick={() => setShowSaveDialog(true)}
                    disabled={lineup.filter(p => p !== null).length === 0}
                    className="px-4 py-2 bg-nebula-orange/20 text-nebula-orange border border-nebula-orange/50 rounded-lg hover:bg-nebula-orange/30 disabled:bg-space-blue/20 disabled:text-star-dim disabled:border-cosmic-border disabled:cursor-not-allowed font-display font-semibold transition-all duration-300"
                  >
                    💾 Save
                  </button>
                  <button
                    onClick={handleClearLineup}
                    disabled={lineup.filter(p => p !== null).length === 0 && battingOrder.filter(p => p !== null).length === 0}
                    className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-400/50 rounded-lg hover:bg-red-500/30 disabled:bg-space-blue/20 disabled:text-star-dim disabled:border-cosmic-border disabled:cursor-not-allowed font-display font-semibold transition-all duration-300"
                  >
                    🗑️ Clear
                  </button>
                </div>

                {statusMessage && (
                  <div
                    className={`w-full rounded-lg border px-4 py-3 font-mono text-sm mt-4 ${
                      statusMessage.type === 'success'
                        ? 'bg-green-500/10 border-green-400/70 text-green-100'
                        : 'bg-red-500/10 border-red-400/70 text-red-200'
                    }`}
                    role="status"
                    aria-live="polite"
                  >
                    {statusMessage.message}
                  </div>
                )}
              </div>

              {/* Baseball Field */}
              <div
                className="relative aspect-square rounded-lg p-8 border border-green-600/30 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: 'url(/Lineup%20Builder%20Template.png)' }}
              >
                {/* Chemistry Lines (SVG) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
                  {chemistryConnections.map((conn, idx) => {
                    const pos1 = POSITIONS[conn.pos1];
                    const pos2 = POSITIONS[conn.pos2];
                    const color = conn.type === 'positive' ? '#4ade80' : '#ef4444';
                    const opacity = Math.min(Math.abs(conn.value) / 500, 0.8);

                    return (
                      <line
                        key={idx}
                        x1={`${pos1.x}%`}
                        y1={`${pos1.y}%`}
                        x2={`${pos2.x}%`}
                        y2={`${pos2.y}%`}
                        stroke={color}
                        strokeWidth="3"
                        opacity={opacity}
                        strokeDasharray={conn.type === 'positive' ? '0' : '5,5'}
                      />
                    );
                  })}
                </svg>

                {/* Player Positions */}
                {POSITIONS.map(position => {
                  const player = lineup[position.id];
                  const hasChemistry = chemistryConnections.some(
                    c => c.pos1 === position.id || c.pos2 === position.id
                  );

                  return (
                    <div
                      key={position.id}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2"
                      style={{ left: `${position.x}%`, top: `${position.y}%`, zIndex: 10 }}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDropOnPosition(position.id)}
                    >
                      {player ? (
                        <div
                          draggable
                          onDragStart={event => handleDragStart(event, player, position.id)}
                          className={`
                            relative bg-space-navy/90 backdrop-blur-md rounded-lg shadow-lg px-3 py-2 cursor-move
                            border-2 transition-all hover:scale-105
                            ${hasChemistry ? 'border-comet-yellow shadow-[0_0_16px_rgba(255,210,63,0.6)]' : 'border-cosmic-border'}
                          `}
                        >
                          <div className="text-xs font-bold text-nebula-orange text-center mb-1 font-display">
                            {position.label}
                          </div>
                          <div className="text-sm font-bold text-star-white text-center whitespace-nowrap font-mono">
                            {player}
                          </div>
                          <button
                            onClick={() => handleRemoveFromPosition(position.id)}
                            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 flex items-center justify-center shadow-lg"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenPositionSelect(position.id)}
                          className="bg-space-navy/30 backdrop-blur-sm rounded-lg border-2 border-dashed border-star-gray/30 px-4 py-3 text-center hover:border-nebula-orange/50 hover:bg-space-navy/50 transition-all duration-200 cursor-pointer"
                        >
                          <div className="text-xs font-bold text-star-white font-display">{position.label}</div>
                          <div className="text-xs text-star-gray mt-1 font-mono">{position.name}</div>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </SurfaceCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Batting Order */}
            <SurfaceCard className="p-4">
              <h3 className="font-display font-bold text-lg text-star-white mb-3">
                ⚾ Batting Order <span className="text-nebula-orange">({battingOrder.filter(p => p !== null).length}/9)</span>
              </h3>
              <div className="space-y-2">
                {battingOrder.map((player, idx) => (
                  <div
                    key={idx}
                    className="relative"
                    onDragOver={handleDragOver}
                    onDrop={() => handleDropOnBattingOrder(idx)}
                  >
                    {player ? (
                      <div
                        draggable
                        onDragStart={event => handleDragStart(event, player, undefined, idx)}
                        className="bg-nebula-orange/10 border-2 border-nebula-orange/50 rounded-lg px-3 py-2 cursor-move hover:bg-nebula-orange/20 transition-all duration-200"
                      >
                        <div className="flex items-center gap-2">
                          <div className="text-xs font-bold text-nebula-orange font-display w-6">#{idx + 1}</div>
                          <div className="text-sm font-semibold text-star-white font-mono flex-1">{player}</div>
                        </div>
                        <button
                          onClick={() => handleRemoveFromBattingOrder(idx)}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 flex items-center justify-center shadow-lg"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleOpenBattingSlotSelect(idx)}
                        className="w-full bg-space-blue/20 border-2 border-dashed border-cosmic-border rounded-lg px-3 py-2 text-left hover:border-nebula-orange/50 hover:bg-space-blue/30 transition-all duration-200 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <div className="text-xs font-bold text-star-gray font-display w-6">#{idx + 1}</div>
                          <div className="text-xs text-star-dim font-mono">Click to select</div>
                        </div>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </SurfaceCard>

            {/* Saved Lineups */}
            <SurfaceCard className="p-4">
              <h3 className="font-display font-bold text-lg text-star-white mb-3">
                Saved Lineups <span className="text-nebula-orange">({savedLineups.length})</span>
              </h3>
              {savedLineups.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                  {savedLineups.map((saved, idx) => (
                    <div
                      key={idx}
                      className="bg-space-blue/30 border border-cosmic-border rounded p-3 hover:border-nebula-orange/50 transition-colors duration-200"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-display font-semibold text-star-white">{saved.name}</div>
                          <div className="text-xs text-star-gray font-mono">
                            {new Date(saved.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                        <div className={`text-sm font-bold font-mono ${
                          saved.chemistry > 0 ? 'text-green-400' : saved.chemistry < 0 ? 'text-red-400' : 'text-star-gray'
                        }`}>
                          {saved.chemistry > 0 ? '+' : ''}{saved.chemistry}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleLoadLineup(saved)}
                          className="flex-1 px-3 py-1 bg-nebula-orange/20 text-nebula-orange border border-nebula-orange/50 text-sm rounded hover:bg-nebula-orange/30 font-display font-semibold transition-all duration-200"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => handleDeleteLineup(idx)}
                          className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-400/50 text-sm rounded hover:bg-red-500/30 font-display font-semibold transition-all duration-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-star-gray text-sm italic font-mono">No saved lineups yet</p>
              )}
            </SurfaceCard>
          </div>
        </div>
      </FadeIn>

      {/* Save Dialog */}
      {showSaveDialog && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <SurfaceCard className="p-6 max-w-md w-full">
              <h3 className="text-xl font-display font-bold text-star-white mb-4">Save Lineup</h3>
              <input
                type="text"
                value={saveLineupName}
                onChange={e => setSaveLineupName(e.target.value)}
                placeholder="Enter lineup name..."
                className="w-full px-4 py-2 bg-space-blue/30 border border-cosmic-border rounded-lg text-star-white placeholder-star-gray focus:outline-none focus:ring-2 focus:ring-nebula-orange mb-4 font-mono"
                onKeyDown={e => e.key === 'Enter' && handleSaveLineup()}
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={handleSaveLineup}
                  disabled={!saveLineupName.trim()}
                  className="flex-1 px-4 py-2 bg-nebula-orange/20 text-nebula-orange border border-nebula-orange/50 rounded-lg hover:bg-nebula-orange/30 disabled:bg-space-blue/20 disabled:text-star-dim disabled:border-cosmic-border disabled:cursor-not-allowed font-display font-semibold transition-all duration-300"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowSaveDialog(false);
                    setSaveLineupName('');
                  }}
                  className="flex-1 px-4 py-2 bg-space-blue/50 text-star-gray border border-cosmic-border rounded-lg hover:bg-space-blue/70 hover:text-star-white font-display font-semibold transition-all duration-300"
                >
                  Cancel
                </button>
              </div>
            </SurfaceCard>
          </div>
      )}

      {/* Import Dialog */}
      {showImportDialog && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <SurfaceCard className="p-6 max-w-md w-full">
              <h3 className="text-xl font-display font-bold text-star-white mb-4">Import Lineup</h3>
              <textarea
                value={importText}
                onChange={e => setImportText(e.target.value)}
                placeholder="Paste lineup JSON here..."
                className="w-full h-48 px-4 py-2 bg-space-blue/30 border border-cosmic-border rounded-lg text-star-white placeholder-star-gray focus:outline-none focus:ring-2 focus:ring-nebula-cyan mb-4 font-mono text-sm"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={handleImport}
                  disabled={!importText.trim()}
                  className="flex-1 px-4 py-2 bg-nebula-cyan/20 text-nebula-cyan border border-nebula-cyan/50 rounded-lg hover:bg-nebula-cyan/30 disabled:bg-space-blue/20 disabled:text-star-dim disabled:border-cosmic-border disabled:cursor-not-allowed font-display font-semibold transition-all duration-300"
                >
                  Import
                </button>
                <button
                  onClick={() => {
                    setShowImportDialog(false);
                    setImportText('');
                  }}
                  className="flex-1 px-4 py-2 bg-space-blue/50 text-star-gray border border-cosmic-border rounded-lg hover:bg-space-blue/70 hover:text-star-white font-display font-semibold transition-all duration-300"
                >
                  Cancel
                </button>
              </div>
            </SurfaceCard>
          </div>
      )}

      {/* Player Select Modal */}
      <PlayerSelectModal
        isOpen={isPlayerSelectOpen}
        onClose={handleCloseModal}
        onSelect={handlePlayerSelected}
        availablePlayers={availablePlayers}
        title={modalTitle}
      />
    </div>
  );
}
