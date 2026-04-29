/**
 * Voice-to-Text Service
 * Handles voice recording, transcription, and text expansion
 * 
 * Uses Web Speech API for speech recognition
 * Falls back to external APIs if needed
 */

import aiService from './aiService';
import toastService from './toastService';

class VoiceService {
  constructor() {
    this.isRecording = false;
    this.recognition = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.transcript = '';
    this.interimTranscript = '';
    this.listeners = [];
    this.isSupported = this.checkSupport();
  }

  /**
   * Check if speech recognition is supported
   */
  checkSupport() {
    return !!(
      window.SpeechRecognition || 
      window.webkitSpeechRecognition ||
      window.mozSpeechRecognition ||
      window.msSpeechRecognition
    );
  }

  /**
   * Subscribe to voice events
   */
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify listeners of events
   */
  notify(event, data) {
    this.listeners.forEach(listener => listener(event, data));
  }

  /**
   * Initialize speech recognition
   */
  initRecognition() {
    const SpeechRecognition = 
      window.SpeechRecognition || 
      window.webkitSpeechRecognition ||
      window.mozSpeechRecognition ||
      window.msSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('[Voice] Speech recognition not supported');
      return null;
    }

    const recognition = new SpeechRecognition();
    
    // Configuration
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-GB'; // UK English
    recognition.maxAlternatives = 1;

    // Event handlers
    recognition.onstart = () => {
      this.isRecording = true;
      this.notify('start', {});
      console.log('[Voice] Recording started');
    };

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript + ' ';
        } else {
          interim += transcript;
        }
      }

      if (final) {
        this.transcript += final;
        this.notify('transcript', { 
          text: this.transcript, 
          isFinal: true,
          newText: final
        });
      }

      this.interimTranscript = interim;
      if (interim) {
        this.notify('interim', { 
          text: this.transcript + interim,
          interim 
        });
      }
    };

    recognition.onerror = (event) => {
      console.error('[Voice] Recognition error:', event.error);
      this.notify('error', { error: event.error });
      
      if (event.error === 'no-speech') {
        // Restart if no speech detected
        if (this.isRecording) {
          recognition.stop();
          setTimeout(() => {
            if (this.isRecording) {
              recognition.start();
            }
          }, 100);
        }
      }
    };

    recognition.onend = () => {
      // Auto-restart if still recording
      if (this.isRecording) {
        try {
          recognition.start();
        } catch (e) {
          console.warn('[Voice] Restart failed:', e);
        }
      } else {
        this.notify('end', { transcript: this.transcript });
        console.log('[Voice] Recording ended');
      }
    };

    return recognition;
  }

  /**
   * Start recording
   */
  async startRecording() {
    if (!this.isSupported) {
      toastService.error('Speech recognition not supported in this browser');
      return false;
    }

    try {
      this.transcript = '';
      this.interimTranscript = '';
      this.recognition = this.initRecognition();
      
      if (this.recognition) {
        this.recognition.start();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[Voice] Start recording error:', error);
      toastService.error('Failed to start voice recording: ' + error.message);
      return false;
    }
  }

  /**
   * Stop recording
   */
  stopRecording() {
    this.isRecording = false;
    
    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }

    return this.transcript;
  }

  /**
   * Toggle recording
   */
  async toggleRecording() {
    if (this.isRecording) {
      return this.stopRecording();
    } else {
      await this.startRecording();
      return null;
    }
  }

  /**
   * Get current transcript
   */
  getTranscript() {
    return this.transcript + this.interimTranscript;
  }

  /**
   * Clear transcript
   */
  clearTranscript() {
    this.transcript = '';
    this.interimTranscript = '';
  }

  /**
   * Expand voice notes into full text using AI
   */
  async expandTranscript(transcript, context = {}) {
    if (!transcript || transcript.trim().length === 0) {
      return null;
    }

    try {
      const expanded = await aiService.expandVoiceNotes(transcript, context);
      return expanded;
    } catch (error) {
      console.error('[Voice] Expansion error:', error);
      toastService.error('Failed to expand voice notes: ' + error.message);
      return null;
    }
  }

  /**
   * Quick dictation mode - just transcribe without expansion
   */
  async quickDictate() {
    return new Promise((resolve) => {
      const unsubscribe = this.subscribe((event, data) => {
        if (event === 'end') {
          unsubscribe();
          resolve(data.transcript);
        }
      });

      this.startRecording();

      // Auto-stop after 30 seconds of silence would be handled by the recognition API
    });
  }

  /**
   * Check if currently recording
   */
  getIsRecording() {
    return this.isRecording;
  }
}

// Export singleton instance
const voiceService = new VoiceService();
export default voiceService;
