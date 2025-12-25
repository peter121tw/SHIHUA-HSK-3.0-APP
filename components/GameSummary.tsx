import React from 'react';
import { VocabWord } from '../types';
import { Star, Check, X } from './Icons';

interface GameSummaryProps {
  score: number;
  total?: number;
  correctWords: VocabWord[];
  wrongWords: VocabWord[];
  favorites: string[];
  onToggleFavorite: (word: VocabWord) => void;
  onExit: () => void;
}

export const GameSummary: React.FC<GameSummaryProps> = ({
  score,
  total,
  correctWords,
  wrongWords,
  favorites,
  onToggleFavorite,
  onExit
}) => {
  // Deduplicate words if they appeared multiple times (e.g. in Speed Run)
  const uniqueCorrect = Array.from(new Map(correctWords.map(w => [w.id, w])).values());
  const uniqueWrong = Array.from(new Map(wrongWords.map(w => [w.id, w])).values());

  return (
    <div className="flex flex-col h-full bg-gray-50 animate-fade-in">
       <div className="bg-white p-6 shadow-sm border-b border-gray-100 text-center z-10">
          <h2 className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-2">Session Complete</h2>
          <div className="text-5xl font-black text-primary-600 mb-2">
             {score} <span className="text-lg text-gray-300 font-normal">{total ? `/ ${total}` : 'pts'}</span>
          </div>
          <p className="text-sm text-gray-500 font-medium">
             You mastered {uniqueCorrect.length} words and need to review {uniqueWrong.length}.
          </p>
       </div>

       <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {uniqueWrong.length > 0 && (
            <div>
               <h3 className="text-red-500 font-bold mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                  <X className="w-5 h-5" /> Review These ({uniqueWrong.length})
               </h3>
               <div className="space-y-2">
                  {uniqueWrong.map(word => (
                     <WordResultRow key={word.id} word={word} isFavorite={favorites.includes(word.id!)} onToggle={() => onToggleFavorite(word)} type="wrong" />
                  ))}
               </div>
            </div>
          )}

          {uniqueCorrect.length > 0 && (
            <div>
               <h3 className="text-green-600 font-bold mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                  <Check className="w-5 h-5" /> Mastered ({uniqueCorrect.length})
               </h3>
               <div className="space-y-2">
                  {uniqueCorrect.map(word => (
                     <WordResultRow key={word.id} word={word} isFavorite={favorites.includes(word.id!)} onToggle={() => onToggleFavorite(word)} type="correct" />
                  ))}
               </div>
            </div>
          )}
       </div>

       <div className="p-4 bg-white border-t border-gray-100">
          <button onClick={onExit} className="w-full py-4 bg-gray-800 text-white rounded-2xl font-bold shadow-lg active:scale-95 transition-all">
             Back to Menu
          </button>
       </div>
    </div>
  )
}

const WordResultRow = ({ word, isFavorite, onToggle, type }: { word: VocabWord, isFavorite: boolean, onToggle: () => void, type: 'correct' | 'wrong' }) => (
  <div className={`flex items-center justify-between p-4 rounded-xl border-l-4 shadow-sm bg-white ${type === 'correct' ? 'border-green-400' : 'border-red-400'}`}>
      <div className="flex-1 min-w-0 mr-2">
         <div className="font-bold text-gray-800 text-lg">{word.hanzi}</div>
         <div className="text-xs text-gray-400 flex items-center gap-2">
            <span>{word.pinyin}</span>
            {word.partOfSpeech && <span className="bg-gray-100 px-1.5 rounded text-[10px]">{word.partOfSpeech}</span>}
         </div>
      </div>
      <div className="flex items-center gap-3">
          <div className="text-right max-w-[100px] truncate text-sm text-gray-600 hidden sm:block">
             {word.translationsThai?.[0] || word.translations[0]}
          </div>
          <button onClick={(e) => { e.stopPropagation(); onToggle(); }} className="p-2 rounded-full hover:bg-gray-50 active:scale-90 transition-transform">
             <Star className={`w-6 h-6 ${isFavorite ? 'text-yellow-400' : 'text-gray-200'}`} filled={isFavorite} />
          </button>
      </div>
  </div>
);