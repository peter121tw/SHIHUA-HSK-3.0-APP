import React, { useState, useEffect } from 'react';
import { VocabWord } from '../../types';
import { Check } from '../Icons';
import { GameSummary } from '../GameSummary';

interface MatchGameProps {
  words: VocabWord[];
  onFinish: () => void;
  favorites: string[];
  onToggleFavorite: (word: VocabWord) => void;
}

interface Card {
  id: string; // Unique ID for the card instance
  wordId: string; // Logical ID to match pairs
  content: string;
  type: 'hanzi' | 'meaning';
  isMatched: boolean;
  isFlipped: boolean;
  partOfSpeech?: string; // Added partOfSpeech
}

export const MatchGame: React.FC<MatchGameProps> = ({ words, onFinish, favorites, onToggleFavorite }) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<Card[]>([]);
  const [matchesFound, setMatchesFound] = useState(0);
  const [levelComplete, setLevelComplete] = useState(false);
  const [activeWords, setActiveWords] = useState<VocabWord[]>([]);

  useEffect(() => {
    // Select 6 random words
    const gameWords = [...words].sort(() => 0.5 - Math.random()).slice(0, 6);
    setActiveWords(gameWords);
    
    const newCards: Card[] = [];
    gameWords.forEach((w, idx) => {
        // Hanzi Card
        newCards.push({
            id: `h-${idx}`,
            wordId: w.id || `temp-${idx}`,
            content: w.hanzi,
            type: 'hanzi',
            isMatched: false,
            isFlipped: false,
            partOfSpeech: w.partOfSpeech
        });
        
        // Meaning Card (Randomly pick one Thai priority)
        const meanings = (w.translationsThai && w.translationsThai.length > 0) ? w.translationsThai : w.translations;
        const randomMeaning = meanings[Math.floor(Math.random() * meanings.length)];

        newCards.push({
            id: `m-${idx}`,
            wordId: w.id || `temp-${idx}`,
            content: randomMeaning,
            type: 'meaning',
            isMatched: false,
            isFlipped: false
        });
    });

    setCards(newCards.sort(() => 0.5 - Math.random()));
  }, [words]);

  const handleCardClick = (card: Card) => {
    if (card.isMatched || card.isFlipped || flippedCards.length >= 2) return;

    const newFlipped = [...flippedCards, card];
    setFlippedCards(newFlipped);
    
    setCards(prev => prev.map(c => c.id === card.id ? { ...c, isFlipped: true } : c));

    if (newFlipped.length === 2) {
      const [c1, c2] = newFlipped;
      if (c1.wordId === c2.wordId) {
        // Match!
        setTimeout(() => {
          setCards(prev => prev.map(c => (c.id === c1.id || c.id === c2.id) ? { ...c, isMatched: true } : c));
          setFlippedCards([]);
          setMatchesFound(prev => prev + 1);
        }, 500);
      } else {
        // No Match
        setTimeout(() => {
          setCards(prev => prev.map(c => (c.id === c1.id || c.id === c2.id) ? { ...c, isFlipped: false } : c));
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  useEffect(() => {
    if (matchesFound === 6 && cards.length > 0) {
      setTimeout(() => setLevelComplete(true), 800);
    }
  }, [matchesFound]);

  if (levelComplete) {
    return (
        <GameSummary 
            score={matchesFound}
            total={6}
            correctWords={activeWords}
            wrongWords={[]}
            favorites={favorites}
            onToggleFavorite={onToggleFavorite}
            onExit={onFinish}
        />
    );
  }

  return (
    <div className="h-full p-4 flex flex-col">
       <div className="text-center mb-4 text-gray-500 font-medium">Find the pairs ({matchesFound}/6)</div>
       <div className="grid grid-cols-3 gap-3 flex-1 content-center">
          {cards.map(card => (
             <div 
                key={card.id}
                onClick={() => handleCardClick(card)}
                className={`
                    relative aspect-square rounded-xl cursor-pointer transition-all duration-300 transform
                    ${card.isMatched ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'}
                `}
             >
                <div className={`
                    absolute inset-0 rounded-xl flex items-center justify-center p-2 text-center shadow-sm border-2
                    transition-all duration-300
                    ${card.isFlipped 
                        ? 'bg-white border-primary-500 rotate-0' 
                        : 'bg-primary-100 border-primary-200 rotate-y-180 text-transparent'}
                `}>
                    {card.isFlipped ? (
                        <div className="flex flex-col items-center justify-center w-full h-full overflow-hidden">
                            <span className={`font-bold ${card.type === 'hanzi' ? 'text-xl text-gray-800' : 'text-xs sm:text-sm text-teal-700 break-words'}`}>
                                {card.content}
                            </span>
                             {card.type === 'hanzi' && card.partOfSpeech && (
                                <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full mt-1.5 whitespace-nowrap">
                                    {card.partOfSpeech}
                                </span>
                            )}
                        </div>
                    ) : (
                        <span className="text-primary-300 font-bold text-2xl">?</span>
                    )}
                </div>
             </div>
          ))}
       </div>
    </div>
  );
};