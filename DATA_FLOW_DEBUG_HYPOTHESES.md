# Data Flow Debug Hypotheses

## Hypothesis A: Skills Not Extracted from Chapter Text
**Issue**: Skills are not being extracted during chapter analysis
**Evidence Needed**:
- Check if `extractCharacterDataFromChapter()` returns skillChanges
- Check if skill names match actor names correctly
- Check if AI is returning skills in correct format

## Hypothesis B: Skills Extracted But Not Saved to Snapshots
**Issue**: Skills are extracted but `buildSnapshotData()` fails to save them
**Evidence Needed**:
- Check if `findSkillId()` resolves skill names to IDs
- Check if skills are added to `baseSnapshot.activeSkills`
- Check if snapshot is saved to database

## Hypothesis C: Skills in Snapshots But Not Loaded by Skill Tree
**Issue**: Skills exist in snapshots but `loadSkillChapterData()` doesn't find them
**Evidence Needed**:
- Check if snapshots are being read correctly
- Check if skill IDs match between snapshots and skillBank
- Check if `buildSkillTree()` uses snapshot data or current state

## Hypothesis D: Skill Tree Uses Current State Instead of Snapshots
**Issue**: `buildSkillTree()` uses `selectedActor.activeSkills` (current) instead of snapshot skills
**Evidence Needed**:
- Check what `selectedActor.activeSkills` contains
- Check if snapshot skills are different from current skills
- Check if Skill Tree should use snapshot for selected chapter

## Hypothesis E: Relationships Not Extracted from Chapter Text
**Issue**: Relationships are not being extracted during analysis
**Evidence Needed**:
- Check if `extractCharacterDataFromChapter()` returns relationshipChanges
- Check if relationship changes are parsed correctly
- Check if actor names match correctly

## Hypothesis F: Relationships Extracted But Not Saved to Snapshots
**Issue**: Relationships are extracted but not saved to snapshot.relationships
**Evidence Needed**:
- Check if `findActorByName()` resolves other actor
- Check if relationships are added to `baseSnapshot.relationships`
- Check if snapshot is saved

## Hypothesis G: Relationships in Snapshots But Not Loaded by Tracker
**Issue**: Relationships exist in snapshots but `loadRelationshipsFromSnapshots()` doesn't find them
**Evidence Needed**:
- Check if snapshots are being iterated correctly
- Check if relationships object exists in snapshots
- Check if bidirectional calculation works

## Hypothesis H: Relationships Not Populated in Database Table
**Issue**: Relationships are in snapshots but not in relationships table
**Evidence Needed**:
- Check if `loadRelationshipsFromSnapshots()` is called
- Check if relationships are added to database
- Check if Mind Map reads from table correctly

## Hypothesis I: Auto-Analysis Not Triggered
**Issue**: Chapter save doesn't trigger analysis
**Evidence Needed**:
- Check if `personnelAnalysisService.analyzeChapter()` is called
- Check if chapter text is passed correctly
- Check if actors array is passed correctly

## Hypothesis J: Analysis Completes But Data Not Persisted
**Issue**: Analysis runs but database update fails
**Evidence Needed**:
- Check if `updateActorSnapshot()` succeeds
- Check if database update throws errors
- Check if actor state is refreshed after analysis
