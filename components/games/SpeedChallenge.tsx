import React, { useState, useEffect, useMemo, useRef } from 'react';
import { VocabWord } from '../../types';
import { Timer, Check, X } from '../Icons';
import { GameSummary } from '../GameSummary';

interface SpeedChallengeProps {
  words: VocabWord[];
  onFinish: () => void;
  favorites: string[];
  onToggleFavorite: (word: VocabWord) => void;
}

export const SpeedChallenge: React.FC<SpeedChallengeProps> = ({ words, onFinish, favorites, onToggleFavorite }) => {
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [currentWord, setCurrentWord] = useState<VocabWord | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showPinyin, setShowPinyin] = useState(false);
  const timerRef = useRef<number | null>(null);

  // Results tracking
  const [correctWords, setCorrectWords] = useState<VocabWord[]>([]);
  const [wrongWords, setWrongWords] = useState<VocabWord[]>([]);

  // Helper to get Random Thai or Fallback
  const getRandomMeaning = (w: VocabWord) => {
    const meanings = (w.translationsThai && w.translationsThai.length > 0) ? w.translationsThai : w.translations;
    return meanings[Math.floor(Math.random() * meanings.length)];
  };

  const generateQuestion = () => {
    if (words.length < 4) return;
    const randomWord = words[Math.floor(Math.random() * words.length)];
    setCurrentWord(randomWord);
    setShowPinyin(false); // Reset hint

    // Pick 3 distractors
    const distractors = words
      .filter(w => w.id !== randomWord.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map(getRandomMeaning); // Pick random meaning for each distractor

    // Pick ONE random meaning for the correct word to display
    const answer = getRandomMeaning(randomWord);
    
    const allOptions = [...distractors, answer].sort(() => 0.5 - Math.random());
    setOptions(allOptions);
  };

  useEffect(() => {
    generateQuestion();
    timerRef.current = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setIsGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleAnswer = (selected: string) => {
    if (isGameOver || !currentWord) return;

    // Check if the selected string is ANY valid translation for the current word
    const validMeanings = (currentWord.translationsThai && currentWord.translationsThai.length > 0) 
        ? currentWord.translationsThai 
        : currentWord.translations;
    
    const correct = validMeanings.includes(selected);

    if (correct) {
      setScore(s => s + 10);
      setCorrectWords(prev => [...prev, currentWord]);
      generateQuestion(); // Immediate next question
    } else {
      setScore(s => Math.max(0, s - 5));
      setWrongWords(prev => [...prev, currentWord]);
      // Optional: Shake effect or visual feedback
    }
  };

  if (isGameOver) {
    return (
        <GameSummary 
            score={score}
            correctWords={correctWords}
            wrongWords={wrongWords}
            favorites={favorites}
            onToggleFavorite={onToggleFavorite}
            onExit={onFinish}
        />
    );
  }

  if (!currentWord) return <div className="p-8 text-center text-gray-400">Loading...</div>;

  return (
    <div className="flex flex-col h-full p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
         <div className="flex items-center gap-2 bg-orange-100 px-6 py-3 rounded-2xl text-orange-700 font-bold font-mono text-xl shadow-sm">
            <Timer className="w-6 h-6" />
            <span>{timeLeft}s</span>
         </div>
         <div className="text-4xl font-black text-primary-600 drop-shadow-sm">{score}</div>
      </div>

      <div className="flex-1 flex flex-col justify-center mb-8">
        <div className="text-center p-12 bg-white rounded-[2rem] shadow-sm border border-gray-100">
             <div className="text-8xl font-bold text-gray-800 mb-6">{currentWord.hanzi}</div>
             
             {showPinyin ? (
                <div className="text-2xl text-primary-600 font-medium mb-3 animate-fade-in">{currentWord.pinyin}</div>
             ) : (
                <button 
                    onClick={() => setShowPinyin(true)}
                    className="mb-3 px-6 py-2 bg-gray-50 hover:bg-gray-100 text-gray-500 text-sm font-bold uppercase tracking-wider rounded-lg transition-colors border border-gray-200"
                >
                    Show Pinyin
                </button>
             )}

             {currentWord.partOfSpeech && (
                <span className="inline-block bg-gray-100 text-gray-500 text-sm px-4 py-1 rounded-full mt-2 border border-gray-200">{currentWord.partOfSpeech}</span>
             )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => handleAnswer(opt)}
            className="py-6 px-6 bg-white border-2 border-gray-100 rounded-2xl text-xl font-medium text-gray-700 hover:border-primary-400 hover:bg-primary-50 hover:shadow-md active:scale-95 transition-all"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
};