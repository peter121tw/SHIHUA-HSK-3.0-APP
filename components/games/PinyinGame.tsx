import React, { useState, useEffect, useMemo } from 'react';
import { VocabWord } from '../../types';
import { Check, X } from '../Icons';
import { GameSummary } from '../GameSummary';

interface PinyinGameProps {
  words: VocabWord[];
  onFinish: () => void;
  favorites: string[];
  onToggleFavorite: (word: VocabWord) => void;
}

export const PinyinGame: React.FC<PinyinGameProps> = ({ words, onFinish, favorites, onToggleFavorite }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [quizSet, setQuizSet] = useState<VocabWord[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  // Tracking
  const [correctWords, setCorrectWords] = useState<VocabWord[]>([]);
  const [wrongWords, setWrongWords] = useState<VocabWord[]>([]);

  useEffect(() => {
    setQuizSet([...words].sort(() => 0.5 - Math.random()).slice(0, 10));
    setCorrectWords([]);
    setWrongWords([]);
    setIsFinished(false);
  }, [words]);

  const currentWord = quizSet[currentIndex];

  const options = useMemo(() => {
    if (!currentWord) return [];
    const distractors = words.filter(w => w.id !== currentWord.id).sort(() => 0.5 - Math.random()).slice(0, 3);
    return [currentWord, ...distractors].sort(() => 0.5 - Math.random());
  }, [currentWord, words]);

  // Pick one random meaning for display
  const displayMeaning = useMemo(() => {
      if (!currentWord) return "";
      const meanings = (currentWord.translationsThai && currentWord.translationsThai.length > 0) 
        ? currentWord.translationsThai 
        : currentWord.translations;
      return meanings[Math.floor(Math.random() * meanings.length)];
  }, [currentWord]);

  const handleAnswer = (word: VocabWord, index: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(index);

    if (word.id === currentWord.id) {
        setCorrectWords(prev => [...prev, currentWord]);
    } else {
        setWrongWords(prev => [...prev, currentWord]);
    }

    setTimeout(() => {
      if (currentIndex < quizSet.length - 1) {
        setCurrentIndex(c => c + 1);
        setSelectedOption(null);
      } else {
        setIsFinished(true);
      }
    }, 1200);
  };

  if (isFinished) {
      return (
        <GameSummary 
            score={correctWords.length}
            total={quizSet.length}
            correctWords={correctWords}
            wrongWords={wrongWords}
            favorites={favorites}
            onToggleFavorite={onToggleFavorite}
            onExit={onFinish}
        />
      );
  }

  if (!currentWord) return <div>Loading...</div>;

  return (
    <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto p-6">
       <div className="mb-8 text-center">
            <h2 className="text-gray-400 font-medium mb-1">Guess the Hanzi</h2>
            <div className="text-5xl font-bold text-primary-600 font-mono mb-2">{currentWord.pinyin}</div>
            {currentWord.partOfSpeech && (
               <div className="mb-2">
                 <span className="inline-block bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">{currentWord.partOfSpeech}</span>
               </div>
            )}
            <div className="text-sm text-gray-400 mt-2">
                Meaning: {displayMeaning}
            </div>
       </div>

       <div className="grid grid-cols-2 gap-4 w-full">
          {options.map((opt, idx) => {
              let style = "bg-white border-gray-200 text-gray-800";
              if (selectedOption !== null) {
                  if (opt.id === currentWord.id) style = "bg-green-100 border-green-500 text-green-800";
                  else if (idx === selectedOption) style = "bg-red-100 border-red-500 text-red-800";
                  else style = "opacity-50";
              }

              return (
                  <button 
                    key={idx}
                    onClick={() => handleAnswer(opt, idx)}
                    className={`p-6 rounded-2xl border-2 text-3xl font-bold transition-all ${style}`}
                  >
                      {opt.hanzi}
                  </button>
              )
          })}
       </div>
    </div>
  );
};