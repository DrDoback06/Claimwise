/**
 * Text-to-Speech Service
 * Provides text-to-speech functionality with multiple provider support
 * Auto-detects best available provider and falls back gracefully
 */

import db from './database';
import aiService from './aiService';

class TextToSpeechService {
  constructor() {
    this.currentProvider = null;
    this.synthesis = null; // Browser Web Speech API
    this.isPlaying = false;
    this.isPaused = false;
    this.currentUtterance = null;
    this.currentAudio = null; // For premium providers
    this.onWordUpdate = null;
    this.currentText = '';
    this.currentPosition = 0; // Current character position in text
    this.wordTimings = [];
    this.playbackSpeed = 1.0;
    this.volume = 1.0;
    this.sentences = []; // Array of sentence objects with start/end positions
    this.paragraphs = []; // Array of paragraph objects with start/end positions
    this.currentSentenceIndex = 0;
    this.currentParagraphIndex = 0;
  }

  /**
   * Detect available TTS providers
   */
  async detectAvailableProviders() {
    const providers = {
      browser: false,
      elevenlabs: false,
      openai: false
    };

    // Check browser Web Speech API
    if ('speechSynthesis' in window && 'SpeechSynthesisUtterance' in window) {
      providers.browser = true;
    }

    // Check ElevenLabs API key
    try {
      const elevenlabsKey = (typeof aiService !== 'undefined' && aiService.getRuntimeKeys ? aiService.getRuntimeKeys().elevenlabs : null);
      if (elevenlabsKey) {
        providers.elevenlabs = true;
      }
    } catch (e) {
      // No API key
    }

    // Check OpenAI API key
    try {
      const settings = await db.get('meta', 'settings');
      if (settings?.openaiApiKey) {
        providers.openai = true;
      }
    } catch (e) {
      // No API key
    }

    return providers;
  }

  /**
   * Select best available provider
   */
  async selectBestProvider() {
    const providers = await this.detectAvailableProviders();
    
    // Priority: ElevenLabs > OpenAI > Browser
    if (providers.elevenlabs) {
      this.currentProvider = 'elevenlabs';
      return 'elevenlabs';
    } else if (providers.openai) {
      this.currentProvider = 'openai';
      return 'openai';
    } else if (providers.browser) {
      this.currentProvider = 'browser';
      return 'browser';
    }

    throw new Error('No TTS provider available');
  }

  /**
   * Get available voices for a provider
   */
  async getAvailableVoices(provider = null) {
    const activeProvider = provider || this.currentProvider || await this.selectBestProvider();

    if (activeProvider === 'browser') {
      return new Promise((resolve) => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          resolve(voices.map(v => ({
            id: v.voiceURI,
            name: v.name,
            lang: v.lang,
            gender: v.name.toLowerCase().includes('female') ? 'female' : 'male',
            provider: 'browser'
          })));
        } else {
          // Voices might not be loaded yet
          window.speechSynthesis.onvoiceschanged = () => {
            const loadedVoices = window.speechSynthesis.getVoices();
            resolve(loadedVoices.map(v => ({
              id: v.voiceURI,
              name: v.name,
              lang: v.lang,
              gender: v.name.toLowerCase().includes('female') ? 'female' : 'male',
              provider: 'browser'
            })));
          };
        }
      });
    } else if (activeProvider === 'elevenlabs') {
      // ElevenLabs voices (premium)
      return [
        { id: 'rachel', name: 'Rachel', gender: 'female', provider: 'elevenlabs', accent: 'british' },
        { id: 'domi', name: 'Domi', gender: 'female', provider: 'elevenlabs', accent: 'american' },
        { id: 'bella', name: 'Bella', gender: 'female', provider: 'elevenlabs', accent: 'british' },
        { id: 'antoni', name: 'Antoni', gender: 'male', provider: 'elevenlabs', accent: 'british' },
        { id: 'elli', name: 'Elli', gender: 'female', provider: 'elevenlabs', accent: 'american' },
        { id: 'josh', name: 'Josh', gender: 'male', provider: 'elevenlabs', accent: 'british' },
        { id: 'arnold', name: 'Arnold', gender: 'male', provider: 'elevenlabs', accent: 'british' },
        { id: 'adam', name: 'Adam', gender: 'male', provider: 'elevenlabs', accent: 'british' },
        { id: 'sam', name: 'Sam', gender: 'male', provider: 'elevenlabs', accent: 'british' }
      ];
    } else if (activeProvider === 'openai') {
      // OpenAI TTS voices
      return [
        { id: 'alloy', name: 'Alloy', gender: 'neutral', provider: 'openai' },
        { id: 'echo', name: 'Echo', gender: 'male', provider: 'openai' },
        { id: 'fable', name: 'Fable', gender: 'male', provider: 'openai' },
        { id: 'onyx', name: 'Onyx', gender: 'male', provider: 'openai' },
        { id: 'nova', name: 'Nova', gender: 'female', provider: 'openai' },
        { id: 'shimmer', name: 'Shimmer', gender: 'female', provider: 'openai' }
      ];
    }

    return [];
  }

  /**
   * Detect dialogue in text
   */
  detectDialogue(text) {
    const dialoguePattern = /"([^"]+)"/g;
    const matches = [];
    let match;

    while ((match = dialoguePattern.exec(text)) !== null) {
      matches.push({
        text: match[1],
        start: match.index,
        end: match.index + match[0].length,
        fullMatch: match[0]
      });
    }

    return matches;
  }

  /**
   * Detect emotion in text using AI (non-blocking, returns neutral on failure)
   */
  async detectEmotion(text) {
    try {
      const prompt = `Analyze the emotional tone of this text. Return ONLY a single word: happy, sad, angry, fearful, surprised, disgusted, neutral, excited, calm, tense, humorous, dark, or dramatic.

Text: "${text.substring(0, 500)}"

Emotion:`;

      // Use a timeout to prevent blocking read-aloud
      const emotionPromise = aiService.callAI(prompt, 'analytical');
      const timeoutPromise = new Promise((resolve) => 
        setTimeout(() => resolve('neutral'), 2000)
      );
      
      const emotion = await Promise.race([emotionPromise, timeoutPromise]);
      return (typeof emotion === 'string' ? emotion.trim().toLowerCase() : 'neutral') || 'neutral';
    } catch (error) {
      console.warn('Emotion detection failed (non-blocking):', error);
      return 'neutral';
    }
  }

  /**
   * Process text for reading (add pauses, detect dialogue, etc.)
   */
  async processTextForReading(text, options = {}) {
    const {
      addPauses = true,
      detectDialogue = true,
      detectEmotion = false
    } = options;

    let processedText = text;

    // Add smart pauses at punctuation
    if (addPauses) {
      processedText = processedText
        .replace(/,/g, ',<pause:300>')
        .replace(/\./g, '.<pause:600>')
        .replace(/!/g, '!<pause:800>')
        .replace(/\?/g, '?<pause:800>')
        .replace(/\n\n/g, '<pause:1200>')
        .replace(/\n/g, '<pause:400>');
    }

    const dialogue = detectDialogue ? this.detectDialogue(text) : [];
    const emotion = detectEmotion ? await this.detectEmotion(text) : 'neutral';

    return {
      processedText,
      dialogue,
      emotion,
      originalText: text
    };
  }

  /**
   * Read text using browser Web Speech API
   */
  async readWithBrowser(text, options = {}) {
    return new Promise((resolve, reject) => {
      if (!window.speechSynthesis) {
        reject(new Error('Browser TTS not available'));
        return;
      }

      // Stop any current speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set voice
      if (options.voiceId) {
        const voices = window.speechSynthesis.getVoices();
        const voice = voices.find(v => v.voiceURI === options.voiceId);
        if (voice) utterance.voice = voice;
      }

      // Set properties
      utterance.rate = (options.speed || this.playbackSpeed) || 1.0;
      utterance.pitch = options.pitch || 1.0;
      utterance.volume = (options.volume || this.volume) || 1.0;
      utterance.lang = options.lang || 'en-GB';

      // Word boundary tracking for highlighting
      let wordIndex = 0;
      const words = text.split(/\s+/);
      
      utterance.onboundary = (event) => {
        if (event.name === 'word' && this.onWordUpdate) {
          const word = words[wordIndex];
          if (word) {
            // Update current position
            this.currentPosition = event.charIndex;
            this.findCurrentIndex(this.currentPosition);
            
            this.onWordUpdate({
              word,
              index: wordIndex,
              charIndex: event.charIndex,
              charLength: event.charLength
            });
            wordIndex++;
          }
        }
      };

      utterance.onend = () => {
        this.isPlaying = false;
        this.isPaused = false;
        this.currentUtterance = null;
        resolve();
      };

      utterance.onerror = (error) => {
        this.isPlaying = false;
        this.isPaused = false;
        this.currentUtterance = null;
        reject(error);
      };

      this.currentUtterance = utterance;
      this.isPlaying = true;
      this.isPaused = false;
      window.speechSynthesis.speak(utterance);
    });
  }

  /**
   * Read text using ElevenLabs API
   */
  async readWithElevenLabs(text, options = {}) {
    try {
      const apiKey = (typeof aiService !== 'undefined' && aiService.getRuntimeKeys ? aiService.getRuntimeKeys().elevenlabs : null);

      if (!apiKey) {
        throw new Error('ElevenLabs API key not set');
      }

      const voiceId = options.voiceId || 'rachel'; // Default British voice
      const modelId = 'eleven_multilingual_v2';

      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey
        },
        body: JSON.stringify({
          text: text,
          model_id: modelId,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: options.emotion || 0.0,
            use_speaker_boost: true
          }
        })
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.statusText}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.playbackRate = options.speed || this.playbackSpeed || 1.0;
      audio.volume = options.volume || this.volume || 1.0;

      // Word tracking for highlighting (approximate)
      const words = text.split(/\s+/);
      const estimatedDuration = audio.duration || (text.length * 0.1); // Rough estimate
      const wordDuration = estimatedDuration / words.length;

      let wordIndex = 0;
      const highlightInterval = setInterval(() => {
        if (wordIndex < words.length && this.onWordUpdate) {
          this.onWordUpdate({
            word: words[wordIndex],
            index: wordIndex,
            charIndex: text.indexOf(words[wordIndex]),
            charLength: words[wordIndex].length
          });
          wordIndex++;
        }
      }, wordDuration * 1000);

      return new Promise((resolve, reject) => {
        audio.onended = () => {
          clearInterval(highlightInterval);
          URL.revokeObjectURL(audioUrl);
          this.isPlaying = false;
          this.isPaused = false;
          resolve();
        };

        audio.onerror = (error) => {
          clearInterval(highlightInterval);
          URL.revokeObjectURL(audioUrl);
          this.isPlaying = false;
          this.isPaused = false;
          reject(error);
        };

        this.currentAudio = audio;
        this.isPlaying = true;
        this.isPaused = false;
        audio.play();
      });
    } catch (error) {
      console.error('ElevenLabs TTS error:', error);
      throw error;
    }
  }

  /**
   * Read text using OpenAI TTS API
   */
  async readWithOpenAI(text, options = {}) {
    try {
      const apiKey = (aiService.getRuntimeKeys ? aiService.getRuntimeKeys().openai : null);

      if (!apiKey) {
        throw new Error('OpenAI API key not set');
      }

      const voice = options.voiceId || 'nova'; // Default voice
      const model = 'tts-1'; // or 'tts-1-hd' for higher quality

      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          input: text,
          voice: voice,
          speed: options.speed || this.playbackSpeed || 1.0
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI TTS API error: ${response.statusText}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.volume = options.volume || this.volume || 1.0;

      // Word tracking for highlighting (approximate)
      const words = text.split(/\s+/);
      const estimatedDuration = audio.duration || (text.length * 0.1);
      const wordDuration = estimatedDuration / words.length;

      let wordIndex = 0;
      const highlightInterval = setInterval(() => {
        if (wordIndex < words.length && this.onWordUpdate) {
          this.onWordUpdate({
            word: words[wordIndex],
            index: wordIndex,
            charIndex: text.indexOf(words[wordIndex]),
            charLength: words[wordIndex].length
          });
          wordIndex++;
        }
      }, wordDuration * 1000);

      return new Promise((resolve, reject) => {
        audio.onended = () => {
          clearInterval(highlightInterval);
          URL.revokeObjectURL(audioUrl);
          this.isPlaying = false;
          this.isPaused = false;
          resolve();
        };

        audio.onerror = (error) => {
          clearInterval(highlightInterval);
          URL.revokeObjectURL(audioUrl);
          this.isPlaying = false;
          this.isPaused = false;
          reject(error);
        };

        this.currentAudio = audio;
        this.isPlaying = true;
        this.isPaused = false;
        audio.play();
      });
    } catch (error) {
      console.error('OpenAI TTS error:', error);
      throw error;
    }
  }

  /**
   * Read text with automatic provider selection
   */
  async readText(text, options = {}) {
    if (!this.currentProvider) {
      await this.selectBestProvider();
    }

    // Process text
    const processed = await this.processTextForReading(text, {
      addPauses: options.addPauses !== false,
      detectDialogue: options.detectDialogue !== false,
      detectEmotion: options.detectEmotion !== false
    });

    // Remove pause markers for actual reading (they're just for processing)
    const textToRead = processed.processedText.replace(/<pause:\d+>/g, '');

    try {
      if (this.currentProvider === 'elevenlabs') {
        return await this.readWithElevenLabs(textToRead, {
          ...options,
          emotion: processed.emotion
        });
      } else if (this.currentProvider === 'openai') {
        return await this.readWithOpenAI(textToRead, options);
      } else {
        return await this.readWithBrowser(textToRead, options);
      }
    } catch (error) {
      // Fallback to browser if premium fails
      if (this.currentProvider !== 'browser') {
        console.warn('Premium TTS failed, falling back to browser:', error);
        this.currentProvider = 'browser';
        return await this.readWithBrowser(textToRead, options);
      }
      throw error;
    }
  }

  /**
   * Read text with word highlighting callback
   */
  async readWithHighlights(text, onWordUpdate) {
    this.onWordUpdate = onWordUpdate;
    this.currentText = text;
    this.currentPosition = 0;
    
    // Parse text structure for skip functionality
    this.parseTextStructure(text);
    
    return await this.readText(text, {
      addPauses: true,
      detectDialogue: true,
      detectEmotion: true
    });
  }

  /**
   * Main read method (alias for readText)
   */
  async read(text, options = {}) {
    this.currentText = text;
    this.currentPosition = 0;
    
    // Parse text structure for skip functionality
    this.parseTextStructure(text);
    
    return await this.readText(text, options);
  }

  /**
   * Pause current playback
   */
  pause() {
    if (this.currentProvider === 'browser') {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        this.isPaused = true;
      }
    } else if (this.currentAudio) {
      this.currentAudio.pause();
      this.isPaused = true;
    }
  }

  /**
   * Resume paused playback
   */
  resume() {
    if (this.currentProvider === 'browser') {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        this.isPaused = false;
      }
    } else if (this.currentAudio && this.isPaused) {
      this.currentAudio.play();
      this.isPaused = false;
    }
  }

  /**
   * Stop current playback
   */
  stop() {
    if (this.currentProvider === 'browser') {
      window.speechSynthesis.cancel();
    } else if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
    }
    
    this.isPlaying = false;
    this.isPaused = false;
    this.currentUtterance = null;
    this.currentAudio = null;
    this.onWordUpdate = null;
  }

  /**
   * Parse text into sentences and paragraphs for navigation
   */
  parseTextStructure(text) {
    this.currentText = text;
    this.sentences = [];
    this.paragraphs = [];
    
    // Split into paragraphs
    const paraTexts = text.split(/\n\n+/);
    let charPos = 0;
    
    paraTexts.forEach((paraText, paraIdx) => {
      const paraStart = charPos;
      const paraEnd = charPos + paraText.length;
      
      // Split paragraph into sentences
      const sentenceRegex = /[.!?]+(?:\s+|$)/g;
      let sentenceStart = paraStart;
      let match;
      
      while ((match = sentenceRegex.exec(paraText)) !== null) {
        const sentenceEnd = paraStart + match.index + match[0].length;
        this.sentences.push({
          start: sentenceStart,
          end: sentenceEnd,
          text: text.substring(sentenceStart, sentenceEnd),
          paragraphIndex: paraIdx
        });
        sentenceStart = sentenceEnd;
      }
      
      // Handle last sentence if no ending punctuation
      if (sentenceStart < paraEnd) {
        this.sentences.push({
          start: sentenceStart,
          end: paraEnd,
          text: text.substring(sentenceStart, paraEnd),
          paragraphIndex: paraIdx
        });
      }
      
      this.paragraphs.push({
        start: paraStart,
        end: paraEnd,
        text: paraText,
        sentenceIndices: this.sentences
          .map((s, idx) => s.start >= paraStart && s.end <= paraEnd ? idx : -1)
          .filter(idx => idx !== -1)
      });
      
      charPos = paraEnd + 2; // +2 for \n\n
    });
  }

  /**
   * Find current sentence/paragraph index based on position
   */
  findCurrentIndex(position) {
    // Find current sentence
    const sentenceIdx = this.sentences.findIndex(s => 
      position >= s.start && position < s.end
    );
    this.currentSentenceIndex = sentenceIdx >= 0 ? sentenceIdx : this.currentSentenceIndex;
    
    // Find current paragraph
    const paraIdx = this.paragraphs.findIndex(p => 
      position >= p.start && position < p.end
    );
    this.currentParagraphIndex = paraIdx >= 0 ? paraIdx : this.currentParagraphIndex;
  }

  /**
   * Skip forward (sentence or paragraph)
   */
  async skipForward(amount = 'sentence') {
    if (!this.isPlaying || !this.currentText) return;
    
    this.findCurrentIndex(this.currentPosition);
    
    let newPosition = this.currentPosition;
    
    if (amount === 'sentence') {
      if (this.currentSentenceIndex < this.sentences.length - 1) {
        newPosition = this.sentences[this.currentSentenceIndex + 1].start;
      } else {
        // Already at last sentence
        return;
      }
    } else if (amount === 'paragraph') {
      if (this.currentParagraphIndex < this.paragraphs.length - 1) {
        newPosition = this.paragraphs[this.currentParagraphIndex + 1].start;
      } else {
        // Already at last paragraph
        return;
      }
    }
    
    // Stop current playback
    this.stop();
    
    // Resume from new position
    const remainingText = this.currentText.substring(newPosition);
    if (remainingText.trim()) {
      this.currentPosition = newPosition;
      await this.read(remainingText, {
        voiceId: this.currentVoiceId,
        speed: this.playbackSpeed,
        volume: this.volume
      });
    }
  }

  /**
   * Skip backward (sentence or paragraph)
   */
  async skipBackward(amount = 'sentence') {
    if (!this.isPlaying || !this.currentText) return;
    
    this.findCurrentIndex(this.currentPosition);
    
    let newPosition = this.currentPosition;
    
    if (amount === 'sentence') {
      if (this.currentSentenceIndex > 0) {
        newPosition = this.sentences[this.currentSentenceIndex - 1].start;
      } else {
        // Already at first sentence
        return;
      }
    } else if (amount === 'paragraph') {
      if (this.currentParagraphIndex > 0) {
        newPosition = this.paragraphs[this.currentParagraphIndex - 1].start;
      } else {
        // Already at first paragraph
        return;
      }
    }
    
    // Stop current playback
    this.stop();
    
    // Resume from new position
    const remainingText = this.currentText.substring(newPosition);
    if (remainingText.trim()) {
      this.currentPosition = newPosition;
      await this.read(remainingText, {
        voiceId: this.currentVoiceId,
        speed: this.playbackSpeed,
        volume: this.volume
      });
    }
  }

  /**
   * Set playback speed
   */
  setSpeed(speed) {
    this.playbackSpeed = Math.max(0.5, Math.min(2.0, speed));
    
    if (this.currentProvider === 'browser' && this.currentUtterance) {
      this.currentUtterance.rate = this.playbackSpeed;
    } else if (this.currentAudio) {
      this.currentAudio.playbackRate = this.playbackSpeed;
    }
  }

  /**
   * Set volume
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    
    if (this.currentProvider === 'browser' && this.currentUtterance) {
      this.currentUtterance.volume = this.volume;
    } else if (this.currentAudio) {
      this.currentAudio.volume = this.volume;
    }
  }

  /**
   * Set voice for character or default
   */
  async setVoice(voiceId, characterId = null) {
    // Store voice preference
    try {
      if (characterId) {
        await db.update('voicePreferences', {
          id: `voice_${characterId}`,
          characterId,
          voiceId,
          provider: this.currentProvider,
          updatedAt: Date.now()
        });
      } else {
        // Default voice for project
        const storyProfile = await db.get('storyProfile', 'default');
        if (storyProfile) {
          storyProfile.defaultVoice = voiceId;
          storyProfile.ttsProvider = this.currentProvider;
          await db.update('storyProfile', storyProfile);
        }
      }
    } catch (error) {
      console.warn('Failed to save voice preference:', error);
    }
  }

  /**
   * Get voice for character
   */
  async getVoiceForCharacter(characterId) {
    try {
      const preference = await db.get('voicePreferences', `voice_${characterId}`);
      return preference?.voiceId || null;
    } catch (error) {
      return null;
    }
  }
}

export default new TextToSpeechService();
