/**
 * Backup Service - Export/Import project data
 * Saves all IndexedDB data to downloadable files with proper folder structure
 */

import db from './database';
import JSZip from 'jszip';

class BackupService {
  constructor() {
    this.version = '1.0';
  }

  /**
   * Export all project data to a downloadable ZIP file
   */
  async exportProject(projectName = 'story-backup') {
    try {
      console.log('[Backup] Starting export...');
      
      // Collect all data from IndexedDB
      const data = await this.collectAllData();
      
      // Create ZIP file with folder structure
      const zip = new JSZip();
      
      // Add manifest with metadata
      const manifest = {
        version: this.version,
        exportedAt: new Date().toISOString(),
        projectName: projectName,
        appVersion: '1.0.0',
        dataStores: Object.keys(data)
      };
      zip.file('manifest.json', JSON.stringify(manifest, null, 2));
      
      // Create folders and add data files
      const storyFolder = zip.folder('story');
      const charactersFolder = zip.folder('characters');
      const worldFolder = zip.folder('world');
      const progressFolder = zip.folder('progress');
      
      // Story data
      if (data.books?.length > 0) {
        storyFolder.file('books.json', JSON.stringify(data.books, null, 2));
      }
      if (data.meta?.length > 0) {
        storyFolder.file('meta.json', JSON.stringify(data.meta, null, 2));
      }
      if (data.storyProfile?.length > 0) {
        storyFolder.file('profile.json', JSON.stringify(data.storyProfile, null, 2));
      }
      if (data.styleEvolution?.length > 0) {
        storyFolder.file('style-evolution.json', JSON.stringify(data.styleEvolution, null, 2));
      }
      
      // Characters data
      if (data.actors?.length > 0) {
        charactersFolder.file('actors.json', JSON.stringify(data.actors, null, 2));
      }
      if (data.characterVoices?.length > 0) {
        charactersFolder.file('voices.json', JSON.stringify(data.characterVoices, null, 2));
      }
      if (data.relationships?.length > 0) {
        charactersFolder.file('relationships.json', JSON.stringify(data.relationships, null, 2));
      }
      
      // World data
      if (data.itemBank?.length > 0) {
        worldFolder.file('items.json', JSON.stringify(data.itemBank, null, 2));
      }
      if (data.skillBank?.length > 0) {
        worldFolder.file('skills.json', JSON.stringify(data.skillBank, null, 2));
      }
      if (data.statRegistry?.length > 0) {
        worldFolder.file('stats.json', JSON.stringify(data.statRegistry, null, 2));
      }
      if (data.wiki?.length > 0) {
        worldFolder.file('wiki.json', JSON.stringify(data.wiki, null, 2));
      }
      if (data.skillTrees?.length > 0) {
        worldFolder.file('skill-trees.json', JSON.stringify(data.skillTrees, null, 2));
      }
      
      // Progress data
      if (data.plotBeats?.length > 0) {
        progressFolder.file('plot-beats.json', JSON.stringify(data.plotBeats, null, 2));
      }
      if (data.onboardingProgress?.length > 0) {
        progressFolder.file('onboarding.json', JSON.stringify(data.onboardingProgress, null, 2));
      }
      if (data.aiCorrections?.length > 0) {
        progressFolder.file('ai-corrections.json', JSON.stringify(data.aiCorrections, null, 2));
      }
      
      // Generate ZIP and trigger download
      const blob = await zip.generateAsync({ type: 'blob' });
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `${projectName}_${timestamp}.zip`;
      
      this.downloadBlob(blob, filename);
      
      console.log('[Backup] Export complete:', filename);
      return { success: true, filename };
      
    } catch (error) {
      console.error('[Backup] Export failed:', error);
      throw error;
    }
  }

  /**
   * Import project data from a ZIP file
   */
  async importProject(file, clearExisting = true) {
    try {
      console.log('[Backup] Starting import...');
      
      const zip = await JSZip.loadAsync(file);
      
      // Read manifest
      const manifestFile = zip.file('manifest.json');
      if (!manifestFile) {
        throw new Error('Invalid backup file: missing manifest.json');
      }
      const manifest = JSON.parse(await manifestFile.async('string'));
      console.log('[Backup] Importing project:', manifest.projectName, 'from', manifest.exportedAt);
      
      // Clear existing data if requested
      if (clearExisting) {
        await this.clearAllData();
      }
      
      // Import story data
      await this.importFromFolder(zip, 'story/books.json', 'books');
      await this.importFromFolder(zip, 'story/meta.json', 'meta');
      await this.importFromFolder(zip, 'story/profile.json', 'storyProfile');
      await this.importFromFolder(zip, 'story/style-evolution.json', 'styleEvolution');
      
      // Import characters data
      await this.importFromFolder(zip, 'characters/actors.json', 'actors');
      await this.importFromFolder(zip, 'characters/voices.json', 'characterVoices');
      await this.importFromFolder(zip, 'characters/relationships.json', 'relationships');
      
      // Import world data
      await this.importFromFolder(zip, 'world/items.json', 'itemBank');
      await this.importFromFolder(zip, 'world/skills.json', 'skillBank');
      await this.importFromFolder(zip, 'world/stats.json', 'statRegistry');
      await this.importFromFolder(zip, 'world/wiki.json', 'wiki');
      await this.importFromFolder(zip, 'world/skill-trees.json', 'skillTrees');
      
      // Import progress data
      await this.importFromFolder(zip, 'progress/plot-beats.json', 'plotBeats');
      await this.importFromFolder(zip, 'progress/onboarding.json', 'onboardingProgress');
      await this.importFromFolder(zip, 'progress/ai-corrections.json', 'aiCorrections');
      
      console.log('[Backup] Import complete');
      return { success: true, manifest };
      
    } catch (error) {
      console.error('[Backup] Import failed:', error);
      throw error;
    }
  }

  /**
   * Clear all data and reset to fresh state (for new project)
   */
  async startNewProject() {
    try {
      console.log('[Backup] Starting new project - clearing all data...');
      
      await this.clearAllData();
      
      // Clear localStorage items related to the app
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.startsWith('panel_') ||
          key.startsWith('onboarding') ||
          key.startsWith('moodDefaults') ||
          key.startsWith('nav_') ||
          key.startsWith('ai_')
        )) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      console.log('[Backup] New project ready - app will show wizard on reload');
      return { success: true };
      
    } catch (error) {
      console.error('[Backup] Failed to start new project:', error);
      throw error;
    }
  }

  /**
   * Collect all data from IndexedDB stores
   */
  async collectAllData() {
    const stores = [
      'meta', 'statRegistry', 'skillBank', 'itemBank', 'actors', 'books',
      'relationships', 'wiki', 'skillTrees', 'plotBeats', 'characterVoices',
      'storyProfile', 'onboardingProgress', 'aiCorrections', 'styleEvolution'
    ];
    
    const data = {};
    
    for (const store of stores) {
      try {
        const items = await db.getAll(store);
        if (items && items.length > 0) {
          data[store] = items;
        }
      } catch (e) {
        // Store might not exist, skip it
        console.warn(`[Backup] Could not read store ${store}:`, e.message);
      }
    }
    
    return data;
  }

  /**
   * Clear all data from IndexedDB
   */
  async clearAllData() {
    const stores = [
      'meta', 'statRegistry', 'skillBank', 'itemBank', 'actors', 'books',
      'relationships', 'wiki', 'skillTrees', 'plotBeats', 'characterVoices',
      'storyProfile', 'onboardingProgress', 'aiCorrections', 'styleEvolution'
    ];
    
    for (const store of stores) {
      try {
        await db.clear(store);
      } catch (e) {
        console.warn(`[Backup] Could not clear store ${store}:`, e.message);
      }
    }
  }

  /**
   * Import data from a ZIP folder path to an IndexedDB store
   */
  async importFromFolder(zip, path, storeName) {
    const file = zip.file(path);
    if (!file) return;
    
    try {
      const content = await file.async('string');
      const items = JSON.parse(content);
      
      if (Array.isArray(items) && items.length > 0) {
        for (const item of items) {
          await db.update(storeName, item);
        }
        console.log(`[Backup] Imported ${items.length} items to ${storeName}`);
      }
    } catch (e) {
      console.warn(`[Backup] Failed to import ${path}:`, e.message);
    }
  }

  /**
   * Download a blob as a file
   */
  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Quick save to localStorage (for auto-save between sessions)
   */
  async quickSave() {
    try {
      const data = await this.collectAllData();
      const compressed = JSON.stringify(data);
      
      // Check size - localStorage has ~5MB limit
      if (compressed.length > 4 * 1024 * 1024) {
        console.warn('[Backup] Data too large for localStorage quick save');
        return { success: false, reason: 'Data too large' };
      }
      
      localStorage.setItem('quickSave', compressed);
      localStorage.setItem('quickSaveTime', new Date().toISOString());
      
      return { success: true };
    } catch (error) {
      console.error('[Backup] Quick save failed:', error);
      return { success: false, error };
    }
  }

  /**
   * Quick restore from localStorage
   */
  async quickRestore() {
    try {
      const saved = localStorage.getItem('quickSave');
      if (!saved) {
        return { success: false, reason: 'No quick save found' };
      }
      
      const data = JSON.parse(saved);
      await this.clearAllData();
      
      for (const [storeName, items] of Object.entries(data)) {
        if (Array.isArray(items)) {
          for (const item of items) {
            await db.update(storeName, item);
          }
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('[Backup] Quick restore failed:', error);
      return { success: false, error };
    }
  }

  /**
   * Check if a quick save exists
   */
  hasQuickSave() {
    return localStorage.getItem('quickSave') !== null;
  }

  /**
   * Get quick save timestamp
   */
  getQuickSaveTime() {
    return localStorage.getItem('quickSaveTime');
  }
}

const backupService = new BackupService();
export default backupService;
