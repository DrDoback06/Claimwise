import db from './database';

/**
 * Data Migration Service
 * Optional utility to migrate existing actor data into the new snapshot-based structure
 */
class DataMigrationService {
  /**
   * Migrate existing actor data to snapshot structure
   * @param {Object} options - Migration options
   * @returns {Promise<Object>} Migration results
   */
  async migrateExistingDataToSnapshots(options = {}) {
    const {
      dryRun = false,
      createSnapshotsForAllChapters = false,
      onProgress = null
    } = options;

    const results = {
      actorsProcessed: 0,
      snapshotsCreated: 0,
      relationshipsMigrated: 0,
      errors: [],
      warnings: []
    };

    try {
      // Get all actors
      const actors = await db.getAll('actors');
      if (actors.length === 0) {
        results.warnings.push('No actors found to migrate');
        return results;
      }

      // Get all books and chapters
      const books = await db.getAll('books');
      const allChapters = [];
      books.forEach(book => {
        if (book.chapters && Array.isArray(book.chapters)) {
          book.chapters.forEach(chapter => {
            allChapters.push({
              bookId: book.id,
              chapterId: chapter.id,
              chapter: chapter
            });
          });
        }
      });

      if (allChapters.length === 0 && !createSnapshotsForAllChapters) {
        results.warnings.push('No chapters found. Set createSnapshotsForAllChapters=true to create snapshots from current actor state.');
        return results;
      }

      // Process each actor
      for (let i = 0; i < actors.length; i++) {
        const actor = actors[i];
        results.actorsProcessed++;

        if (onProgress) {
          onProgress({
            current: i + 1,
            total: actors.length,
            actorName: actor.name,
            message: `Processing ${actor.name}...`
          });
        }

        try {
          // If actor already has snapshots, check if migration is needed
          if (actor.snapshots && Object.keys(actor.snapshots).length > 0) {
            // Check if snapshots have the new structure (with relationships)
            const hasNewStructure = Object.values(actor.snapshots).some(snapshot => 
              snapshot.relationships !== undefined || snapshot.chapterAnalyzed !== undefined
            );

            if (hasNewStructure) {
              results.warnings.push(`${actor.name}: Already has new snapshot structure, skipping`);
              continue;
            }
          }

          // Migrate existing relationships to snapshots
          const relationships = await db.getAll('relationships');
          const actorRelationships = relationships.filter(rel =>
            rel.actor1Id === actor.id || rel.actor2Id === actor.id
          );

          if (actorRelationships.length > 0) {
            // Group relationships by chapter
            const relationshipsByChapter = {};
            actorRelationships.forEach(rel => {
              const key = `${rel.bookId}_${rel.chapterId}`;
              if (!relationshipsByChapter[key]) {
                relationshipsByChapter[key] = [];
              }
              relationshipsByChapter[key].push(rel);
            });

            // Create/update snapshots with relationship data
            for (const [snapKey, rels] of Object.entries(relationshipsByChapter)) {
              const [bookId, chapterId] = snapKey.split('_').map(Number);
              
              if (!dryRun) {
                // Get or create snapshot
                let snapshot = actor.snapshots?.[snapKey];
                if (!snapshot) {
                  snapshot = {
                    baseStats: { ...(actor.baseStats || {}) },
                    additionalStats: { ...(actor.additionalStats || {}) },
                    activeSkills: [...(actor.activeSkills || [])],
                    inventory: [...(actor.inventory || [])],
                    equipment: actor.equipment ? JSON.parse(JSON.stringify(actor.equipment)) : {},
                    relationships: {},
                    snapshotTimestamp: Date.now(),
                    bookId,
                    chapterId,
                    chapterAnalyzed: false // Mark as not analyzed (needs re-analysis)
                  };
                }

                // Add relationships to snapshot
                if (!snapshot.relationships) {
                  snapshot.relationships = {};
                }

                rels.forEach(rel => {
                  const otherActorId = rel.actor1Id === actor.id ? rel.actor2Id : rel.actor1Id;
                  snapshot.relationships[otherActorId] = {
                    strength: rel.strength || 0,
                    type: rel.relationshipType || 'neutral',
                    notes: rel.summary || rel.description || '',
                    direction: rel.actor1Id === actor.id ? 'outgoing' : 'incoming',
                    updatedAt: rel.updatedAt || rel.createdAt || Date.now()
                  };
                });

                // Update actor's snapshots
                if (!actor.snapshots) {
                  actor.snapshots = {};
                }
                actor.snapshots[snapKey] = snapshot;

                results.snapshotsCreated++;
                results.relationshipsMigrated += rels.length;
              } else {
                // Dry run - just count
                results.snapshotsCreated++;
                results.relationshipsMigrated += rels.length;
              }
            }
          }

          // If createSnapshotsForAllChapters is true, create snapshots for all chapters
          // using current actor state (for chapters without existing data)
          if (createSnapshotsForAllChapters) {
            for (const { bookId, chapterId } of allChapters) {
              const snapKey = `${bookId}_${chapterId}`;
              
              // Skip if snapshot already exists
              if (actor.snapshots?.[snapKey]) continue;

              if (!dryRun) {
                const snapshot = {
                  baseStats: { ...(actor.baseStats || {}) },
                  additionalStats: { ...(actor.additionalStats || {}) },
                  activeSkills: [...(actor.activeSkills || [])],
                  inventory: [...(actor.inventory || [])],
                  equipment: actor.equipment ? JSON.parse(JSON.stringify(actor.equipment)) : {},
                  relationships: {},
                  snapshotTimestamp: Date.now(),
                  bookId,
                  chapterId,
                  chapterAnalyzed: false // Mark as not analyzed
                };

                if (!actor.snapshots) {
                  actor.snapshots = {};
                }
                actor.snapshots[snapKey] = snapshot;

                results.snapshotsCreated++;
              } else {
                results.snapshotsCreated++;
              }
            }
          }

          // Save updated actor
          if (!dryRun) {
            await db.update('actors', actor);
          }

        } catch (error) {
          results.errors.push({
            actorId: actor.id,
            actorName: actor.name,
            error: error.message
          });
          console.error(`Error migrating actor ${actor.name}:`, error);
        }
      }

      return results;
    } catch (error) {
      console.error('Migration error:', error);
      results.errors.push({
        type: 'general',
        error: error.message
      });
      return results;
    }
  }

  /**
   * Rollback migration (remove snapshots created by migration)
   * WARNING: This will remove all snapshots, not just migrated ones
   */
  async rollbackMigration() {
    const results = {
      actorsProcessed: 0,
      snapshotsRemoved: 0,
      errors: []
    };

    try {
      const actors = await db.getAll('actors');
      
      for (const actor of actors) {
        if (actor.snapshots && Object.keys(actor.snapshots).length > 0) {
          // Remove all snapshots
          actor.snapshots = {};
          await db.update('actors', actor);
          results.actorsProcessed++;
        }
      }

      return results;
    } catch (error) {
      console.error('Rollback error:', error);
      results.errors.push({
        error: error.message
      });
      return results;
    }
  }

  /**
   * Get migration status report
   */
  async getMigrationStatus() {
    const actors = await db.getAll('actors');
    const books = await db.getAll('books');
    
    const status = {
      totalActors: actors.length,
      actorsWithSnapshots: 0,
      actorsWithNewStructure: 0,
      totalSnapshots: 0,
      chaptersWithSnapshots: 0,
      totalChapters: 0
    };

    // Count chapters
    books.forEach(book => {
      if (book.chapters && Array.isArray(book.chapters)) {
        status.totalChapters += book.chapters.length;
      }
    });

    // Analyze actors
    actors.forEach(actor => {
      if (actor.snapshots && Object.keys(actor.snapshots).length > 0) {
        status.actorsWithSnapshots++;
        status.totalSnapshots += Object.keys(actor.snapshots).length;

        // Check if has new structure
        const hasNewStructure = Object.values(actor.snapshots).some(snapshot =>
          snapshot.relationships !== undefined || snapshot.chapterAnalyzed !== undefined
        );
        if (hasNewStructure) {
          status.actorsWithNewStructure++;
        }
      }
    });

    // Count unique chapters with snapshots
    const chaptersWithSnapshots = new Set();
    actors.forEach(actor => {
      if (actor.snapshots) {
        Object.keys(actor.snapshots).forEach(snapKey => {
          chaptersWithSnapshots.add(snapKey);
        });
      }
    });
    status.chaptersWithSnapshots = chaptersWithSnapshots.size;

    return status;
  }
}

// Export singleton instance
const dataMigrationService = new DataMigrationService();
export default dataMigrationService;
