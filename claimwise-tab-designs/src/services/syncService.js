/**
 * Sync Service
 * Handles export/import of app data for mobile/desktop sync
 * Supports: JSON file export, QR code, cloud storage
 */

import db from './database';

class SyncService {
  async getSyncableStores() {
    const storeNames = await db.getStoreNames();
    const excluded = new Set(['meta']);
    return storeNames.filter(name => !excluded.has(name));
  }

  /**
   * Export all app data to JSON
   */
  async exportToJSON() {
    try {
      const stores = await this.getSyncableStores();
      const payload = {};
      for (const storeName of stores) {
        payload[storeName] = await db.getAll(storeName);
      }

      const data = {
        version: '2.0',
        schemaVersion: db.getSchemaVersion(),
        timestamp: Date.now(),
        stores: payload
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
      const entityTypes = Object.keys(data.stores || {}).length
        ? Object.keys(data.stores)
        : [
            'actors', 'itemBank', 'skillBank', 'statRegistry',
            'books', 'relationships', 'wiki', 'skillTrees',
            'documents', 'documentSuggestions'
          ];
      const availableStores = new Set(await db.getStoreNames());

      for (const entityType of entityTypes) {
        if (selectiveImport && !selectedEntities.includes(entityType)) {
          results.skipped[entityType] = 'Not selected for import';
          continue;
        }

        const entityRecords = data.stores?.[entityType] ?? data[entityType];
        if (!Array.isArray(entityRecords)) {
          continue;
        }
        if (!availableStores.has(entityType)) {
          results.skipped[entityType] = 'Store unavailable in current schema';
          continue;
        }

        try {
          if (mergeStrategy === 'overwrite') {
            // Clear existing and import all
            await db.clear(entityType);
            await db.batchUpsert(entityType, entityRecords, 100);
            results.imported[entityType] = entityRecords.length;
          } else if (mergeStrategy === 'merge') {
            // Merge: update existing, add new
            await db.batchUpsert(entityType, entityRecords, 100);
            results.imported[entityType] = { addedOrUpdated: entityRecords.length };
          } else {
            // Skip: only add if doesn't exist
            let added = 0;
            for (const item of entityRecords) {
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
            results.imported[entityType] = { added, skipped: entityRecords.length - added };
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

    const normalizeStores = (data) => data?.stores || data || {};
    const localStores = normalizeStores(localData);
    const remoteStores = normalizeStores(remoteData);
    const entityTypes = Array.from(
      new Set([
        ...Object.keys(localStores),
        ...Object.keys(remoteStores)
      ])
    );

    const stableId = (item, index) => {
      if (item?.id !== undefined && item?.id !== null && item?.id !== '') {
        return String(item.id);
      }
      return `__index_${index}_${JSON.stringify(item)}`;
    };

    for (const entityType of entityTypes) {
      const local = Array.isArray(localStores[entityType]) ? localStores[entityType] : [];
      const remote = Array.isArray(remoteStores[entityType]) ? remoteStores[entityType] : [];
      
      const localPairs = local.map((item, index) => ({ key: stableId(item, index), item }));
      const remotePairs = remote.map((item, index) => ({ key: stableId(item, index), item }));
      const localIds = new Set(localPairs.map(({ key }) => key));
      const remoteIds = new Set(remotePairs.map(({ key }) => key));

      // Find items only in local
      differences.localOnly[entityType] = localPairs
        .filter(({ key }) => !remoteIds.has(key))
        .map(({ item }) => item);
      
      // Find items only in remote
      differences.remoteOnly[entityType] = remotePairs
        .filter(({ key }) => !localIds.has(key))
        .map(({ item }) => item);

      // Find conflicts (same ID, different content)
      const localMap = new Map(localPairs.map(({ key, item }) => [key, item]));
      const remoteMap = new Map(remotePairs.map(({ key, item }) => [key, item]));
      
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
