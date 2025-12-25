import React, { useState, useEffect, useMemo } from 'react';
import { VocabWord } from '../types';
import { Check, X, RefreshCw, Volume2 } from './Icons';
import { GameSummary } from './GameSummary';

interface QuizProps {
  words: VocabWord[];
  onFinish: () => void;
  favorites: string[];
  onToggleFavorite: (word: VocabWord) => void;
}

export const Quiz: React.FC<QuizProps> = ({ words, onFinish, favorites, onToggleFavorite }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [quizSet, setQuizSet] = useState<VocabWord[]>([]);
  const [showPinyin, setShowPinyin] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  
  // Track results
  const [correctWords, setCorrectWords] = useState<VocabWord[]>([]);
  const [wrongWords, setWrongWords] = useState<VocabWord[]>([]);

  // Prepare the quiz set based on props
  useEffect(() => {
    // We assume the parent component has already sliced the words to the desired count.
    // We just shuffle them here for random question order.
    const shuffled = [...words].sort(() => 0.5 - Math.random());
    setQuizSet(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setShowPinyin(false);
    setIsFinished(false);
    setCorrectWords([]);
    setWrongWords([]);
  }, [words]);

  const currentWord = quizSet[currentIndex];

  // Helper to get A RANDOM Thai translation if available, otherwise English
  const getRandomTrans = (w: VocabWord) => {
    const meanings = (w.translationsThai && w.translationsThai.length > 0) ? w.translationsThai : w.translations;
    // Pick one random meaning from the array
    return meanings[Math.floor(Math.random() * meanings.length)];
  };

  const options = useMemo(() => {
    if (!currentWord) return [];
    
    // Get 3 random distractors from the FULL provided list
    const distractors = words
      .filter(w => w.id !== currentWord.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    
    // Create the correct option string specifically for this render
    const correctOptionString = getRandomTrans(currentWord);

    // Create distractor option strings
    const distractorStrings = distractors.map(getRandomTrans);
    
    // Combine and shuffle
    return [correctOptionString, ...distractorStrings]
      .sort(() => 0.5 - Math.random());
  }, [currentWord, words]);

  const handleAnswer = (index: number) => {
    if (selectedOption !== null) return;
    
    setSelectedOption(index);
    setShowPinyin(true); // Reveal pinyin on answer
    const selectedString = options[index];

    // Check if the selected string is one of the valid meanings for the current word
    const validMeanings = (currentWord.translationsThai && currentWord.translationsThai.length > 0) 
        ? currentWord.translationsThai 
        : currentWord.translations;

    const correct = validMeanings.includes(selectedString);
    
    setIsCorrect(correct);
    if (correct) {
        setScore(s => s + 1);
        setCorrectWords(prev => [...prev, currentWord]);
    } else {
        setWrongWords(prev => [...prev, currentWord]);
    }

    setTimeout(() => {
      if (currentIndex < quizSet.length - 1) {
        setCurrentIndex(c => c + 1);
        setSelectedOption(null);
        setIsCorrect(null);
        setShowPinyin(false); // Reset for next word
      } else {
        setIsFinished(true);
      }
    }, 1500);
  };

  if (isFinished) {
      return (
          <GameSummary 
            score={score}
            total={quizSet.length}
            correctWords={correctWords}
            wrongWords={wrongWords}
            favorites={favorites}
            onToggleFavorite={onToggleFavorite}
            onExit={onFinish}
          />
      );
  }

  if (!currentWord) return <div className="p-8 text-center">Loading Quiz...</div>;

  const isOptionCorrect = (optStr: string) => {
     const validMeanings = (currentWord.translationsThai && currentWord.translationsThai.length > 0) 
        ? currentWord.translationsThai 
        : currentWord.translations;
     return validMeanings.includes(optStr);
  }

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto p-6 h-full">
      <div className="w-full flex justify-between items-center mb-8">
        <div className="text-sm font-medium text-gray-400">Question {currentIndex + 1} / {quizSet.length}</div>
        <div className="text-sm font-bold text-primary-600">Score: {score}</div>
      </div>

      <div className="w-full bg-white p-10 rounded-3xl shadow-lg border border-gray-100 text-center mb-8">
        <div className="text-6xl font-bold text-gray-800 mb-4">{currentWord.hanzi}</div>
        
        {showPinyin ? (
          <div className="text-xl text-primary-600 font-medium mb-2 animate-fade-in">{currentWord.pinyin}</div>
        ) : (
          <button 
            onClick={() => setShowPinyin(true)}
            className="mb-2 px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-500 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors"
          >
            Show Pinyin
          </button>
        )}

        {currentWord.partOfSpeech && (
           <span className="inline-block bg-gray-100 text-gray-500 text-sm px-3 py-1 rounded-full mt-1">{currentWord.partOfSpeech}</span>
        )}
      </div>

      <div className="w-full space-y-3">
        {options.map((opt, idx) => {
          let btnClass = "w-full py-4 px-6 rounded-xl border-2 text-left font-medium transition-all transform active:scale-98 ";
          
          if (selectedOption !== null) {
            if (isOptionCorrect(opt)) {
              btnClass += "bg-green-100 border-green-500 text-green-700";
            } else if (idx === selectedOption) {
              btnClass += "bg-red-100 border-red-500 text-red-700";
            } else {
              btnClass += "bg-gray-50 border-gray-100 text-gray-400";
            }
          } else {
            btnClass += "bg-white border-gray-200 text-gray-700 hover:border-primary-400 hover:bg-primary-50";
          }

          return (
            <button 
              key={idx}
              onClick={() => handleAnswer(idx)}
              disabled={selectedOption !== null}
              className={btnClass}
            >
              <div className="flex items-center justify-between">
                <span>{opt}</span>
                {selectedOption !== null && isOptionCorrect(opt) && <Check className="w-5 h-5 text-green-600" />}
                {selectedOption === idx && !isOptionCorrect(opt) && <X className="w-5 h-5 text-red-600" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};