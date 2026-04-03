/**
 * Sync Service
 * Handles export/import of app data for mobile/desktop sync
 * Supports: JSON file export, QR code, cloud storage
 */

import db from '../src/services/database';

class SyncService {
  /**
   * Export all app data to JSON
   */
  async exportToJSON() {
    try {
      const data = {
        version: '1.0',
        timestamp: Date.now(),
        actors: await db.getAll('actors'),
        itemBank: await db.getAll('itemBank'),
        skillBank: await db.getAll('skillBank'),
        statRegistry: await db.getAll('statRegistry'),
        books: await db.getAll('books'),
        relationships: await db.getAll('relationships'),
        wiki: await db.getAll('wiki'),
        skillTrees: await db.getAll('skillTrees'),
        storyMap: await db.getAll('storyMap'),
        snapshots: await db.getAll('snapshots'),
        documents: await db.getAll('documents'),
        documentSuggestions: await db.getAll('documentSuggestions'),
        backups: await db.getAll('backups')
      };
      
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('Export error:', error);
      throw new Error('Failed to export data: ' + error.message);
    }
  }

  /**
   * Download JSON file
   */
  async downloadJSON(filename = `claimwise-backup-${Date.now()}.json`) {
    try {
      const jsonData = await this.exportToJSON();
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return { success: true };
    } catch (error) {
      console.error('Download error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Import data from JSON
   */
  async importFromJSON(jsonString, options = {}) {
    try {
      const data = JSON.parse(jsonString);
      
      // Validate data structure
      if (!data.version || !data.timestamp) {
        throw new Error('Invalid data format');
      }

      const {
        mergeStrategy = 'merge', // 'overwrite', 'merge', 'skip'
        selectiveImport = false,
        selectedEntities = []
      } = options;

      const results = {
        imported: {},
        skipped: {},
        errors: {}
      };

      // Import each entity type
      const entityTypes = [
        'actors', 'itemBank', 'skillBank', 'statRegistry', 
        'books', 'relationships', 'wiki', 'skillTrees', 
        'storyMap', 'snapshots', 'documents', 'documentSuggestions'
      ];

      for (const entityType of entityTypes) {
        if (selectiveImport && !selectedEntities.includes(entityType)) {
          results.skipped[entityType] = 'Not selected for import';
          continue;
        }

        if (!data[entityType] || !Array.isArray(data[entityType])) {
          continue;
        }

        try {
          if (mergeStrategy === 'overwrite') {
            // Clear existing and import all
            const existing = await db.getAll(entityType);
            for (const item of existing) {
              await db.delete(entityType, item.id);
            }
            for (const item of data[entityType]) {
              await db.add(entityType, item);
            }
            results.imported[entityType] = data[entityType].length;
          } else if (mergeStrategy === 'merge') {
            // Merge: update existing, add new
            let added = 0;
            let updated = 0;
            for (const item of data[entityType]) {
              try {
                const existing = await db.get(entityType, item.id);
                if (existing) {
                  await db.update(entityType, item);
                  updated++;
                } else {
                  await db.add(entityType, item);
                  added++;
                }
              } catch (err) {
                // Item might not exist, try adding
                try {
                  await db.add(entityType, item);
                  added++;
                } catch (addErr) {
                  console.error(`Failed to import ${entityType} item:`, item.id, addErr);
                }
              }
            }
            results.imported[entityType] = { added, updated };
          } else {
            // Skip: only add if doesn't exist
            let added = 0;
            for (const item of data[entityType]) {
              try {
                const existing = await db.get(entityType, item.id);
                if (!existing) {
                  await db.add(entityType, item);
                  added++;
                }
              } catch (err) {
                // Item doesn't exist, add it
                try {
                  await db.add(entityType, item);
                  added++;
                } catch (addErr) {
                  console.error(`Failed to import ${entityType} item:`, item.id, addErr);
                }
              }
            }
            results.imported[entityType] = { added };
          }
        } catch (error) {
          results.errors[entityType] = error.message;
        }
      }

      return { success: true, results };
    } catch (error) {
      console.error('Import error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Import from file
   */
  async importFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const result = await this.importFromJSON(event.target.result);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  }

  /**
   * Generate QR code data (returns data URL)
   */
  async generateQRCode() {
    try {
      // For large datasets, we'll need to chunk or compress
      const jsonData = await this.exportToJSON();
      
      // Check size - QR codes have limits (~3KB for high error correction)
      if (jsonData.length > 2000) {
        // Compress or chunk the data
        // For now, return a URL that can be used to download
        const compressed = await this.compressData(jsonData);
        return this.generateQRCodeFromData(compressed);
      }
      
      return this.generateQRCodeFromData(jsonData);
    } catch (error) {
      console.error('QR code generation error:', error);
      throw new Error('Failed to generate QR code: ' + error.message);
    }
  }

  /**
   * Compress data using simple encoding
   */
  async compressData(data) {
    // Simple base64 encoding (in production, use proper compression)
    return btoa(unescape(encodeURIComponent(data)));
  }

  /**
   * Generate QR code from data (requires qrcode library)
   */
  async generateQRCodeFromData(data) {
    try {
      // Dynamic import of qrcode
      const QRCode = await import('qrcode');
      const dataUrl = await QRCode.default.toDataURL(data, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 400
      });
      return dataUrl;
    } catch (error) {
      // Fallback: return a download link instead
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      return { type: 'download', url, data };
    }
  }

  /**
   * Scan QR code (requires camera access)
   */
  async scanQRCode() {
    // This would use a QR code scanner library
    // For now, return a placeholder
    return new Promise((resolve, reject) => {
      // In production, use: npm install html5-qrcode
      reject(new Error('QR code scanning not yet implemented. Please use file import.'));
    });
  }

  /**
   * Export to cloud storage
   */
  async exportToCloud(provider, credentials) {
    try {
      const jsonData = await this.exportToJSON();
      
      switch (provider) {
        case 'google-drive':
          return await this.exportToGoogleDrive(jsonData, credentials);
        case 'dropbox':
          return await this.exportToDropbox(jsonData, credentials);
        case 'onedrive':
          return await this.exportToOneDrive(jsonData, credentials);
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
    } catch (error) {
      console.error('Cloud export error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Import from cloud storage
   */
  async importFromCloud(provider, credentials) {
    try {
      let jsonData;
      
      switch (provider) {
        case 'google-drive':
          jsonData = await this.importFromGoogleDrive(credentials);
          break;
        case 'dropbox':
          jsonData = await this.importFromDropbox(credentials);
          break;
        case 'onedrive':
          jsonData = await this.importFromOneDrive(credentials);
          break;
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
      
      return await this.importFromJSON(jsonData);
    } catch (error) {
      console.error('Cloud import error:', error);
      return { success: false, error: error.message };
    }
  }

  // Placeholder methods for cloud providers
  async exportToGoogleDrive(data, credentials) {
    throw new Error('Google Drive integration not yet implemented');
  }

  async importFromGoogleDrive(credentials) {
    throw new Error('Google Drive integration not yet implemented');
  }

  async exportToDropbox(data, credentials) {
    throw new Error('Dropbox integration not yet implemented');
  }

  async importFromDropbox(credentials) {
    throw new Error('Dropbox integration not yet implemented');
  }

  async exportToOneDrive(data, credentials) {
    throw new Error('OneDrive integration not yet implemented');
  }

  async importFromOneDrive(credentials) {
    throw new Error('OneDrive integration not yet implemented');
  }

  /**
   * Compare local and remote data
   */
  async compareData(localData, remoteData) {
    const differences = {
      localOnly: {},
      remoteOnly: {},
      conflicts: {}
    };

    const entityTypes = [
      'actors', 'itemBank', 'skillBank', 'statRegistry',
      'books', 'relationships', 'wiki', 'skillTrees', 'storyMap'
    ];

    for (const entityType of entityTypes) {
      const local = localData[entityType] || [];
      const remote = remoteData[entityType] || [];
      
      const localIds = new Set(local.map(item => item.id));
      const remoteIds = new Set(remote.map(item => item.id));

      // Find items only in local
      differences.localOnly[entityType] = local.filter(item => !remoteIds.has(item.id));
      
      // Find items only in remote
      differences.remoteOnly[entityType] = remote.filter(item => !localIds.has(item.id));

      // Find conflicts (same ID, different content)
      const localMap = new Map(local.map(item => [item.id, item]));
      const remoteMap = new Map(remote.map(item => [item.id, item]));
      
      differences.conflicts[entityType] = [];
      for (const [id, localItem] of localMap) {
        if (remoteMap.has(id)) {
          const remoteItem = remoteMap.get(id);
          if (JSON.stringify(localItem) !== JSON.stringify(remoteItem)) {
            differences.conflicts[entityType].push({
              id,
              local: localItem,
              remote: remoteItem
            });
          }
        }
      }
    }

    return differences;
  }
}

const syncService = new SyncService();
export default syncService;

