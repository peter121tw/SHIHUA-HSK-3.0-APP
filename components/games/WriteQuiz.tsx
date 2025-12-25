import React, { useState, useEffect } from 'react';
import { VocabWord } from '../../types';
import { Edit3, Check, X, ArrowLeft } from '../Icons';
import { GameSummary } from '../GameSummary';

interface WriteQuizProps {
  words: VocabWord[];
  onFinish: () => void;
  favorites: string[];
  onToggleFavorite: (word: VocabWord) => void;
}

export const WriteQuiz: React.FC<WriteQuizProps> = ({ words, onFinish, favorites, onToggleFavorite }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [quizSet, setQuizSet] = useState<VocabWord[]>([]);
  const [showPinyin, setShowPinyin] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // Tracking
  const [correctWords, setCorrectWords] = useState<VocabWord[]>([]);
  const [wrongWords, setWrongWords] = useState<VocabWord[]>([]);

  useEffect(() => {
    // Use all passed words, shuffle them
    setQuizSet([...words].sort(() => 0.5 - Math.random()));
    setCurrentIndex(0);
    setShowPinyin(false);
    setIsFinished(false);
    setCorrectWords([]);
    setWrongWords([]);
  }, [words]);

  const currentWord = quizSet[currentIndex];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWord || feedback !== null) return;

    // Check against Thai OR English translations
    const validAnswers = [
        ...(currentWord.translationsThai || []),
        ...currentWord.translations
    ].map(s => s.toLowerCase().trim());

    const userInput = input.toLowerCase().trim();
    
    // Exact match or includes (for simpler checking)
    const isCorrect = validAnswers.some(ans => userInput === ans || (ans.length > 3 && userInput.includes(ans)));

    setFeedback(isCorrect ? 'correct' : 'wrong');
    setShowPinyin(true); // Reveal pinyin on submit

    if (isCorrect) {
        setCorrectWords(prev => [...prev, currentWord]);
    } else {
        setWrongWords(prev => [...prev, currentWord]);
    }

    setTimeout(() => {
        if (currentIndex < quizSet.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setInput('');
            setFeedback(null);
            setShowPinyin(false); // Reset for next
        } else {
            setIsFinished(true);
        }
    }, 2000);
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
        <div className="mb-8 text-gray-400 font-medium">Word {currentIndex + 1} / {quizSet.length}</div>
        
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

        <form onSubmit={handleSubmit} className="w-full">
            <label className="block text-sm font-bold text-gray-500 mb-2 uppercase">Type Meaning (Thai)</label>
            <div className="relative">
                <input 
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={feedback !== null}
                    className={`
                        w-full p-4 rounded-xl border-2 outline-none text-lg transition-colors
                        ${feedback === 'correct' ? 'border-green-500 bg-green-50 text-green-700' : 
                          feedback === 'wrong' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 focus:border-primary-500'}
                    `}
                    placeholder="Type here..."
                    autoFocus
                />
                <div className="absolute right-4 top-4">
                    {feedback === 'correct' && <Check className="w-6 h-6 text-green-500" />}
                    {feedback === 'wrong' && <X className="w-6 h-6 text-red-500" />}
                </div>
            </div>
            
            {feedback === 'wrong' && (
                <div className="mt-4 text-center text-red-500">
                    <p className="text-sm font-bold">Correct Answer:</p>
                    <p className="text-lg">
                        {currentWord.translationsThai?.[0] || currentWord.translations[0]}
                    </p>
                </div>
            )}

            {!feedback && (
                <button 
                    type="submit"
                    className="w-full mt-6 py-4 bg-primary-600 text-white rounded-xl font-bold shadow-lg hover:bg-primary-700 transition-all"
                >
                    Check Answer
                </button>
            )}
        </form>
    </div>
  );
};