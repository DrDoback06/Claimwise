/**
 * Cloud Sync Service
 * Syncs data across devices using a simple cloud storage solution
 * Supports: Firebase, Local Network Sync, or Custom API
 */

import db from './database';

class CloudSyncService {
  constructor() {
    this.syncEnabled = false;
    this.syncProvider = null; // 'firebase' | 'local' | 'custom'
    this.syncConfig = {};
    this.lastSyncTime = null;
    this.syncInterval = null;
  }

  /**
   * Initialize sync with provider
   */
  async init(provider, config) {
    this.syncProvider = provider;
    this.syncConfig = config;
    this.syncEnabled = true;
    
    // Load last sync time
    this.lastSyncTime = localStorage.getItem('lastCloudSync') 
      ? parseInt(localStorage.getItem('lastCloudSync')) 
      : null;

    // Start auto-sync if enabled
    if (config.autoSync) {
      this.startAutoSync(config.syncInterval || 30000); // Default 30 seconds
    }
  }

  /**
   * Start automatic syncing
   */
  startAutoSync(interval = 30000) {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    this.syncInterval = setInterval(() => {
      this.sync();
    }, interval);
  }

  /**
   * Stop automatic syncing
   */
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Sync data to cloud
   */
  async sync() {
    if (!this.syncEnabled || !this.syncProvider) {
      return { success: false, error: 'Sync not initialized' };
    }

    try {
      // Get all data from local database
      const data = {
        actors: await db.getAll('actors'),
        itemBank: await db.getAll('itemBank'),
        skillBank: await db.getAll('skillBank'),
        statRegistry: await db.getAll('statRegistry'),
        books: await db.getAll('books'),
        relationships: await db.getAll('relationships'),
        wiki: await db.getAll('wiki'),
        skillTrees: await db.getAll('skillTrees'),
        storyMap: await db.getAll('storyMap'),
        timestamp: Date.now()
      };

      // Sync based on provider
      let result;
      switch (this.syncProvider) {
        case 'firebase':
          result = await this.syncToFirebase(data);
          break;
        case 'local':
          result = await this.syncToLocalNetwork(data);
          break;
        case 'custom':
          result = await this.syncToCustomAPI(data);
          break;
        default:
          throw new Error(`Unknown sync provider: ${this.syncProvider}`);
      }

      if (result.success) {
        this.lastSyncTime = Date.now();
        localStorage.setItem('lastCloudSync', this.lastSyncTime.toString());
        return { success: true, timestamp: this.lastSyncTime };
      }

      return result;
    } catch (error) {
      console.error('Sync error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sync to Firebase
   */
  async syncToFirebase(data) {
    // Firebase implementation would go here
    // For now, return a placeholder
    return { success: false, error: 'Firebase sync not implemented. Configure Firebase in Settings.' };
  }

  /**
   * Sync to local network (using WebRTC or HTTP server)
   */
  async syncToLocalNetwork(data) {
    const syncUrl = this.syncConfig.url || 'http://localhost:3001/sync';
    
    try {
      const response = await fetch(syncUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data,
          deviceId: this.syncConfig.deviceId || 'unknown',
          timestamp: Date.now()
        })
      });

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.statusText}`);
      }

      const result = await response.json();
      return { success: true, result };
    } catch (error) {
      // If local network sync fails, try to use IndexedDB as fallback
      console.warn('Local network sync failed, using IndexedDB fallback:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sync to custom API
   */
  async syncToCustomAPI(data) {
    const apiUrl = this.syncConfig.apiUrl;
    const apiKey = this.syncConfig.apiKey;

    if (!apiUrl) {
      return { success: false, error: 'API URL not configured' };
    }

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': apiKey ? `Bearer ${apiKey}` : '',
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`API sync failed: ${response.statusText}`);
      }

      const result = await response.json();
      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Pull data from cloud
   */
  async pull() {
    if (!this.syncEnabled || !this.syncProvider) {
      return { success: false, error: 'Sync not initialized' };
    }

    try {
      let remoteData;
      switch (this.syncProvider) {
        case 'firebase':
          remoteData = await this.pullFromFirebase();
          break;
        case 'local':
          remoteData = await this.pullFromLocalNetwork();
          break;
        case 'custom':
          remoteData = await this.pullFromCustomAPI();
          break;
        default:
          throw new Error(`Unknown sync provider: ${this.syncProvider}`);
      }

      if (remoteData.success && remoteData.data) {
        // Merge with local data (remote takes precedence)
        await this.mergeData(remoteData.data);
        this.lastSyncTime = Date.now();
        localStorage.setItem('lastCloudSync', this.lastSyncTime.toString());
        return { success: true, data: remoteData.data };
      }

      return remoteData;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Pull from Firebase
   */
  async pullFromFirebase() {
    return { success: false, error: 'Firebase pull not implemented' };
  }

  /**
   * Pull from local network
   */
  async pullFromLocalNetwork() {
    const syncUrl = this.syncConfig.url || 'http://localhost:3001/sync';
    
    try {
      const response = await fetch(`${syncUrl}?deviceId=${this.syncConfig.deviceId || 'unknown'}`);
      
      if (!response.ok) {
        throw new Error(`Pull failed: ${response.statusText}`);
      }

      const result = await response.json();
      return { success: true, data: result.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Pull from custom API
   */
  async pullFromCustomAPI() {
    const apiUrl = this.syncConfig.apiUrl;
    const apiKey = this.syncConfig.apiKey;

    if (!apiUrl) {
      return { success: false, error: 'API URL not configured' };
    }

    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': apiKey ? `Bearer ${apiKey}` : '',
        }
      });

      if (!response.ok) {
        throw new Error(`API pull failed: ${response.statusText}`);
      }

      const result = await response.json();
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Merge remote data with local
   */
  async mergeData(remoteData) {
    // Merge each store
    if (remoteData.actors) {
      for (const actor of remoteData.actors) {
        await db.update('actors', actor);
      }
    }
    if (remoteData.itemBank) {
      for (const item of remoteData.itemBank) {
        await db.update('itemBank', item);
      }
    }
    if (remoteData.skillBank) {
      for (const skill of remoteData.skillBank) {
        await db.update('skillBank', skill);
      }
    }
    if (remoteData.statRegistry) {
      for (const stat of remoteData.statRegistry) {
        await db.update('statRegistry', stat);
      }
    }
    if (remoteData.books) {
      for (const book of remoteData.books) {
        await db.update('books', book);
      }
    }
    // Add other stores as needed
  }

  /**
   * Get sync status
   */
  getStatus() {
    return {
      enabled: this.syncEnabled,
      provider: this.syncProvider,
      lastSync: this.lastSyncTime,
      autoSync: !!this.syncInterval
    };
  }

  /**
   * Disable sync
   */
  disable() {
    this.syncEnabled = false;
    this.stopAutoSync();
  }
}

const cloudSyncService = new CloudSyncService();
export default cloudSyncService;

