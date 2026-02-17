
import React, { useState, useEffect, useMemo } from 'react';
import { SUNNAHS, VIRTUES } from './data';
import { SunnahItem, Category, SquareValue } from './types';
import { getSunnahExplanation, searchVirtues } from './services/aiService';
import { getBestMove } from './services/geminiService';
import { calculateWinner } from './utils';

type ViewState = 'home' | 'fajilat' | 'game' | 'info';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewState>('home');
  const [items, setItems] = useState<SunnahItem[]>(() => {
    const saved = localStorage.getItem('sunnah_progress');
    if (saved) {
      const parsed = JSON.parse(saved);
      return SUNNAHS.map(s => ({
        ...s,
        completed: parsed.includes(s.id)
      }));
    }
    return SUNNAHS;
  });

  const [filter, setFilter] = useState<Category | 'সব'>('সব');
  const [explainingId, setExplainingId] = useState<number | null>(null);
  const [explanation, setExplanation] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Tic-Tac-Toe State
  const [board, setBoard] = useState<SquareValue[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [gameLoading, setGameLoading] = useState(false);
  const [score, setScore] = useState({ player: 0, ai: 0, draw: 0 });
  const winInfo = calculateWinner(board);

  // Search feature for Fajilat
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResult, setSearchResult] = useState<{text: string, sources: any[]} | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Daily Sunnah logic
  const dailyIndex = useMemo(() => {
    const today = new Date();
    return (today.getFullYear() + today.getMonth() + today.getDate()) % SUNNAHS.length;
  }, []);
  const dailySunnah = SUNNAHS[dailyIndex];

  useEffect(() => {
    const completedIds = items.filter(i => i.completed).map(i => i.id);
    localStorage.setItem('sunnah_progress', JSON.stringify(completedIds));
  }, [items]);

  // Handle Winner Score
  useEffect(() => {
    if (winInfo) {
      if (winInfo.isDraw) {
        setScore(s => ({ ...s, draw: s.draw + 1 }));
      } else if (winInfo.winner === 'X') {
        setScore(s => ({ ...s, player: s.player + 1 }));
      } else if (winInfo.winner === 'O') {
        setScore(s => ({ ...s, ai: s.ai + 1 }));
      }
    }
  }, [winInfo?.winner, winInfo?.isDraw]);

  // AI Move logic for Tic-Tac-Toe
  useEffect(() => {
    if (!isXNext && !winInfo && activeView === 'game') {
      const makeAiMove = async () => {
        setGameLoading(true);
        // Small delay for natural feeling
        await new Promise(r => setTimeout(r, 600));
        const move = await getBestMove(board, 'O');
        if (move !== undefined && board[move] === null) {
          const nextBoard = board.slice();
          nextBoard[move] = 'O';
          setBoard(nextBoard);
          setIsXNext(true);
        }
        setGameLoading(false);
      };
      makeAiMove();
    }
  }, [isXNext, board, winInfo, activeView]);

  const handleSquareClick = (index: number) => {
    if (board[index] || winInfo || !isXNext || gameLoading) return;
    const nextBoard = board.slice();
    nextBoard[index] = 'X';
    setBoard(nextBoard);
    setIsXNext(false);
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
  };

  const toggleComplete = (id: number) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const handleExplain = async (item: SunnahItem) => {
    if (explainingId === item.id) {
      setExplainingId(null);
      return;
    }
    setLoading(true);
    setExplainingId(item.id);
    const text = await getSunnahExplanation(item.title);
    setExplanation(text);
    setLoading(false);
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setIsSearching(true);
    const result = await searchVirtues(searchTerm);
    setSearchResult(result);
    setIsSearching(false);
  };

  const filteredItems = useMemo(() => {
    if (filter === 'সব') return items;
    return items.filter(i => i.category === filter);
  }, [items, filter]);

  const renderHome = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Daily Highlight */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-emerald-200 mb-4 px-1 flex items-center gap-2">
          <span className="text-2xl">✨</span> আজকের বিশেষ সুন্নাহ
        </h2>
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-900 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 scale-150 group-hover:scale-110 transition-transform duration-700">
             <svg width="120" height="120" viewBox="0 0 24 24" fill="white"><path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z"/></svg>
          </div>
          <span className="inline-block px-4 py-1.5 bg-white/20 rounded-full text-[10px] font-black text-white mb-5 uppercase tracking-[0.2em]">
            {dailySunnah.category}
          </span>
          <h3 className="text-3xl font-black text-white mb-4 leading-tight">{dailySunnah.title}</h3>
          <p className="text-emerald-50/90 text-lg mb-8 leading-relaxed font-medium">{dailySunnah.description}</p>
          <div className="flex justify-between items-center relative z-10">
             <span className="text-emerald-200 text-sm font-bold italic opacity-80">📖 {dailySunnah.reference}</span>
             <button 
              onClick={() => handleExplain(dailySunnah)}
              className="px-6 py-3 bg-white text-emerald-900 rounded-2xl font-black hover:bg-emerald-50 transition-all text-sm shadow-[0_10px_20px_rgba(0,0,0,0.2)] active:scale-95"
             >
               বিস্তারিত জানুন
             </button>
          </div>
          
          {explainingId === dailySunnah.id && (
            <div className="mt-8 p-6 bg-emerald-950/40 rounded-3xl border border-emerald-400/20 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-500">
              {loading ? (
                <div className="flex items-center gap-4 text-emerald-200 py-2">
                   <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                   <span className="font-bold">Gemini AI ব্যাখ্যা তৈরি করছে...</span>
                </div>
              ) : (
                <p className="text-emerald-50 text-base leading-relaxed whitespace-pre-line">{explanation}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2.5 mb-8 overflow-x-auto pb-4 scrollbar-hide">
        {(['সব', 'খাবার', 'ঘুম', 'সকাল', 'মসজিদ', 'সাধারণ'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-6 py-2.5 rounded-2xl whitespace-nowrap text-sm font-bold transition-all duration-300 ${
              filter === cat 
                ? 'bg-emerald-500 text-white shadow-[0_8px_15px_rgba(16,185,129,0.3)] scale-105' 
                : 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/50 hover:bg-emerald-800/50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Sunnah List */}
      <div className="space-y-5">
        {filteredItems.map(item => (
          <div 
            key={item.id}
            className={`
              p-6 rounded-[2rem] border transition-all duration-500
              ${item.completed 
                ? 'bg-emerald-900/10 border-emerald-900/20 opacity-60 grayscale-[0.5]' 
                : 'bg-emerald-800/20 border-emerald-700/30 hover:border-emerald-500/40 hover:bg-emerald-800/30 shadow-lg'}
            `}
          >
            <div className="flex items-start gap-5">
              <button 
                onClick={() => toggleComplete(item.id)}
                className={`
                  w-8 h-8 rounded-xl flex items-center justify-center border-2 transition-all duration-300 mt-1
                  ${item.completed ? 'bg-emerald-500 border-emerald-500 text-white rotate-[360deg]' : 'border-emerald-700 hover:border-emerald-500'}
                `}
              >
                {item.completed && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>}
              </button>
              
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h4 className={`text-xl font-bold ${item.completed ? 'text-emerald-600 line-through' : 'text-emerald-50'}`}>
                    {item.title}
                  </h4>
                  <span className="text-[9px] bg-emerald-900/80 px-2.5 py-1 rounded-lg text-emerald-500 font-black uppercase tracking-widest">
                    {item.category}
                  </span>
                </div>
                <p className="text-emerald-200/70 text-base mb-4 leading-relaxed">{item.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-emerald-600 text-xs font-bold">📜 {item.reference}</span>
                  <button 
                    onClick={() => handleExplain(item)}
                    className="text-xs text-emerald-400 hover:text-emerald-200 font-bold underline underline-offset-4 decoration-emerald-800"
                  >
                    ব্যাখ্যা {explainingId === item.id ? 'বন্ধ করুন' : 'দেখুন'}
                  </button>
                </div>
                
                {explainingId === item.id && (
                  <div className="mt-5 p-5 bg-emerald-950/60 rounded-2xl text-sm text-emerald-100 leading-relaxed border border-emerald-500/10 animate-in zoom-in-95 duration-300 shadow-inner">
                    {loading ? "তথ্য সংগৃহীত হচ্ছে..." : explanation}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderFajilat = () => (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="flex justify-between items-center mb-8 px-1">
        <h2 className="text-3xl font-black text-emerald-100">ইবাদতের ফজিলত</h2>
      </div>

      {/* AI Search Bar */}
      <div className="mb-10 bg-gradient-to-r from-emerald-900/40 to-emerald-800/20 p-6 rounded-[2.5rem] border border-emerald-700/40 shadow-2xl">
         <div className="flex items-center gap-2 mb-3 ml-2">
            <span className="text-emerald-400 animate-pulse">●</span>
            <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">Web Search powered by Gemini</p>
         </div>
         <div className="flex gap-3">
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="যেমন: মা-বাবার সেবার ফজিলত..." 
              className="flex-1 bg-emerald-950/80 border-2 border-emerald-800/50 rounded-2xl px-5 py-3 text-sm text-emerald-50 placeholder:text-emerald-800 focus:outline-none focus:border-emerald-500 transition-all shadow-inner"
            />
            <button 
              onClick={handleSearch}
              disabled={isSearching}
              className="bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-3 rounded-2xl text-sm font-black shadow-lg active:scale-90 disabled:opacity-50 transition-all flex items-center justify-center min-w-[80px]"
            >
              {isSearching ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'সার্চ'}
            </button>
         </div>
         {searchResult && (
           <div className="mt-6 p-6 bg-emerald-950 rounded-3xl border border-emerald-500/30 animate-in zoom-in-95 duration-500 shadow-2xl relative">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-emerald-900">
                <h4 className="text-emerald-400 text-xs font-black uppercase tracking-wider">AI রেজাল্ট</h4>
                <button onClick={() => setSearchResult(null)} className="text-emerald-700 hover:text-rose-500 transition-colors p-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <p className="text-emerald-50 text-base leading-relaxed mb-6 font-medium whitespace-pre-line">{searchResult.text}</p>
              {searchResult.sources.length > 0 && (
                <div className="bg-emerald-900/20 p-4 rounded-2xl">
                   <p className="text-[10px] text-emerald-500 font-black mb-3 uppercase tracking-tighter">নির্ভরযোগ্য উৎসসমূহ:</p>
                   <div className="flex flex-wrap gap-2">
                     {searchResult.sources.map((chunk: any, i: number) => chunk.web && (
                       <a 
                        key={i} 
                        href={chunk.web.uri} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-[10px] bg-emerald-800/40 px-3 py-1.5 rounded-lg text-emerald-300 hover:bg-emerald-500 hover:text-white transition-all border border-emerald-700/50 max-w-full overflow-hidden"
                       >
                         🔗 {chunk.web.title || 'ওয়েবসাইট'}
                       </a>
                     ))}
                   </div>
                </div>
              )}
           </div>
         )}
      </div>

      <div className="grid gap-5">
        {VIRTUES.map(virtue => (
          <div key={virtue.id} className="bg-emerald-800/10 border border-emerald-800/30 p-8 rounded-[2rem] relative overflow-hidden shadow-xl hover:bg-emerald-800/20 transition-all group border-l-4 border-l-emerald-500/50">
             <div className="absolute -bottom-6 -right-6 text-8xl opacity-5 grayscale group-hover:grayscale-0 group-hover:opacity-10 transition-all duration-700 pointer-events-none">{virtue.icon}</div>
             <div className="flex items-center gap-4 mb-4">
                <span className="text-3xl bg-emerald-500/10 p-3 rounded-2xl shadow-inner">{virtue.icon}</span>
                <h3 className="text-2xl font-black text-white">{virtue.title}</h3>
             </div>
             <p className="text-emerald-100/80 text-base leading-relaxed mb-6 relative z-10 font-medium">{virtue.benefit}</p>
             <div className="flex items-center gap-2 text-emerald-600 text-[11px] font-black uppercase tracking-widest bg-emerald-950/40 inline-flex px-3 py-1 rounded-full">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L1 21h22L12 2zm0 3.45l8.15 14.1H3.85L12 5.45zM11 11h2v4h-2v-4zm0 6h2v2h-2v-2z"/></svg>
                সোর্স: {virtue.reference}
             </div>
          </div>
        ))}
      </div>
      <div className="h-28"></div>
    </div>
  );

  const renderGame = () => (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 text-center">
      <h2 className="text-3xl font-black text-emerald-100 mb-2">AI চ্যালেঞ্জ</h2>
      <p className="text-emerald-400 text-sm mb-8 font-bold">সুন্নাহর বিরতিতে Gemini-র সাথে একটু খেলা যাক!</p>
      
      {/* Scoreboard */}
      <div className="flex justify-center gap-6 mb-8">
        <div className="bg-emerald-900/40 px-6 py-4 rounded-3xl border border-emerald-700/30 shadow-xl">
           <p className="text-[10px] font-black text-emerald-500 uppercase mb-1">আপনি (X)</p>
           <p className="text-2xl font-black text-white">{score.player}</p>
        </div>
        <div className="bg-emerald-900/40 px-6 py-4 rounded-3xl border border-emerald-700/30 shadow-xl">
           <p className="text-[10px] font-black text-emerald-500 uppercase mb-1">ড্র</p>
           <p className="text-2xl font-black text-white">{score.draw}</p>
        </div>
        <div className="bg-emerald-900/40 px-6 py-4 rounded-3xl border border-emerald-700/30 shadow-xl">
           <p className="text-[10px] font-black text-rose-500 uppercase mb-1">Gemini (O)</p>
           <p className="text-2xl font-black text-white">{score.ai}</p>
        </div>
      </div>

      <div className="bg-emerald-900/20 border-2 border-emerald-700/30 rounded-[3rem] p-10 shadow-2xl inline-block backdrop-blur-sm">
        <div className="grid grid-cols-3 gap-3 w-72 h-72 mx-auto">
          {board.map((val, idx) => (
            <button
              key={idx}
              onClick={() => handleSquareClick(idx)}
              className={`
                w-full h-full rounded-2xl border-2 flex items-center justify-center text-4xl font-black transition-all duration-300
                ${!val && !winInfo && isXNext && !gameLoading ? 'hover:bg-emerald-500/20 hover:border-emerald-500/50 border-emerald-800/50 cursor-pointer active:scale-90' : 'border-emerald-800/20 cursor-default'}
                ${val === 'X' ? 'text-emerald-400 bg-emerald-900/40 shadow-[0_0_20px_rgba(52,211,153,0.1)]' : ''}
                ${val === 'O' ? 'text-rose-400 bg-rose-950/20' : ''}
                ${winInfo?.line?.includes(idx) ? 'bg-emerald-500 text-white scale-110 shadow-[0_0_30px_rgba(16,185,129,0.5)] z-10' : ''}
              `}
            >
              {val}
            </button>
          ))}
        </div>
        
        <div className="mt-10">
          {winInfo ? (
            <div className="mb-6 animate-bounce">
              <p className="text-2xl font-black text-white">
                {winInfo.isDraw ? "ড্র হয়েছে! 🤝" : winInfo.winner === 'X' ? "অভিনন্দন! আপনি জিতেছেন 🎉" : "Gemini জিতেছে! 🤖"}
              </p>
            </div>
          ) : (
            <div className="mb-6 flex items-center justify-center gap-3 h-8">
              {gameLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-emerald-400 font-black text-xs uppercase tracking-widest">Gemini চাল দিচ্ছে...</span>
                </>
              ) : (
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${isXNext ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-rose-500/20 border-rose-500 text-rose-400'}`}>
                  {isXNext ? "আপনার পালা (X)" : "Gemini-র পালা (O)"}
                </div>
              )}
            </div>
          )}
          <button 
            onClick={resetGame}
            className="px-10 py-4 bg-emerald-500 text-white rounded-2xl font-black shadow-[0_15px_30px_-5px_rgba(16,185,129,0.4)] hover:bg-emerald-400 hover:scale-105 active:scale-95 transition-all text-sm uppercase tracking-widest"
          >
            আবার শুরু করুন
          </button>
        </div>
      </div>
      <p className="mt-10 text-emerald-700 text-[9px] font-black uppercase tracking-widest">Powered by Gemini-3-Pro-Preview</p>
      <div className="h-28"></div>
    </div>
  );

  const renderInfo = () => (
    <div className="p-10 text-center animate-in fade-in duration-700">
      <div className="w-24 h-24 bg-gradient-to-tr from-emerald-500 to-emerald-300 rounded-[2rem] mx-auto mb-8 flex items-center justify-center text-4xl shadow-2xl rotate-12">✨</div>
      <h2 className="text-3xl font-black text-white mb-4">দৈনিক সুন্নাহ</h2>
      <p className="text-emerald-300 mb-10 text-lg leading-relaxed font-medium">
        একটি আধুনিক এবং সহজ প্ল্যাটফর্ম যা আপনাকে প্রতিদিনের জীবনে রাসূলুল্লাহ (সা.) এর সুন্নাহগুলো মনে করিয়ে দিতে সাহায্য করবে।
      </p>
      
      <div className="space-y-4 mb-10">
        <div className="bg-emerald-900/30 p-6 rounded-[2rem] border border-emerald-800 text-left">
          <h4 className="text-emerald-100 font-black mb-3 text-sm flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span> লেটেস্ট আপডেট (v1.5.0)
          </h4>
          <ul className="text-emerald-400 text-sm space-y-2 font-medium opacity-80">
            <li className="flex gap-2">🚀 ১০টি নতুন গুরুত্বপূর্ণ ফজিলত যুক্ত।</li>
            <li className="flex gap-2">🕹️ গেম সেকশনে স্কোরবোর্ড সুবিধা।</li>
            <li className="flex gap-2">🔍 AI সার্চের রেজাল্ট ও সোর্স উন্নত।</li>
            <li className="flex gap-2">💎 Gemini-3-Pro-Preview মডেল ব্যবহার।</li>
          </ul>
        </div>
      </div>

      <div className="text-emerald-800 text-[10px] font-black uppercase tracking-[0.3em] mt-10">
        Made with ❤️ for the Ummah
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 pb-40">
      {/* Header */}
      <header className="text-center mb-16 animate-in slide-in-from-top-10 duration-1000">
        <div className="inline-block px-4 py-1 bg-emerald-500/10 rounded-full text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] mb-4 border border-emerald-500/20">
          Daily Sunnah App
        </div>
        <h1 className="text-5xl font-black text-white mb-4 drop-shadow-2xl tracking-tight">দৈনিক সুন্নাহ</h1>
        <div className="w-16 h-1.5 bg-emerald-500 mx-auto rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
      </header>

      <main>
        {activeView === 'home' && renderHome()}
        {activeView === 'fajilat' && renderFajilat()}
        {activeView === 'game' && renderGame()}
        {activeView === 'info' && renderInfo()}
      </main>

      {/* Footer Nav (Floating) */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-md px-6 z-50">
        <nav className="bg-emerald-950/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-5 flex justify-around shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
          {(['home', 'fajilat', 'game', 'info'] as const).map((view) => (
            <button 
              key={view}
              onClick={() => setActiveView(view)}
              className={`flex flex-col items-center gap-1.5 transition-all duration-500 group ${activeView === view ? 'text-emerald-300 scale-125' : 'text-emerald-900 hover:text-emerald-700'}`}
            >
              <div className={`p-2 rounded-2xl transition-all duration-500 ${activeView === view ? 'bg-emerald-500/20 shadow-inner' : 'group-hover:bg-emerald-500/5'}`}>
                {view === 'home' && <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>}
                {view === 'fajilat' && <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>}
                {view === 'game' && <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M20 6H4V4h16v2zM4 18h16v-2H4v2zm0-6h16v-2H4v2z"/></svg>}
                {view === 'info' && <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${activeView === view ? 'opacity-100' : 'opacity-0'}`}>
                {view === 'home' ? 'হোম' : view === 'fajilat' ? 'ফজিলত' : view === 'game' ? 'খেলা' : 'তথ্য'}
              </span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default App;
