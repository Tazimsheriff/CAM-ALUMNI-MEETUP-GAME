import React, { useEffect } from "react";
import { X, QrCode, Sparkles, Download, Smartphone } from "lucide-react";
import { Profile } from "../types";
import { motion } from "motion/react";
import { BINGO_SQUARES } from "../data/squares";

interface MyQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
}

const MOCK_NAMES = [
  "Siddharth Shah", "Meera Nair", "Arjun Reddy", "Tanvi Rao", 
  "Kunal Kapoor", "Aditi Deshmukh", "Yash Wardhan", "Riya Sen",
  "Devendra Patil", "Shreya Ghoshal", "Aarav Mehta", "Ishita Dutta"
];

export default function MyQRModal({ isOpen, onClose, profile }: MyQRModalProps) {
  // No automatic trigger or simulate button
  useEffect(() => {
    // Disabled simulation trigger on tab change/mount to keep interaction purely manual or standard scanner-based.
  }, [isOpen]);

  const triggerMockScan = () => {
    // No-op or keep for type safety if referenced, though unused.
  };

  if (!isOpen) return null;

  // Personal QR data format
  const qrData = `cs_alum:${profile.id}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glow-card w-full max-w-sm rounded-3xl border border-brand-neon/20 shadow-2xl p-6 relative overflow-hidden text-center"
      >
        {/* Decorative corner glow */}
        <div className="absolute -top-12 -left-12 w-24 h-24 rounded-full bg-brand-neon/10 blur-xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-24 h-24 rounded-full bg-brand-neon/10 blur-xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center gap-1.5 mb-5 mt-2">
          <div className="w-10 h-10 rounded-xl bg-brand-neon/15 flex items-center justify-center border border-brand-neon/30 text-brand-neon mb-1.5">
            <QrCode className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-display font-black text-white">My Meetup QR</h3>
          <p className="text-xs text-brand-neon font-mono uppercase tracking-widest flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" /> CodeSapiens Attendee ID
          </p>
        </div>

        {/* QR Code Graphic Frame */}
        <div className="relative mx-auto bg-white p-4.5 rounded-2xl inline-block shadow-2xl border-4 border-[#092315] select-none">
          <img
            src={qrUrl}
            alt={`${profile.first_name}'s Meetup QR Code`}
            referrerPolicy="no-referrer"
            className="w-48 h-48 block"
          />
        </div>

        {/* Attendee Card details */}
        <div className="mt-5 space-y-1">
          <h4 className="text-lg font-display font-bold text-white">
            {profile.first_name} {profile.last_name}
          </h4>
          <p className="text-xs text-slate-400 font-medium">
            {profile.current_role || "CodeSapiens Attendee"}
          </p>
          <p className="text-[10px] text-brand-neon bg-[#092315] inline-block px-2.5 py-0.5 rounded-full font-mono border border-brand-neon/20 font-bold mt-1">
            {profile.company || "Alumni Member"}
          </p>
        </div>

        {/* Helper guide */}
        <p className="text-[11px] text-slate-400 leading-relaxed mt-4 border-t border-white/5 pt-3">
          Show this QR code to other alumni you connect with! They can tap any matching square on their board to scan this code and log the connection.
        </p>


      </motion.div>
    </div>
  );
}
