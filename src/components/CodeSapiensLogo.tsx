import React from "react";
import { motion } from "motion/react";

/**
 * Highly-crafted SVG Vector CodeSapiens Mascot.
 * Renders the lovable cartoon coder monkey with glasses, winking, and smiling!
 */
export function CodeSapiensMascot({ className = "w-24 h-24" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer Glow Backdrop */}
      <circle cx="100" cy="100" r="85" fill="#8CE825" fillOpacity="0.15" />
      
      {/* Monkey Ears */}
      {/* Left Ear */}
      <circle cx="45" cy="100" r="22" fill="#1e1e1e" stroke="black" strokeWidth="6" />
      <circle cx="45" cy="100" r="13" fill="#ffd1a9" />
      {/* Right Ear */}
      <circle cx="155" cy="100" r="22" fill="#1e1e1e" stroke="black" strokeWidth="6" />
      <circle cx="155" cy="100" r="13" fill="#ffd1a9" />

      {/* Head Base */}
      <circle cx="100" cy="100" r="60" fill="#1e1e1e" stroke="black" strokeWidth="6" />

      {/* Face Overlay (Heart-like curved top, rounded bottom) */}
      <path
        d="M 62 105 
           C 54 85, 78 68, 100 82 
           C 122 68, 146 85, 138 105 
           C 134 125, 122 145, 100 145 
           C 78 145, 66 125, 62 105 Z"
        fill="#ffd1a9"
        stroke="black"
        strokeWidth="4.5"
        strokeLinejoin="round"
      />

      {/* Glasses Frame (Thick Nerd Glasses) */}
      {/* Left Lens Frame */}
      <rect x="58" y="76" width="38" height="30" rx="10" fill="none" stroke="black" strokeWidth="8" />
      <rect x="58" y="76" width="38" height="30" rx="10" fill="white" fillOpacity="0.1" stroke="#8CE825" strokeWidth="2.5" />
      {/* Right Lens Frame */}
      <rect x="104" y="76" width="38" height="30" rx="10" fill="none" stroke="black" strokeWidth="8" />
      <rect x="104" y="76" width="38" height="30" rx="10" fill="white" fillOpacity="0.1" stroke="#8CE825" strokeWidth="2.5" />
      {/* Glasses Bridge */}
      <rect x="94" y="85" width="12" height="6" rx="2" fill="black" />

      {/* Eyes Inside Lenses */}
      {/* Left Eye: Big cute wide open eye with sparkle */}
      <circle cx="77" cy="91" r="7" fill="black" />
      <circle cx="75" cy="88" r="2.5" fill="white" />
      {/* Right Eye: Cute winking eye (curved line) */}
      <path
        d="M 115 94 Q 123 86 131 94"
        stroke="black"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />

      {/* Rosy Cheeks */}
      <circle cx="67" cy="113" r="5" fill="#ff9b9b" fillOpacity="0.7" />
      <circle cx="133" cy="113" r="5" fill="#ff9b9b" fillOpacity="0.7" />

      {/* Happy Open Smile with teeth */}
      <path
        d="M 82 118 C 82 118, 100 140, 118 118"
        fill="#a81c1c"
        stroke="black"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <path
        d="M 85 119 C 90 123, 110 123, 115 119"
        fill="white"
        stroke="none"
      />

      {/* Cute Monkey Hair Tuft */}
      <path
        d="M 100 40 Q 95 28 88 32 Q 97 32 100 40 Q 103 28 112 32 Q 103 32 100 40"
        fill="#1e1e1e"
        stroke="black"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />

      {/* Tiny programmer touch: Small green led glow near head (like headphones or bluetooth bead) */}
      <circle cx="43" cy="118" r="4" fill="#8CE825" className="animate-ping" />
      <circle cx="43" cy="118" r="3" fill="#8CE825" />
    </svg>
  );
}

/**
 * Beautiful full Header Banner styled precisely like the official flyer.
 * Uses Fredoka display typography, slanted ribbons, and rich green/neon color pairings.
 */
interface CodeSapiensBannerProps {
  cohortYear?: number;
}

export function CodeSapiensBanner({ cohortYear }: CodeSapiensBannerProps = {}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-6 px-4">
      {/* Floating Mascot with entry animation */}
      <motion.div
        initial={{ scale: 0.8, y: -10, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 12 }}
        className="relative z-10"
      >
        <CodeSapiensMascot className="w-28 h-28 sm:w-36 sm:h-36 drop-shadow-2xl" />
        {/* Cute Speech Bubble */}
        <div className="absolute -top-3 -right-14 bg-white text-slate-900 border-2 border-black font-display font-bold text-[10px] sm:text-xs px-2.5 py-1 rounded-xl shadow-md rotate-12 flex items-center gap-1">
          <span className="text-emerald-600">class arambikalama!! {}</span> 🐵
        </div>
      </motion.div>

      {/* Main typographic stacks */}
      <div className="relative mt-2 max-w-lg w-full">
        {/* "WELCOME TO THE" Ribbon */}
        <div className="inline-block transform -rotate-2 bg-gradient-to-r from-emerald-500 via-brand-green to-[#157355] border-3 border-black text-white font-display font-black text-sm sm:text-base px-6 py-1.5 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase tracking-wider">
          Welcome To The
        </div>

        {/* Brand Group Block */}
        <div className="mt-4 transform rotate-1 flex flex-col items-center">
          {/* "CODESAPIENS" with exact custom coloration */}
          <h2 className="font-display font-black text-4xl sm:text-5xl md:text-6xl tracking-tighter uppercase leading-none text-stroke-white flex flex-wrap justify-center items-center gap-x-2">
            <span className="text-white">CODE</span>
            <span className="text-brand-neon">SAPIENS</span>
          </h2>

          {/* "ALUMNI MEETUP" Block */}
          <div className="mt-1 transform -rotate-1 bg-white border-3 border-black px-5 py-1 rounded-xl shadow-[4px_4px_0px_0px_rgba(140,232,37,1)]">
            <h3 className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-slate-900 tracking-tight leading-none uppercase">
              ALUMNI <span className="text-[#1D9E75]">MEETUP</span>
            </h3>
          </div>

          {/* "2026" Badge */}
          <div className="mt-3.5 bg-black text-brand-neon border-2 border-brand-neon font-mono font-black text-sm sm:text-base px-4 py-1 rounded-full shadow-[0px_0px_15px_rgba(140,232,37,0.4)] tracking-widest animate-pulse">
            ★ {cohortYear || 2026} ★
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Beautiful crowd silhouette matching the bottom of the flyer.
 * Generates dynamic dark student shadows with glowing neon-green highlight lines.
 */
export function CodeSapiensCrowd() {
  return (
    <div className="relative w-full h-20 sm:h-32 overflow-hidden shrink-0 mt-auto pointer-events-none">
      {/* Glowing Neon Line overlaying the silhouettes */}
      <div className="absolute inset-x-0 bottom-0 h-[4px] bg-brand-neon shadow-[0_0_20px_#8CE825] z-10" />

      {/* Silhouettes path */}
      <svg
        className="absolute bottom-0 w-full h-full"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Subtle background glow */}
        <path
          d="M0,120 L0,80 Q120,40 240,65 T480,50 T720,70 T960,45 T1200,60 T1440,30 L1440,120 Z"
          fill="rgba(140,232,37,0.07)"
        />

        {/* Dynamic Foreground Silhouettes (student crowd partying, waving) */}
        <path
          d="M0,120 L0,75 
             C30,70 45,45 60,75 
             C80,60 110,50 130,85 
             C160,80 180,40 210,90 
             C240,75 270,30 295,95 
             C320,80 340,60 365,90 
             C390,75 420,55 450,100 
             C480,90 510,45 540,95 
             C570,80 600,60 625,95 
             C650,85 680,40 710,100 
             C740,90 770,55 800,90 
             C830,75 860,35 885,100 
             C910,80 930,65 955,90 
             C980,80 1010,45 1040,100 
             C1070,90 1100,60 1130,95 
             C1160,80 1190,40 1220,100 
             C1250,90 1280,55 1310,90 
             C1340,75 1370,30 1395,105 
             C1415,80 1430,70 1440,75 L1440,120 Z"
          fill="#05120a"
          stroke="rgba(140,232,37,0.6)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Secondary silhouette layer for parallax depth */}
        <path
          d="M0,120 L0,90 
             C50,80 90,65 140,95 
             C200,85 250,70 310,100 
             C380,90 430,75 490,105 
             C560,95 610,80 670,110 
             C740,100 790,85 850,115 
             C920,105 970,90 1030,120 
             C1100,110 1150,95 1210,125 
             C1280,115 1330,100 1390,130 
             L1440,130 L1440,120 Z"
          fill="#020804"
          opacity="0.8"
        />
      </svg>
    </div>
  );
}
