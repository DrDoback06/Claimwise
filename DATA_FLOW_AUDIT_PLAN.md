# Comprehensive Data Flow Audit Plan

## Overview
Systematic audit of all data flows from collection → conversion → storage → visualization to identify gaps and ensure complete data pipeline.

## Data Flow Architecture (Target)

```
┌─────────────────────────────────────────────────────────────┐
│                    DATA COLLECTION LAYER                     │
├─────────────────────────────────────────────────────────────┤
│ 1. Writers Room (Chapter Text)                              │
│ 2. Manuscript Intelligence (Manual Entry)                    │
│ 3. Personnel Tab (Direct Entry)                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  DATA EXTRACTION LAYER                       │
├─────────────────────────────────────────────────────────────┤
│ 1. ChapterDataExtractionService                              │
│    - extractCharacterDataFromChapter()                       │
│    - Returns: appearances, statChanges, skillChanges,       │
│      relationshipChanges                                     │
│ 2. PersonnelAnalysisService                                  │
│    - analyzeChapter()                                        │
│    - buildSnapshotData()                                     │
│    - updateActorSnapshot()                                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   DATA STORAGE LAYER                         │
├─────────────────────────────────────────────────────────────┤
│ 1. Actor Profiles (Database: 'actors')                       │
│    - actor.snapshots[bookId_chapterId] = {                    │
│        activeSkills: [],                                     │
│        baseStats: {},                                        │
│        additionalStats: {},                                  │
│        relationships: {},                                   │
│        inventory: [],                                        │
│        equipment: {},                                        │
│        chapterAnalyzed: true                                 │
│      }                                                       │
│ 2. Relationships Table (Database: 'relationships')           │
│    - Populated from snapshots via RelationshipTracker        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  DATA VISUALIZATION LAYER                    │
├─────────────────────────────────────────────────────────────┤
│ 1. Skill Tree Visual                                        │
│    - Source: actor.snapshots[].activeSkills                 │
│    - Function: loadSkillChapterData()                        │
│                                                              │
│ 2. Relationship Tracker                                     │
│    - Source: actor.snapshots[].relationships                 │
│    - Function: loadRelationshipsFromSnapshots()             │
│                                                              │
│ 3. Mind Map                                                 │
│    - Source: relationships table (populated by Tracker)      │
│    - Function: loadRelationships() → createRelationshipEdges│
└─────────────────────────────────────────────────────────────┘
```

## Audit Checklist

### Phase 1: Data Collection → Extraction

#### 1.1 Writers Room Auto-Analysis
- [ ] Verify `saveChapterToBook()` triggers `personnelAnalysisService.analyzeChapter()`
- [ ] Verify chapter text is passed correctly
- [ ] Verify actors array is passed correctly
- [ ] Check for errors in console during save
- [ ] Verify analysis completes successfully

#### 1.2 Manual Analysis (Personnel Tab)
- [ ] Verify "Analyze Chapter" button works
- [ ] Verify chapter text is retrieved correctly
- [ ] Verify analysis results are displayed
- [ ] Verify snapshots are created/updated

#### 1.3 Extraction Service
- [ ] Verify `extractCharacterDataFromChapter()` is called
- [ ] Verify AI prompt is correct (only gained/learned skills)
- [ ] Verify response parsing works
- [ ] Verify all data types are extracted:
  - [ ] Appearances
  - [ ] Stat changes
  - [ ] Skill changes (gained/improved only)
  - [ ] Relationship changes

### Phase 2: Extraction → Storage

#### 2.1 Snapshot Creation
- [ ] Verify `buildSnapshotData()` is called for each actor
- [ ] Verify previous snapshot is loaded correctly
- [ ] Verify stat changes are applied
- [ ] Verify skill changes are applied:
  - [ ] New skills added (gained)
  - [ ] Existing skills upgraded (improved)
  - [ ] Skill IDs are resolved correctly
- [ ] Verify relationships are stored:
  - [ ] Directional relationships created
  - [ ] Strength calculated
  - [ ] Type inferred

#### 2.2 Snapshot Update
- [ ] Verify `updateActorSnapshot()` saves to database
- [ ] Verify snapshot is stored in `actor.snapshots[snapKey]`
- [ ] Verify snapshot structure is complete:
  - [ ] activeSkills array
  - [ ] baseStats object
  - [ ] relationships object
  - [ ] chapterAnalyzed flag
  - [ ] snapshotTimestamp

#### 2.3 Database Storage
- [ ] Verify actor is updated in database
- [ ] Verify snapshot persists across app restarts
- [ ] Verify multiple snapshots per actor work

### Phase 3: Storage → Visualization

#### 3.1 Skill Tree Data Loading
- [ ] Verify `loadSkillChapterData()` is called
- [ ] Verify it iterates through all books/chapters
- [ ] Verify it reads from `actor.snapshots[bookId_chapterId]`
- [ ] Verify skill IDs are extracted correctly
- [ ] Verify skill levels are extracted correctly
- [ ] Verify firstGained chapter is tracked
- [ ] Verify upgrade chapters are tracked
- [ ] Verify `buildSkillTree()` uses snapshot data (not current state)

#### 3.2 Relationship Tracker Data Loading
- [ ] Verify `loadRelationshipsFromSnapshots()` is called
- [ ] Verify it iterates through all actors
- [ ] Verify it reads from `actor.snapshots[].relationships`
- [ ] Verify bidirectional calculation works
- [ ] Verify relationships are merged with table data
- [ ] Verify relationships are displayed correctly

#### 3.3 Mind Map Data Loading
- [ ] Verify `loadRelationships()` loads from database
- [ ] Verify relationships table is populated from snapshots
- [ ] Verify `createRelationshipEdges()` creates edges correctly
- [ ] Verify edges connect correct nodes
- [ ] Verify relationship strength is displayed

### Phase 4: Data Flow Issues

#### 4.1 Missing Data Scenarios
- [ ] Chapter analyzed but no snapshots created
- [ ] Snapshots created but skills missing
- [ ] Skills in snapshots but not in Skill Tree
- [ ] Relationships in snapshots but not in Tracker
- [ ] Relationships in Tracker but not in Mind Map

#### 4.2 Data Inconsistency
- [ ] Skills in current state but not in snapshots
- [ ] Relationships in table but not in snapshots
- [ ] Multiple snapshots for same chapter
- [ ] Snapshot data overwritten incorrectly

#### 4.3 Performance Issues
- [ ] Analysis takes too long
- [ ] Too many database queries
- [ ] Memory issues with large snapshots

## Debugging Strategy

### Step 1: Add Comprehensive Logging
Add instrumentation logs at each critical point:
1. Chapter save → Analysis trigger
2. Analysis start → Extraction call
3. Extraction → Data received
4. Snapshot build → Data structure
5. Snapshot save → Database update
6. Visualization load → Data retrieval
7. Visualization render → Data display

### Step 2: Verify Each Flow
Test each data type independently:
- Skills flow
- Relationships flow
- Stats flow
- Inventory flow

### Step 3: Fix Identified Issues
Address each gap systematically:
- Missing data → Fix extraction/storage
- Wrong data → Fix conversion logic
- Missing visualization → Fix loading/rendering

## Implementation Priority

1. **CRITICAL**: Skills not appearing in Skill Tree
2. **CRITICAL**: Relationships not appearing in Tracker/Mind Map
3. **HIGH**: Stats not updating in snapshots
4. **MEDIUM**: Inventory/equipment not tracked
5. **LOW**: Performance optimizations

## Next Steps

1. Add debug logging to all critical points
2. Test with a simple chapter (1 actor, 1 skill gain, 1 relationship)
3. Trace data through entire pipeline
4. Identify and fix gaps
5. Verify all visualizations show correct data
