
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Page, UserStats, Category, Question, QuizHistoryEntry, Difficulty } from './types';
import { MAIN_MISSION_HUBS, QUIZ_REWARD_BASE } from './constants';
import AdBanner from './components/AdBanner';
import { generateQuestions } from './services/geminiService';
import { adService } from './services/adService';

const DIFFICULTY_CONFIG = {
  Easy: { fee: 50, rewardMultiplier: 1, label: 'BRONZE' },
  Medium: { fee: 150, rewardMultiplier: 3, label: 'GOLD' },
  Hard: { fee: 500, rewardMultiplier: 8, label: 'HEROIC' }
};

const VOUCHER_PACKAGES = [
  { id: 'v1', title: '₹10 Google Play', cost: 1500, brand: 'Google', color: 'from-green-600 to-emerald-800', icon: '🎮' },
  { id: 'v2', title: '₹50 Amazon Pay', cost: 6500, brand: 'Amazon', color: 'from-orange-500 to-slate-900', icon: '📦' },
  { id: 'v3', title: '₹100 Flipkart', cost: 12000, brand: 'Flipkart', color: 'from-blue-600 to-indigo-900', icon: '🛒' },
  { id: 'v4', title: '₹250 Myntra Card', cost: 28000, brand: 'Myntra', color: 'from-pink-500 to-rose-700', icon: '🛍️' },
  { id: 'v5', title: '110 Diamonds FF', cost: 1000, brand: 'Garena', color: 'from-sky-500 to-blue-700', icon: '💎' },
  { id: 'v6', title: 'Elite Pass Pack', cost: 9500, brand: 'Garena', color: 'from-purple-600 to-fuchsia-800', icon: '🎫' },
];

const MOCK_WINNERS = [
  { name: 'Elite_Gamer', score: 12500, avatar: '👑', rank: 'HEROIC' },
  { name: 'Sniper_King', score: 11200, avatar: '🎯', rank: 'GRANDMASTER' },
  { name: 'FF_Legend', score: 9800, avatar: '🐉', rank: 'DIAMOND' },
];

const CHECKIN_REWARDS = [50, 100, 150, 200, 250, 300, 1000];
const QUESTION_TIMER_LIMIT = 60;

const Confetti: React.FC = () => {
  const pieces = useMemo(() => {
    return Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100 + '%',
      delay: Math.random() * 2 + 's',
      color: ['#ff4d00', '#ffcc00', '#00bfff', '#ffffff', '#00ff00'][Math.floor(Math.random() * 5)],
      duration: Math.random() * 2 + 2 + 's'
    }));
  }, []);

  return (
    <>
      {pieces.map(p => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: p.left,
            animationDelay: p.delay,
            backgroundColor: p.color,
            animationDuration: p.duration
          }}
        />
      ))}
    </>
  );
};

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.INTRO);
  const [stats, setStats] = useState<UserStats>({ coins: 1500, quizzesCompleted: 0, correctAnswers: 0, checkInStreak: 0 });
  const [history, setHistory] = useState<QuizHistoryEntry[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [redeemedCode, setRedeemedCode] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinRotation, setSpinRotation] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMainHubId, setActiveMainHubId] = useState<string>('DIAMOND');

  // Timer States
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIMER_LIMIT);
  const timerRef = useRef<number | null>(null);

  // Lifeline & Fun States
  const [lifelinesUsed, setLifelinesUsed] = useState({ fiftyFifty: false, skip: false, doubleDip: false, hint: false });
  const [disabledOptions, setDisabledOptions] = useState<string[]>([]);
  const [doubleDipActive, setDoubleDipActive] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);
  const [airdropAvailable, setAirdropAvailable] = useState(true);
  const [scavengePos, setScavengePos] = useState({ top: 20, left: 80 });

  useEffect(() => {
    const savedStats = localStorage.getItem('ff_quiz_user_stats');
    if (savedStats) setStats(JSON.parse(savedStats));
    const savedHistory = localStorage.getItem('ff_quiz_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  useEffect(() => {
    localStorage.setItem('ff_quiz_user_stats', JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem('ff_quiz_history', JSON.stringify(history));
  }, [history]);

  // Timer Effect
  useEffect(() => {
    if (currentPage === Page.QUIZ && !isAnswering) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentPage, isAnswering, currentQuestionIndex]);

  const handleTimeout = () => {
    if (isAnswering) return;
    setIsAnswering(true);
    setWrongCount(w => w + 1);
    setTimeout(nextQuestion, 1500);
  };

  const navigateWithAd = (newPage: Page) => {
    if (Math.random() > 0.4) adService.showInterstitial();
    setCurrentPage(newPage);
  };

  const handleCheckIn = () => {
    const today = new Date().toDateString();
    if (stats.lastCheckIn === today) {
      alert("MISSION COMPLETE! Come back tomorrow for more diamonds.");
      return;
    }

    let newStreak = (stats.checkInStreak || 0) + 1;
    if (newStreak > 7) newStreak = 1;
    
    if (stats.lastCheckIn) {
      const lastDate = new Date(stats.lastCheckIn);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (lastDate.toDateString() !== yesterday.toDateString()) {
        newStreak = 1; 
      }
    }

    const reward = CHECKIN_REWARDS[newStreak - 1];
    setStats(prev => ({
      ...prev,
      coins: prev.coins + reward,
      lastCheckIn: today,
      checkInStreak: newStreak
    }));
    alert(`DAILY LOGIN! 📅 Day ${newStreak} secured. Looted 💎 ${reward}!`);
  };

  const handleSocialMission = (type: 'telegram' | 'instagram') => {
    if (type === 'telegram' && stats.joinedTelegram) {
      alert("Already joined Telegram hub!");
      return;
    }
    if (type === 'instagram' && stats.followedInstagram) {
      alert("Already following Instagram HQ!");
      return;
    }

    const reward = 250;
    const url = type === 'telegram' ? 'https://t.me/example' : 'https://instagram.com/example';
    window.open(url, '_blank');

    setStats(prev => ({
      ...prev,
      coins: prev.coins + reward,
      [type === 'telegram' ? 'joinedTelegram' : 'followedInstagram']: true
    }));
    alert(`MISSION SUCCESS! 💎 ${reward} added for ${type === 'telegram' ? 'joining Telegram' : 'following Instagram'}.`);
  };

  const handleRedeemVoucher = (pkg: any) => {
    if (stats.coins < pkg.cost) {
      alert("Insufficient Diamonds! Complete more missions to earn more.");
      return;
    }
    if (window.confirm(`Exchange 💎 ${pkg.cost} for ${pkg.title}?`)) {
      setStats(prev => ({ ...prev, coins: prev.coins - pkg.cost }));
      const code = `FFV-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      setRedeemedCode(code);
    }
  };

  const clearHistory = () => {
    if (window.confirm("Format Battle Logs? All mission history will be erased.")) {
      setHistory([]);
    }
  };

  const startQuiz = async (category: Category, diff: Difficulty) => {
    setIsLoading(true);
    const fee = DIFFICULTY_CONFIG[diff].fee;
    if (stats.coins < fee) {
      alert("Insufficient Balance!");
      setIsLoading(false);
      return;
    }
    setStats(prev => ({ ...prev, coins: prev.coins - fee }));
    setDifficulty(diff);
    setScore(0);
    setWrongCount(0);
    setCurrentQuestionIndex(0);
    setTimeLeft(QUESTION_TIMER_LIMIT);
    setLifelinesUsed({ fiftyFifty: false, skip: false, doubleDip: false, hint: false });
    setDisabledOptions([]);
    setDoubleDipActive(false);
    setSelectedAnswer(null);
    setIsAnswering(false);

    try {
      const q = await generateQuestions(category.name, diff);
      setQuestions(q);
      setCurrentPage(Page.QUIZ);
    } catch (e) {
      alert("Failed to deploy mission.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = (opt: string) => {
    if (isAnswering) return;
    setSelectedAnswer(opt);
    const correct = questions[currentQuestionIndex].correctAnswer;
    
    if (opt === correct) {
      setIsAnswering(true);
      setScore(s => s + 1);
      setTimeout(nextQuestion, 800);
    } else {
      if (doubleDipActive) {
        setDoubleDipActive(false);
        setDisabledOptions(prev => [...prev, opt]);
        setSelectedAnswer(null);
        return;
      }
      setIsAnswering(true);
      setWrongCount(w => w + 1);
      setTimeout(nextQuestion, 800);
    }
  };

  const nextQuestion = () => {
    setSelectedAnswer(null);
    setIsAnswering(false);
    setDisabledOptions([]);
    setTimeLeft(QUESTION_TIMER_LIMIT);
    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      completeQuiz();
    }
  };

  const completeQuiz = () => {
    const multiplier = difficulty ? DIFFICULTY_CONFIG[difficulty].rewardMultiplier : 1;
    const earned = (score * 50 * multiplier) + QUIZ_REWARD_BASE;
    setStats(prev => ({ 
      ...prev, 
      coins: prev.coins + earned,
      quizzesCompleted: prev.quizzesCompleted + 1,
      correctAnswers: prev.correctAnswers + score
    }));
    
    if (selectedCategory) {
      const entry: QuizHistoryEntry = {
        id: Date.now().toString(),
        categoryId: selectedCategory.id,
        categoryName: selectedCategory.name,
        categoryIcon: selectedCategory.icon,
        score: score,
        totalQuestions: questions.length,
        date: new Date().toLocaleString()
      };
      setHistory(prev => [entry, ...prev]);
    }
    setCurrentPage(Page.RESULTS);
  };

  const handleLuckySpin = () => {
    if (isSpinning) return;
    const spinFee = 50;
    if (stats.coins < spinFee) {
      alert("Spin cost 💎 50. Insufficient diamonds!");
      return;
    }
    setStats(prev => ({ ...prev, coins: prev.coins - spinFee }));
    setIsSpinning(true);
    
    const prizes = [10, 50, 100, 200, 500, 10, 1000, 50]; 
    const prizeIndex = Math.floor(Math.random() * prizes.length);
    const extraRotations = 5 + Math.floor(Math.random() * 5);
    const newRotation = spinRotation + (extraRotations * 360) + (prizeIndex * (360 / prizes.length));
    
    setSpinRotation(newRotation);

    setTimeout(() => {
      const won = prizes[prizeIndex];
      setStats(prev => ({ ...prev, coins: prev.coins + won }));
      setIsSpinning(false);
      alert(`BOOYAH! You won 💎 ${won}!`);
    }, 4000);
  };

  const handleWatchAdReward = () => {
    adService.showRewarded(() => {
        setStats(prev => ({ ...prev, coins: prev.coins + 100 }));
        alert("REWARD GRANTED! 💎 100 added to your vault.");
    });
  };

  const claimAirdrop = () => {
    if (!airdropAvailable) return;
    const loot = Math.floor(Math.random() * 41) + 10;
    setStats(prev => ({ ...prev, coins: prev.coins + loot }));
    setAirdropAvailable(false);
    alert(`AIRDROP SECURED! 📦 Found 💎 ${loot} inside!`);
    setTimeout(() => setAirdropAvailable(true), 60000);
  };

  const scavengeDiamond = () => {
    setStats(prev => ({ ...prev, coins: prev.coins + 5 }));
    setScavengePos({
      top: Math.floor(Math.random() * 80) + 10,
      left: Math.floor(Math.random() * 80) + 10
    });
  };

  const useFiftyFifty = () => {
    if (lifelinesUsed.fiftyFifty || isAnswering) return;
    const correct = questions[currentQuestionIndex].correctAnswer;
    const incorrect = questions[currentQuestionIndex].options.filter(o => o !== correct);
    const toDisable = incorrect.sort(() => 0.5 - Math.random()).slice(0, 2);
    setDisabledOptions(toDisable);
    setLifelinesUsed(prev => ({ ...prev, fiftyFifty: true }));
  };

  const useSkip = () => {
    if (lifelinesUsed.skip || isAnswering) return;
    setLifelinesUsed(prev => ({ ...prev, skip: true }));
    nextQuestion();
  };

  const useDoubleDip = () => {
    if (lifelinesUsed.doubleDip || isAnswering) return;
    setDoubleDipActive(true);
    setLifelinesUsed(prev => ({ ...prev, doubleDip: true }));
  };

  const useHint = () => {
    if (lifelinesUsed.hint || isAnswering) return;
    setLifelinesUsed(prev => ({ ...prev, hint: true }));
    const correct = questions[currentQuestionIndex].correctAnswer;
    setSelectedAnswer(correct);
    setTimeout(() => { if (!isAnswering) setSelectedAnswer(null); }, 1200);
  };

  const currentRank = (() => {
    const ratio = score / (questions.length || 1);
    if (ratio >= 0.9) return { grade: 'S', label: 'HEROIC', color: 'text-red-500', icon: '🎖️' };
    if (ratio >= 0.7) return { grade: 'A', label: 'DIAMOND', color: 'text-sky-400', icon: '💎' };
    if (ratio >= 0.5) return { grade: 'B', label: 'PLATINUM', color: 'text-slate-300', icon: '🥈' };
    return { grade: 'C', label: 'GOLD', color: 'text-yellow-400', icon: '🥇' };
  })();

  const activeHub = MAIN_MISSION_HUBS.find(h => h.id === activeMainHubId);
  const filteredSubCategories = activeHub?.categories.filter(cat => cat.name.toLowerCase().includes(searchTerm.toLowerCase())) || [];

  if (currentPage === Page.INTRO) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center overflow-x-hidden relative">
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-orange-500/10 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-sky-500/10 blur-[150px] rounded-full"></div>
        
        <div className="z-10 animate-fadeIn space-y-8 max-w-2xl">
          <header>
             <div className="inline-block px-4 py-1 bg-orange-500/20 border border-orange-500/50 rounded-full mb-4">
                <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em] animate-pulse">● LIVE SERVER CONNECTED</span>
             </div>
             <h1 className="text-6xl md:text-8xl font-black font-gaming text-white leading-none tracking-tighter italic">
               DIAMOND <br/><span className="text-orange-500">MASTER</span>
             </h1>
             <p className="mt-4 text-slate-400 font-bold tracking-[0.2em] uppercase italic text-sm">Elite Tactical Quiz Engine</p>
          </header>

          <div className="glass-effect p-8 rounded-[2.5rem] border-2 border-white/5 space-y-6 text-left relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">⚔️</div>
             <div>
                <h3 className="text-orange-500 font-black text-xs uppercase tracking-widest mb-2">MISSION OBJECTIVE</h3>
                <p className="text-slate-300 text-sm leading-relaxed font-bold">
                  Survive intense missions across <span className="text-white">10+ Global Hubs</span>. Answer correctly to loot <span className="text-sky-400 italic">Diamonds</span> and climb the ranks from Bronze to Heroic.
                </p>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                   <p className="text-sky-400 font-black text-lg mb-1 italic">10+ HUBS</p>
                   <p className="text-[10px] text-slate-500 font-black uppercase">Gaming, Tech, Anime & Crypto missions.</p>
                </div>
                <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                   <p className="text-orange-500 font-black text-lg mb-1 italic">VOUCHERS</p>
                   <p className="text-[10px] text-slate-500 font-black uppercase">Redeem for Play Store & Amazon Codes.</p>
                </div>
             </div>

             <div className="space-y-3">
                <h3 className="text-slate-500 font-black text-[10px] uppercase tracking-widest">ACTIVE CATEGORIES</h3>
                <div className="flex gap-2 overflow-hidden whitespace-nowrap opacity-50">
                   <div className="flex gap-4 animate-marquee">
                      {MAIN_MISSION_HUBS.map(hub => (
                        <span key={hub.id} className="text-white font-black text-xs uppercase italic bg-slate-800 px-3 py-1 rounded-lg">
                          {hub.icon} {hub.name}
                        </span>
                      ))}
                      {MAIN_MISSION_HUBS.map(hub => (
                        <span key={`${hub.id}-dup`} className="text-white font-black text-xs uppercase italic bg-slate-800 px-3 py-1 rounded-lg">
                          {hub.icon} {hub.name}
                        </span>
                      ))}
                   </div>
                </div>
             </div>
          </div>

          <div className="flex flex-col gap-4">
            <button 
              onClick={() => navigateWithAd(Page.HOME)} 
              className="px-16 py-7 ff-gradient text-black font-black text-2xl font-gaming rounded-3xl shadow-[0_0_50px_rgba(255,77,0,0.4)] hover:scale-105 active:scale-95 transition-all animate-pulse-ff italic tracking-tighter"
            >
              DEPLOY TO LOBBY
            </button>
            <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Version 3.4.0 Elite Royale Edition</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] flex flex-col pb-32">
      <AdBanner type="leaderboard" />
      
      <main className="flex-1 container mx-auto px-4 py-6 max-w-4xl">
        {isLoading && (
          <div className="fixed inset-0 bg-black/90 z-[300] flex items-center justify-center backdrop-blur-md">
            <div className="text-center p-8 glass-effect rounded-[2rem] border-2 border-orange-500">
              <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="font-gaming font-black text-orange-500 animate-pulse uppercase tracking-widest">DEPLOYING MISSION...</p>
            </div>
          </div>
        )}

        {currentPage === Page.HOME && (
          <div className="space-y-8 animate-fadeIn relative">
            {airdropAvailable && (
              <div onClick={claimAirdrop} className="absolute right-0 top-0 z-20 cursor-pointer animate-bounce group">
                <div className="relative">
                  <span className="text-6xl drop-shadow-[0_0_15px_rgba(255,77,0,0.8)]">📦</span>
                  <span className="absolute -top-4 -right-2 bg-red-600 text-[8px] font-black px-2 py-0.5 rounded border border-white animate-pulse">SUPPLY DROP</span>
                </div>
              </div>
            )}

            <div className="glass-effect p-8 rounded-3xl border-t-4 border-t-orange-500 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-black font-gaming text-white italic">LOBBY STATUS</h2>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Global Server 01</p>
                </div>
                <div className="text-right">
                    <p className="text-3xl font-black text-sky-400">💎 {stats.coins}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">DIAMOND VAULT</p>
                </div>
              </div>
              <div className="pt-4 border-t border-white/5 flex gap-4">
                <button 
                  onClick={() => navigateWithAd(Page.HISTORY)}
                  className="flex-1 py-3 px-4 bg-slate-900 border border-white/5 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors group"
                >
                  <span className="text-xl group-hover:scale-110 transition-transform">📜</span>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">BATTLE LOGS</span>
                </button>
                <div className="flex-1 py-3 px-4 bg-slate-900 border border-white/5 rounded-2xl flex items-center justify-center gap-2">
                  <span className="text-xl">🔥</span>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{stats.quizzesCompleted} MISSIONS</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <button onClick={() => navigateWithAd(Page.EARN_MORE)} className="p-6 rounded-3xl glass-effect border-orange-500/30 flex flex-col items-center hover:bg-orange-500/10 hover:scale-[1.02] transition-all bg-gradient-to-b from-orange-500/5 to-transparent border-t-4 border-t-orange-500">
                  <span className="text-4xl mb-2">💎</span>
                  <span className="font-gaming text-[10px] font-black uppercase text-orange-500 tracking-widest">BONUS HUB</span>
                  <span className="text-[8px] text-slate-500 font-bold mt-1">SPIN, DAILY & SOCIAL</span>
               </button>
               <button onClick={() => navigateWithAd(Page.WINNERS)} className="p-6 rounded-3xl glass-effect border-sky-500/30 flex flex-col items-center hover:bg-sky-500/10 hover:scale-[1.02] transition-all">
                  <span className="text-4xl mb-2">🏆</span>
                  <span className="font-gaming text-[10px] font-black uppercase tracking-widest">HALL OF FAME</span>
               </button>
            </div>

            <div className="space-y-4">
               <h3 className="text-xl font-black font-gaming uppercase tracking-tighter italic">SELECT COMBAT ZONE</h3>
               <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {MAIN_MISSION_HUBS.map(hub => (
                     <button key={hub.id} onClick={() => { setActiveMainHubId(hub.id); navigateWithAd(Page.CATEGORIES); }} className={`p-5 rounded-2xl glass-effect border-b-4 ${hub.color} flex flex-col items-center hover:scale-105 transition-transform group relative overflow-hidden`}>
                        <span className="text-4xl mb-2 group-hover:scale-110 transition-transform">{hub.icon}</span>
                        <span className="text-[10px] font-black font-gaming">{hub.name}</span>
                        {hub.tag && <span className="absolute top-1 right-1 text-[7px] font-black bg-white/10 px-1 rounded">{hub.tag}</span>}
                     </button>
                  ))}
               </div>
            </div>
            <AdBanner type="rectangle" />
          </div>
        )}

        {currentPage === Page.EARN_MORE && (
          <div className="space-y-10 animate-fadeIn pb-12">
            <header className="flex justify-between items-center px-2">
               <div>
                  <h2 className="text-3xl font-black font-gaming tracking-tighter uppercase italic">DIAMOND HUB</h2>
                  <p className="text-orange-500 text-[10px] font-black uppercase tracking-widest">MAXIMIZE YOUR VAULT</p>
               </div>
               <button onClick={() => setCurrentPage(Page.HOME)} className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">LOBBY</button>
            </header>

            {/* Section 1: Lucky Royale */}
            <div className="glass-effect p-8 rounded-[3rem] border-2 border-orange-500/20 flex flex-col items-center relative overflow-hidden">
               <div className="absolute top-0 left-0 bg-orange-500 text-black px-4 py-1 text-[8px] font-black uppercase tracking-widest rounded-br-2xl">LUCKY ROYALE</div>
               <div className="relative mt-8 mb-12">
                  <div className="w-64 h-64 sm:w-72 sm:h-72 rounded-full border-8 border-slate-800 shadow-[0_0_50px_rgba(255,77,0,0.2)] relative overflow-hidden transition-transform duration-[4000ms] ease-[cubic-bezier(0.13,0.67,0.01,0.94)]" style={{ transform: `rotate(${spinRotation}deg)` }}>
                      {[...Array(8)].map((_, i) => (
                        <div key={i} className="absolute top-0 left-1/2 w-1/2 h-full bg-slate-900 border-l border-white/5 origin-left flex items-center justify-end px-4" style={{ transform: `rotate(${i * 45}deg)` }}>
                          <span className="text-[10px] font-black font-gaming text-orange-500 -rotate-90 select-none">💎 {[10, 50, 100, 200, 500, 10, 1000, 50][i]}</span>
                        </div>
                      ))}
                  </div>
                  <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 w-8 h-8 bg-orange-500 clip-path-triangle z-10" style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }}></div>
                  <button onClick={handleLuckySpin} disabled={isSpinning} className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full glass-effect border-4 border-orange-500 flex items-center justify-center font-black font-gaming text-white z-20 shadow-2xl ${isSpinning ? 'opacity-50' : 'animate-pulse'}`}>SPIN</button>
               </div>
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">COST: 💎 50 PER SPIN</p>
               <button onClick={handleWatchAdReward} className="w-full max-w-xs py-5 bg-gradient-to-r from-blue-600 to-sky-400 text-white font-black text-xs rounded-2xl shadow-xl hover:scale-102 active:scale-95 transition-all flex items-center justify-center gap-3 group uppercase tracking-widest italic">
                  <span className="text-xl">📺</span> WATCH AD FOR 💎 100
               </button>
            </div>

            {/* Section 2: Daily Check-in */}
            <div className="glass-effect p-8 rounded-[3rem] border-2 border-white/5 relative overflow-hidden">
               <div className="absolute top-0 left-0 bg-sky-500 text-black px-4 py-1 text-[8px] font-black uppercase tracking-widest rounded-br-2xl">DAILY LOGIN</div>
               <div className="flex justify-between gap-1 mt-6 mb-8">
                  {CHECKIN_REWARDS.map((rew, i) => {
                    const isClaimed = i + 1 <= (stats.checkInStreak || 0);
                    return (
                      <div key={i} className={`flex-1 flex flex-col items-center p-3 rounded-2xl border transition-all ${isClaimed ? 'bg-orange-500/20 border-orange-500/50 shadow-[0_0_15px_rgba(255,77,0,0.2)]' : 'bg-slate-900 border-white/5 opacity-40'}`}>
                         <span className="text-[8px] font-black text-slate-500 uppercase mb-1">D{i+1}</span>
                         <span className="text-lg mb-1">{i === 6 ? '🔥' : '💎'}</span>
                         <span className={`text-[10px] font-black ${isClaimed ? 'text-white' : 'text-slate-600'}`}>{rew}</span>
                      </div>
                    );
                  })}
               </div>
               <button onClick={handleCheckIn} className={`w-full py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${stats.lastCheckIn === new Date().toDateString() ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'ff-gradient text-black animate-pulse shadow-[0_0_20px_rgba(255,77,0,0.3)] hover:scale-105'}`}>
                 {stats.lastCheckIn === new Date().toDateString() ? 'BONUS CLAIMED' : 'CLAIM DAILY DIAMONDS'}
               </button>
            </div>

            {/* Section 3: Social Tasks */}
            <div className="grid grid-cols-2 gap-4">
               <div className={`p-6 rounded-[2.5rem] glass-effect border-sky-500/30 flex flex-col items-center transition-all ${stats.joinedTelegram ? 'opacity-40 grayscale' : 'hover:bg-sky-500/10'}`}>
                  <span className="text-4xl mb-3">✈️</span>
                  <p className="text-[9px] font-black text-white uppercase mb-1">TELEGRAM ELITE</p>
                  <button onClick={() => handleSocialMission('telegram')} className="text-[10px] font-black text-sky-400 bg-sky-500/10 px-4 py-2 rounded-xl mt-2">CLAIM 💎 250</button>
               </div>
               <div className={`p-6 rounded-[2.5rem] glass-effect border-pink-500/30 flex flex-col items-center transition-all ${stats.followedInstagram ? 'opacity-40 grayscale' : 'hover:bg-pink-500/10'}`}>
                  <span className="text-4xl mb-3">📸</span>
                  <p className="text-[9px] font-black text-white uppercase mb-1">INSTAGRAM HQ</p>
                  <button onClick={() => handleSocialMission('instagram')} className="text-[10px] font-black text-pink-400 bg-pink-500/10 px-4 py-2 rounded-xl mt-2">CLAIM 💎 250</button>
               </div>
            </div>
            
            <AdBanner type="rectangle" />
          </div>
        )}

        {currentPage === Page.HISTORY && (
          <div className="space-y-8 animate-fadeIn pb-12">
            <header className="flex justify-between items-end px-2">
              <div>
                <h2 className="text-3xl font-black font-gaming tracking-tighter uppercase italic">BATTLE RECORDS</h2>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">MISSION LOG ARCHIVE</p>
              </div>
              <button onClick={clearHistory} className="text-[10px] font-black text-red-500 hover:text-red-400 uppercase tracking-widest border border-red-500/30 px-3 py-2 rounded-xl bg-red-500/5">FORMAT LOGS</button>
            </header>

            {history.length === 0 ? (
              <div className="glass-effect p-20 rounded-[3rem] text-center border-dashed border-2 border-slate-800">
                <div className="text-7xl mb-6 opacity-30">📜</div>
                <h3 className="text-xl font-black font-gaming text-slate-500 uppercase tracking-widest">NO DATA FOUND</h3>
                <p className="text-slate-600 text-[10px] font-black uppercase mt-2 mb-8">Deploy for combat to generate logs</p>
                <button onClick={() => navigateWithAd(Page.CATEGORIES)} className="px-8 py-4 ff-gradient text-black font-black rounded-2xl uppercase text-[10px] tracking-widest">ENTER COMBAT ZONE</button>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map(entry => {
                  const successRate = (entry.score / entry.totalQuestions) * 100;
                  return (
                    <div key={entry.id} className="glass-effect p-5 rounded-[2rem] flex flex-col sm:flex-row items-center gap-5 border border-white/5 relative overflow-hidden group">
                      <div className="flex-shrink-0 text-5xl bg-slate-900 w-20 h-20 rounded-3xl flex items-center justify-center border border-white/5 shadow-inner group-hover:scale-110 transition-transform">
                        {entry.categoryIcon}
                      </div>
                      <div className="flex-1 text-center sm:text-left">
                        <h4 className="font-black text-lg text-white uppercase italic tracking-tighter">{entry.categoryName}</h4>
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em]">{entry.date}</p>
                        <div className="mt-3 w-full sm:w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                          <div className={`h-full bg-gradient-to-r from-orange-500 to-yellow-400`} style={{ width: `${successRate}%` }}></div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-xs font-black text-slate-500 uppercase italic">SUCCESS RATE</p>
                        <p className="text-2xl font-black text-white">{Math.round(successRate)}%</p>
                        <p className="text-[10px] font-black text-orange-500 uppercase">{entry.score} / {entry.totalQuestions} HITS</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <AdBanner type="rectangle" />
          </div>
        )}

        {currentPage === Page.WINNERS && (
            <div className="space-y-12 animate-fadeIn py-8">
                <header className="text-center">
                    <h2 className="text-4xl font-black font-gaming text-white italic">ELITE LEGENDS</h2>
                    <p className="text-orange-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2">TODAY'S TOP SURVIVORS</p>
                </header>

                <div className="flex justify-center items-end gap-2 md:gap-8 h-64 px-4">
                    <div className="flex flex-col items-center w-24">
                        <span className="text-4xl mb-2 drop-shadow-[0_0_10px_rgba(200,200,200,0.5)]">🥈</span>
                        <div className="w-full bg-slate-800 h-24 rounded-t-2xl border-t-4 border-slate-400 flex flex-col items-center justify-center p-2 text-center shadow-lg">
                            <p className="text-[10px] font-black text-white truncate w-full">{MOCK_WINNERS[1].name}</p>
                            <p className="text-xs text-slate-400">💎 {MOCK_WINNERS[1].score}</p>
                        </div>
                    </div>
                    <div className="flex flex-col items-center w-32">
                        <span className="text-6xl mb-2 drop-shadow-[0_0_20px_rgba(255,200,0,0.8)] animate-pulse">👑</span>
                        <div className="w-full bg-slate-800 h-40 rounded-t-2xl border-t-4 border-yellow-500 flex flex-col items-center justify-center p-4 text-center shadow-[0_-20px_60px_rgba(234,179,8,0.3)]">
                            <p className="text-sm font-black text-white truncate w-full">{MOCK_WINNERS[0].name}</p>
                            <p className="text-md text-yellow-500 font-bold">💎 {MOCK_WINNERS[0].score}</p>
                        </div>
                    </div>
                    <div className="flex flex-col items-center w-24">
                        <span className="text-4xl mb-2 drop-shadow-[0_0_10px_rgba(150,100,50,0.5)]">🥉</span>
                        <div className="w-full bg-slate-800 h-16 rounded-t-2xl border-t-4 border-orange-800 flex flex-col items-center justify-center p-2 text-center shadow-lg">
                            <p className="text-[10px] font-black text-white truncate w-full">{MOCK_WINNERS[2].name}</p>
                            <p className="text-xs text-slate-400">💎 {MOCK_WINNERS[2].score}</p>
                        </div>
                    </div>
                </div>

                <div className="glass-effect p-6 rounded-3xl border border-white/5">
                    <h3 className="text-lg font-gaming font-black mb-4 uppercase italic">LIVE DEPLOYMENT FEED</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5 animate-pulse">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">⚡</span>
                                <div>
                                    <p className="text-sm font-bold text-white">Voucher_King</p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Claimed ₹100 Flipkart Card</p>
                                </div>
                            </div>
                            <span className="text-sky-400 font-black text-[10px]">JUST NOW</span>
                        </div>
                    </div>
                </div>
                <AdBanner type="rectangle" />
            </div>
        )}

        {currentPage === Page.REDEEM && (
          <div className="space-y-8 animate-fadeIn pb-12">
            <header className="flex justify-between items-center px-2">
               <div>
                  <h2 className="text-3xl font-black font-gaming tracking-tighter uppercase italic">GIFT STORE</h2>
                  <p className="text-slate-500 text-[10px] font-black uppercase">Official Garena Partners</p>
               </div>
               <div className="text-right bg-sky-900/20 p-3 rounded-2xl border border-sky-500/20">
                 <p className="text-2xl font-black text-sky-400">💎 {stats.coins}</p>
                 <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">WALLET</p>
               </div>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {VOUCHER_PACKAGES.map(pkg => (
                <div key={pkg.id} className={`p-6 rounded-3xl bg-gradient-to-br ${pkg.color} border-2 border-white/10 relative overflow-hidden group hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all`}>
                   <div className="absolute -bottom-6 -right-6 text-[10rem] opacity-10 group-hover:scale-125 transition-transform rotate-12">{pkg.icon}</div>
                   <div className="relative z-10 h-full flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-2 block">{pkg.brand} ELITE</span>
                        <h3 className="text-2xl font-black text-white italic tracking-tighter leading-none mb-4 uppercase">{pkg.title}</h3>
                      </div>
                      <div className="flex justify-between items-end mt-12">
                         <div className="bg-black/40 px-4 py-2 rounded-2xl border border-white/10 backdrop-blur-sm">
                            <p className="text-[8px] text-white/50 font-black uppercase tracking-widest">COST</p>
                            <p className="text-lg font-black text-white">💎 {pkg.cost}</p>
                         </div>
                         <button onClick={() => handleRedeemVoucher(pkg)} className="px-6 py-4 bg-white text-black font-black text-[10px] uppercase rounded-2xl hover:bg-sky-400 hover:scale-105 active:scale-95 transition-all shadow-xl">CLAIM NOW</button>
                      </div>
                   </div>
                </div>
              ))}
            </div>

            {redeemedCode && (
              <div className="fixed inset-0 z-[400] bg-black/95 flex items-center justify-center p-6 backdrop-blur-md">
                <div className="max-w-md w-full glass-effect p-8 rounded-[3rem] border-2 border-green-500 text-center animate-bounce-in shadow-[0_0_80px_rgba(34,197,94,0.4)]">
                  <div className="text-7xl mb-6">🎁</div>
                  <h3 className="text-3xl font-black font-gaming text-white uppercase tracking-tighter italic">VOUCHER SECURED</h3>
                  <div className="bg-black/60 p-8 rounded-[2rem] border-2 border-dashed border-green-500 relative">
                    <p className="text-2xl font-mono font-black text-green-400 tracking-[0.2em] select-all uppercase">{redeemedCode}</p>
                  </div>
                  <button onClick={() => setRedeemedCode(null)} className="w-full mt-12 py-6 ff-gradient text-black font-black rounded-3xl">RETURN TO LOBBY</button>
                </div>
              </div>
            )}
            <AdBanner type="rectangle" />
          </div>
        )}

        {currentPage === Page.CATEGORIES && (
          <div className="space-y-6 animate-fadeIn relative">
            <div onClick={scavengeDiamond} style={{ top: `${scavengePos.top}%`, left: `${scavengePos.left}%` }} className="absolute z-30 cursor-pointer animate-pulse transition-all duration-1000 bg-sky-500/20 p-3 rounded-full border border-sky-400/50 shadow-[0_0_20px_rgba(14,165,233,0.6)]">
              <span className="text-3xl">💎</span>
            </div>

            <header className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black font-gaming text-white italic">{activeHub?.name}</h2>
                <button onClick={() => setCurrentPage(Page.HOME)} className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">BACK TO HUB</button>
              </div>
              <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
                {MAIN_MISSION_HUBS.map(hub => (
                  <button key={hub.id} onClick={() => setActiveMainHubId(hub.id)} className={`flex-shrink-0 px-5 py-3 rounded-2xl text-[10px] font-black transition-all border ${activeMainHubId === hub.id ? 'ff-gradient text-black border-transparent shadow-lg' : 'bg-slate-900 text-slate-500 border-white/5'}`}>{hub.icon} {hub.name}</button>
                ))}
              </div>
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredSubCategories.map((cat) => (
                <div key={cat.id} onClick={() => { setSelectedCategory(cat); setDifficulty(null); }} className={`group glass-effect p-5 rounded-[2rem] cursor-pointer hover:bg-orange-500/10 transition-all border-l-8 ${selectedCategory?.id === cat.id ? 'border-l-orange-500 bg-orange-500/5' : 'border-l-transparent'}`}>
                  <div className="flex items-center gap-4">
                    <span className="text-4xl bg-slate-800 p-3 rounded-2xl group-hover:scale-110 transition-transform">{cat.icon}</span>
                    <div className="overflow-hidden">
                      <h3 className="font-black text-sm group-hover:text-orange-500 transition-colors truncate uppercase italic">{cat.name}</h3>
                      <p className="text-[10px] text-slate-500 font-bold truncate opacity-60">{cat.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {selectedCategory && !difficulty && (
              <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
                <div className="max-w-md w-full glass-effect rounded-[3rem] p-10 border-t-8 border-t-orange-500 animate-fadeIn shadow-2xl">
                  <h3 className="text-3xl font-black font-gaming text-center mb-10 uppercase tracking-tighter italic text-white">SELECT RANK</h3>
                  <div className="space-y-4">
                    <button onClick={() => startQuiz(selectedCategory, 'Easy')} className="w-full p-6 rounded-3xl border-2 border-slate-700 bg-black/40 text-left flex justify-between items-center group hover:border-slate-400 transition-all">
                       <div><p className="font-black text-white group-hover:text-orange-500 transition-colors uppercase italic text-xl tracking-widest">Bronze</p><p className="text-[10px] text-slate-500 font-black uppercase">FEE: 💎 50</p></div>
                       <p className="text-sky-400 font-black text-2xl">💎 100+</p>
                    </button>
                    <button onClick={() => startQuiz(selectedCategory, 'Medium')} className="w-full p-6 rounded-3xl border-2 border-yellow-600 bg-black/40 text-left flex justify-between items-center group hover:border-yellow-400 transition-all">
                       <div><p className="font-black text-white group-hover:text-yellow-500 transition-colors uppercase italic text-xl tracking-widest">Gold</p><p className="text-[10px] text-slate-500 font-black uppercase">FEE: 💎 150</p></div>
                       <p className="text-sky-400 font-black text-2xl">💎 300+</p>
                    </button>
                    <button onClick={() => startQuiz(selectedCategory, 'Hard')} className="w-full p-6 rounded-3xl border-2 border-red-700 bg-black/40 text-left flex justify-between items-center group hover:border-red-500 transition-all">
                       <div><p className="font-black text-white group-hover:text-red-500 transition-colors uppercase italic text-xl tracking-widest">Heroic</p><p className="text-[10px] text-slate-500 font-black uppercase">FEE: 💎 500</p></div>
                       <p className="text-sky-400 font-black text-2xl">💎 1500+</p>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {currentPage === Page.QUIZ && (
          <div className="max-w-2xl mx-auto space-y-10 animate-fadeIn relative">
             <div className="flex justify-between items-center px-4">
                <div className="bg-slate-900 border border-white/5 px-5 py-3 rounded-3xl shadow-lg">
                    <p className="text-[10px] font-black text-slate-500 uppercase italic mb-1">MATCH PROGRESS</p>
                    <p className="text-lg font-black font-gaming text-orange-500">{currentQuestionIndex + 1} <span className="text-slate-700 text-xs">/ 10</span></p>
                </div>
                
                {/* Tactical Timer UI */}
                <div className={`flex flex-col items-center justify-center bg-slate-900 border-2 rounded-full w-20 h-20 shadow-[0_0_20px_rgba(255,77,0,0.1)] transition-all ${timeLeft <= 10 ? 'border-red-500 animate-pulse' : 'border-orange-500/50'}`}>
                   <span className={`text-2xl font-black font-gaming ${timeLeft <= 10 ? 'text-red-500' : 'text-white'}`}>{timeLeft}</span>
                   <span className="text-[8px] font-bold text-slate-500 uppercase">SEC</span>
                </div>

                <div className="bg-slate-900 border border-white/5 px-5 py-3 rounded-3xl text-right shadow-lg">
                    <p className="text-[10px] font-black text-slate-500 uppercase italic mb-1">EXPECTED POOL</p>
                    <p className="text-lg font-black font-gaming text-sky-400">💎 {(score * 50 * (difficulty ? DIFFICULTY_CONFIG[difficulty].rewardMultiplier : 1)) + QUIZ_REWARD_BASE}</p>
                </div>
             </div>

             <div className="relative glass-effect p-12 rounded-[4rem] border-t-8 border-t-orange-500 text-center overflow-hidden bg-slate-900/60 shadow-2xl">
                 {/* Progress Bar Timer */}
                 <div className="absolute top-0 left-0 h-1 bg-orange-500 transition-all duration-1000 linear shadow-[0_0_10px_#ff4d00]" style={{ width: `${(timeLeft / QUESTION_TIMER_LIMIT) * 100}%` }}></div>
                 
                 <div className="absolute -top-10 -left-10 w-40 h-40 bg-orange-500/5 blur-3xl rounded-full"></div>
                 <h3 className="text-2xl md:text-3xl font-black text-white italic leading-tight relative z-10">{questions[currentQuestionIndex]?.question}</h3>
             </div>

             <div className="grid grid-cols-4 gap-3">
                <LifelineBtn label="50-50" icon="📡" used={lifelinesUsed.fiftyFifty} onClick={useFiftyFifty} />
                <LifelineBtn label="Shield" icon="🛡️" used={lifelinesUsed.doubleDip} onClick={useDoubleDip} />
                <LifelineBtn label="Rapid" icon="⚡" used={lifelinesUsed.skip} onClick={useSkip} />
                <LifelineBtn label="Aimbot" icon="🎯" used={lifelinesUsed.hint} onClick={useHint} />
             </div>

             <div className="grid gap-4">
               {questions[currentQuestionIndex]?.options.map((opt, i) => {
                 const isCorrect = opt === questions[currentQuestionIndex].correctAnswer;
                 const isSelected = opt === selectedAnswer;
                 const isDisabled = disabledOptions.includes(opt);
                 let btnStyle = "bg-slate-900 border-white/5 text-slate-300 hover:border-orange-500 hover:bg-orange-500/5 hover:text-white";
                 if (isSelected) { btnStyle = isCorrect ? "bg-green-600 border-green-400 text-white shadow-[0_0_20px_rgba(34,197,94,0.3)]" : "bg-red-600 border-red-400 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)]"; }
                 else if (isAnswering && isCorrect) { btnStyle = "bg-green-600 border-green-400 text-white animate-pulse"; }
                 return (
                  <button key={i} disabled={isAnswering || isDisabled} onClick={() => handleAnswer(opt)} className={`w-full p-7 text-left font-black rounded-[2.5rem] transition-all border group relative overflow-hidden ${btnStyle} ${isDisabled ? 'opacity-10 grayscale scale-95' : ''}`}>
                     <span className="bg-slate-800 text-slate-500 group-hover:bg-orange-500 group-hover:text-black w-10 h-10 rounded-2xl inline-flex items-center justify-center mr-5 text-sm font-black transition-colors">{String.fromCharCode(65 + i)}</span>
                     <span className="text-lg italic">{opt}</span>
                  </button>
                 );
               })}
             </div>
          </div>
        )}

        {currentPage === Page.RESULTS && (
          <div className="text-center space-y-12 animate-fadeIn py-12 relative">
            <Confetti />
            <div className="space-y-2">
                <h2 className="text-8xl md:text-[10rem] font-black font-gaming tracking-tighter text-white italic drop-shadow-[0_0_40px_rgba(255,77,0,0.4)] leading-none">BOOYAH!</h2>
                <p className="text-orange-500 font-black uppercase tracking-[0.5em] text-sm italic">VICTORY SECURED</p>
            </div>
            
            <div className="glass-effect p-10 rounded-[4rem] border-2 border-orange-500 relative overflow-hidden shadow-[0_0_80px_rgba(255,77,0,0.3)] bg-gradient-to-b from-slate-900 to-black">
               <div className="flex flex-col items-center mb-8">
                  <div className="text-[120px] mb-4 leading-none drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">{currentRank.icon}</div>
                  <h3 className={`text-4xl font-black font-gaming ${currentRank.color} italic uppercase`}>{currentRank.label} RANK</h3>
               </div>

               <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="p-6 bg-slate-900/60 rounded-[2.5rem] border border-white/5">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">HITS</p>
                    <p className="text-3xl font-black text-white">{score} / 10</p>
                  </div>
                  <div className="p-6 bg-sky-900/30 rounded-[2.5rem] border border-sky-500/20">
                    <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1 italic">DIAMONDS</p>
                    <p className="text-3xl font-black text-white">💎 {(score * 50 * (difficulty ? DIFFICULTY_CONFIG[difficulty].rewardMultiplier : 1)) + QUIZ_REWARD_BASE}</p>
                  </div>
               </div>

               <div className="space-y-4">
                  <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.3em] mb-4 italic">— NEXT OPERATIONS —</p>
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => navigateWithAd(Page.WINNERS)} className="p-4 bg-slate-800 border border-white/5 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors">
                      <span className="text-xl">🏆</span>
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">HALL OF FAME</span>
                    </button>
                    <button onClick={() => navigateWithAd(Page.REDEEM)} className="p-4 bg-slate-800 border border-white/5 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors">
                      <span className="text-xl">🎫</span>
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">GIFT STORE</span>
                    </button>
                  </div>
               </div>
            </div>

            <button onClick={() => adService.showRewarded(() => {
                    const extra = (score * 50 * (difficulty ? DIFFICULTY_CONFIG[difficulty].rewardMultiplier : 1)) + QUIZ_REWARD_BASE;
                    setStats(prev => ({ ...prev, coins: prev.coins + extra }));
                    alert("BOOSTED! Mission diamonds have been DOUBLED! 🚀🚀");
                })} className="w-full py-6 bg-gradient-to-r from-blue-600 to-sky-400 text-white font-black text-xl rounded-[2.5rem] shadow-[0_0_40px_rgba(14,165,233,0.4)] animate-pulse-ff uppercase tracking-widest italic">📺 DOUBLE YOUR LOOT 💎</button>

            <div className="flex gap-4">
              <button onClick={() => navigateWithAd(Page.CATEGORIES)} className="flex-1 py-6 ff-gradient text-black font-black text-lg rounded-3xl hover:scale-105 transition-all uppercase italic">RE-DEPLOY</button>
              <button onClick={() => navigateWithAd(Page.HOME)} className="flex-1 py-6 glass-effect font-black text-lg rounded-3xl text-white hover:bg-slate-800 transition-all uppercase italic">LOBBY</button>
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 glass-effect border-t border-orange-500/20 py-8 px-8 flex justify-between items-center z-[200] rounded-t-[4.5rem] shadow-[0_-20px_80px_rgba(0,0,0,0.95)]">
        <NavItem active={currentPage === Page.HOME} onClick={() => navigateWithAd(Page.HOME)} icon="🏠" label="LOBBY" />
        <NavItem active={currentPage === Page.CATEGORIES} onClick={() => navigateWithAd(Page.CATEGORIES)} icon="⚔️" label="COMBAT" />
        <NavItem active={currentPage === Page.WINNERS} onClick={() => navigateWithAd(Page.WINNERS)} icon="🏆" label="ELITE" />
        <NavItem active={currentPage === Page.REDEEM} onClick={() => navigateWithAd(Page.REDEEM)} icon="🎫" label="STORE" />
        <div className="flex flex-col items-center bg-sky-900/30 px-6 py-2 rounded-3xl border border-sky-500/30 shadow-inner">
          <span className="text-2xl animate-bounce">💎</span>
          <span className="text-[16px] font-black text-sky-400 tracking-tighter font-gaming">{stats.coins}</span>
        </div>
      </nav>
    </div>
  );
};

const LifelineBtn = ({ label, icon, used, onClick }: any) => (
  <button onClick={onClick} disabled={used} className={`flex flex-col items-center justify-center p-4 rounded-[1.5rem] border-2 transition-all shadow-lg relative group ${used ? 'bg-slate-900 border-slate-800 opacity-20' : 'bg-slate-800/80 border-orange-500/30 hover:border-orange-500/60'}`}>
    <span className="text-3xl mb-1 group-hover:scale-110 transition-transform">{icon}</span>
    <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">{label}</span>
  </button>
);

const NavItem = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className="flex flex-col items-center gap-1 group">
    <span className={`text-4xl transition-all duration-300 ${active ? 'scale-125 drop-shadow-[0_0_15px_rgba(255,77,0,0.6)]' : 'opacity-30'}`}>{icon}</span>
    <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${active ? 'text-orange-500' : 'text-slate-700'}`}>{label}</span>
  </button>
);

export default App;
