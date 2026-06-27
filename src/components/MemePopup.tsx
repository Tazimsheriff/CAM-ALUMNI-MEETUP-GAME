import React, { useState, useEffect } from "react";
import { X, Smile, MessageSquare, Flame } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Meme {
  id: string;
  title: string;
  caption: string;
  subcaption?: string;
  emoji: string;
  imageUrl: string;
  color: string; // Tailwind border/glow color class
}

// Map of the custom Giphy IDs provided by the user
const GIPHY_MEMES = {
  angry_tamil: "8KRn8myKGT9ldbGuOn",         // Angry Vadivelu / Santhanam style
  rajini_laugh: "gb7TapYMG8VvyESvGi",        // Rajini laughing / style
  tamil_vibe: "IkaDE0GmCQroeTWlCS",          // Hilarious Tamil meme expressions
  japan_karan: "relOuLGUggM0CAZ7HC",         // Santhanam "Japan karan edha edho kandupudikiran..."
  coolie_eppadi: "mlVu3JA9H3DFFxBkO8",       // "Eppadi irukinga anna" / Coolie welcoming
  confused: "u5WFTVgED8bN3OEqey",            // Confused face / expression
  rajakumaran: "pT8F2kbMQEMixw4X6o",          // Rajakumaran / disappointed style
  pushpa_raj: "toF5y94FmhJ09c23g1",          // Pushpa Raj / Santhanam swag attitude
  
  // New user added GIFs
  yaru_ivaru: "AOVQVl3RPk2ogKZayB",          // "Who is this?" / "Yaru ivaru?"
  happy_ghost: "7WSvNDFf9HyqqGXmnT",         // Indian movie happy ghost
  inna_di_idhu: "GK6tEiVdb3kPmYzfr4",        // "Inna di idhu..."
  pikachu_shock: "rFNeQUSwjzZTEKuqix",       // Pikachu shocked face Kanakaraj
  know_its_you: "kjgY3zcTDLqDdA0pLd",        // "I know it's you"
  look_camera: "7N0n6gctDvVfXznaDz",         // Looking at camera
  karunas_troll: "6lCLAKr4ABdTbke1Yb",       // Karunas CSK vs RCB troll
  trisha_smile: "NwNLEhkJ3fwYMiCQ7m",        // Trisha sweet smile
  sirichiten: "VCFiQfI6J7yCFip7Z7",          // "Sirichiten semmaya"
  thanni_kudi: "TaRhc4PLrPYtsufOu1",         // "Thanni kudi mame" (Stay hydrated)
  arr_reaction: "xdBCeanNvjJZsSpAIR",        // ARR reaction face
  rajini_walk: "1sizYfJpjOrVtPZLxE",         // Rajini style walk
  vijay_trisha: "M9lPXpEEzOwJZPowwJ",        // Vijay & Trisha TVK style
  funny_face: "sQl99b6fPevWVmxJDG",          // Comedy funny face

  // NEWEST ADDITIONS FROM THE USER
  achaa: "https://i.ibb.co/233j2mmc/achaa.webp",
  malak_valak: "l2IFtgckanCwiVtBef",
  tamil_movie_meme: "3S7dHcfGYlxvqjtHqn",
  funny_tamil_template: "u6WA0TFt0O1KAbaJ88",
  rajini_style: "1REaFimDo7SbmlyW0A",
  shocked: "D1wDNDYdAOBVnH1im3",
  watermelon_drdiwakar: "kw7prTZfSkqzEFUXIp",
  ajith_thala: "sH5Ye88rMq7MMxqVRs",
  seeman_trisha: "MBuyww6RR6s6DBQ9wM",
  nalenale: "bPHvhXrAmYEzt8uzcs",
  man_sad_funny: "vfYnXZabo2subue7G1",
  dulquer: "91kSZhdwrfZxVczOxZ",
  amala_kandupidichutane: "90X2oHBxti3QnzSDd6",
};

// Function to generate the direct Giphy source URL
function getGiphyUrl(id: string): string {
  if (id.startsWith("http")) return id;
  // We use the direct media domain by default which works fantastic in img tags
  return `https://media.giphy.com/media/${id}/giphy.gif`;
}

// Fallback Memes if no square text is present (using user's custom GIFs!)
const FALLBACK_MEMES: Meme[] = [
  {
    id: "fallback_rajini",
    title: "Vaa Thalaiva Vaa!",
    caption: "When scanning matches perfectly and the dev backend doesn't crash.",
    subcaption: "Me: *feels like a superstar* is this real life or local storage?",
    emoji: "⚡",
    imageUrl: getGiphyUrl(GIPHY_MEMES.rajini_laugh),
    color: "border-brand-neon shadow-brand-neon/20"
  },
  {
    id: "fallback_angry",
    title: "Connection Success!",
    caption: "Checking off a box with absolute confidence. Keep networking!",
    subcaption: "Me celebrating with absolute swagger.",
    emoji: "🔥",
    imageUrl: getGiphyUrl(GIPHY_MEMES.pushpa_raj),
    color: "border-emerald-500 shadow-emerald-500/20"
  },
  {
    id: "fallback_achaa",
    title: "Achaa Achaa!",
    caption: "When the connection request actually succeeds on the first try.",
    subcaption: "Achaa... nalla connect aachu!",
    emoji: "👌",
    imageUrl: getGiphyUrl(GIPHY_MEMES.achaa),
    color: "border-sky-400 shadow-sky-400/20"
  },
  {
    id: "fallback_malak_valak",
    title: "The Ultimate Pitch",
    caption: "Trying to explain your startup idea in 30 seconds at a networking meetup.",
    subcaption: "Bro: *speaks high level gibberish confidently*",
    emoji: "🗣️",
    imageUrl: getGiphyUrl(GIPHY_MEMES.malak_valak),
    color: "border-purple-500 shadow-purple-500/20"
  },
  {
    id: "fallback_thala",
    title: "God Bless You!",
    caption: "Senior blessing your code changes before merging to production.",
    subcaption: "Thala: God bless you machaa, direct live deploy panni vidu!",
    emoji: "👑",
    imageUrl: getGiphyUrl(GIPHY_MEMES.ajith_thala),
    color: "border-yellow-400 shadow-yellow-400/20"
  },
  {
    id: "fallback_kandupidichutane",
    title: "Kandupidichutane!",
    caption: "When you finally locate that one buggy line hidden in a 1000-line package.",
    subcaption: "Me: Oh my god! Kandupidichutane!",
    emoji: "💡",
    imageUrl: getGiphyUrl(GIPHY_MEMES.amala_kandupidichutane),
    color: "border-teal-400 shadow-teal-400/20"
  },
  {
    id: "fallback_dulquer",
    title: "Swag Connection",
    caption: "Walking into the meetup after completing 3 full bingo columns.",
    subcaption: "Aesthetic vibes are completely active.",
    emoji: "🕶️",
    imageUrl: getGiphyUrl(GIPHY_MEMES.dulquer),
    color: "border-indigo-400 shadow-indigo-400/20"
  }
];

function getMemeDetails(text: string): {
  title: string;
  emoji: string;
  subcaption: string;
  color: string;
  imageUrl: string;
  isStudent: boolean;
} {
  const t = text.toLowerCase();

  // Student Memes 🎓
  if (t.includes("3 months coding class") || t.includes("hello world")) {
    return {
      title: "Hello World Specialist",
      emoji: "🎓",
      subcaption: "Japan-karan edha edho kandupidikiran, naan innum hello world print panren da machaa",
      color: "border-brand-neon shadow-brand-neon/20",
      imageUrl: getGiphyUrl(GIPHY_MEMES.japan_karan),
      isStudent: true
    };
  }
  if (t.includes("dsa") || t.includes("stress")) {
    return {
      title: "The LinkedIn Solver",
      emoji: "📈",
      subcaption: "LeetCode page paakave stress aaguthu but bio la 'Problem Solver' nu heavy coding tags potruken",
      color: "border-purple-500 shadow-purple-500/20",
      imageUrl: getGiphyUrl(GIPHY_MEMES.pikachu_shock),
      isStudent: true
    };
  }
  if (t.includes("internship offer letter") || t.includes("refresh")) {
    return {
      title: "The Refresh Saga",
      emoji: "⏳",
      subcaption: "Everyday Gmail inbox refresh panren. Mail varla, but expectation mattum strong-a iruku.",
      color: "border-cyan-400 shadow-cyan-400/20",
      imageUrl: getGiphyUrl(GIPHY_MEMES.inna_di_idhu),
      isStudent: true
    };
  }
  if (t.includes("portfolio site") || t.includes("choosing font")) {
    return {
      title: "Font Selection Paralysis",
      emoji: "🎨",
      subcaption: "6 months font ready panren... background animations ready panren... code mattum ready pannala.",
      color: "border-pink-500 shadow-pink-500/20",
      imageUrl: getGiphyUrl(GIPHY_MEMES.funny_face),
      isStudent: true
    };
  }
  if (t.includes("hackathon") || t.includes("idea guy")) {
    return {
      title: "The Swagger Idea Guy",
      emoji: "🏆",
      subcaption: "Hackathon la implementation full-ah avan pannan. Prize tharumbothu front la naan ninnen!",
      color: "border-yellow-500 shadow-yellow-500/20",
      imageUrl: getGiphyUrl(GIPHY_MEMES.pushpa_raj),
      isStudent: true
    };
  }
  if (t.includes("senior") && (t.includes("referral") || t.includes("seen") || t.includes("dm poten"))) {
    return {
      title: "Eppadi Irukinga Anna?",
      emoji: "👻",
      subcaption: "Seniorku referral kettu direct DM poten. Left on seen da machaa, classic update.",
      color: "border-red-500 shadow-red-500/20",
      imageUrl: getGiphyUrl(GIPHY_MEMES.coolie_eppadi),
      isStudent: true
    };
  }
  if (t.includes("cgpa") || t.includes("filter")) {
    return {
      title: "CGPA Reality Check",
      emoji: "📋",
      subcaption: "CGPA matter panalnu naan solren. HR profile-a filter panni delete panitaanga. Who is this?!",
      color: "border-orange-500 shadow-orange-500/20",
      imageUrl: getGiphyUrl(GIPHY_MEMES.yaru_ivaru),
      isStudent: true
    };
  }
  if (t.includes("certification") || t.includes("linkedin update")) {
    return {
      title: "Certified Superstar",
      emoji: "🏆",
      subcaption: "Completed a 20-minute course. LinkedIn: 'Thrilled to share my graduating honors...'",
      color: "border-emerald-400 shadow-emerald-400/20",
      imageUrl: getGiphyUrl(GIPHY_MEMES.sirichiten),
      isStudent: true
    };
  }
  if (t.includes("mock interview") || t.includes("wifi")) {
    return {
      title: "Network Error Connection",
      emoji: "📡",
      subcaption: "Mock interview timing correct-a pathu router red light eriyuthu. Reset and repeat.",
      color: "border-slate-500 shadow-slate-500/20",
      imageUrl: getGiphyUrl(GIPHY_MEMES.pikachu_shock),
      isStudent: true
    };
  }
  if (t.includes("resume") && t.includes("3 pages")) {
    return {
      title: "The Resume Author",
      emoji: "📖",
      subcaption: "Adding Microsoft Paint and Chrome browsing under 'Core Competencies' to stretch page 3.",
      color: "border-amber-400 shadow-amber-400/20",
      imageUrl: getGiphyUrl(GIPHY_MEMES.funny_face),
      isStudent: true
    };
  }
  if (t.includes("disappeared") || t.includes("side project panrom")) {
    return {
      title: "Missing Friend Logic",
      emoji: "👻",
      subcaption: "'Side project panrom nu sonaen', he disconnected from life, server, and LinkedIn.",
      color: "border-rose-500 shadow-rose-500/20",
      imageUrl: getGiphyUrl(GIPHY_MEMES.happy_ghost),
      isStudent: true
    };
  }
  if (t.includes("contribution graph") || t.includes("commits")) {
    return {
      title: "Green Contributions",
      emoji: "🌿",
      subcaption: "Adding missing commas to README to trigger green squares on Github.",
      color: "border-green-500 shadow-green-500/20",
      imageUrl: getGiphyUrl(GIPHY_MEMES.know_its_you),
      isStudent: true
    };
  }
  if (t.includes("placement season") || t.includes("linkedin lie")) {
    return {
      title: "LinkedIn Celebrities",
      emoji: "👔",
      subcaption: "Everyone is 'extremely humbled and placed' except me who is just chilling on Giphy.",
      color: "border-indigo-500 shadow-indigo-500/20",
      imageUrl: getGiphyUrl(GIPHY_MEMES.trisha_smile),
      isStudent: true
    };
  }
  if (t.includes("deadline tomorrow") || t.includes("aaj raat")) {
    return {
      title: "Sab Theek Ho Jayega",
      emoji: "⏰",
      subcaption: "Deadline tomorrow morning, but tonight 'Sab theek ho jayega' mode is active.",
      color: "border-rose-400 shadow-rose-400/20",
      imageUrl: getGiphyUrl(GIPHY_MEMES.vijay_trisha),
      isStudent: true
    };
  }
  if (t.includes("learn by doing") || t.includes("nothing learned")) {
    return {
      title: "Learn By Doing Errors",
      emoji: "🌀",
      subcaption: "Doing things... breaking things... doing more things... learning absolutely nothing.",
      color: "border-amber-500 shadow-amber-500/20",
      imageUrl: getGiphyUrl(GIPHY_MEMES.inna_di_idhu),
      isStudent: true
    };
  }
  if (t.includes("copy") && t.includes("resume")) {
    return {
      title: "Senior Copy Paste",
      emoji: "📋",
      subcaption: "Copying the exact template of a senior who works at Amazon. Bold styling, zero content.",
      color: "border-brand-green shadow-brand-green/20",
      imageUrl: getGiphyUrl(GIPHY_MEMES.look_camera),
      isStudent: true
    };
  }

  // Developer Memes 💻
  if (t.includes("works on my machine") || t.includes("prayer")) {
    return {
      title: "Works On My Machine",
      emoji: "💻",
      subcaption: "Bro, client machine la error varuthu na client laptop dynamic-ah packaging panni ship pannidlama?",
      color: "border-blue-500 shadow-blue-500/20",
      imageUrl: getGiphyUrl(GIPHY_MEMES.inna_di_idhu),
      isStudent: false
    };
  }
  if (t.includes("coming since 2022") || t.includes("readme")) {
    return {
      title: "Coming Soon™",
      emoji: "⏰",
      subcaption: "The repository's README says 'under active development' since 2022. God bless.",
      color: "border-amber-400 shadow-amber-400/20",
      imageUrl: getGiphyUrl(GIPHY_MEMES.look_camera),
      isStudent: false
    };
  }
  if (t.includes("leetcode grind") || t.includes("shorts")) {
    return {
      title: "The Shorts Grind",
      emoji: "📱",
      subcaption: "LeetCode tab opened, but somehow watching YouTube Shorts at 3 AM with absolute focus.",
      color: "border-red-500 shadow-red-500/20",
      imageUrl: getGiphyUrl(GIPHY_MEMES.sirichiten),
      isStudent: false
    };
  }
  if (t.includes("cloud credits") || t.includes("credits expired")) {
    return {
      title: "Credits Vanished",
      emoji: "☁️",
      subcaption: "$300 of AWS free tier credits expired. I literally created one Hello World instance.",
      color: "border-cyan-400 shadow-cyan-400/20",
      imageUrl: getGiphyUrl(GIPHY_MEMES.pikachu_shock),
      isStudent: false
    };
  }
  if (t.includes("code review") || t.includes("can you elaborate")) {
    return {
      title: "The Confused Review",
      emoji: "🧐",
      subcaption: "Senior: 'Can you elaborate on the time complexity?'\nMe: 'Bro, just tell me if I should delete it'",
      color: "border-purple-500 shadow-purple-500/20",
      imageUrl: getGiphyUrl(GIPHY_MEMES.yaru_ivaru),
      isStudent: false
    };
  }
  if (t.includes("2009") || t.includes("stack overflow")) {
    return {
      title: "2009 Legacy Code",
      emoji: "📜",
      subcaption: "The code was written by 'jQueryKing99' in 2009. It runs. Don't touch, don't breath.",
      color: "border-yellow-500 shadow-yellow-500/20",
      imageUrl: getGiphyUrl(GIPHY_MEMES.happy_ghost),
      isStudent: false
    };
  }
  if (t.includes("broke 3 other things") || t.includes("simple feature")) {
    return {
      title: "The Domino Collapse",
      emoji: "🎳",
      subcaption: "Added a small text space in layout. The payment database and login server are now on fire.",
      color: "border-rose-500 shadow-rose-500/20",
      imageUrl: getGiphyUrl(GIPHY_MEMES.karunas_troll),
      isStudent: false
    };
  }
  if (t.includes("commit message") || t.includes("pls work")) {
    return {
      title: "The Push of Hope",
      emoji: "🚀",
      subcaption: "Git: 'fix', 'fix2', 'actual final fix', 'pls work machin', 'real final fix 123'",
      color: "border-green-500 shadow-green-500/20",
      imageUrl: getGiphyUrl(GIPHY_MEMES.know_its_you),
      isStudent: false
    };
  }
  if (t.includes("documentation") || t.includes("confidently")) {
    return {
      title: "Confidently Lie",
      emoji: "🗣️",
      subcaption: "'Yes I read the 500-page AWS whitepaper fully' (Me: Googled 'how to setup bucket' 2 mins ago)",
      color: "border-indigo-500 shadow-indigo-500/20",
      imageUrl: getGiphyUrl(GIPHY_MEMES.vijay_trisha),
      isStudent: false
    };
  }
  if (t.includes("copy paste") || t.includes("not asking")) {
    return {
      title: "The Copy-Paste Creed",
      emoji: "📋",
      subcaption: "I pasted it from StackOverflow. It compiled. I am not asking any more questions.",
      color: "border-cyan-500 shadow-cyan-500/20",
      imageUrl: getGiphyUrl(GIPHY_MEMES.sirichiten),
      isStudent: false
    };
  }
  if (t.includes("ai ku code") || t.includes("new bug")) {
    return {
      title: "AI Co-Pilot Rants",
      emoji: "🤖",
      subcaption: "Japan-karan dynamic AI algorithm ready panran, namma AI generated code error fix panna inno oru prompt typing",
      color: "border-brand-neon shadow-brand-neon/20",
      imageUrl: getGiphyUrl(GIPHY_MEMES.arr_reaction),
      isStudent: false
    };
  }
  if (t.includes("variable name") || t.includes("datafinal")) {
    return {
      title: "Variable Naming Saga",
      emoji: "🏷️",
      subcaption: "const data_final_actual_new_v3_dont_delete = ...",
      color: "border-slate-400 shadow-slate-400/20",
      imageUrl: getGiphyUrl(GIPHY_MEMES.funny_face),
      isStudent: false
    };
  }
  if (t.includes("small change") || t.includes("on fire")) {
    return {
      title: "Everything Is Fine",
      emoji: "🔥",
      subcaption: "It was literally a single line style edit. Why is the master branch on fire?",
      color: "border-red-600 shadow-red-600/20",
      imageUrl: getGiphyUrl(GIPHY_MEMES.rajini_walk),
      isStudent: false
    };
  }
  if (t.includes("dark mode") || t.includes("days waste")) {
    return {
      title: "Priorities",
      emoji: "🕶️",
      subcaption: "Auth system completely broken, but spent 3 days designing customizable glowing scrollbars.",
      color: "border-indigo-400 shadow-indigo-400/20",
      imageUrl: getGiphyUrl(GIPHY_MEMES.trisha_smile),
      isStudent: false
    };
  }
  if (t.includes("node modules") || t.includes("cried")) {
    return {
      title: "Node Modules Sledgehammer",
      emoji: "🔨",
      subcaption: "Accidentally ran rm -rf. Now waiting for 14 gigabytes of node_modules to download. Cry in Tamil.",
      color: "border-amber-500 shadow-amber-500/20",
      imageUrl: getGiphyUrl(GIPHY_MEMES.thanni_kudi),
      isStudent: false
    };
  }
  if (t.includes("missing semicolon") || t.includes("bug fix")) {
    return {
      title: "The Missing Semicolon",
      emoji: "❌",
      subcaption: "3 hours refactoring. The bug was a missing semicolon. I hate everything.",
      color: "border-rose-500 shadow-rose-500/20",
      imageUrl: getGiphyUrl(GIPHY_MEMES.karunas_troll),
      isStudent: false
    };
  }
  if (t.includes("console.log") || t.includes("strategic logging")) {
    return {
      title: "Strategic Log Master",
      emoji: "📝",
      subcaption: "Japan-karan debugger monitor ready panran, namma console.log('PLEASE REACH HERE 123')",
      color: "border-brand-green shadow-brand-green/20",
      imageUrl: getGiphyUrl(GIPHY_MEMES.know_its_you),
      isStudent: false
    };
  }
  if (t.includes("internship") || t.includes("setting up")) {
    return {
      title: "Day 3 Connection",
      emoji: "🐣",
      subcaption: "Intern day 3: Still trying to setup local development on Docker. 'Eppadi irukinga anna?'",
      color: "border-sky-400 shadow-sky-400/20",
      imageUrl: getGiphyUrl(GIPHY_MEMES.coolie_eppadi),
      isStudent: false
    };
  }
  if (t.includes("friday evening") || t.includes("weekend vanished")) {
    return {
      title: "Friday Deploy",
      emoji: "💀",
      subcaption: "Production deploy completed at 4:55 PM on Friday. Switched off phone instantly. Goodbye weekend.",
      color: "border-red-500 shadow-red-500/30",
      imageUrl: getGiphyUrl(GIPHY_MEMES.rajini_walk),
      isStudent: false
    };
  }
  if (t.includes("system design") || t.includes("todo app")) {
    return {
      title: "The Todo Architect",
      emoji: "📐",
      subcaption: "Explaining Kafka queues and Kubernetes cluster setups for a 1-page Todo List.",
      color: "border-emerald-500 shadow-emerald-500/20",
      imageUrl: getGiphyUrl(GIPHY_MEMES.look_camera),
      isStudent: false
    };
  }
  if (t.includes("10x") || t.includes("realistically")) {
    return {
      title: "The 10x Dreamer",
      emoji: "💤",
      subcaption: "Watched a 10x Developer tutorial at 2x speed. Spent 5 hours centering a div realistically.",
      color: "border-purple-400 shadow-purple-400/20",
      imageUrl: getGiphyUrl(GIPHY_MEMES.arr_reaction),
      isStudent: false
    };
  }
  if (t.includes("500 lines") || t.includes("nobody touching")) {
    return {
      title: "The Sacred Script",
      emoji: "🏺",
      subcaption: "There is a 500-line function with zero comments. Nobody wrote it. Nobody touch it.",
      color: "border-amber-600 shadow-amber-600/20",
      imageUrl: getGiphyUrl(GIPHY_MEMES.pikachu_shock),
      isStudent: false
    };
  }
  if (t.includes("googling da open secret") || t.includes("senior dev")) {
    return {
      title: "Senior Google Searcher",
      emoji: "🔍",
      subcaption: "Junior: 'You have so much experience anna!'\nSenior: *Googling basic array map on other screen*",
      color: "border-blue-400 shadow-blue-400/20",
      imageUrl: getGiphyUrl(GIPHY_MEMES.know_its_you),
      isStudent: false
    };
  }
  if (t.includes("estimated 2 days") || t.includes("hollow inside")) {
    return {
      title: "Hollow Success",
      emoji: "🎭",
      subcaption: "Estimated 2 days, took 2 weeks. Client is happy but I am completely hollow inside.",
      color: "border-indigo-400 shadow-indigo-400/20",
      imageUrl: getGiphyUrl(GIPHY_MEMES.rajini_walk),
      isStudent: false
    };
  }

  // Default fallback (using Rajini Style Laugh!)
  return {
    title: "Awesome Scan Caught!",
    emoji: "🔥",
    subcaption: "Connection synchronized with CodeSapiens core backend servers!",
    color: "border-brand-neon shadow-brand-neon/20",
    imageUrl: getGiphyUrl(GIPHY_MEMES.rajini_laugh),
    isStudent: false
  };
}

export default function MemePopup() {
  const [activeEvent, setActiveEvent] = useState<{
    type: "scanned_others" | "scanned_by_others";
    otherName: string;
    meme: Meme;
    isStudent: boolean;
  } | null>(null);

  const [imgSrc, setImgSrc] = useState<string>("");

  useEffect(() => {
    const handleMemeTrigger = (event: Event) => {
      const customEvent = event as CustomEvent<{
        type: "scanned_others" | "scanned_by_others";
        otherName: string;
        squareText?: string;
      }>;
      
      if (!customEvent.detail) return;

      const { type, otherName, squareText } = customEvent.detail;
      
      let finalMeme: Meme;
      let isStudent = false;

      if (squareText) {
        const details = getMemeDetails(squareText);
        isStudent = details.isStudent;
        finalMeme = {
          id: "custom_" + Math.random(),
          title: details.title,
          caption: squareText,
          subcaption: details.subcaption,
          emoji: details.emoji,
          imageUrl: details.imageUrl,
          color: details.color
        };
      } else {
        const randomFallback = FALLBACK_MEMES[Math.floor(Math.random() * FALLBACK_MEMES.length)];
        finalMeme = randomFallback;
      }

      setImgSrc(finalMeme.imageUrl);
      setActiveEvent({
        type,
        otherName,
        meme: finalMeme,
        isStudent
      });
    };

    window.addEventListener("trigger-meme" as any, handleMemeTrigger);
    return () => {
      window.removeEventListener("trigger-meme" as any, handleMemeTrigger);
    };
  }, []);

  if (!activeEvent) return null;

  const { type, otherName, meme, isStudent } = activeEvent;

  return (
    <AnimatePresence>
      <div id="meme-popup-container" className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className={`glow-card w-full max-w-md rounded-3xl border-2 ${meme.color} bg-slate-950 p-6 relative overflow-hidden shadow-2xl flex flex-col`}
        >
          {/* Animated decorative sparks */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-neon/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-green/10 rounded-full blur-2xl pointer-events-none" />

          {/* Close button */}
          <button
            id="close-meme-popup"
            onClick={() => setActiveEvent(null)}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition-all cursor-pointer z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Notification Header badge */}
          <div className="flex flex-wrap items-center gap-2 mb-4 self-start">
            <span className={`inline-flex items-center gap-1.5 text-xs font-mono font-black uppercase tracking-wider px-3 py-1.5 rounded-full ${
              type === "scanned_others" 
                ? "bg-brand-neon/20 text-brand-neon border border-brand-neon/30"
                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
            }`}>
              {type === "scanned_others" ? (
                <>
                  <Smile className="w-3.5 h-3.5" /> Scan Recorded!
                </>
              ) : (
                <>
                  <MessageSquare className="w-3.5 h-3.5" /> Someone Scanned You!
                </>
              )}
            </span>

            <span className={`inline-flex items-center gap-1.5 text-[10px] font-mono font-black uppercase tracking-wider px-2.5 py-1.5 rounded-full ${
              isStudent
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
            }`}>
              {isStudent ? "🎓 Student" : "💻 Developer"}
            </span>
          </div>

          {/* Trigger Alert Info */}
          <div className="mb-5">
            <h4 className="text-lg font-display font-black text-white leading-tight">
              {type === "scanned_others" ? (
                <>
                  You connected with <span className="text-brand-neon font-extrabold">{otherName}</span>!
                </>
              ) : (
                <>
                  <span className="text-emerald-300 font-extrabold">{otherName}</span> scanned your QR code!
                </>
              )}
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Connection synced to CodeSapiens Leaderboard. Enjoy your custom Tamil developer meme:
            </p>
          </div>

          {/* MEME DISPLAY BOX */}
          <div className="bg-black/40 border border-white/5 rounded-2xl overflow-hidden shadow-inner flex flex-col">
            {/* Meme Image Overlay with gradient */}
            <div className="relative aspect-video w-full bg-slate-900 overflow-hidden flex items-center justify-center p-1">
              {imgSrc ? (
                <img
                  src={imgSrc}
                  alt={meme.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain opacity-95 rounded-xl"
                  onError={() => {
                    // Failover logic between Giphy URL schemas
                    if (imgSrc.includes("media.giphy.com")) {
                      const parts = imgSrc.split("/");
                      // URL looks like: https://media.giphy.com/media/ID/giphy.gif
                      const id = parts[parts.length - 2];
                      if (id) {
                        setImgSrc(`https://i.giphy.com/${id}.gif`);
                      }
                    } else if (imgSrc.includes("i.giphy.com") && !imgSrc.includes("media.giphy.com")) {
                      const parts = imgSrc.split("/");
                      const filename = parts[parts.length - 1];
                      const id = filename.split(".")[0];
                      if (id) {
                        setImgSrc(`https://media.giphy.com/media/${id}/giphy.gif`);
                      }
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full bg-slate-900 flex items-center justify-center text-xs text-slate-500">
                  Loading awesome GIF...
                </div>
              )}
            </div>

            {/* Meme text content */}
            <div className="p-4 sm:p-5 space-y-3 bg-black/60 border-t border-white/5">
              {/* Meme Title Badge - moved out of the image overlay to prevent blocking subtitle text */}
              <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                <span className="text-sm">{meme.emoji}</span>
                <span className="text-xs font-mono font-black text-brand-neon uppercase tracking-widest">
                  {meme.title}
                </span>
              </div>

              <p className="text-sm font-medium text-slate-100 leading-relaxed font-sans pt-1">
                &ldquo;{meme.caption}&rdquo;
              </p>
              {meme.subcaption && (
                <p className="text-xs text-slate-300 font-mono leading-relaxed pl-3.5 border-l-2 border-brand-neon italic bg-slate-950/50 p-2.5 rounded-lg">
                  {meme.subcaption}
                </p>
              )}
            </div>
          </div>

          {/* Actions / Dismiss */}
          <div className="mt-6 flex flex-col gap-2.5">
            <button
              id="dismiss-meme"
              onClick={() => setActiveEvent(null)}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-neon to-brand-green text-black font-display font-black text-xs uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-brand-neon/10"
            >
              Keep Mingling!
            </button>
            <p className="text-[9px] text-center font-mono text-slate-500 uppercase tracking-widest flex items-center justify-center gap-1">
              <Flame className="w-3 h-3 text-amber-500" /> Meme Reward Engine active • 2026 CodeSapiens
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
