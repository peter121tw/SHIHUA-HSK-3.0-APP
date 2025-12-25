import React, { useState, useEffect } from 'react';
import { VocabWord } from '../types';
import { Volume2, Sparkles, RefreshCw, Star } from './Icons';
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

  return (
    <div className="flex flex-col items-center justify-center w-full h-full max-w-md mx-auto p-4">
      <div 
        className={`relative w-full aspect-[3/4] cursor-pointer card-flip group`}
        onClick={() => setFlipped(!flipped)}
      >
        <div className={`absolute w-full h-full transition-all duration-500 preserve-3d card-inner ${flipped ? 'card-flipped' : ''}`}>
          
          {/* Front */}
          <div className="absolute w-full h-full bg-white rounded-3xl shadow-xl border-2 border-primary-50 flex flex-col items-center justify-center p-8 backface-hidden card-front relative">
            
            <button 
              onClick={toggleFav}
              className="absolute top-6 right-6 p-2 rounded-full text-yellow-400 hover:bg-yellow-50 transition-colors z-20"
            >
              <Star className="w-8 h-8" filled={isFavorite} />
            </button>

            <span className="absolute top-6 left-6 text-sm font-bold text-gray-300">HSK {word.level}</span>
            <div className="text-8xl font-bold text-gray-800 mb-6 text-center">{word.hanzi}</div>
            <div className="text-gray-400 text-sm">Tap to reveal</div>
            
            <button 
              onClick={handleSpeech}
              className="absolute bottom-6 right-6 p-3 rounded-full bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors z-20"
            >
              <Volume2 className="w-6 h-6" />
            </button>
          </div>

          {/* Back */}
          <div className="absolute w-full h-full bg-white rounded-3xl shadow-xl border-2 border-primary-500 flex flex-col items-center justify-center p-8 backface-hidden card-back overflow-y-auto">
             <button 
              onClick={toggleFav}
              className="absolute top-6 left-6 p-2 rounded-full text-yellow-400 hover:bg-yellow-50 transition-colors z-20"
            >
              <Star className="w-6 h-6" filled={isFavorite} />
            </button>

            <div className="text-center mb-4">
                <div className="text-4xl font-bold text-primary-600 mb-1">{word.hanzi}</div>
                {word.traditional && word.traditional !== word.hanzi && (
                    <div className="text-xl text-primary-400 font-serif mb-1">({word.traditional})</div>
                )}
                <div className="flex items-center justify-center gap-2">
                    <div className="text-xl font-medium text-gray-500">{word.pinyin}</div>
                    {word.partOfSpeech && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full border border-gray-200">{word.partOfSpeech}</span>
                    )}
                </div>
            </div>
            
            <div className="w-full text-center space-y-4 mb-6">
              <div>
                  {word.translations.map((t, i) => (
                    <div key={i} className="text-lg text-gray-800 font-medium">{t}</div>
                  ))}
              </div>

              {word.translationsThai && word.translationsThai.length > 0 && (
                  <div className="pt-2 border-t border-gray-100">
                      {word.translationsThai.map((t, i) => (
                        <div key={i} className="text-lg text-teal-700 font-medium font-sans">{t}</div>
                      ))}
                  </div>
              )}

              {word.sheetExample && (
                  <div className="bg-gray-50 p-3 rounded-lg text-sm text-left mt-2">
                      <p className="text-xs text-gray-400 font-bold uppercase mb-1">Example</p>
                      <p className="text-gray-700 italic">"{word.sheetExample}"</p>
                  </div>
              )}
            </div>

            {aiExplanation ? (
              <div className="w-full bg-primary-50 p-4 rounded-xl text-left text-sm space-y-2 animate-fade-in">
                <p className="font-semibold text-primary-700">AI Note:</p>
                <p className="text-gray-700">{aiExplanation.nuance}</p>
                <div className="mt-2 border-t border-primary-200 pt-2">
                   {aiExplanation.examples?.slice(0, 1).map((ex: any, idx: number) => (
                     <div key={idx} className="mb-1">
                       <p className="text-xs text-gray-500">{ex.chinese}</p>
                       <p className="text-xs text-gray-400 italic">{ex.english}</p>
                     </div>
                   ))}
                </div>
              </div>
            ) : (
               <button 
                onClick={handleAiExplain}
                disabled={loadingAi}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-teal-400 text-white rounded-full shadow-md hover:shadow-lg transition-all"
              >
                {loadingAi ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>AI Tutor Explain</span>
              </button>
            )}

            <button 
              onClick={handleSpeech}
              className="absolute top-6 right-6 p-2 rounded-full text-gray-400 hover:text-primary-500 transition-colors z-20"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mt-8 w-full max-w-xs">
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
          Next Word
        </button>
      </div>
    </div>
  );
};