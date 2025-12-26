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

  const renderHome = () => (
    <div className="p-6 pt-8 flex flex-col items-center h-full">
      <div className="w-full max-w-md mb-6 relative shrink-0">
         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
         </div>
         <input 
            type="text"
            placeholder="Search Hanzi, Pinyin (no tone), English..."
            className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-2xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 sm:text-sm shadow-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
         />
      </div>

      {isGlobalSearch ? (
        <div className="flex-1 w-full max-w-md overflow-y-auto bg-white rounded-3xl shadow-sm border border-gray-100 min-h-0">
           <div className="p-4 border-b border-gray-50 flex justify-between items-center sticky top-0 bg-white">
             <h3 className="font-bold text-gray-700">Search Results ({currentWords.length})</h3>
             <button onClick={() => setSearchTerm('')} className="text-sm text-primary-500">Clear</button>
           </div>
           {currentWords.length === 0 ? (
             <div className="p-8 text-center text-gray-400">No words found.</div>
           ) : (
             <div>
                {currentWords.slice(0, 100).map((word, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 border-b border-gray-50 hover:bg-gray-50">
                     <div>
                        <div className="font-bold text-gray-800 flex items-center gap-2">
                            {word.hanzi} 
                            <span className="text-xs text-primary-500 bg-primary-50 px-2 py-0.5 rounded-full">HSK {word.level}</span>
                        </div>
                        <div className="text-sm text-gray-400 flex items-center gap-2">
                            <span>{word.pinyin}</span>
                            {word.partOfSpeech && (
                                <span className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded text-[10px] border border-gray-200">
                                    {word.partOfSpeech}
                                </span>
                            )}
                        </div>
                     </div>
                     <div className="text-right max-w-[120px] sm:max-w-[180px]">
                        <div className="text-sm text-gray-600 break-words whitespace-normal leading-tight">
                            {(word.translationsThai && word.translationsThai.length > 0)
                                ? word.translationsThai.join(', ')
                                : word.translations.join(', ')}
                        </div>
                     </div>
                  </div>
                ))}
             </div>
           )}
        </div>
      ) : (
        <>
          <div className="mb-4 text-center shrink-0">
            <img src="https://peter121tw.github.io/hsk-learning-system/logo.png" alt="HSK" className="w-32 h-32 mx-auto mb-1 object-contain" />
            <h1 className="text-3xl font-extrabold text-gray-600 mb-1 tracking-tight">新 HSK 3.0 生詞卡學習系統<span className="text-primary-400"></span></h1>
            <p className="text-gray-400 text-sm">專業的 HSK 3.0 生詞學習平台</p>
            <p className="text-gray-400 text-xs mt-1">V.202512250900</p>
          </div>
          
          {loading ? (
             <div className="flex flex-col items-center justify-center flex-1">
                <RefreshCw className="w-10 h-10 text-primary-500 animate-spin mb-4" />
                <span className="text-gray-500">Loading Vocabulary...</span>
             </div>
          ) : (
            <div className="flex-1 w-full max-w-md min-h-0 overflow-y-auto no-scrollbar pb-6">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleLevelSelect('favorites')}
                    className="col-span-2 relative group overflow-hidden bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-3xl shadow-sm border border-yellow-100 hover:shadow-lg transition-all active:scale-95 flex items-center justify-between"
                  >
                    <div className="text-left">
                        <div className="text-2xl font-bold text-gray-800 mb-1 flex items-center gap-2">
                        <Star className="w-6 h-6 text-yellow-500" filled />
                        Favorites
                        </div>
                        <div className="text-sm text-gray-500 font-medium">{favorites.length} Saved Words</div>
                    </div>
                    <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <ArrowLeft className="w-5 h-5 text-yellow-500 rotate-180" />
                    </div>
                  </button>

                  {Object.values(HSKLevel).map((level) => {
                    const count = data[level]?.length || 0;
                    return (
                      <button
                        key={level}
                        onClick={() => handleLevelSelect(level)}
                        disabled={count === 0}
                        className="relative group overflow-hidden bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-primary-200 transition-all active:scale-95 disabled:opacity-50 aspect-square flex flex-col justify-between"
                      >
                        <div className="flex justify-end">
                          <div className="p-2 bg-primary-50 rounded-2xl opacity-80 group-hover:opacity-100 transition-opacity">
                            <Layers className="w-8 h-8 text-primary-500" />
                          </div>
                        </div>
                        <div className="text-left">
                          <div className="text-3xl font-bold text-gray-800 mb-1">HSK {level}</div>
                          <div className="text-sm text-gray-400 font-medium">{count} Words</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderLevelDashboard = () => (
    <div className="flex flex-col h-full bg-gray-50 relative">
      <div className="px-6 py-6 bg-white shadow-sm z-10 sticky top-0 flex flex-col gap-4 shrink-0">
        <div className="flex items-center justify-between">
            <button onClick={handleBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <h2 className="text-xl font-bold text-gray-800">
              {selectedLevel === 'favorites' ? 'My Favorites' : `HSK Level ${selectedLevel}`}
            </h2>
            <div className="w-10"></div>
        </div>
        
         <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
             </div>
             <input 
                type="text"
                placeholder={`Search in ${selectedLevel === 'favorites' ? 'favorites' : 'level ' + selectedLevel}...`}
                className="block w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
             />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {/* Practice Arcade Menu */}
        {currentWords.length > 0 && (
          <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">Practice Arcade</h3>
              <div className="grid grid-cols-2 gap-3">
                 <button 
                    onClick={() => initiateGameSetup('quiz')}
                    disabled={currentWords.length < 4}
                    className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all text-left flex flex-col gap-2 disabled:opacity-50"
                 >
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                        <BrainCircuit className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="font-bold text-gray-800">Quiz Mode</div>
                        <div className="text-xs text-gray-400">Standard test</div>
                    </div>
                 </button>

                 <button 
                    onClick={() => initiateGameSetup('speed')}
                    disabled={currentWords.length < 4}
                    className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all text-left flex flex-col gap-2 disabled:opacity-50"
                 >
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600">
                        <Timer className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="font-bold text-gray-800">Speed Run</div>
                        <div className="text-xs text-gray-400">60s Challenge</div>
                    </div>
                 </button>

                 <button 
                    onClick={() => setViewMode('match')}
                    disabled={currentWords.length < 6}
                    className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all text-left flex flex-col gap-2 disabled:opacity-50"
                 >
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                        <Grid className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="font-bold text-gray-800">Match Game</div>
                        <div className="text-xs text-gray-400">Flip cards</div>
                    </div>
                 </button>

                 <button 
                    onClick={() => initiateGameSetup('write')}
                    disabled={currentWords.length < 5}
                    className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all text-left flex flex-col gap-2 disabled:opacity-50"
                 >
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                        <Edit3 className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="font-bold text-gray-800">Write It</div>
                        <div className="text-xs text-gray-400">Type meaning</div>
                    </div>
                 </button>
                 
                 <button 
                    onClick={() => setViewMode('pinyin')}
                    disabled={currentWords.length < 4}
                    className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all text-left flex flex-row items-center gap-4 disabled:opacity-50"
                 >
                    <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-600">
                        <Type className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="font-bold text-gray-800">Pinyin Master</div>
                        <div className="text-xs text-gray-400">Reverse lookup</div>
                    </div>
                 </button>

                 <button 
                    onClick={() => initiateGameSetup('sentence')}
                    disabled={currentWords.filter(w => w.sheetExample).length < 4}
                    className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all text-left flex flex-row items-center gap-4 disabled:opacity-50"
                 >
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                        <FileText className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="font-bold text-gray-800">Sentence Fill</div>
                        <div className="text-xs text-gray-400">Context practice</div>
                    </div>
                 </button>

                 {/* New Vocab Hunter Button */}
                 <button 
                    onClick={() => setViewMode('hunter')}
                    className="p-4 bg-gradient-to-br from-gray-800 to-black rounded-2xl shadow-md border border-gray-700 hover:shadow-lg transition-all text-left flex flex-row items-center gap-4 col-span-2 group"
                 >
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                        <Camera className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="font-bold text-white text-lg">Vocab Hunter</div>
                        <div className="text-xs text-gray-400">Scan & Unlock Culture</div>
                    </div>
                 </button>
              </div>

              <div className="mt-4">
                  <button 
                    onClick={() => setViewMode('flashcard')}
                    className="w-full flex items-center p-4 bg-gradient-to-r from-primary-500 to-teal-600 rounded-2xl shadow-lg text-white transform active:scale-98 transition-all"
                  >
                    <div className="p-2 bg-white/20 rounded-xl mr-4">
                    <Layers className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                    <div className="font-bold text-lg">Study Flashcards</div>
                    <div className="opacity-90 text-xs">Review all words</div>
                    </div>
                </button>
              </div>
          </div>
        )}

        <div className="mt-6 pb-20">
          <h3 className="text-lg font-bold text-gray-800 mb-4 px-2">Word List {searchTerm && `(${currentWords.length})`}</h3>
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            {currentWords.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                    {selectedLevel === 'favorites' ? 'No favorites yet.' : 'No words found.'}
                </div>
            ) : (
                <>
                    {currentWords.slice(0, 100).map((word, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 group">
                        <div className="flex-1">
                            <div className="font-bold text-gray-800 text-lg flex items-center gap-2">
                                {word.hanzi}
                                {word.traditional && word.traditional !== word.hanzi && (
                                   <span className="text-gray-400 text-base font-normal">({word.traditional})</span>
                                )}
                            </div>
                            <div className="text-sm text-gray-400 flex gap-2 items-center">
                              <span>{word.pinyin}</span>
                              {word.partOfSpeech && <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] border border-gray-200">{word.partOfSpeech}</span>}
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right max-w-[120px] sm:max-w-[200px]">
                                <div className="text-sm text-gray-600 break-words whitespace-normal leading-tight">
                                    {(word.translationsThai && word.translationsThai.length > 0)
                                        ? word.translationsThai.join(', ')
                                        : word.translations.join(', ')}
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button 
                                  onClick={(e) => { e.stopPropagation(); toggleFavorite(word); }}
                                  className="p-2 rounded-full hover:bg-gray-100 active:scale-90 transition-transform"
                              >
                                  <Star className={`w-5 h-5 ${favorites.includes(word.id!) ? 'text-yellow-400' : 'text-gray-200'}`} filled={favorites.includes(word.id!)} />
                              </button>
                            </div>
                        </div>
                    </div>
                    ))}
                    {currentWords.length > 100 && (
                    <div className="p-4 text-center text-gray-400 text-sm italic">
                        And {currentWords.length - 100} more...
                    </div>
                    )}
                </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderGameContainer = (children: React.ReactNode) => (
      <div className="h-full flex flex-col">
          <div className="px-4 py-4 shrink-0">
            <button onClick={() => setViewMode('list')} className="p-2 rounded-full bg-white shadow-sm border border-gray-100 w-fit">
                <ArrowLeft className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
             {children}
          </div>
      </div>
  );

  const renderGameSetup = () => {
    // Determine actual available words based on the game type criteria
    const availableCount = targetGame === 'sentence' 
        ? currentWords.filter(w => w.sheetExample && w.sheetExample.includes(w.hanzi)).length
        : currentWords.length;

    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-fade-in overflow-y-auto min-h-0">
        <div className="bg-primary-100 p-6 rounded-full mb-6 shrink-0">
           {targetGame === 'quiz' && <BrainCircuit className="w-12 h-12 text-primary-600" />}
           {targetGame === 'speed' && <Timer className="w-12 h-12 text-primary-600" />}
           {targetGame === 'write' && <Edit3 className="w-12 h-12 text-primary-600" />}
           {targetGame === 'sentence' && <FileText className="w-12 h-12 text-primary-600" />}
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
            {targetGame === 'quiz' && 'Quiz Mode'}
            {targetGame === 'speed' && 'Speed Run'}
            {targetGame === 'write' && 'Write It'}
            {targetGame === 'sentence' && 'Sentence Fill'}
        </h2>
        <p className="text-gray-500 mb-8">How many words would you like to practice?</p>
        
        <div className="grid grid-cols-2 gap-4 w-full max-w-xs mb-8">
            {[5, 10, 20].map(count => (
                <button
                    key={count}
                    onClick={() => startGameWithCount(count)}
                    disabled={availableCount < count}
                    className="py-4 rounded-xl bg-white border-2 border-gray-200 text-gray-700 font-bold text-lg hover:border-primary-500 hover:text-primary-600 active:bg-primary-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {count}
                </button>
            ))}
            <button
                onClick={() => startGameWithCount('all')}
                className="py-4 rounded-xl bg-primary-600 border-2 border-primary-600 text-white font-bold text-lg hover:bg-primary-700 active:scale-95 transition-all"
            >
                All ({availableCount})
            </button>
        </div>

        <button 
            onClick={() => setViewMode('list')}
            className="text-gray-400 hover:text-gray-600"
        >
            Cancel
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
          <div className="h-full flex flex-col">
             <div className="px-4 py-4 flex items-center justify-between shrink-0">
                <button onClick={() => setViewMode('list')} className="p-2 rounded-full bg-white shadow-sm border border-gray-100">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex flex-col items-center">
                    <span className="font-mono text-gray-800 font-bold text-lg">
                    {flashcardIndex + 1} / {currentWords.length}
                    </span>
                    <span className="text-xs text-gray-400 uppercase tracking-widest">Card</span>
                </div>
                <div className="w-10"></div>
             </div>
             <div className="flex-1">
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
    <div className="w-full h-full max-w-md mx-auto bg-gray-50 sm:border-x border-gray-200 shadow-2xl relative">
       {renderContent()}
    </div>
  );
};

export default App;