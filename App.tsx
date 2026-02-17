
import React, { useState, useEffect, useMemo } from 'react';
import { SUNNAHS, VIRTUES } from './data.ts';
import { SunnahItem, Category } from './types.ts';
import { getSunnahExplanation } from './services/aiService.ts';

type ViewState = 'home' | 'fajilat' | 'info';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewState>('home');
  const [items, setItems] = useState<SunnahItem[]>(() => {
    try {
      const saved = localStorage.getItem('sunnah_progress');
      if (saved) {
        const parsed = JSON.parse(saved);
        return SUNNAHS.map(s => ({
          ...s,
          completed: Array.isArray(parsed) && parsed.includes(s.id)
        }));
      }
    } catch (e) {
      console.error("Failed to parse progress", e);
    }
    return SUNNAHS;
  });

  const [filter, setFilter] = useState<Category | 'সব'>('সব');
  const [explainingId, setExplainingId] = useState<number | null>(null);
  const [explanation, setExplanation] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Daily Sunnah logic
  const dailySunnah = useMemo(() => {
    if (!SUNNAHS || SUNNAHS.length === 0) return null;
    const today = new Date();
    const index = (today.getFullYear() + today.getMonth() + today.getDate()) % SUNNAHS.length;
    return SUNNAHS[index];
  }, []);

  useEffect(() => {
    const completedIds = items.filter(i => i.completed).map(i => i.id);
    localStorage.setItem('sunnah_progress', JSON.stringify(completedIds));
  }, [items]);

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
    try {
      const text = await getSunnahExplanation(item.title);
      setExplanation(text);
    } catch (e) {
      setExplanation("দুঃখিত, তথ্য লোড করা যায়নি।");
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    if (filter === 'সব') return items;
    return items.filter(i => i.category === filter);
  }, [items, filter]);

  if (!dailySunnah) {
    return <div className="p-10 text-center text-emerald-200">ডাটা লোড হচ্ছে...</div>;
  }

  const renderHome = () => (
    <div className="animate-in">
      {/* Daily Highlight */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-emerald-200 mb-4 px-1 flex items-center gap-2">
          <span className="text-2xl">✨</span> বিশেষ সুন্নাহ
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
            <div className="mt-8 p-6 bg-emerald-950/40 rounded-3xl border border-emerald-400/20 backdrop-blur-md animate-in">
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
                ? 'bg-emerald-500 text-white shadow-lg scale-105' 
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
            className={`p-6 rounded-[2rem] border transition-all duration-500 ${item.completed ? 'bg-emerald-900/10 border-emerald-900/20 opacity-60' : 'bg-emerald-800/20 border-emerald-700/30 shadow-lg'}`}
          >
            <div className="flex items-start gap-5">
              <button 
                onClick={() => toggleComplete(item.id)}
                className={`w-8 h-8 rounded-xl flex items-center justify-center border-2 transition-all mt-1 ${item.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-emerald-700'}`}
              >
                {item.completed && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>}
              </button>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h4 className={`text-xl font-bold ${item.completed ? 'text-emerald-600 line-through' : 'text-emerald-50'}`}>{item.title}</h4>
                  <span className="text-[9px] bg-emerald-900/80 px-2.5 py-1 rounded-lg text-emerald-500 font-black uppercase tracking-widest">{item.category}</span>
                </div>
                <p className="text-emerald-200/70 text-base mb-4 leading-relaxed">{item.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-emerald-600 text-xs font-bold">📜 {item.reference}</span>
                  <button onClick={() => handleExplain(item)} className="text-xs text-emerald-400 font-bold underline underline-offset-4 decoration-emerald-800">ব্যাখ্যা জানুন</button>
                </div>
                {explainingId === item.id && (
                  <div className="mt-5 p-5 bg-emerald-950/60 rounded-2xl text-sm text-emerald-100 leading-relaxed border border-emerald-500/10 animate-in">
                    {loading ? "লোডিং..." : explanation}
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
    <div className="animate-in">
      <h2 className="text-3xl font-black text-emerald-100 mb-8">ইবাদতের ফজিলত</h2>
      
      <div className="grid gap-5">
        {VIRTUES.map(virtue => (
          <div key={virtue.id} className="bg-emerald-800/10 border border-emerald-800/30 p-8 rounded-[2rem] relative overflow-hidden shadow-xl hover:bg-emerald-800/20 transition-all border-l-4 border-l-emerald-500/50">
             <div className="absolute -bottom-6 -right-6 text-8xl opacity-5 pointer-events-none">{virtue.icon}</div>
             <div className="flex items-center gap-4 mb-4">
                <span className="text-3xl bg-emerald-500/10 p-3 rounded-2xl">{virtue.icon}</span>
                <h3 className="text-2xl font-black text-white">{virtue.title}</h3>
             </div>
             <p className="text-emerald-100/80 text-base leading-relaxed mb-6 relative z-10 font-medium">{virtue.benefit}</p>
             <div className="flex items-center gap-2 text-emerald-600 text-[11px] font-black uppercase bg-emerald-950/40 inline-flex px-3 py-1 rounded-full">
                সোর্স: {virtue.reference}
             </div>
          </div>
        ))}
      </div>
      <div className="h-28"></div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 pb-40">
      <main>
        {activeView === 'home' && renderHome()}
        {activeView === 'fajilat' && renderFajilat()}
        {activeView === 'info' && (
           <div className="p-10 text-center animate-in">
              <div className="w-24 h-24 bg-gradient-to-tr from-emerald-500 to-emerald-300 rounded-[2rem] mx-auto mb-8 flex items-center justify-center text-4xl shadow-2xl rotate-12">✨</div>
              <h2 className="text-3xl font-black text-white mb-4">দৈনিক সুন্নাহ</h2>
              <p className="text-emerald-300 mb-10 text-lg leading-relaxed font-medium">প্রতিদিনের জীবনে রাসূলুল্লাহ (সা.) এর সুন্নাহগুলো মনে করিয়ে দিতে এই অ্যাপটি তৈরি করা হয়েছে।</p>
              <div className="space-y-4 mb-10 text-left">
                <div className="bg-emerald-900/30 p-6 rounded-[2rem] border border-emerald-800">
                  <h4 className="text-emerald-100 font-black mb-3 text-sm">অ্যাপ আপডেট (v1.5.1)</h4>
                  <ul className="text-emerald-400 text-sm space-y-2">
                    <li>✓ ইন্টারফেস আরও সহজ ও সুন্দর করা হয়েছে।</li>
                    <li>✓ নতুন ফজিলত ও সুন্নাহ ডাটাবেজ আপডেট।</li>
                    <li>✓ উন্নত ও দ্রুত পারফরম্যান্স।</li>
                  </ul>
                </div>
              </div>
              <div className="text-emerald-800 text-[10px] font-black uppercase tracking-[0.3em] mt-10">Made for the Ummah</div>
           </div>
        )}
      </main>

      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-md px-6 z-50">
        <div className="bg-emerald-950/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-5 flex justify-around shadow-2xl">
          {(['home', 'fajilat', 'info'] as const).map((view) => (
            <button key={view} onClick={() => setActiveView(view)} className={`flex flex-col items-center gap-1.5 transition-all duration-500 ${activeView === view ? 'text-emerald-300 scale-125' : 'text-emerald-900'}`}>
              <div className={`p-2 rounded-2xl transition-all ${activeView === view ? 'bg-emerald-500/20' : ''}`}>
                {view === 'home' && <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>}
                {view === 'fajilat' && <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>}
                {view === 'info' && <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${activeView === view ? 'opacity-100' : 'opacity-0'}`}>{view === 'home' ? 'হোম' : view === 'fajilat' ? 'ফজিলত' : 'তথ্য'}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default App;
