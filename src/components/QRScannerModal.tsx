import React, { useState, useEffect, useRef } from "react";
import jsQR from "jsqr";
import { supabase } from "../supabase";
import { Profile } from "../types";
import {
  X,
  Camera,
  QrCode,
  AlertCircle,
  Check,
  Search,
  Sparkles,
  RefreshCw,
  Award
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (profile: Profile) => void;
  squareText: string;
}

export default function QRScannerModal({
  isOpen,
  onClose,
  onScanSuccess,
  squareText,
}: QRScannerModalProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanningActive, setScanningActive] = useState(false);
  const [alumniList, setAlumniList] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSimAlum, setSelectedSimAlum] = useState<string>("");
  const [successScan, setSuccessScan] = useState<Profile | null>(null);
  const [isDecoding, setIsDecoding] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestRef = useRef<number | null>(null);

  // Fetch registered alumni for the simulator
  useEffect(() => {
    if (isOpen) {
      const fetchAlumni = async () => {
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .order("first_name", { ascending: true });
          if (data) {
            setAlumniList(data as Profile[]);
          }
        } catch (err) {
          console.error("Error fetching alumni:", err);
        }
      };
      fetchAlumni();
    }
  }, [isOpen]);

  // Handle Camera initialization and QR scanning loop
  useEffect(() => {
    if (isOpen && !successScan) {
      setCameraError(null);
      setIsDecoding(true);
      
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: "environment" } })
        .then((mediaStream) => {
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
            videoRef.current.setAttribute("playsinline", "true"); // required to play inline on iOS
            videoRef.current.play().catch((err) => {
              console.log("Webcam play interrupted or aborted gracefully:", err);
            });
            setScanningActive(true);
          }
        })
        .catch((err) => {
          console.error("Camera getUserMedia error:", err);
          setCameraError(
            "Webcam permission denied or unavailable. Please use the simulator below to test scanning!"
          );
          setScanningActive(false);
        });
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, successScan]);

  // jsQR decoding loop
  useEffect(() => {
    if (scanningActive && isOpen && !successScan) {
      const scanFrame = () => {
        if (!videoRef.current || !canvasRef.current || !scanningActive) {
          requestRef.current = requestAnimationFrame(scanFrame);
          return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        if (video.readyState === video.HAVE_ENOUGH_DATA && context) {
          canvas.width = 300;
          canvas.height = 300;
          
          // Draw video frame to canvas
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          
          // Attempt QR decoding
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code) {
            const rawData = code.data.trim();
            console.log("Successfully decoded QR Code:", rawData);
            
            // Extract Alum ID or Email from scanned data
            let lookupIdOrEmail = rawData;
            if (rawData.startsWith("cs_alum:")) {
              lookupIdOrEmail = rawData.replace("cs_alum:", "");
            }

            handleLookupAndSuccess(lookupIdOrEmail);
            return; // Exit loop on success
          }
        }

        requestRef.current = requestAnimationFrame(scanFrame);
      };

      requestRef.current = requestAnimationFrame(scanFrame);
    }

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [scanningActive, isOpen, successScan]);

  const stopCamera = () => {
    setScanningActive(false);
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleLookupAndSuccess = async (idOrEmail: string) => {
    stopCamera();
    setIsDecoding(false);
    
    try {
      // Lookup profile in DB
      let query = supabase.from("profiles").select("*");
      if (idOrEmail.includes("@")) {
        query = query.eq("email", idOrEmail);
      } else {
        query = query.eq("id", idOrEmail);
      }
      
      const { data, error } = await query.single();
      if (data) {
        setSuccessScan(data as Profile);
        setTimeout(() => {
          onScanSuccess(data as Profile);
          handleCloseReset();
        }, 2200);
      } else {
        setCameraError("Scanned QR is valid, but no matching CodeSapiens alumnus profile was found.");
        // Resume scan after 3s error visibility
        setTimeout(() => {
          setCameraError(null);
          setScanningActive(true);
        }, 3000);
      }
    } catch (err) {
      setCameraError("Scan lookup failed. Please try again.");
    }
  };

  const handleSimulateScan = () => {
    if (!selectedSimAlum) return;
    const found = alumniList.find((p) => p.id === selectedSimAlum);
    if (found) {
      handleLookupAndSuccess(found.id);
    }
  };

  const handleCloseReset = () => {
    stopCamera();
    setSuccessScan(null);
    setCameraError(null);
    setSelectedSimAlum("");
    setSearchQuery("");
    onClose();
  };

  if (!isOpen) return null;

  const filteredAlumni = alumniList.filter((p) => {
    const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
    const company = (p.company || "").toLowerCase();
    const role = (p.current_role || "").toLowerCase();
    const search = searchQuery.toLowerCase();
    return fullName.includes(search) || company.includes(search) || role.includes(search);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="glow-card w-full max-w-lg rounded-3xl border border-brand-neon/20 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-brand-neon animate-pulse" />
            <h3 className="text-lg font-display font-black text-white">QR Connect Scanner</h3>
          </div>
          <button
            onClick={handleCloseReset}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* Target Square info */}
          <div className="p-3.5 bg-brand-neon/5 border border-brand-neon/20 rounded-2xl">
            <p className="text-[10px] font-mono uppercase tracking-wider text-brand-neon">Scanning For Board Requirement:</p>
            <p className="text-sm font-display font-bold text-white mt-1">"{squareText}"</p>
          </div>

          {/* Scanner view */}
          <div className="relative aspect-video w-full rounded-2xl bg-black overflow-hidden border border-white/10 flex flex-col items-center justify-center">
            
            {successScan ? (
              // Scan Successful Screen
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 z-20 bg-[#092315] flex flex-col items-center justify-center p-4 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-brand-neon text-black flex items-center justify-center mb-4 shadow-xl">
                  <Check className="w-9 h-9 stroke-[3]" />
                </div>
                <h4 className="text-xl font-display font-black text-white">Connection Logged!</h4>
                <p className="text-sm text-brand-neon font-bold mt-1 font-mono uppercase tracking-wider">
                  Met: {successScan.first_name} {successScan.last_name}
                </p>
                <p className="text-xs text-slate-400 mt-2 max-w-xs">
                  {successScan.current_role} at {successScan.company || "CodeSapiens Alum"}
                </p>
              </motion.div>
            ) : null}

            {/* Video feed element */}
            <video
              ref={videoRef}
              className={`w-full h-full object-cover ${cameraError ? "hidden" : "block"}`}
            />
            
            {/* Hidden canvas used for frame capture */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Scanning overlays and visual effects */}
            {!cameraError && !successScan && (
              <div className="absolute inset-0 pointer-events-none z-10 flex flex-col items-center justify-center">
                {/* Neon Target corner brackets */}
                <div className="relative w-44 h-44 border border-brand-neon/20">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-brand-neon rounded-tl-md" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-brand-neon rounded-tr-md" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-brand-neon rounded-bl-md" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-brand-neon rounded-br-md" />
                  
                  {/* Laser line beam animation */}
                  <div className="absolute left-0 w-full h-0.5 bg-brand-neon/80 shadow-[0_0_10px_#8CE825] top-0 animate-[bounce_2s_infinite]" />
                </div>
                
                <span className="text-[10px] bg-black/75 px-3 py-1 rounded-full border border-white/10 text-slate-300 font-mono tracking-widest mt-4 uppercase">
                  Align Alum's QR Code
                </span>
              </div>
            )}

            {/* Camera Error Message fallback */}
            {cameraError && !successScan && (
              <div className="p-6 text-center text-slate-400 flex flex-col items-center gap-3">
                <Camera className="w-10 h-10 text-slate-500 animate-pulse" />
                <p className="text-xs max-w-xs font-medium leading-relaxed">{cameraError}</p>
              </div>
            )}
          </div>

          {/* Simulator Panel (The backup option that is highly interactive) */}
          <div className="border-t border-white/5 pt-5 space-y-4">
            <div className="flex items-center gap-2 text-slate-300">
              <Sparkles className="w-4 h-4 text-brand-neon" />
              <span className="text-xs font-display font-bold uppercase tracking-wider">Meetup QR Simulator</span>
            </div>
            
            <p className="text-[11px] text-slate-400 leading-normal">
              No secondary device or webcam? No problem! Use this simulator to search and select the alumnus you met to log your connection:
            </p>

            <div className="space-y-3">
              {/* Search input inside simulator */}
              <div className="relative font-sans">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Filter attendees by name, role, or college..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-black/30 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-brand-neon focus:ring-1 focus:ring-brand-neon/10"
                />
              </div>

              {/* Selector */}
              <div className="flex gap-2">
                <select
                  value={selectedSimAlum}
                  onChange={(e) => setSelectedSimAlum(e.target.value)}
                  className="flex-1 px-3 py-2 bg-black/40 border border-white/10 text-white text-xs rounded-xl focus:outline-none focus:border-brand-neon"
                >
                  <option value="">-- Choose Attendee --</option>
                  {filteredAlumni.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.first_name} {p.last_name} ({p.company || "Alum"})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleSimulateScan}
                  disabled={!selectedSimAlum}
                  className="px-4 py-2 bg-brand-neon hover:bg-[#8CE825] text-black font-display font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  Scan
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Footer info text */}
        <div className="p-4 bg-black/20 border-t border-white/5 text-center">
          <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
            CodeSapiens Meetup Connectivity Network
          </p>
        </div>
      </motion.div>
    </div>
  );
}
