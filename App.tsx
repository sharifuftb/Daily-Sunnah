
import React, { useState, useEffect, useMemo } from 'react';
import { SUNNAHS, VIRTUES } from './data';
import { SunnahItem, Category } from './types';
import { getSunnahExplanation, searchVirtues } from './services/aiService';

type ViewState = 'home' | 'fajilat' | 'info';

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
    <>
      {/* Daily Highlight */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-emerald-200 mb-4 px-1 flex items-center gap-2">
          <span className="text-2xl">✨</span> বিশেষ সুন্নাহ
        </h2>
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 scale-150 group-hover:scale-110 transition-transform duration-500">
             <svg width="100" height="100" viewBox="0 0 24 24" fill="white"><path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z"/></svg>
          </div>
          <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-bold text-white mb-4 uppercase tracking-wider">
            {dailySunnah.category}
          </span>
          <h3 className="text-2xl font-bold text-white mb-3">{dailySunnah.title}</h3>
          <p className="text-emerald-50/90 text-lg mb-6 leading-relaxed">{dailySunnah.description}</p>
          <div className="flex justify-between items-center">
             <span className="text-emerald-200 text-sm italic">— {dailySunnah.reference}</span>
             <button 
              onClick={() => handleExplain(dailySunnah)}
              className="px-5 py-2 bg-emerald-100 text-emerald-900 rounded-xl font-bold hover:bg-white transition-colors text-sm shadow-lg active:scale-95"
             >
               বিস্তারিত জানুন
             </button>
          </div>
          
          {explainingId === dailySunnah.id && (
            <div className="mt-6 p-4 bg-emerald-900/50 rounded-2xl border border-emerald-400/30 animate-in fade-in slide-in-from-top-4 duration-300">
              {loading ? (
                <div className="flex items-center gap-3 text-emerald-200">
                   <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                   <span>AI ব্যাখ্যা তৈরি করছে...</span>
                </div>
              ) : (
                <p className="text-emerald-50 text-sm leading-relaxed whitespace-pre-line">{explanation}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {(['সব', 'খাবার', 'ঘুম', 'সকাল', 'মসজিদ', 'সাধারণ'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-5 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-all ${
              filter === cat 
                ? 'bg-emerald-500 text-white shadow-lg' 
                : 'bg-emerald-900/40 text-emerald-300 border border-emerald-800 hover:bg-emerald-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Sunnah List */}
      <div className="space-y-4">
        {filteredItems.map(item => (
          <div 
            key={item.id}
            className={`
              p-5 rounded-2xl border transition-all duration-300
              ${item.completed 
                ? 'bg-emerald-900/20 border-emerald-800/40 opacity-70' 
                : 'bg-emerald-800/30 border-emerald-700/50 hover:border-emerald-500/50'}
            `}
          >
            <div className="flex items-start gap-4">
              <button 
                onClick={() => toggleComplete(item.id)}
                className={`
                  w-7 h-7 rounded-lg flex items-center justify-center border-2 transition-colors mt-1
                  ${item.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-emerald-600 hover:border-emerald-400'}
                `}
              >
                {item.completed && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
              </button>
              
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h4 className={`text-lg font-bold ${item.completed ? 'text-emerald-400 line-through' : 'text-emerald-100'}`}>
                    {item.title}
                  </h4>
                  <span className="text-[10px] bg-emerald-900/60 px-2 py-0.5 rounded text-emerald-400 uppercase tracking-tighter">
                    {item.category}
                  </span>
                </div>
                <p className="text-emerald-300/80 text-sm mb-3 leading-relaxed">{item.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-emerald-500 text-xs italic">{item.reference}</span>
                  <button 
                    onClick={() => handleExplain(item)}
                    className="text-xs text-emerald-400 hover:text-emerald-200 font-bold underline decoration-dotted"
                  >
                    ব্যাখ্যা {explainingId === item.id ? 'বন্ধ করুন' : 'দেখুন'}
                  </button>
                </div>
                
                {explainingId === item.id && (
                  <div className="mt-4 p-4 bg-emerald-950/50 rounded-xl text-xs text-emerald-100 leading-relaxed animate-in zoom-in-95 duration-200">
                    {loading ? "লোডিং..." : explanation}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );

  const renderFajilat = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-6 px-1">
        <h2 className="text-2xl font-bold text-emerald-200">ইবাদতের ফজিলত</h2>
      </div>

      {/* AI Search Bar */}
      <div className="mb-8 bg-emerald-900/40 p-4 rounded-3xl border border-emerald-700/50 shadow-inner">
         <p className="text-emerald-400 text-[10px] font-bold uppercase mb-2 ml-2">ইন্টারনেট থেকে ফজিলত খুঁজুন (AI)</p>
         <div className="flex gap-2">
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="যেমন: জুমার দিনের ফজিলত..." 
              className="flex-1 bg-emerald-950/60 border border-emerald-700/30 rounded-2xl px-4 py-2 text-sm text-emerald-100 placeholder:text-emerald-700 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <button 
              onClick={handleSearch}
              disabled={isSearching}
              className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-2xl text-sm font-bold shadow-lg active:scale-95 disabled:opacity-50 transition-all"
            >
              {isSearching ? '...' : 'সার্চ'}
            </button>
         </div>
         {searchResult && (
           <div className="mt-4 p-4 bg-emerald-950/80 rounded-2xl border border-emerald-500/30 animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-emerald-400 text-xs font-bold">সার্চ ফলাফল:</h4>
                <button onClick={() => setSearchResult(null)} className="text-emerald-700 hover:text-emerald-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <p className="text-emerald-50 text-sm leading-relaxed mb-4">{searchResult.text}</p>
              {searchResult.sources.length > 0 && (
                <div className="border-t border-emerald-800 pt-2 mt-2">
                   <p className="text-[10px] text-emerald-600 mb-1">উৎস বা সোর্স:</p>
                   <div className="flex flex-wrap gap-2">
                     {searchResult.sources.map((chunk: any, i: number) => chunk.web && (
                       <a 
                        key={i} 
                        href={chunk.web.uri} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-[9px] bg-emerald-900/60 px-2 py-1 rounded text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors truncate max-w-[150px]"
                       >
                         {chunk.web.title || 'Source'}
                       </a>
                     ))}
                   </div>
                </div>
              )}
           </div>
         )}
      </div>

      <div className="grid gap-4">
        {VIRTUES.map(virtue => (
          <div key={virtue.id} className="bg-emerald-800/20 border border-emerald-700/50 p-6 rounded-3xl relative overflow-hidden shadow-xl hover:bg-emerald-800/30 transition-colors group">
             <div className="absolute -bottom-4 -right-4 text-6xl opacity-10 grayscale group-hover:grayscale-0 group-hover:opacity-20 transition-all duration-500">{virtue.icon}</div>
             <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl bg-emerald-500/20 p-2 rounded-xl">{virtue.icon}</span>
                <h3 className="text-xl font-bold text-white">{virtue.title}</h3>
             </div>
             <p className="text-emerald-100/90 text-sm leading-relaxed mb-4 relative z-10">{virtue.benefit}</p>
             <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-bold uppercase tracking-wider">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L1 21h22L12 2zm0 3.45l8.15 14.1H3.85L12 5.45zM11 11h2v4h-2v-4zm0 6h2v2h-2v-2z"/></svg>
                সোর্স: {virtue.reference}
             </div>
          </div>
        ))}
      </div>
      <div className="h-20"></div>
    </div>
  );

  const renderInfo = () => (
    <div className="p-8 text-center animate-in fade-in duration-500">
      <div className="w-20 h-20 bg-emerald-500 rounded-full mx-auto mb-6 flex items-center justify-center text-3xl">✨</div>
      <h2 className="text-2xl font-bold text-white mb-4">দৈনিক সুন্নাহ অ্যাপ</h2>
      <p className="text-emerald-300 mb-6 text-sm leading-relaxed">
        আমাদের লক্ষ্য হলো দৈনন্দিন জীবনে রাসূলুল্লাহ (সা.) এর ছোট ছোট কিন্তু গুরুত্বপূর্ণ সুন্নাহগুলো সবার মাঝে ছড়িয়ে দেওয়া।
      </p>
      <div className="bg-emerald-900/40 p-4 rounded-2xl border border-emerald-800 text-left mb-4">
        <h4 className="text-emerald-100 font-bold mb-2 text-sm">নতুন আপডেট:</h4>
        <ul className="text-emerald-400 text-xs space-y-1 list-disc ml-4">
          <li>ইন্টারনেট থেকে সরাসরি ফজিলত সার্চ করার সুবিধা।</li>
          <li>হজ্ব, রোজা ও মা-বাবার সেবার ফজিলত যুক্ত করা হয়েছে।</li>
          <li>AI গ্রাউন্ডিং এর মাধ্যমে নির্ভরযোগ্য সোর্স প্রদর্শন।</li>
        </ul>
      </div>
      <div className="bg-emerald-900/40 p-4 rounded-2xl border border-emerald-800 text-left">
        <h4 className="text-emerald-100 font-bold mb-1 text-sm">অ্যাপ ভার্সন: ১.৩.০</h4>
        <p className="text-emerald-400 text-xs">জেমিলাই AI (গুগল সার্চ সাপোর্ট) এবং রিঅ্যাক্ট দিয়ে তৈরি।</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto px-4 py-8 pb-32">
      {/* Header */}
      <header className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-emerald-100 mb-2 drop-shadow-lg">দৈনিক সুন্নাহ</h1>
        <p className="text-emerald-300 text-lg">রাসূলুল্লাহ (সা.) এর পথ হোক আমাদের চলার পথ</p>
      </header>

      {activeView === 'home' && renderHome()}
      {activeView === 'fajilat' && renderFajilat()}
      {activeView === 'info' && renderInfo()}

      {/* Footer Nav (Floating) */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-emerald-900/90 backdrop-blur-xl border border-emerald-700/50 rounded-3xl p-4 flex justify-around shadow-2xl z-50">
        <button 
          onClick={() => setActiveView('home')}
          className={`flex flex-col items-center gap-1 transition-all ${activeView === 'home' ? 'text-emerald-300 scale-110' : 'text-emerald-700 hover:text-emerald-600'}`}
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          <span className="text-[10px] font-bold">হোম</span>
        </button>
        <button 
          onClick={() => setActiveView('fajilat')}
          className={`flex flex-col items-center gap-1 transition-all ${activeView === 'fajilat' ? 'text-emerald-300 scale-110' : 'text-emerald-700 hover:text-emerald-600'}`}
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
          <span className="text-[10px] font-bold">ফজিলত</span>
        </button>
        <button 
          onClick={() => setActiveView('info')}
          className={`flex flex-col items-center gap-1 transition-all ${activeView === 'info' ? 'text-emerald-300 scale-110' : 'text-emerald-700 hover:text-emerald-600'}`}
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
          <span className="text-[10px] font-bold">তথ্য</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
