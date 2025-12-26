import React, { useState, useEffect } from 'react';
import { VocabWord } from '../types';
import { Volume2, Sparkles, RefreshCw, Star, BookOpen } from './Icons';
import { explainWord } from '../services/gemini';

interface FlashcardProps {
  word: VocabWord;
  isFavorite: boolean;
  onToggleFavorite: (word: VocabWord) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const Flashcard: React.FC<FlashcardProps> = ({ word, isFavorite, onToggleFavorite, onNext, onPrev }) => {
  const [flipped, setFlipped] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<any | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    setFlipped(false);
    setAiExplanation(null);
  }, [word]);

  const handleSpeech = (e: React.MouseEvent) => {
    e.stopPropagation();
    const utterance = new SpeechSynthesisUtterance(word.hanzi);
    utterance.lang = 'zh-CN';
    window.speechSynthesis.speak(utterance);
  };

  const handleAiExplain = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (aiExplanation) return;
    
    setLoadingAi(true);
    try {
      const result = await explainWord(word);
      setAiExplanation(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAi(false);
    }
  };

  const toggleFav = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(word);
  }

  // Helper to parse examples from the single string
  const getExamples = (text?: string) => {
    if (!text) return [];
    // Split by pipe, semicolon, or newline
    return text.split(/[|;\n]/).map(s => s.trim()).filter(Boolean);
  };

  const examples = getExamples(word.sheetExample);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full max-w-md mx-auto p-4">
      <div 
        className={`relative w-full aspect-[3/4] cursor-pointer card-flip group ${flipped ? 'card-flipped' : ''}`}
        onClick={() => setFlipped(!flipped)}
      >
        <div className="absolute w-full h-full transition-all duration-500 preserve-3d card-inner">
          
          {/* --- Front Side --- */}
          <div className="absolute w-full h-full bg-white rounded-3xl shadow-xl border-2 border-primary-50 flex flex-col items-center justify-center p-8 backface-hidden card-front">
            
            <button 
              onClick={toggleFav}
              className="absolute top-6 right-6 p-2 rounded-full text-yellow-400 hover:bg-yellow-50 transition-colors z-20"
            >
              <Star className="w-8 h-8" filled={isFavorite} />
            </button>

            <span className="absolute top-6 left-6 text-sm font-bold text-gray-300">HSK {word.level}</span>
            
            <div className="flex flex-col items-center justify-center flex-1">
                <div className="text-8xl font-bold text-gray-800 mb-4 text-center">{word.hanzi}</div>
                
                {/* POS on Front */}
                {word.partOfSpeech && (
                    <span className="px-4 py-1.5 bg-primary-50 text-primary-600 text-lg rounded-full font-medium border border-primary-100">
                        {word.partOfSpeech}
                    </span>
                )}
            </div>

            <div className="text-gray-400 text-sm mt-4">Tap to reveal</div>
            
            <button 
              onClick={handleSpeech}
              className="absolute bottom-6 right-6 p-3 rounded-full bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors z-20"
            >
              <Volume2 className="w-6 h-6" />
            </button>
          </div>

          {/* --- Back Side --- */}
          <div className="absolute w-full h-full bg-white rounded-3xl shadow-xl border-2 border-primary-500 flex flex-col p-6 backface-hidden card-back overflow-hidden">
             
             {/* Header Section (Fixed Top) */}
             <div className="flex-none border-b border-gray-100 pb-4 mb-4 relative">
                <button 
                  onClick={toggleFav}
                  className="absolute top-0 right-0 p-1 text-yellow-400 hover:bg-yellow-50 rounded-full transition-colors z-20"
                >
                  <Star className="w-6 h-6" filled={isFavorite} />
                </button>

                <div className="flex items-baseline gap-3 mb-1">
                    <span className="text-4xl font-bold text-primary-600">{word.hanzi}</span>
                    <span className="text-xl text-gray-400 font-serif">
                        {word.traditional ? word.traditional : word.hanzi}
                    </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-lg font-medium text-gray-800 mr-2">[{word.pinyin}]</span>
                    {word.partOfSpeech && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md border border-gray-200">
                            {word.partOfSpeech}
                        </span>
                    )}
                     <button 
                        onClick={handleSpeech}
                        className="ml-auto p-1.5 rounded-full text-gray-400 hover:text-primary-500 hover:bg-primary-50 transition-colors"
                        >
                        <Volume2 className="w-5 h-5" />
                    </button>
                </div>
             </div>
            
            {/* Scrollable Content Section */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-5 no-scrollbar">
              
              {/* Thai Meanings */}
              {word.translationsThai && word.translationsThai.length > 0 && (
                  <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider">Thai Definition</h4>
                      <ul className="space-y-1">
                        {word.translationsThai.map((t, i) => (
                            <li key={i} className="text-lg text-gray-800 font-medium leading-snug flex items-start">
                                <span className="text-primary-300 mr-2">•</span>
                                {t}
                            </li>
                        ))}
                      </ul>
                  </div>
              )}

               {/* English Meanings (Fallback or Secondary) */}
               {(!word.translationsThai || word.translationsThai.length === 0) && (
                  <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider">Definition</h4>
                       <ul className="space-y-1">
                        {word.translations.map((t, i) => (
                            <li key={i} className="text-lg text-gray-800 font-medium leading-snug flex items-start">
                                <span className="text-primary-300 mr-2">•</span>
                                {t}
                            </li>
                        ))}
                      </ul>
                  </div>
               )}

              {/* Examples */}
              {examples.length > 0 && (
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-2 mb-2 text-primary-600">
                         <BookOpen className="w-4 h-4" />
                         <span className="text-xs font-bold uppercase">Examples</span>
                      </div>
                      <div className="space-y-3">
                          {examples.map((ex, idx) => (
                              <div key={idx} className="text-sm text-gray-700 leading-relaxed border-l-2 border-primary-200 pl-3">
                                  {ex}
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              {/* AI Section */}
              {aiExplanation ? (
                <div className="bg-primary-50 p-4 rounded-xl text-left text-sm space-y-2 animate-fade-in border border-primary-100">
                  <p className="font-semibold text-primary-700 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> AI Note
                  </p>
                  <p className="text-gray-700">{aiExplanation.nuance}</p>
                </div>
              ) : (
                 <button 
                  onClick={handleAiExplain}
                  disabled={loadingAi}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-primary-200 text-primary-600 rounded-xl hover:bg-primary-50 transition-all text-sm font-bold"
                >
                  {loadingAi ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>Ask AI Tutor for Nuance</span>
                </button>
              )}
            </div>

          </div>
        </div>
      </div>

      <div className="flex gap-4 mt-6 w-full max-w-xs">
        <button 
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          className="flex-1 py-4 rounded-2xl bg-white border border-gray-200 text-gray-600 font-medium shadow-sm hover:bg-gray-50 active:scale-95 transition-all"
        >
          Previous
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="flex-1 py-4 rounded-2xl bg-primary-600 text-white font-bold shadow-lg shadow-primary-200 hover:bg-primary-700 active:scale-95 transition-all"
        >
          Next
        </button>
      </div>
    </div>
  );
};