import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Key, Database, Trash2, X, Save, Eye, EyeOff, Image as ImageIcon, Sparkles, RefreshCw, FileArchive, FileText, Volume2, Shield } from 'lucide-react';
import aiService from '../services/aiService';
import db from '../services/database';
import imageGenerationService from '../../services/imageGenerationService';
import contextEngine from '../services/contextEngine';
import BackupManager from './BackupManager';
import StyleReferenceManager from './StyleReferenceManager';
import textToSpeechService from '../services/textToSpeechService';
import CanonSettingsPanel from './CanonSettingsPanel';

/**
 * Settings Panel - API key management, backup settings, UI preferences, data management
 */
const Settings = ({ onClose, onRerunOnboarding }) => {
  const [storyProfileExists, setStoryProfileExists] = useState(false);
  const [showCanonSettings, setShowCanonSettings] = useState(false);

  useEffect(() => {
    checkStoryProfile();
  }, []);

  const checkStoryProfile = async () => {
    const profile = await contextEngine.getStoryProfile();
    setStoryProfileExists(!!profile);
  };

  const resetOnboarding = async () => {
    if (!window.confirm('This will clear your story profile and restart the onboarding wizard. Continue?')) {
      return;
    }
    try {
      await db.clear('storyProfile');
      await db.clear('onboardingProgress');
      onRerunOnboarding?.();
      onClose();
    } catch (error) {
      alert('Error resetting onboarding: ' + error.message);
    }
  };
  const [apiKeys, setApiKeys] = useState({
    gemini: '',
    openai: '',
    anthropic: '',
    groq: '',
    huggingface: '',
    elevenlabs: ''
  });
  const [showKeys, setShowKeys] = useState({
    gemini: false,
    openai: false,
    anthropic: false,
    groq: false,
    huggingface: false,
    elevenlabs: false
  });
  const [preferredProvider, setPreferredProvider] = useState('auto');
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [backupFrequency, setBackupFrequency] = useState('daily');
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [voiceProvider, setVoiceProvider] = useState('auto');

  useEffect(() => {
    loadSettings();
    loadVoices();
  }, []);

  const loadVoices = async () => {
    try {
      const voices = await textToSpeechService.getAvailableVoices();
      setAvailableVoices(voices);
      
      // Load saved voice preference
      const savedVoice = localStorage.getItem('tts_selected_voice');
      const savedProvider = localStorage.getItem('tts_provider') || 'auto';
      if (savedVoice) {
        setSelectedVoice(savedVoice);
      }
      setVoiceProvider(savedProvider);
    } catch (error) {
      console.error('Error loading voices:', error);
    }
  };

  const loadSettings = () => {
    // Load API keys from runtime memory (aiService) - NOT from localStorage
    // Security: Keys are kept in-memory only, never persisted to localStorage
    const runtimeKeys = aiService.getRuntimeKeys ? aiService.getRuntimeKeys() : {};

    // Migration: if legacy localStorage keys exist, migrate to runtime and clear
    const providers = ['gemini', 'openai', 'anthropic', 'groq', 'huggingface', 'elevenlabs'];
    providers.forEach(p => {
      const legacyKey = localStorage.getItem(`ai_${p}_key`);
      if (legacyKey) {
        runtimeKeys[p] = legacyKey;
        aiService.setApiKey(p, legacyKey);
        localStorage.removeItem(`ai_${p}_key`); // Clear from localStorage
        console.info(`[Security] Migrated ${p} key from localStorage to runtime memory`);
      }
    });

    setApiKeys({
      gemini: runtimeKeys.gemini || '',
      openai: runtimeKeys.openai || '',
      anthropic: runtimeKeys.anthropic || '',
      groq: runtimeKeys.groq || '',
      huggingface: runtimeKeys.huggingface || ''
    });

    // Load preferred provider
    const preferred = localStorage.getItem('ai_preferred_provider') || 'auto';
    setPreferredProvider(preferred);

    // Load backup settings
    const autoBackup = localStorage.getItem('autoBackupEnabled');
    if (autoBackup !== null) {
      setAutoBackupEnabled(autoBackup === 'true');
    }

    const frequency = localStorage.getItem('backupFrequency') || 'daily';
    setBackupFrequency(frequency);
  };

  const saveApiKey = (provider, key) => {
    if (provider === 'openai') {
      imageGenerationService.setApiKey(key);
    }
    // Security: Store in runtime memory only — NOT in localStorage
    aiService.setApiKey(provider, key);
    setApiKeys(prev => ({ ...prev, [provider]: key }));
    alert(`${provider.toUpperCase()} API key saved (session-only — will need re-entry after reload).`);
  };

  const savePreferredProvider = (provider) => {
    aiService.setPreferredProvider(provider);
    setPreferredProvider(provider);
    alert(`Preferred AI provider set to: ${provider === 'auto' ? 'Auto (with fallback)' : provider.toUpperCase()}`);
  };

  const clearDatabase = async () => {
    if (!window.confirm('This will delete ALL data. This cannot be undone. Continue?')) {
      return;
    }

    try {
      const storeNames = ['meta', 'statRegistry', 'skillBank', 'itemBank', 'actors', 'books', 'relationships', 'wiki', 'skillTrees', 'snapshots', 'storyMap'];
      for (const storeName of storeNames) {
        await db.clear(storeName);
      }
      alert('Database cleared! Please refresh the page.');
      window.location.reload();
    } catch (error) {
      alert(`Error clearing database: ${error.message}`);
    }
  };

  const exportAllData = async () => {
    try {
      const data = await db.exportData();
      const dataStr = JSON.stringify(data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `claimwise-export-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
      alert('Data exported successfully!');
    } catch (error) {
      alert(`Export Error: ${error.message}`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900 border-b border-green-500/30 p-4 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center">
            <SettingsIcon className="mr-3 text-green-500" />
            SETTINGS
          </h2>
          <p className="text-sm text-slate-400 mt-1">API keys, backup settings, and data management</p>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* AI Provider Selection */}
          <div className="bg-slate-900 rounded-lg p-6 border border-slate-800">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <SettingsIcon className="mr-2 text-green-500" />
              AI PROVIDER SELECTION
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-2">
                  PREFERRED AI PROVIDER
                  <span className="text-xs text-amber-400 ml-2">(Auto = tries free providers first, then falls back)</span>
                </label>
                <select
                  value={preferredProvider}
                  onChange={(e) => savePreferredProvider(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded"
                >
                  <option value="auto">🔄 Auto (Free First, Then Fallback)</option>
                  <option value="groq">⚡ Groq (FREE - 14,400 req/day)</option>
                  <option value="huggingface">🤗 Hugging Face (FREE - No Key Required)</option>
                  <option value="gemini">🔷 Gemini (Paid)</option>
                  <option value="openai">🤖 OpenAI (Paid)</option>
                  <option value="anthropic">🧠 Anthropic Claude (Paid)</option>
                </select>
                <p className="text-xs text-slate-500 mt-2">
                  {preferredProvider === 'auto' 
                    ? 'Will automatically try free providers first, then fall back to paid providers if quota exceeded.'
                    : `Using ${preferredProvider.toUpperCase()} as primary provider. Will fallback to others if quota exceeded.`
                  }
                </p>
              </div>
            </div>
          </div>

          {/* API Keys Section */}
          <div className="bg-slate-900 rounded-lg p-6 border border-slate-800">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <Key className="mr-2 text-yellow-500" />
              AI API KEYS
            </h3>
            <div className="space-y-4">
              {/* Gemini */}
              <div>
                <label className="text-xs text-slate-400 block mb-2">GEMINI API KEY</label>
                <div className="flex gap-2">
                  <input
                    type={showKeys.gemini ? 'text' : 'password'}
                    value={apiKeys.gemini}
                    onChange={(e) => setApiKeys(prev => ({ ...prev, gemini: e.target.value }))}
                    placeholder="Enter Gemini API key"
                    className="flex-1 bg-slate-950 border border-slate-700 text-white p-2 rounded"
                  />
                  <button
                    onClick={() => setShowKeys(prev => ({ ...prev, gemini: !prev.gemini }))}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-3 rounded"
                  >
                    {showKeys.gemini ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => saveApiKey('gemini', apiKeys.gemini)}
                    className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold px-4 py-2 rounded"
                  >
                    SAVE
                  </button>
                </div>
              </div>

              {/* OpenAI */}
              <div>
                <label className="text-xs text-slate-400 block mb-2 flex items-center gap-2">
                  <span>OPENAI API KEY</span>
                  <span className="text-xs text-purple-400 flex items-center gap-1">
                    <ImageIcon className="w-3 h-3" />
                    (For DALL-E Image Generation)
                  </span>
                </label>
                <div className="flex gap-2">
                  <input
                    type={showKeys.openai ? 'text' : 'password'}
                    value={apiKeys.openai}
                    onChange={(e) => setApiKeys(prev => ({ ...prev, openai: e.target.value }))}
                    placeholder="Enter OpenAI API key for DALL-E"
                    className="flex-1 bg-slate-950 border border-slate-700 text-white p-2 rounded"
                  />
                  <button
                    onClick={() => setShowKeys(prev => ({ ...prev, openai: !prev.openai }))}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-3 rounded"
                  >
                    {showKeys.openai ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => saveApiKey('openai', apiKeys.openai)}
                    className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold px-4 py-2 rounded"
                  >
                    SAVE
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">Required for AI-generated item images, skill symbols, and book/chapter symbols</p>
              </div>

              {/* Anthropic */}
              <div>
                <label className="text-xs text-slate-400 block mb-2">ANTHROPIC API KEY</label>
                <div className="flex gap-2">
                  <input
                    type={showKeys.anthropic ? 'text' : 'password'}
                    value={apiKeys.anthropic}
                    onChange={(e) => setApiKeys(prev => ({ ...prev, anthropic: e.target.value }))}
                    placeholder="Enter Anthropic API key"
                    className="flex-1 bg-slate-950 border border-slate-700 text-white p-2 rounded"
                  />
                  <button
                    onClick={() => setShowKeys(prev => ({ ...prev, anthropic: !prev.anthropic }))}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-3 rounded"
                  >
                    {showKeys.anthropic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => saveApiKey('anthropic', apiKeys.anthropic)}
                    className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold px-4 py-2 rounded"
                  >
                    SAVE
                  </button>
                </div>
              </div>

              {/* Groq - FREE */}
              <div>
                <label className="text-xs text-slate-400 block mb-2 flex items-center gap-2">
                  <span>GROQ API KEY</span>
                  <span className="text-xs text-green-400 bg-green-900/30 px-2 py-0.5 rounded">FREE - 14,400 req/day</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type={showKeys.groq ? 'text' : 'password'}
                    value={apiKeys.groq}
                    onChange={(e) => setApiKeys(prev => ({ ...prev, groq: e.target.value }))}
                    placeholder="Get free key at https://console.groq.com/"
                    className="flex-1 bg-slate-950 border border-slate-700 text-white p-2 rounded"
                  />
                  <button
                    onClick={() => setShowKeys(prev => ({ ...prev, groq: !prev.groq }))}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-3 rounded"
                  >
                    {showKeys.groq ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => saveApiKey('groq', apiKeys.groq)}
                    className="bg-green-600 hover:bg-green-500 text-white font-bold px-4 py-2 rounded"
                  >
                    SAVE
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Very fast inference. Get a free API key at <a href="https://console.groq.com/" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline">console.groq.com</a>
                </p>
              </div>

              {/* Hugging Face - FREE */}
              <div>
                <label className="text-xs text-slate-400 block mb-2 flex items-center gap-2">
                  <span>HUGGING FACE API KEY</span>
                  <span className="text-xs text-green-400 bg-green-900/30 px-2 py-0.5 rounded">FREE - Optional</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type={showKeys.huggingface ? 'text' : 'password'}
                    value={apiKeys.huggingface}
                    onChange={(e) => setApiKeys(prev => ({ ...prev, huggingface: e.target.value }))}
                    placeholder="Optional - works without key, but better with one"
                    className="flex-1 bg-slate-950 border border-slate-700 text-white p-2 rounded"
                  />
                  <button
                    onClick={() => setShowKeys(prev => ({ ...prev, huggingface: !prev.huggingface }))}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-3 rounded"
                  >
                    {showKeys.huggingface ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => saveApiKey('huggingface', apiKeys.huggingface)}
                    className="bg-green-600 hover:bg-green-500 text-white font-bold px-4 py-2 rounded"
                  >
                    SAVE
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Works without a key, but better performance with one. Get free key at <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline">huggingface.co</a>
                </p>
              </div>
            </div>
          </div>

          {/* Backup Settings */}
          <div className="bg-slate-900 rounded-lg p-6 border border-slate-800">
            <h3 className="text-xl font-bold text-white mb-4">BACKUP SETTINGS</h3>
            <div className="space-y-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={autoBackupEnabled}
                  onChange={(e) => {
                    setAutoBackupEnabled(e.target.checked);
                    localStorage.setItem('autoBackupEnabled', e.target.checked.toString());
                  }}
                  className="w-5 h-5"
                />
                <span className="text-white">Enable automatic backups</span>
              </label>
              {autoBackupEnabled && (
                <div>
                  <label className="text-xs text-slate-400 block mb-2">BACKUP FREQUENCY</label>
                  <select
                    value={backupFrequency}
                    onChange={(e) => {
                      setBackupFrequency(e.target.value);
                      localStorage.setItem('backupFrequency', e.target.value);
                    }}
                    className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="manual">Manual Only</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Project Backup & Management */}
          <div className="bg-slate-900 rounded-lg p-6 border border-slate-800">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <FileArchive className="mr-2 text-amber-500" />
              PROJECT BACKUP & MANAGEMENT
            </h3>
            <BackupManager onProjectChange={() => window.location.reload()} />
          </div>

          {/* Story Intelligence Settings */}
          <div className="bg-slate-900 rounded-lg p-6 border border-slate-800">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <Sparkles className="mr-2 text-amber-500" />
              STORY INTELLIGENCE
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <div>
                  <p className="text-white font-medium">Story Profile</p>
                  <p className="text-xs text-slate-400">
                    {storyProfileExists 
                      ? 'Your writing style and story context are configured'
                      : 'No story profile configured yet'
                    }
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  storyProfileExists 
                    ? 'bg-green-900/50 text-green-400' 
                    : 'bg-amber-900/50 text-amber-400'
                }`}>
                  {storyProfileExists ? 'Active' : 'Not Set'}
                </span>
              </div>
              
              <button
                onClick={() => onRerunOnboarding?.()}
                className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                {storyProfileExists ? 'UPDATE STORY PROFILE' : 'RUN SETUP WIZARD'}
              </button>
              
              {storyProfileExists && (
                <button
                  onClick={resetOnboarding}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  RESET & START FRESH
                </button>
              )}
              
              <p className="text-xs text-slate-500">
                The setup wizard configures your writing style, character voices, and story context for AI assistance.
              </p>
            </div>
          </div>

          {/* Style Reference Manager */}
          <div className="bg-slate-900 rounded-lg p-6 border border-slate-800">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <FileText className="mr-2 text-purple-500" />
              STYLE REFERENCE MANAGER
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Add writing examples, style guides, or reference material to improve AI style matching. 
              The AI will analyze these documents to better understand your writing voice.
            </p>
            <StyleReferenceManager compact={true} />
          </div>

          {/* Text-to-Speech Settings */}
          <div className="bg-slate-900 rounded-lg p-6 border border-slate-800">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <Sparkles className="mr-2 text-blue-500" />
              TEXT-TO-SPEECH (READ ALOUD)
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Configure voice settings for the read-aloud feature. Premium voices require API keys.
            </p>
            
            <div className="space-y-4">
              {/* ElevenLabs API Key */}
              <div>
                <label className="text-xs text-slate-400 block mb-2 flex items-center gap-2">
                  <Key className="w-4 h-4" /> ElevenLabs API Key
                  <span className="text-xs text-amber-400 bg-amber-900/30 px-2 py-0.5 rounded">Premium - Optional</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type={showKeys.elevenlabs ? 'text' : 'password'}
                    value={apiKeys.elevenlabs}
                    onChange={(e) => setApiKeys(prev => ({ ...prev, elevenlabs: e.target.value }))}
                    placeholder="For premium British voices with natural cadence"
                    className="flex-1 bg-slate-950 border border-slate-700 text-white p-2 rounded"
                  />
                  <button
                    onClick={() => setShowKeys(prev => ({ ...prev, elevenlabs: !prev.elevenlabs }))}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-400"
                  >
                    {showKeys.elevenlabs ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => saveApiKey('elevenlabs', apiKeys.elevenlabs)}
                    className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-4 py-2 rounded"
                  >
                    SAVE
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Premium voices with natural cadence and character voice support. Falls back to browser TTS if not set.
                </p>
              </div>

              {/* Voice Selection */}
              <div className="pt-4 border-t border-slate-700">
                <label className="text-sm text-slate-300 block mb-2 flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  Default Voice
                </label>
                <div className="space-y-3">
                  {/* Provider Selection */}
                  <div>
                    <label className="text-xs text-slate-400 block mb-2">Voice Provider</label>
                    <select
                      value={voiceProvider}
                      onChange={(e) => {
                        setVoiceProvider(e.target.value);
                        localStorage.setItem('tts_provider', e.target.value);
                        loadVoices(); // Reload voices for new provider
                      }}
                      className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded"
                    >
                      <option value="auto">Auto (Best Available)</option>
                      <option value="browser">Browser (Free)</option>
                      <option value="openai">OpenAI (Premium - Requires API Key)</option>
                      <option value="elevenlabs">ElevenLabs (Premium - Requires API Key)</option>
                    </select>
                  </div>

                  {/* Voice Selection */}
                  {availableVoices.length > 0 && (
                    <div>
                      <label className="text-xs text-slate-400 block mb-2">Select Voice</label>
                      <select
                        value={selectedVoice || ''}
                        onChange={(e) => {
                          setSelectedVoice(e.target.value);
                          localStorage.setItem('tts_selected_voice', e.target.value);
                          // Save voice preference to database
                          db.update('voicePreferences', {
                            id: 'default',
                            voiceId: e.target.value,
                            provider: voiceProvider,
                            updatedAt: Date.now()
                          }).catch(() => {
                            // Create if doesn't exist
                            db.add('voicePreferences', {
                              id: 'default',
                              voiceId: e.target.value,
                              provider: voiceProvider,
                              updatedAt: Date.now()
                            });
                          });
                        }}
                        className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded"
                      >
                        <option value="">Default (Auto-select)</option>
                        {availableVoices.map((voice) => (
                          <option key={voice.id} value={voice.id}>
                            {voice.name} {voice.accent ? `(${voice.accent})` : ''} {voice.gender ? `- ${voice.gender}` : ''} {voice.provider === 'browser' ? '(Free)' : '(Premium)'}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-slate-500 mt-1">
                        {availableVoices.length} voice{availableVoices.length !== 1 ? 's' : ''} available
                      </p>
                    </div>
                  )}

                  {/* Test Voice Button */}
                  <button
                    onClick={async () => {
                      if (selectedVoice) {
                        try {
                          await textToSpeechService.setVoice(selectedVoice, voiceProvider);
                          await textToSpeechService.readText('This is a test of the selected voice. How does it sound?', {
                            speed: 1.0,
                            volume: 1.0
                          });
                        } catch (error) {
                          alert('Error testing voice: ' + error.message);
                        }
                      } else {
                        alert('Please select a voice first');
                      }
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-medium flex items-center justify-center gap-2"
                  >
                    <Volume2 className="w-4 h-4" />
                    Test Voice
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-700">
                <p className="text-xs text-slate-500">
                  💡 <strong>Tip:</strong> The read-aloud feature automatically selects the best available voice provider.
                  Browser voices are free but limited. Premium voices (ElevenLabs/OpenAI) provide better quality and character differentiation.
                </p>
              </div>
            </div>

            {/* Canon Control Settings */}
            <div className="bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
              <button
                onClick={() => setShowCanonSettings(!showCanonSettings)}
                className="w-full p-4 flex items-center justify-between hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-red-400" />
                  <div className="text-left">
                    <div className="text-sm font-bold text-white">Canon Control</div>
                    <div className="text-xs text-slate-400">Confidence thresholds, auto-apply, extraction policies</div>
                  </div>
                </div>
                <span className="text-slate-500 text-xs">{showCanonSettings ? '▲' : '▼'}</span>
              </button>
              {showCanonSettings && (
                <div className="border-t border-slate-700">
                  <CanonSettingsPanel onClose={() => setShowCanonSettings(false)} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

