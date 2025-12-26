import React, { useEffect, useState, useMemo } from 'react';
import { fetchVocabData, syncWordToSheet } from './services/api';
import { VocabWord, AppData, ViewMode, HSKLevel } from './types';
import { Layers, BrainCircuit, ArrowLeft, RefreshCw, Search, Star, Timer, Grid, Edit3, Type, FileText, Camera } from './components/Icons';
import { Flashcard } from './components/Flashcard';
import { Quiz } from './components/Quiz';
import { SpeedChallenge } from './components/games/SpeedChallenge';
import { MatchGame } from './components/games/MatchGame';
import { WriteQuiz } from './components/games/WriteQuiz';
import { PinyinGame } from './components/games/PinyinGame';
import { SentenceFillIn } from './components/games/SentenceFillIn';
import { VocabHunter } from './components/games/VocabHunter';

// Helper to remove tones from Pinyin for searching
const normalizeText = (text: string) => {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

const App = () => {
  const [data, setData] = useState<AppData>({});
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  
  // States for Game Setup
  const [activeGameWords, setActiveGameWords] = useState<VocabWord[]>([]);
  const [targetGame, setTargetGame] = useState<'quiz' | 'speed' | 'write' | 'sentence' | null>(null);

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('hsk_favorites') || '[]');
    } catch {
      return [];
    }
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadData = async () => {
      const result = await fetchVocabData();
      setData(result);
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    localStorage.setItem('hsk_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (word: VocabWord) => {
    if (!word.id) return;
    setFavorites(prev => {
      if (prev.includes(word.id!)) {
        return prev.filter(id => id !== word.id);
      } else {
        return [...prev, word.id!];
      }
    });
  };

  const allWords = useMemo(() => Object.values(data).flat(), [data]);

  const filterWords = (words: VocabWord[], term: string) => {
    if (!term) return words;
    const lowerTerm = term.toLowerCase().trim();
    const normalizedTerm = normalizeText(lowerTerm);

    return words.filter(w => {
      const normalizedPinyin = normalizeText(w.pinyin);
      
      return (
        w.hanzi.includes(lowerTerm) || // Simplified
        (w.traditional && w.traditional.includes(lowerTerm)) || // Traditional
        w.pinyin.toLowerCase().includes(lowerTerm) || // Pinyin (Exact/Partial)
        normalizedPinyin.includes(normalizedTerm) || // Pinyin (No Tones)
        w.translations.some(t => t.toLowerCase().includes(lowerTerm)) || // English
        w.translationsThai?.some(t => t.toLowerCase().includes(lowerTerm)) // Thai
      );
    });
  };

  const currentWords = useMemo(() => {
    if (selectedLevel === 'favorites') {
      const favWords = allWords.filter(w => w.id && favorites.includes(w.id));
      return filterWords(favWords, searchTerm);
    }
    if (selectedLevel && data[selectedLevel]) {
      if (viewMode === 'list' && searchTerm) {
        return filterWords(data[selectedLevel], searchTerm);
      }
      return data[selectedLevel];
    }
    if (viewMode === 'home' && searchTerm) {
       return filterWords(allWords, searchTerm);
    }
    return [];
  }, [selectedLevel, data, viewMode, searchTerm, allWords, favorites]);

  const isGlobalSearch = viewMode === 'home' && searchTerm.length > 0;

  const handleLevelSelect = (level: string) => {
    setSelectedLevel(level);
    setViewMode('list');
    setFlashcardIndex(0);
    setSearchTerm('');
  };

  const handleBack = () => {
    if (viewMode !== 'home' && viewMode !== 'list') {
      setViewMode('list');
    } else if (viewMode === 'list') {
      setSelectedLevel(null);
      setViewMode('home');
      setSearchTerm('');
    }
  };

  const initiateGameSetup = (game: 'quiz' | 'speed' | 'write' | 'sentence') => {
    setTargetGame(game);
    setActiveGameWords([]); // Clear previous game words to reset selection logic
    setViewMode('game_setup');
  };

  const startGameWithCount = (count: number | 'all') => {
    if (!targetGame) return;

    let gameWords = [...currentWords];
    
    // For sentence game, filter first to ensure we have valid content
    if (targetGame === 'sentence') {
        gameWords = gameWords.filter(w => w.sheetExample && w.sheetExample.includes(w.hanzi));
    }

    // Shuffle words first to get a random selection
    gameWords.sort(() => 0.5 - Math.random());

    // Slice if needed
    if (count !== 'all') {
      gameWords = gameWords.slice(0, count);
    }

    setActiveGameWords(gameWords);
    setViewMode(targetGame);
  };

  // --- Web Layout Components ---

  const Navbar = () => (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center cursor-pointer gap-3" onClick={() => { setViewMode('home'); setSelectedLevel(null); setSearchTerm(''); }}>
             {/* Logo would go here if available */}
             <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold">H</div>
             <span className="text-xl font-bold text-gray-800 tracking-tight hidden sm:block">新 HSK 3.0 <span className="text-primary-600">Pro</span></span>
          </div>

          <div className="flex-1 flex items-center justify-center px-6 lg:ml-6 lg:justify-end">
            <div className="max-w-lg w-full lg:max-w-xs relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 sm:text-sm transition duration-150 ease-in-out"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             {selectedLevel && (
               <button onClick={handleBack} className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1">
                  <ArrowLeft className="w-4 h-4" /> Back
               </button>
             )}
             <button 
                onClick={() => handleLevelSelect('favorites')}
                className="p-2 text-gray-400 hover:text-yellow-500 transition-colors relative"
                title="Favorites"
             >
                <Star filled className="w-6 h-6" />
                <span className="absolute top-1 right-0 bg-red-500 text-white text-[10px] font-bold px-1 rounded-full min-w-[16px] text-center">
                    {favorites.length}
                </span>
             </button>
          </div>
        </div>
      </div>
    </nav>
  );

  const renderHome = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {isGlobalSearch ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden min-h-[500px]">
           <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
             <h3 className="text-lg font-bold text-gray-700">Search Results ({currentWords.length})</h3>
             <button onClick={() => setSearchTerm('')} className="text-sm text-primary-600 font-medium hover:text-primary-800">Clear Search</button>
           </div>
           {currentWords.length === 0 ? (
             <div className="p-20 text-center text-gray-400 flex flex-col items-center">
                <Search className="w-12 h-12 mb-4 opacity-20" />
                No words found.
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 divide-y md:divide-y-0 md:gap-4 p-0 md:p-6">
                {currentWords.slice(0, 100).map((word, idx) => (
                  <div key={idx} className="flex items-start justify-between p-4 bg-white md:border md:rounded-xl hover:shadow-md transition-all group border-gray-100">
                     <div>
                        <div className="font-bold text-gray-800 text-lg flex items-center gap-2">
                            {word.hanzi} 
                            <span className="text-xs text-white bg-primary-500 px-2 py-0.5 rounded-md font-bold">HSK {word.level}</span>
                        </div>
                        <div className="text-sm text-gray-500 mt-1 font-mono">{word.pinyin}</div>
                     </div>
                     <div className="text-right text-sm text-gray-600 max-w-[60%]">
                        {(word.translationsThai && word.translationsThai.length > 0)
                                ? word.translationsThai[0]
                                : word.translations[0]}
                     </div>
                  </div>
                ))}
             </div>
           )}
        </div>
      ) : (
        <>
          <div className="text-center mb-16">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
              Master HSK Vocabulary
            </h1>
            <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
              Select a level to start learning, practicing with AI, and playing games.
            </p>
          </div>
          
          {loading ? (
             <div className="flex flex-col items-center justify-center py-20">
                <RefreshCw className="w-12 h-12 text-primary-500 animate-spin mb-4" />
                <span className="text-gray-500 font-medium">Loading Database...</span>
             </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {/* Favorites Card */}
                <button
                    onClick={() => handleLevelSelect('favorites')}
                    className="col-span-1 sm:col-span-2 lg:col-span-1 relative group overflow-hidden bg-gradient-to-br from-yellow-50 to-orange-50 p-8 rounded-3xl shadow-sm border border-yellow-100 hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between h-64"
                  >
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm">
                            <Star className="w-8 h-8 text-yellow-500" filled />
                        </div>
                        <div className="text-4xl font-black text-yellow-600/20">{favorites.length}</div>
                    </div>
                    <div className="text-left">
                        <div className="text-2xl font-bold text-gray-800 mb-1">Favorites</div>
                        <div className="text-sm text-gray-600 font-medium">Your personal collection</div>
                    </div>
                </button>

                {Object.values(HSKLevel).map((level) => {
                    const count = data[level]?.length || 0;
                    return (
                      <button
                        key={level}
                        onClick={() => handleLevelSelect(level)}
                        disabled={count === 0}
                        className="relative group overflow-hidden bg-white p-8 rounded-3xl shadow-sm border border-gray-200 hover:shadow-xl hover:border-primary-300 hover:-translate-y-1 transition-all disabled:opacity-50 h-64 flex flex-col justify-between"
                      >
                        <div className="flex justify-between items-start">
                             <div className="p-3 bg-gray-50 rounded-2xl text-gray-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                                <Layers className="w-8 h-8" />
                             </div>
                             <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Level</span>
                        </div>
                        <div className="text-left">
                          <div className="text-4xl font-extrabold text-gray-800 mb-2">HSK {level}</div>
                          <div className="text-sm text-gray-500 font-medium">{count} Words</div>
                        </div>
                      </button>
                    );
                  })}
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderLevelDashboard = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8 h-[calc(100vh-64px)]">
       
       {/* Sidebar Controls */}
       <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-6 overflow-y-auto pr-2 pb-10 no-scrollbar">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
             <h2 className="text-2xl font-bold text-gray-800 mb-1">{selectedLevel === 'favorites' ? 'Favorites' : `HSK Level ${selectedLevel}`}</h2>
             <p className="text-gray-500 text-sm mb-6">{currentWords.length} words loaded</p>
             
             <button 
                onClick={() => setViewMode('flashcard')}
                className="w-full mb-3 flex items-center justify-center gap-2 p-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-md transition-all font-bold"
              >
                <Layers className="w-5 h-5" />
                <span>Study Flashcards</span>
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
             <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Practice Arcade</h3>
             <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
                 <GameButton 
                    icon={<BrainCircuit />} 
                    title="Quiz Mode" 
                    desc="Standard Test" 
                    color="orange" 
                    onClick={() => initiateGameSetup('quiz')} 
                    disabled={currentWords.length < 4}
                 />
                 <GameButton 
                    icon={<Timer />} 
                    title="Speed Run" 
                    desc="60s Challenge" 
                    color="yellow" 
                    onClick={() => initiateGameSetup('speed')} 
                    disabled={currentWords.length < 4}
                 />
                 <GameButton 
                    icon={<Grid />} 
                    title="Match Game" 
                    desc="Memory Pairs" 
                    color="blue" 
                    onClick={() => setViewMode('match')} 
                    disabled={currentWords.length < 6}
                 />
                 <GameButton 
                    icon={<Edit3 />} 
                    title="Write It" 
                    desc="Type Meaning" 
                    color="purple" 
                    onClick={() => initiateGameSetup('write')} 
                    disabled={currentWords.length < 5}
                 />
                 <GameButton 
                    icon={<Type />} 
                    title="Pinyin Master" 
                    desc="Guess Hanzi" 
                    color="teal" 
                    onClick={() => setViewMode('pinyin')} 
                    disabled={currentWords.length < 4}
                 />
                 <GameButton 
                    icon={<FileText />} 
                    title="Sentence Fill" 
                    desc="Context" 
                    color="indigo" 
                    onClick={() => initiateGameSetup('sentence')} 
                    disabled={currentWords.filter(w => w.sheetExample).length < 4}
                 />
                  <button 
                    onClick={() => setViewMode('hunter')}
                    className="p-3 bg-gray-900 rounded-xl text-white shadow-md hover:shadow-lg hover:scale-[1.02] transition-all text-left flex items-center gap-3 col-span-2 lg:col-span-1 group mt-2"
                 >
                    <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center group-hover:bg-white/20">
                        <Camera className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="font-bold text-sm">Vocab Hunter</div>
                        <div className="text-[10px] text-gray-400">AR Camera</div>
                    </div>
                 </button>
             </div>
          </div>
       </div>

       {/* Main Word List */}
       <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-0">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
             <h3 className="font-bold text-gray-700">Word List</h3>
             <div className="text-sm text-gray-400">
                {searchTerm ? `Filtering "${searchTerm}"` : 'Showing all'}
             </div>
          </div>
          <div className="flex-1 overflow-y-auto p-0 scroll-smooth">
             {currentWords.length === 0 ? (
                <div className="p-20 text-center text-gray-400">
                    No words found matching your filter.
                </div>
            ) : (
                <div className="divide-y divide-gray-100">
                    {currentWords.map((word, idx) => (
                    <div key={idx} className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors group">
                        <div className="flex items-center gap-6">
                            <span className="text-sm font-mono text-gray-300 w-8 text-right hidden sm:block">{idx + 1}</span>
                            <div>
                                <div className="flex items-baseline gap-3">
                                    <span className="font-bold text-gray-800 text-2xl">{word.hanzi}</span>
                                    {word.traditional && word.traditional !== word.hanzi && (
                                    <span className="text-gray-400 text-lg">({word.traditional})</span>
                                    )}
                                </div>
                                <div className="text-sm text-gray-500 flex gap-2 items-center mt-1">
                                    <span className="font-medium text-primary-600 bg-primary-50 px-2 rounded">{word.pinyin}</span>
                                    {word.partOfSpeech && <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-[10px] uppercase border border-gray-200">{word.partOfSpeech}</span>}
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-8 text-right">
                             <div className="hidden md:block max-w-xs text-sm text-gray-600">
                                {(word.translationsThai && word.translationsThai.length > 0)
                                    ? word.translationsThai.join(', ')
                                    : word.translations.join(', ')}
                             </div>
                             <button 
                                onClick={(e) => { e.stopPropagation(); toggleFavorite(word); }}
                                className="p-2 rounded-full hover:bg-white hover:shadow-sm active:scale-90 transition-all"
                             >
                                <Star className={`w-6 h-6 ${favorites.includes(word.id!) ? 'text-yellow-400' : 'text-gray-200'}`} filled={favorites.includes(word.id!)} />
                             </button>
                        </div>
                    </div>
                    ))}
                </div>
            )}
          </div>
       </div>
    </div>
  );

  const GameButton = ({ icon, title, desc, color, onClick, disabled }: any) => {
     const colors: any = {
         orange: "bg-orange-50 text-orange-600 group-hover:bg-orange-500 group-hover:text-white",
         yellow: "bg-yellow-50 text-yellow-600 group-hover:bg-yellow-500 group-hover:text-white",
         blue: "bg-blue-50 text-blue-600 group-hover:bg-blue-500 group-hover:text-white",
         purple: "bg-purple-50 text-purple-600 group-hover:bg-purple-500 group-hover:text-white",
         teal: "bg-teal-50 text-teal-600 group-hover:bg-teal-500 group-hover:text-white",
         indigo: "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-500 group-hover:text-white",
     };

     return (
        <button 
            onClick={onClick}
            disabled={disabled}
            className="p-3 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all text-left flex items-center gap-3 disabled:opacity-50 group w-full"
        >
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${colors[color]}`}>
                {React.cloneElement(icon, { className: "w-6 h-6" })}
            </div>
            <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-800 text-sm">{title}</div>
                <div className="text-xs text-gray-500 truncate">{desc}</div>
            </div>
        </button>
     )
  }

  const renderGameContainer = (children: React.ReactNode) => (
      <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50">
          <div className="max-w-6xl w-full mx-auto px-4 py-6 shrink-0 flex items-center">
            <button onClick={() => setViewMode('list')} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white shadow-sm border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium transition-all">
                <ArrowLeft className="w-4 h-4" />
                <span>Exit Activity</span>
            </button>
          </div>
          <div className="flex-1 w-full max-w-6xl mx-auto px-4 pb-10 min-h-0 flex flex-col">
             {children}
          </div>
      </div>
  );

  const renderGameSetup = () => {
    const availableCount = targetGame === 'sentence' 
        ? currentWords.filter(w => w.sheetExample && w.sheetExample.includes(w.hanzi)).length
        : currentWords.length;

    return (
      <div className="flex flex-col items-center justify-center flex-1 bg-white rounded-3xl shadow-sm border border-gray-200 p-8 md:p-20 animate-fade-in">
        <div className="bg-primary-50 p-8 rounded-full mb-8 shrink-0 ring-8 ring-primary-50/50">
           {targetGame === 'quiz' && <BrainCircuit className="w-20 h-20 text-primary-600" />}
           {targetGame === 'speed' && <Timer className="w-20 h-20 text-primary-600" />}
           {targetGame === 'write' && <Edit3 className="w-20 h-20 text-primary-600" />}
           {targetGame === 'sentence' && <FileText className="w-20 h-20 text-primary-600" />}
        </div>
        <h2 className="text-4xl font-extrabold text-gray-900 mb-2">
            {targetGame === 'quiz' && 'Quiz Mode'}
            {targetGame === 'speed' && 'Speed Run'}
            {targetGame === 'write' && 'Write It'}
            {targetGame === 'sentence' && 'Sentence Fill'}
        </h2>
        <p className="text-gray-500 mb-10 text-xl">Select the number of words to practice</p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-3xl mb-12">
            {[5, 10, 20].map(count => (
                <button
                    key={count}
                    onClick={() => startGameWithCount(count)}
                    disabled={availableCount < count}
                    className="py-6 rounded-2xl bg-white border-2 border-gray-100 text-gray-700 font-bold text-2xl hover:border-primary-500 hover:text-primary-600 hover:shadow-xl active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {count}
                </button>
            ))}
            <button
                onClick={() => startGameWithCount('all')}
                className="py-6 rounded-2xl bg-primary-600 border-2 border-primary-600 text-white font-bold text-2xl hover:bg-primary-700 hover:shadow-xl active:scale-95 transition-all"
            >
                All ({availableCount})
            </button>
        </div>

        <button 
            onClick={() => setViewMode('list')}
            className="text-gray-400 hover:text-gray-600 underline underline-offset-4"
        >
            Cancel and go back
        </button>
      </div>
    );
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'home': return renderHome();
      case 'list': return renderLevelDashboard();
      case 'game_setup': return renderGameContainer(renderGameSetup());
      case 'flashcard':
        return (
          <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50">
             <div className="max-w-6xl w-full mx-auto px-4 py-6 shrink-0 flex items-center justify-between">
                <button onClick={() => setViewMode('list')} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white shadow-sm border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium transition-all">
                    <ArrowLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Back to List</span>
                </button>
                <div className="flex flex-col items-center">
                    <span className="font-mono text-gray-800 font-bold text-xl">
                    {flashcardIndex + 1} / {currentWords.length}
                    </span>
                    <span className="text-xs text-gray-400 uppercase tracking-widest font-bold">Card</span>
                </div>
                <div className="w-24"></div> 
             </div>
             <div className="flex-1 w-full max-w-3xl mx-auto px-4 pb-10 min-h-0">
                {currentWords.length > 0 && (
                  <Flashcard 
                    word={currentWords[flashcardIndex]} 
                    isFavorite={!!(currentWords[flashcardIndex].id && favorites.includes(currentWords[flashcardIndex].id!))}
                    onToggleFavorite={toggleFavorite}
                    onNext={() => setFlashcardIndex(i => (i + 1) % currentWords.length)}
                    onPrev={() => setFlashcardIndex(i => (i - 1 + currentWords.length) % currentWords.length)}
                  />
                )}
             </div>
          </div>
        );
      case 'quiz':
        return renderGameContainer(
            <Quiz 
                words={activeGameWords} 
                onFinish={() => setViewMode('list')} 
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
            />
        );
      case 'speed':
        return renderGameContainer(
            <SpeedChallenge 
                words={activeGameWords} 
                onFinish={() => setViewMode('list')}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
            />
        );
      case 'match':
        return renderGameContainer(
            <MatchGame 
                words={currentWords} 
                onFinish={() => setViewMode('list')}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
            />
        );
      case 'write':
         return renderGameContainer(
            <WriteQuiz 
                words={activeGameWords} 
                onFinish={() => setViewMode('list')}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
            />
        );
      case 'pinyin':
         return renderGameContainer(
            <PinyinGame 
                words={currentWords} 
                onFinish={() => setViewMode('list')}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
            />
        );
      case 'sentence':
         return renderGameContainer(
            <SentenceFillIn 
                words={activeGameWords} 
                onFinish={() => setViewMode('list')}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
            />
        );
      case 'hunter':
         return (
             <VocabHunter 
                allWords={currentWords}
                onFinish={() => setViewMode('list')}
             />
         );
      default:
        return renderHome();
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 font-sans">
       <Navbar />
       <main className="w-full">
         {renderContent()}
       </main>
    </div>
  );
};

export default App;