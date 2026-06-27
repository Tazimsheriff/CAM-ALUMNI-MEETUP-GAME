import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { Board, Profile, Score } from "../types";
import { BINGO_SQUARES } from "../data/squares";
import { useToast } from "./Toast";
import { Share2, RefreshCw, Trophy, Zap, Sparkles, Check, Flame, QrCode } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CodeSapiensMascot } from "./CodeSapiensLogo";
import QRScannerModal from "./QRScannerModal";
import MyQRModal from "./MyQRModal";

interface BingoBoardProps {
  userId: string;
  profile: Profile;
  onScoreUpdate: (score: Score) => void;
}

// Check lines helper to count active Bingos
export function checkBingos(checked: number[]): number {
  const lines = [
    // Rows
    [0, 1, 2, 3, 4],
    [5, 6, 7, 8, 9],
    [10, 11, 12, 13, 14],
    [15, 16, 17, 18, 19],
    [20, 21, 22, 23, 24],
    // Columns
    [0, 5, 10, 15, 20],
    [1, 6, 11, 16, 21],
    [2, 7, 12, 17, 22],
    [3, 8, 13, 18, 23],
    [4, 9, 14, 19, 24],
    // Diagonals
    [0, 6, 12, 18, 24],
    [4, 8, 12, 16, 20],
  ];

  let count = 0;
  for (const line of lines) {
    if (line.every((idx) => checked.includes(idx))) {
      count++;
    }
  }
  return count;
}

export default function BingoBoard({ userId, profile, onScoreUpdate }: BingoBoardProps) {
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scanningGridIndex, setScanningGridIndex] = useState<number | null>(null);
  const [showMyQR, setShowMyQR] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchOrCreateBoard();
  }, [userId]);

  const fetchOrCreateBoard = async () => {
    setLoading(true);
    try {
      // 1. Fetch board
      const { data: boardData, error: boardError } = await supabase
        .from("boards")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (boardError && boardError.code !== "PGRST116") {
        showToast("Error retrieving board: " + boardError.message, "error");
        setLoading(false);
        return;
      }

      if (boardData) {
        setBoard(boardData as Board);
        // Sync local stats to score callback
        calculateAndPublishScore(boardData.checked_indices, boardData as Board);
      } else {
        // Create new board
        await createNewBoard();
      }
    } catch (err: any) {
      showToast(err.message || "Failed to load board.", "error");
    } finally {
      setLoading(false);
    }
  };

  const shuffleSquares = (): string[] => {
    const shuffled = [...BINGO_SQUARES];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    // Return exactly 24 squares (center is free space)
    return shuffled.slice(0, 24);
  };

  const createNewBoard = async () => {
    setSaving(true);
    const shuffled = shuffleSquares();
    const initialChecked = [12]; // Center space checked by default

    const newBoard: Partial<Board> = {
      user_id: userId,
      squares: shuffled,
      checked_indices: initialChecked,
      event_name: "CodeSapiens Alumni Meetup",
    };

    try {
      const { data, error } = await supabase.from("boards").upsert(newBoard, { onConflict: "user_id" });
      if (error) {
        showToast("Error saving new board: " + error.message, "error");
      } else {
        // Retrieve the created board to get ID/dates
        const { data: boardData } = await supabase
          .from("boards")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (boardData) {
          setBoard(boardData as Board);
          showToast("A fresh Bingo board has been generated!", "success");
          await calculateAndPublishScore(initialChecked, boardData as Board);
        }
      }
    } catch (err: any) {
      showToast(err.message || "Failed to create board.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSquareClick = async (gridIndex: number) => {
    if (!board || saving) return;
    if (gridIndex === 12) {
      showToast("The center square is a Free Space!", "info");
      return;
    }

    const currentChecked = [...board.checked_indices];
    const indexLocation = currentChecked.indexOf(gridIndex);
    
    if (indexLocation > -1) {
      // Toggle off - unmarking is allowed directly
      setSaving(true);
      const nextChecked = currentChecked.filter((idx) => idx !== gridIndex);
      const updatedBoard = { ...board, checked_indices: nextChecked };
      setBoard(updatedBoard);

      try {
        const { error } = await supabase.from("boards").upsert({
          id: board.id,
          user_id: userId,
          squares: board.squares,
          checked_indices: nextChecked,
          event_name: board.event_name,
        }, { onConflict: "user_id" });

        if (error) {
          showToast("Error removing square: " + error.message, "error");
        } else {
          await calculateAndPublishScore(nextChecked, updatedBoard);
          showToast("Square unchecked successfully.", "info");
        }
      } catch (err: any) {
        showToast(err.message || "Failed to sync square.", "error");
      } finally {
        setSaving(false);
      }
    } else {
      // Toggle on - requires scanning a QR code!
      setScanningGridIndex(gridIndex);
    }
  };

  const handleScanSuccess = async (scannedProfile: Profile) => {
    if (scanningGridIndex === null || !board) return;
    const gridIndex = scanningGridIndex;

    if (scannedProfile.id === userId) {
      showToast("You cannot scan your own QR code to check off your board!", "error");
      setScanningGridIndex(null);
      return;
    }

    setSaving(true);
    const currentChecked = [...board.checked_indices];
    if (currentChecked.includes(gridIndex)) {
      setScanningGridIndex(null);
      setSaving(false);
      return;
    }

    const nextChecked = [...currentChecked, gridIndex];
    const updatedBoard = { ...board, checked_indices: nextChecked };
    setBoard(updatedBoard);

    try {
      const { error } = await supabase.from("boards").upsert({
        id: board.id,
        user_id: userId,
        squares: board.squares,
        checked_indices: nextChecked,
        event_name: board.event_name,
      }, { onConflict: "user_id" });

      if (error) {
        showToast("Error saving square connection: " + error.message, "error");
      } else {
        // Also log the connection in the connections table
        await supabase.from("connections").upsert({
          user_id: userId,
          connected_user_id: scannedProfile.id,
        }, { onConflict: "user_id,connected_user_id" });

        await calculateAndPublishScore(nextChecked, updatedBoard);
        showToast(`Connected with ${scannedProfile.first_name}! Square marked successfully!`, "success");
        
        // Dispatch meme event
        window.dispatchEvent(
          new CustomEvent("trigger-meme", {
            detail: {
              type: "scanned_others",
              otherName: `${scannedProfile.first_name} ${scannedProfile.last_name}`,
              squareText: getGridItem(gridIndex).text,
            },
          })
        );
      }
    } catch (err: any) {
      showToast(err.message || "Failed to save connection.", "error");
    } finally {
      setSaving(false);
      setScanningGridIndex(null);
    }
  };

  const calculateAndPublishScore = async (checked: number[], currentBoard: Board) => {
    // 1. Calculations
    const squaresChecked = checked.filter((idx) => idx !== 12).length;
    const points = squaresChecked * 10;
    const bingos = checkBingos(checked);

    const scoreData: Partial<Score> = {
      user_id: userId,
      points,
      bingos,
      squares_checked: squaresChecked,
      submitted_at: new Date().toISOString(),
    };

    // 2. Publish to Supabase
    try {
      const { error } = await supabase.from("scores").upsert(scoreData, { onConflict: "user_id" });
      if (error) {
        console.error("Failed to update scores database:", error);
      } else {
        // Send state back to main controller
        onScoreUpdate({
          ...scoreData,
          id: userId,
        } as Score);
      }
    } catch (err) {
      console.error("Score submission error:", err);
    }
  };

  const handleShare = () => {
    if (!board) return;
    const checkedCount = board.checked_indices.filter((idx) => idx !== 12).length;
    const pts = checkedCount * 10;
    const fullname = `${profile.first_name} ${profile.last_name}`;
    const shareMessage = `${fullname} scored ${pts} pts at the CodeSapiens Alumni Meetup Networking Bingo! #CodeSapiens #AlumniMeetup`;

    navigator.clipboard.writeText(shareMessage);
    showToast("LinkedIn sharing text copied to clipboard!", "success");
  };

  // Convert board.squares (length 24) to 5x5 grid (length 25) with index 12 as Free Space
  const getGridItem = (gridIndex: number): { text: string; isChecked: boolean } => {
    const isChecked = board?.checked_indices.includes(gridIndex) || false;

    if (gridIndex === 12) {
      return { text: "FREE CENTER SQUARE", isChecked: true };
    }

    // Map 0-11 as 0-11, 12 is skipped, 13-24 maps to 12-23 in squares array
    const squaresIndex = gridIndex < 12 ? gridIndex : gridIndex - 1;
    const text = board?.squares[squaresIndex] || "";
    return { text, isChecked };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-brand-neon border-t-transparent rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <CodeSapiensMascot className="w-8 h-8" />
          </div>
        </div>
        <p className="text-slate-400 font-display font-medium tracking-wide">Syncing Bingo card with CodeSapiens servers...</p>
      </div>
    );
  }

  const checkedCount = board?.checked_indices.filter((idx) => idx !== 12).length || 0;
  const currentPoints = checkedCount * 10;
  const currentBingos = board ? checkBingos(board.checked_indices) : 0;

  return (
    <div className="max-w-4xl mx-auto py-2 px-4 sm:px-6">
      {/* Visual Title Header with Tile Count Badges */}
      <div className="mb-6 text-center sm:text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-display font-black tracking-tight text-white flex items-center justify-center sm:justify-start gap-2">
            Networking Bingo <span className="text-brand-neon animate-pulse">✨</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Meet alumni, scan their QR codes, check off squares, and climb the leaderboard!
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-mono font-black uppercase tracking-wider bg-brand-neon/10 text-brand-neon border border-brand-neon/30">
            🎓 16 Student Memes
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-mono font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            💻 24 Developer Memes
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-mono font-black uppercase tracking-wider bg-white/5 text-white border border-white/10">
            🎲 40 Total Tiles
          </span>
        </div>
      </div>

      {/* Top Interactive Score Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="glow-card rounded-2xl p-4 shadow-xl flex items-center gap-4 border border-brand-green/20">
          <div className="w-12 h-12 rounded-xl bg-brand-green/20 text-brand-neon flex items-center justify-center border border-brand-neon/30">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <p className="text-2xl font-display font-black text-white">{currentPoints} pts</p>
            <p className="text-[10px] font-display font-bold text-slate-400 uppercase tracking-wider">My Current Score</p>
          </div>
        </div>

        <div className="glow-card rounded-2xl p-4 shadow-xl flex items-center gap-4 border border-brand-green/20">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-400/20">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-display font-black text-white">{currentBingos} Lines</p>
            <p className="text-[10px] font-display font-bold text-slate-400 uppercase tracking-wider">Active Bingos</p>
          </div>
        </div>

        <div className="glow-card rounded-2xl p-4 shadow-xl flex items-center gap-4 border border-brand-green/20">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-400/20">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-display font-black text-white">{checkedCount}/24</p>
            <p className="text-[10px] font-display font-bold text-slate-400 uppercase tracking-wider">Connections Logged</p>
          </div>
        </div>
      </div>

      {/* Main Bingo Grid */}
      <div className="glow-card rounded-3xl border border-white/5 p-4 sm:p-6 mb-6 shadow-2xl relative overflow-hidden">
        {/* Subtle grid beam overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-brand-neon/5 to-transparent pointer-events-none" />
        
        <div className="grid grid-cols-5 gap-1.5 sm:gap-3 sm:aspect-square max-w-2xl mx-auto relative z-10">
          {Array.from({ length: 25 }).map((_, gridIndex) => {
            const { text, isChecked } = getGridItem(gridIndex);
            const isCenter = gridIndex === 12;

            return (
              <motion.button
                key={gridIndex}
                onClick={() => handleSquareClick(gridIndex)}
                whileHover={{ scale: isCenter ? 1.03 : 1.02 }}
                whileTap={{ scale: isCenter ? 0.97 : 0.98 }}
                className={`relative rounded-xl flex flex-col items-center justify-center p-1 sm:p-2.5 text-center transition-all cursor-pointer overflow-hidden border min-h-[75px] sm:min-h-0 ${
                  isCenter
                    ? "bg-gradient-to-br from-brand-neon/20 via-brand-green/30 to-brand-deep border-brand-neon text-white shadow-lg shadow-brand-neon/10"
                    : isChecked
                    ? "bingo-glow-active text-white font-semibold"
                    : "bg-black/30 border-white/5 hover:bg-white/5 hover:border-brand-neon/40 text-slate-300"
                }`}
                id={`bingo-cell-${gridIndex}`}
              >
                {/* Cell Number Marker for high polish */}
                <span
                  className={`absolute top-1 left-1.5 text-[7px] sm:text-[9px] font-display font-bold ${
                    isCenter ? "text-brand-neon" : isChecked ? "text-emerald-300" : "text-slate-500"
                  }`}
                >
                  {gridIndex + 1}
                </span>

                {/* Main Text Content */}
                <div className="w-full h-full flex flex-col items-center justify-center pt-1 sm:pt-2">
                  {isCenter ? (
                    <div className="flex flex-col items-center justify-center">
                      <CodeSapiensMascot className="w-7 h-7 sm:w-14 sm:h-14 mb-0.5 animate-bounce" />
                      <span className="text-[6px] sm:text-[10px] font-display font-black tracking-widest text-brand-neon uppercase">
                        FREE CENTER
                      </span>
                    </div>
                  ) : (
                    <span className="text-[7px] sm:text-[9px] md:text-[11px] leading-tight font-medium tracking-tight line-clamp-4">
                      {text}
                    </span>
                  )}
                </div>

                {/* Corner Checkmark Accent */}
                {isChecked && !isCenter && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute bottom-0.5 right-0.5 bg-brand-neon text-black rounded-full p-0.5 shadow-md"
                  >
                    <Check className="w-2 h-2 sm:w-3 sm:h-3 stroke-[3]" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Grid Controls (Share, QR, and Shuffle) */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-3.5 mb-8">
        <button
          onClick={() => setShowMyQR(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 py-3.5 px-6 bg-brand-neon hover:bg-[#8CE825] text-black font-display font-black uppercase text-xs tracking-wider rounded-2xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
        >
          <QrCode className="w-4 h-4" />
          Show My QR Code
        </button>

        <button
          onClick={handleShare}
          className="w-full sm:w-auto flex items-center justify-center gap-2 py-3.5 px-6 bg-[#1D9E75] hover:bg-[#22C55E] text-white font-display font-bold uppercase text-xs tracking-wider rounded-2xl shadow-md transition-all active:scale-[0.98] cursor-pointer border-b-4 border-emerald-800"
        >
          <Share2 className="w-4 h-4 text-brand-neon" />
          Share Score to LinkedIn
        </button>

        <button
          onClick={createNewBoard}
          disabled={saving}
          className="w-full sm:w-auto flex items-center justify-center gap-2 py-3.5 px-6 bg-black/40 border border-white/10 text-slate-300 hover:text-white font-display font-bold uppercase text-xs tracking-wider rounded-2xl shadow-sm hover:bg-white/5 transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-brand-neon ${saving ? "animate-spin" : ""}`} />
          Generate New Board
        </button>
      </div>

      {/* Rules Notice */}
      <div className="bg-brand-neon/10 border border-brand-neon/30 rounded-2xl p-4 text-xs text-brand-neon flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-brand-neon shrink-0 mt-0.5 animate-pulse" />
        <div>
          <span className="font-bold">Mingle Rules:</span> Walk around and meet alumni! Click any square on your board, and scan their personal QR code to check off that square. Complete rows, columns, or diagonals to claim <span className="font-extrabold uppercase text-white">Bingo!</span>
        </div>
      </div>

      {/* QR Modals */}
      <AnimatePresence>
        {scanningGridIndex !== null && (
          <QRScannerModal
            isOpen={scanningGridIndex !== null}
            onClose={() => setScanningGridIndex(null)}
            onScanSuccess={handleScanSuccess}
            squareText={getGridItem(scanningGridIndex).text}
          />
        )}
        
        {showMyQR && (
          <MyQRModal
            isOpen={showMyQR}
            onClose={() => setShowMyQR(false)}
            profile={profile}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
