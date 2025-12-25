import React, { useState, useEffect, useMemo } from 'react';
import { VocabWord } from '../../types';
import { Check, X, FileText } from '../Icons';
import { GameSummary } from '../GameSummary';

interface SentenceFillInProps {
  words: VocabWord[];
  onFinish: () => void;
  favorites: string[];
  onToggleFavorite: (word: VocabWord) => void;
}

interface Question {
  word: VocabWord;
  maskedSentence: string;
  originalSentence: string;
  options: VocabWord[];
}

export const SentenceFillIn: React.FC<SentenceFillInProps> = ({ words, onFinish, favorites, onToggleFavorite }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);

  // Track results
  const [correctWords, setCorrectWords] = useState<VocabWord[]>([]);
  const [wrongWords, setWrongWords] = useState<VocabWord[]>([]);

  useEffect(() => {
    // Filter words that actually have examples AND the word exists in the example
    const validWords = words.filter(w => {
      if (!w.sheetExample) return false;
      // Simple check: does the sentence contain the Hanzi?
      return w.sheetExample.includes(w.hanzi);
    });

    // Shuffle and slice
    const shuffled = validWords.sort(() => 0.5 - Math.random()).slice(0, 10);

    const generatedQuestions = shuffled.map(word => {
      // Pick the first example if multiple separated by |
      const rawExample = word.sheetExample!.split('|')[0].trim();
      // Mask the word. We use a regex to replace all occurrences or just the first.
      // Using split/join is safe for exact matches.
      const masked = rawExample.split(word.hanzi).join(' _____ ');

      // Distractors: Pick 3 random words from the *original* full list to ensure variety
      const distractors = words
        .filter(w => w.id !== word.id)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
      
      const options = [word, ...distractors].sort(() => 0.5 - Math.random());

      return {
        word,
        maskedSentence: masked,
        originalSentence: rawExample,
        options
      };
    });

    setQuestions(generatedQuestions);
    setCurrentIndex(0);
    setScore(0);
    setCorrectWords([]);
    setWrongWords([]);
    setIsFinished(false);
  }, [words]);

  const handleAnswer = (option: VocabWord) => {
    if (selectedOption !== null) return;
    
    setSelectedOption(option.id!);
    const currentQ = questions[currentIndex];
    const correct = option.id === currentQ.word.id;

    setIsCorrect(correct);
    if (correct) {
      setScore(s => s + 1);
      setCorrectWords(prev => [...prev, currentQ.word]);
    } else {
      setWrongWords(prev => [...prev, currentQ.word]);
    }

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(c => c + 1);
        setSelectedOption(null);
        setIsCorrect(null);
      } else {
        setIsFinished(true);
      }
    }, 2000);
  };

  if (questions.length === 0 && words.length > 0) {
    return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <FileText className="w-16 h-16 text-gray-300 mb-4" />
            <h2 className="text-xl font-bold text-gray-600">Not Enough Data</h2>
            <p className="text-gray-500 mt-2">The selected words do not have enough example sentences to generate this game.</p>
            <button onClick={onFinish} className="mt-6 px-6 py-3 bg-primary-600 text-white rounded-xl">
                Go Back
            </button>
        </div>
    );
  }

  if (isFinished) {
    return (
      <GameSummary 
        score={score}
        total={questions.length}
        correctWords={correctWords}
        wrongWords={wrongWords}
        favorites={favorites}
        onToggleFavorite={onToggleFavorite}
        onExit={onFinish}
      />
    );
  }

  if (questions.length === 0) return <div className="p-8 text-center">Loading...</div>;

  const currentQ = questions[currentIndex];

  return (
    <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto p-6">
      <div className="w-full flex justify-between items-center mb-8">
        <div className="text-sm font-medium text-gray-400">Question {currentIndex + 1} / {questions.length}</div>
        <div className="text-sm font-bold text-primary-600">Score: {score}</div>
      </div>

      <div className="w-full bg-white p-8 rounded-3xl shadow-lg border border-gray-100 text-center mb-8 min-h-[200px] flex flex-col justify-center items-center">
        {selectedOption === null ? (
            <div className="text-2xl font-bold text-gray-800 leading-relaxed">
                {currentQ.maskedSentence}
            </div>
        ) : (
             <div className="animate-fade-in">
                <div className="text-2xl font-bold text-gray-800 leading-relaxed mb-4">
                    {currentQ.originalSentence}
                </div>
                <div className="p-3 bg-primary-50 rounded-xl">
                    <div className="text-lg text-primary-700 font-bold">{currentQ.word.hanzi}</div>
                    <div className="text-sm text-primary-500">{currentQ.word.pinyin}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {(currentQ.word.translationsThai?.[0] || currentQ.word.translations[0])}
                    </div>
                </div>
             </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 w-full">
        {currentQ.options.map((opt, idx) => {
          let btnClass = "py-4 px-2 rounded-xl border-2 text-lg font-medium transition-all transform active:scale-95 flex flex-col items-center ";
          
          if (selectedOption !== null) {
            if (opt.id === currentQ.word.id) {
              btnClass += "bg-green-100 border-green-500 text-green-700";
            } else if (opt.id === selectedOption) {
              btnClass += "bg-red-100 border-red-500 text-red-700";
            } else {
              btnClass += "bg-gray-50 border-gray-100 text-gray-300 opacity-50";
            }
          } else {
            btnClass += "bg-white border-gray-200 text-gray-700 hover:border-primary-400 hover:bg-primary-50";
          }

          return (
            <button 
              key={idx}
              onClick={() => handleAnswer(opt)}
              disabled={selectedOption !== null}
              className={btnClass}
            >
              <span>{opt.hanzi}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
