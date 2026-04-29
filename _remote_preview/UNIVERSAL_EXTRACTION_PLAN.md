# Universal Extraction System Plan

## Current State Analysis

### What Works (Master Timeline)
- Uses `chapterDataExtractionService.extractEventsFromChapter()`
- Returns structured events: `{type, title, description, actors, locations}`
- Events are saved to `timelineEvents` database table
- Extraction works perfectly and reliably

### What's Broken
- `extractCharacterDataFromChapter()` has JSON parsing errors (`+5` syntax)
- Returns 0 for all data types (appearances, statChanges, skillChanges, relationshipChanges)
- PersonnelAnalysisService uses broken extraction method
- Data doesn't flow to snapshots → visualizations

## Solution: Universal Event-Based Extraction

### Architecture
```
Chapter Text
    ↓
extractEventsFromChapter() [PROVEN - Master Timeline uses this]
    ↓
Timeline Events Array
    ↓
convertEventsToCharacterData() [NEW - converts events to snapshot format]
    ↓
Actor Snapshots
    ↓
Visualizations (Skill Tree, Relationship Tracker, Mind Map)
```

### Implementation Steps

1. **Fix JSON Parsing** ✅
   - Fixed `+5` syntax error in `_parseCharacterDataResponse()`

2. **Refactor PersonnelAnalysisService** ✅
   - Changed to use `extractEventsFromChapter()` instead of `extractCharacterDataFromChapter()`
   - Added `convertEventsToCharacterData()` to convert events to snapshot format

3. **Event Type Mapping**
   - `character_appearance` → appearances
   - `stat_change` → statChanges
   - `skill_event` → skillChanges
   - `relationship_change` → relationshipChanges
   - `item_event` → (can be added to inventory)
   - `travel` → (can be added to locations)

4. **Data Extraction from Events**
   - Parse stat changes from event descriptions
   - Extract skill names from event titles/descriptions
   - Extract relationship changes from event descriptions
   - Match actor names to actor IDs

5. **Update All Components**
   - Skill Tree: Already uses snapshots (needs data to flow)
   - Relationship Tracker: Already uses snapshots (needs data to flow)
   - Mind Map: Uses Relationship Tracker (will work once data flows)

## Benefits

1. **Single Source of Truth**: All extraction uses the same proven method
2. **Consistency**: Master Timeline and Personnel use same data
3. **Reliability**: No more JSON parsing errors
4. **Maintainability**: One extraction system to maintain
5. **Extensibility**: Easy to add new event types

## Next Steps

1. Test the refactored extraction
2. Verify events are converted correctly
3. Verify snapshots are created
4. Verify visualizations show data
5. Add any missing event type conversions
