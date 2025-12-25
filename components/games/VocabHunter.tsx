import React, { useRef, useState, useEffect } from 'react';
import { VocabWord, CultureTip } from '../../types';
import { Camera, Aperture, X, Sparkles, RefreshCw, Check, BookOpen, Target, Shuffle } from '../Icons';
import { identifyTextInImage, generateCultureTip } from '../../services/gemini';

interface VocabHunterProps {
  allWords: VocabWord[];
  onFinish: () => void;
}

type HunterMode = 'explore' | 'quest';

export const VocabHunter: React.FC<VocabHunterProps> = ({ allWords, onFinish }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [scanning, setScanning] = useState(false);
  const [foundWord, setFoundWord] = useState<VocabWord | null>(null);
  const [cultureTip, setCultureTip] = useState<CultureTip | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingTip, setLoadingTip] = useState(false);
  
  // Quest Mode State
  const [mode, setMode] = useState<HunterMode>('explore');
  const [questTarget, setQuestTarget] = useState<VocabWord | null>(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  // Initialize quest when entering quest mode
  useEffect(() => {
    if (mode === 'quest' && !questTarget && allWords.length > 0) {
        generateNewQuest();
    }
  }, [mode]);

  const generateNewQuest = () => {
      if (allWords.length === 0) return;
      const randomWord = allWords[Math.floor(Math.random() * allWords.length)];
      setQuestTarget(randomWord);
      setFoundWord(null);
      setCultureTip(null);
      setError(null);
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setError("Unable to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const captureAndScan = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setScanning(true);
    setError(null);
    setFoundWord(null);
    setCultureTip(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get base64 string
    const base64Image = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

    try {
      // 1. Identify text using Gemini Vision
      const detectedTexts = await identifyTextInImage(base64Image);
      
      if (detectedTexts.length === 0) {
        setError("No Chinese text found. Try getting closer or improving lighting.");
        setScanning(false);
        return;
      }

      // Normalize function for simple matching (strip special chars)
      const clean = (s: string) => s.replace(/[^\u4e00-\u9fa5]/g, '');
      
      let match: VocabWord | undefined;

      // --- LOGIC SPLIT BASED ON MODE ---
      if (mode === 'explore') {
          // EXPLORE MODE: Find ANY word from the list
          for (const text of detectedTexts) {
            const cleanedText = clean(text);
            match = allWords.find(w => clean(w.hanzi) === cleanedText || (w.traditional && clean(w.traditional) === cleanedText));
            if (match) break;
          }
          if (!match) {
             for (const text of detectedTexts) {
                 const cleanedText = clean(text);
                 match = allWords.find(w => cleanedText.includes(clean(w.hanzi)) && w.hanzi.length >= 2);
                 if (match) break;
             }
          }
      } else if (mode === 'quest' && questTarget) {
          // QUEST MODE: Must find the SPECIFIC target
          const targetClean = clean(questTarget.hanzi);
          
          // Check for exact match or strong inclusion
          const isMatch = detectedTexts.some(text => {
              const detectedClean = clean(text);
              return detectedClean === targetClean || detectedClean.includes(targetClean);
          });

          if (isMatch) {
              match = questTarget;
          } else {
              // Check if they found SOMETHING else valid, just to give feedback
              const otherMatch = allWords.find(w => detectedTexts.some(d => clean(d).includes(clean(w.hanzi))));
              if (otherMatch) {
                  setError(`Found "${otherMatch.hanzi}", but your quest is "${questTarget.hanzi}"!`);
              } else {
                  setError(`Target "${questTarget.hanzi}" not detected. Found: ${detectedTexts[0]}`);
              }
              setScanning(false);
              return;
          }
      }

      if (match) {
        setFoundWord(match);
        setScanning(false);
        
        // 3. Unlock Culture Tip
        setLoadingTip(true);
        try {
            const tip = await generateCultureTip(match);
            setCultureTip(tip);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingTip(false);
        }
      } else {
        setError(`Found: "${detectedTexts[0]}" but it's not in your current list.`);
        setScanning(false);
      }

    } catch (err) {
      console.error(err);
      setError("Scanning failed. Please try again.");
      setScanning(false);
    }
  };

  const resetScanner = () => {
    setFoundWord(null);
    setCultureTip(null);
    setError(null);
    // If in quest mode and we just finished one, clicking "Next Quest" should be the action. 
    // This function is for "Scan Another" in Explore mode logic.
    if (mode === 'quest') {
        generateNewQuest();
    }
  };

  return (
    <div className="flex flex-col h-full bg-black relative">
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 pt-4 flex flex-col gap-4 bg-gradient-to-b from-black/80 to-transparent">
         <div className="flex justify-between items-center w-full">
            <button onClick={onFinish} className="p-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30">
                <X className="w-6 h-6" />
            </button>
            <div className="text-white font-bold text-lg drop-shadow-md flex items-center gap-2">
                <Camera className="w-5 h-5" /> Vocab Hunter
            </div>
            <div className="w-10"></div>
         </div>

         {/* Mode Switcher */}
         {!foundWord && (
             <div className="flex justify-center w-full">
                <div className="bg-black/40 backdrop-blur-md rounded-full p-1 flex border border-white/10">
                    <button 
                        onClick={() => { setMode('explore'); setError(null); }}
                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${mode === 'explore' ? 'bg-white text-black shadow-sm' : 'text-white/70 hover:text-white'}`}
                    >
                        <Aperture className="w-4 h-4" /> Explore
                    </button>
                    <button 
                        onClick={() => { setMode('quest'); setError(null); }}
                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${mode === 'quest' ? 'bg-primary-500 text-white shadow-sm' : 'text-white/70 hover:text-white'}`}
                    >
                        <Target className="w-4 h-4" /> Quest
                    </button>
                </div>
             </div>
         )}
      </div>

      {/* Quest Target Overlay */}
      {mode === 'quest' && questTarget && !foundWord && (
          <div className="absolute top-28 left-4 right-4 z-20 animate-slide-down">
              <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-white/50 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary-500"></div>
                  <div className="flex justify-between items-center">
                      <div>
                          <div className="text-xs font-bold text-primary-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                             <Target className="w-3 h-3" /> Current Mission
                          </div>
                          <div className="text-2xl font-black text-gray-800">{questTarget.hanzi}</div>
                          <div className="text-sm text-gray-600">
                             Find this word! (Meaning: {questTarget.translationsThai?.[0] || questTarget.translations[0]})
                          </div>
                      </div>
                      <button 
                        onClick={generateNewQuest}
                        className="p-3 bg-gray-100 rounded-xl text-gray-500 hover:bg-gray-200 active:scale-95 transition-all"
                      >
                         <Shuffle className="w-5 h-5" />
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Video Viewport */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center">
        {!stream && !error && <div className="text-white">Starting camera...</div>}
        
        <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="absolute min-w-full min-h-full object-cover"
        />

        {/* Viewfinder Overlay */}
        <div className="absolute inset-0 border-[30px] border-black/30 pointer-events-none transition-colors duration-500" style={{ borderColor: mode === 'quest' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.3)' }}>
            <div className="absolute top-0 left-0 w-full h-1 bg-white/50"></div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-white/50"></div>
            
            {/* Scanning Line Animation */}
            {scanning && (
                <div className={`absolute top-0 left-0 w-full h-1 shadow-[0_0_15px_rgba(45,212,191,0.8)] animate-[scan_2s_ease-in-out_infinite] ${mode === 'quest' ? 'bg-orange-400' : 'bg-primary-400'}`} />
            )}
        </div>
        
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <div className={`w-64 h-32 border-2 rounded-xl relative transition-colors ${mode === 'quest' ? 'border-orange-400/80' : 'border-white/50'}`}>
                <div className={`absolute -top-2 -left-2 w-4 h-4 border-t-4 border-l-4 ${mode === 'quest' ? 'border-orange-400' : 'border-white'}`}></div>
                <div className={`absolute -top-2 -right-2 w-4 h-4 border-t-4 border-r-4 ${mode === 'quest' ? 'border-orange-400' : 'border-white'}`}></div>
                <div className={`absolute -bottom-2 -left-2 w-4 h-4 border-b-4 border-l-4 ${mode === 'quest' ? 'border-orange-400' : 'border-white'}`}></div>
                <div className={`absolute -bottom-2 -right-2 w-4 h-4 border-b-4 border-r-4 ${mode === 'quest' ? 'border-orange-400' : 'border-white'}`}></div>
             </div>
        </div>

        {/* Feedback Messages */}
        {error && (
            <div className="absolute bottom-40 mx-4 bg-red-500/90 text-white px-6 py-3 rounded-2xl text-sm font-bold text-center animate-bounce-short shadow-lg backdrop-blur-sm z-30">
                {error}
            </div>
        )}
      </div>

      {/* Controls / Result Panel */}
      <div className="bg-white rounded-t-3xl p-6 min-h-[160px] z-30 transition-all duration-300 max-h-[60vh] overflow-y-auto">
         {foundWord ? (
            <div className="animate-slide-up">
               <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1 mb-1 ${mode === 'quest' ? 'text-orange-600' : 'text-green-600'}`}>
                        {mode === 'quest' ? <Target className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                        {mode === 'quest' ? 'Mission Accomplished!' : 'Match Found'}
                    </div>
                    <div className="text-3xl font-bold text-gray-800">{foundWord.hanzi}</div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-lg text-gray-500">{foundWord.pinyin}</span>
                        {foundWord.partOfSpeech && (
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded border border-gray-200">
                                {foundWord.partOfSpeech}
                            </span>
                        )}
                    </div>
                  </div>
                  <div className="bg-primary-50 px-3 py-1 rounded-full text-primary-700 text-xs font-bold border border-primary-100">
                    HSK {foundWord.level}
                  </div>
               </div>

               {/* Thai Meanings */}
               <div className="mb-4">
                  <p className="text-gray-800 text-lg leading-snug font-medium">
                        {(foundWord.translationsThai && foundWord.translationsThai.length > 0)
                            ? foundWord.translationsThai.join(', ')
                            : foundWord.translations.join(', ')}
                  </p>
               </div>

               {/* Example Sentence */}
               {foundWord.sheetExample && (
                   <div className="mb-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-2 mb-1 text-gray-400">
                            <BookOpen className="w-3 h-3" />
                            <span className="text-xs font-bold uppercase">Example</span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed italic">
                            {foundWord.sheetExample.split('|')[0]}
                        </p>
                   </div>
               )}

               {loadingTip ? (
                   <div className="flex items-center gap-2 text-primary-600 animate-pulse py-4">
                       <Sparkles className="w-5 h-5" /> Unlocking Secret Culture Tip...
                   </div>
               ) : cultureTip ? (
                   <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl mb-4 animate-fade-in">
                        <div className="flex items-center gap-2 text-yellow-700 font-bold mb-2">
                             <Sparkles className="w-4 h-4" /> Cultural Tip
                        </div>
                        <p className="text-gray-800 text-sm mb-2">{cultureTip.tip}</p>
                        <p className="text-gray-500 text-xs mb-2 italic">{cultureTip.pinyin}</p>
                        <div className="border-t border-yellow-200 pt-2 mt-2">
                            <p className="text-gray-700 text-sm font-medium">{cultureTip.thai}</p>
                        </div>
                   </div>
               ) : null}

               <button 
                onClick={resetScanner}
                className={`w-full py-4 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95 ${mode === 'quest' ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-200' : 'bg-gray-900 hover:bg-black'}`}
               >
                 {mode === 'quest' ? 'Start Next Mission' : 'Scan Another'}
               </button>
            </div>
         ) : (
            <div className="flex flex-col items-center">
                <p className="text-gray-500 text-sm mb-4 text-center">
                   {mode === 'quest' 
                     ? 'Find the target word in the real world to complete the mission!' 
                     : 'Point at Chinese text (menus, signs, books) to unlock vocab rewards!'}
                </p>
                <button 
                  onClick={captureAndScan}
                  disabled={scanning}
                  className={`w-20 h-20 rounded-full border-4 p-1 flex items-center justify-center transition-transform active:scale-95 shadow-lg bg-white ${mode === 'quest' ? 'border-orange-100' : 'border-primary-100'}`}
                >
                   <div className={`w-full h-full rounded-full flex items-center justify-center text-white ${scanning ? 'animate-pulse' : ''} ${mode === 'quest' ? 'bg-orange-500' : 'bg-primary-500'}`}>
                      {scanning ? <RefreshCw className="w-8 h-8 animate-spin" /> : (mode === 'quest' ? <Target className="w-8 h-8" /> : <Aperture className="w-8 h-8" />)}
                   </div>
                </button>
            </div>
         )}
      </div>

      <style>{`
        @keyframes scan {
            0% { top: 0%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
        }
        @keyframes bounce-short {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
};