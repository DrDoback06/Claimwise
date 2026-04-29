# Entity Extraction Wizard - User Guide

## Overview
The Entity Extraction Wizard is a **mandatory** modal that appears automatically after you save a chapter in the Writers Room. It extracts all entities (actors, items, skills, stats) mentioned in your chapter text and allows you to review, create, or update them.

## How It Works

### Step 1: Write and Save Your Chapter
1. Open the **Writers Room** tab
2. Write or edit your chapter text
3. Click the **"SAVE & EXTRACT"** button (top right, blue button with Save icon)
4. The chapter is saved to the database

### Step 2: Automatic Event Extraction
After saving, the system automatically:
- Extracts timeline events using the same proven method as Master Timeline
- Saves events to the `timelineEvents` table
- Extracts entities (actors, items, skills) from the chapter text

### Step 3: Wizard Appears
The **Entity Extraction Wizard** modal appears automatically with:
- **New Entities** section (expanded by default) - Shows entities that don't exist yet
- **Upgrades** section (collapsed) - Shows existing entities that have been upgraded/changed

## Wizard Interface

### New Entities Section
- Lists all newly detected entities (actors, items, skills)
- Each entity shows:
  - **Name** and **Type** (Actor/Item/Skill)
  - **Description** extracted from chapter text
  - **Source Context** - The exact text excerpt where it was found
  - **Action Buttons**:
    - **CREATE** - Creates the entity in the database
    - **SKIP** - Skips this entity (won't be created)

### Upgrades Section
- Lists existing entities that have been detected with changes
- Shows:
  - **Matched Entity** - The existing entity it matched to
  - **Match Confidence** - How confident the match is (percentage)
  - **Changes Detected** - What changed (stats, description, etc.)
  - **Source Context** - The text excerpt
  - **Action Buttons**:
    - **APPLY UPGRADE** - Applies the changes and records upgrade history
    - **CONFIRM MATCH** - Confirms it's the same entity (no changes)
    - **SKIP** - Skips this upgrade

## Actions You Can Take

### For New Entities:
1. **CREATE** - Click to create the entity immediately
   - Actor: Creates a new actor with the extracted information
   - Item: Creates a new item with stats and properties
   - Skill: Creates a new skill with description and type

2. **SKIP** - Click to skip this entity
   - Entity won't be created
   - You can create it manually later if needed

### For Upgrades:
1. **APPLY UPGRADE** - Click to apply detected changes
   - Updates the entity with new stats/properties
   - Records the upgrade in the entity's `upgradeHistory`
   - Shows which chapter the upgrade came from

2. **CONFIRM MATCH** - Click if it's the same entity with no changes
   - Just confirms the match, no changes applied

3. **SKIP** - Click to skip this upgrade
   - No changes will be applied

## Completing the Wizard

### Progress Indicator
- Shows how many entities you've processed
- Example: "3/5 processed"

### Complete Button
- Appears when you've processed all entities (or clicked Skip on remaining ones)
- Click **"COMPLETE"** to close the wizard
- The wizard is **mandatory** - you must process or skip all entities before you can continue

## What Happens After Completion

1. **Entities Created** - New entities are added to the database
2. **Upgrades Applied** - Entity upgrades are recorded with chapter information
3. **Timeline Events** - All events are saved to `timelineEvents` table
4. **Visualizations Update** - All tabs automatically update:
   - **Skill Tree** - Shows new skills and progression
   - **Relationship Tracker** - Shows new relationships
   - **Personnel Tab** - Shows actor progression
   - **Master Timeline** - Shows all extracted events

## Tips

1. **Review Carefully** - The wizard uses AI extraction, so review matches for accuracy
2. **Source Context** - Always check the source context to verify the entity is correct
3. **Upgrade History** - Upgrades are tracked per chapter, so you can see entity evolution over time
4. **Skip When Unsure** - If you're not sure about an entity, skip it and create it manually later

## Troubleshooting

### Wizard Doesn't Appear
- Make sure you clicked **"SAVE & EXTRACT"** (not just Ctrl+S)
- Check that chapter text is at least 50 characters long
- Check browser console for errors

### Entities Not Detected
- The extraction uses AI, so very subtle mentions might be missed
- You can manually create entities in the Personnel/Items/Skills tabs

### Wrong Matches
- Use the **SKIP** button if a match is incorrect
- You can manually link entities later if needed

## Technical Details

- **Extraction Method**: Uses `chapterDataExtractionService.extractEntitiesFromChapter()`
- **Matching**: Uses `entityMatchingService` for fuzzy matching
- **Upgrade Tracking**: Uses `upgradeTrackingService` to record upgrade history
- **Event Storage**: Events saved to `timelineEvents` table via `dataConsistencyService`
