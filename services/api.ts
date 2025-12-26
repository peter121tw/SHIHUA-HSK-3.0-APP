import { VocabWord, AppData } from '../types';

// The URL provided by the user, customizable via ?api= URL parameter
const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const apiParam = params.get('api');
    if (apiParam) return apiParam;
  }
  return 'https://script.google.com/macros/s/AKfycbyWXTEV9W1UJFm1BiaX4vx45v1UnQM0TcV4W1ttydcXrji7oHF4d0Ni4REw8Jlu5-eP/exec';
};

const API_URL = getApiUrl();

export const fetchVocabData = async (): Promise<AppData> => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }
    
    // The raw JSON response
    const jsonResponse = await response.json();
    let list: any[] = [];

    // The Apps Script returns { success: true, data: [...] }
    if (jsonResponse.data && Array.isArray(jsonResponse.data)) {
      list = jsonResponse.data;
    } else if (Array.isArray(jsonResponse)) {
      list = jsonResponse;
    }

    // Process data into a map by level
    const processedData: AppData = {};

    list.forEach((item: any, index: number) => {
      // Map Apps Script fields to VocabWord fields
      // Apps Script keys: id, simplified, traditional, pinyin, word_type, thai_meanings, example_sentences, hsk_level
      
      const hanzi = item.simplified || item.hanzi || '';
      
      let rawLevel = String(item.hsk_level || item.level || '1');
      // Normalize HSK 7, 8, 9 to '7-9'
      if (['7', '8', '9'].includes(rawLevel)) {
        rawLevel = '7-9';
      }
      const level = rawLevel;

      const id = item.id ? String(item.id) : `word-${index}`;
      const pinyin = item.pinyin || '';
      const traditional = item.traditional || '';
      const partOfSpeech = item.word_type || item.partOfSpeech || '';
      const sheetExample = item.example_sentences || item.example || '';
      
      // Parse Translations (Thai)
      // UPDATED: Now splits by | (pipe), ; (semicolon), or , (comma)
      let translationsThai: string[] = [];
      if (item.thai_meanings) {
        translationsThai = String(item.thai_meanings).split(/[|;,]/).map(s => s.trim()).filter(Boolean);
      }

      // Parse Translations (English/Default)
      let translations: string[] = [];
      const rawEng = item.english || item.meaning || item.translations || item.definition;
      if (rawEng) {
        translations = String(rawEng).split(/[|;,]/).map(s => s.trim()).filter(Boolean);
      } else if (translationsThai.length > 0) {
        // Fallback: If no explicit English, use Thai array
        translations = [...translationsThai]; 
      }

      const word: VocabWord = {
        id,
        hanzi,
        pinyin,
        translations,
        level,
        traditional,
        partOfSpeech,
        translationsThai,
        sheetExample
      };

      if (!processedData[level]) {
        processedData[level] = [];
      }
      processedData[level].push(word);
    });

    return processedData;
  } catch (error) {
    console.error("Error fetching data:", error);
    return {};
  }
};

export const syncWordToSheet = async (word: VocabWord): Promise<void> => {
  try {
    const payload = {
        action: 'add',
        hanzi: word.hanzi,
        pinyin: word.pinyin,
        translations: word.translations.join(', '),
        level: word.level,
        traditional: word.traditional,
        partOfSpeech: word.partOfSpeech,
        thai_meanings: word.translationsThai?.join(', '),
        example_sentences: word.sheetExample
    };

    await fetch(API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error("Error syncing word:", error);
  }
};