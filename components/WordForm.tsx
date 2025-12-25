import React, { useState } from 'react';
import { VocabWord } from '../types';
import { X, Save, Check } from './Icons';

interface WordFormProps {
  initialLevel: string;
  onSave: (word: VocabWord) => void;
  onCancel: () => void;
}

export const WordForm: React.FC<WordFormProps> = ({ initialLevel, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    hanzi: '',
    pinyin: '',
    translation: '',
    level: initialLevel || '1',
    partOfSpeech: '',
    traditional: '',
    thai: '',
    example: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.hanzi) return;

    const newWord: VocabWord = {
      hanzi: formData.hanzi,
      pinyin: formData.pinyin,
      translations: formData.translation.split(/[,;]/).map(s => s.trim()).filter(Boolean),
      level: formData.level,
      traditional: formData.traditional,
      partOfSpeech: formData.partOfSpeech,
      translationsThai: formData.thai.split(/[,;]/).map(s => s.trim()).filter(Boolean),
      sheetExample: formData.example
    };
    onSave(newWord);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-scale-in">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-lg text-gray-800">Add New Word</h3>
          <button onClick={onCancel} className="p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
             <div className="col-span-1">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Level</label>
                <select 
                  name="level" 
                  value={formData.level} 
                  onChange={handleChange}
                  className="w-full rounded-xl border-gray-200 bg-gray-50 py-2.5 px-3 text-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  {[1,2,3,4,5,6].map(l => <option key={l} value={l}>HSK {l}</option>)}
                </select>
             </div>
             <div className="col-span-1">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">POS (Optional)</label>
                <input 
                  type="text" 
                  name="partOfSpeech"
                  placeholder="e.g. noun, verb"
                  value={formData.partOfSpeech}
                  onChange={handleChange}
                  className="w-full rounded-xl border-gray-200 bg-gray-50 py-2.5 px-3 text-sm focus:border-primary-500 focus:ring-primary-500"
                />
             </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hanzi (Simplified) *</label>
            <input 
              required
              type="text" 
              name="hanzi"
              placeholder="e.g. 咖啡"
              value={formData.hanzi}
              onChange={handleChange}
              className="w-full rounded-xl border-gray-200 bg-gray-50 py-2.5 px-3 text-lg font-medium focus:border-primary-500 focus:ring-primary-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="col-span-1">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Pinyin</label>
                <input 
                  type="text" 
                  name="pinyin"
                  placeholder="e.g. kā fēi"
                  value={formData.pinyin}
                  onChange={handleChange}
                  className="w-full rounded-xl border-gray-200 bg-gray-50 py-2.5 px-3 text-sm focus:border-primary-500 focus:ring-primary-500"
                />
             </div>
             <div className="col-span-1">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Traditional</label>
                <input 
                  type="text" 
                  name="traditional"
                  placeholder="(Optional)"
                  value={formData.traditional}
                  onChange={handleChange}
                  className="w-full rounded-xl border-gray-200 bg-gray-50 py-2.5 px-3 text-sm focus:border-primary-500 focus:ring-primary-500"
                />
             </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Meaning (English)</label>
            <input 
              type="text" 
              name="translation"
              placeholder="e.g. coffee"
              value={formData.translation}
              onChange={handleChange}
              className="w-full rounded-xl border-gray-200 bg-gray-50 py-2.5 px-3 text-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Meaning (Thai)</label>
            <input 
              type="text" 
              name="thai"
              placeholder="e.g. กาแฟ"
              value={formData.thai}
              onChange={handleChange}
              className="w-full rounded-xl border-gray-200 bg-gray-50 py-2.5 px-3 text-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
          
           <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Example Sentence</label>
            <textarea 
              rows={2}
              name="example"
              placeholder="Example sentence..."
              value={formData.example}
              onChange={handleChange}
              className="w-full rounded-xl border-gray-200 bg-gray-50 py-2.5 px-3 text-sm focus:border-primary-500 focus:ring-primary-500 resize-none"
            />
          </div>

          <button 
            type="submit"
            className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-2xl shadow-lg shadow-primary-200 flex items-center justify-center gap-2 transition-all active:scale-95 mt-2"
          >
            <Save className="w-5 h-5" />
            <span>Save to Sheet</span>
          </button>
        </form>
      </div>
    </div>
  );
};