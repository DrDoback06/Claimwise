# Data Flow Test Steps

## Test Scenario: Complete Data Flow from Chapter to Visualizations

### Prerequisites
- At least 2 actors created in Personnel tab
- At least 1 skill in Skill Bank
- At least 1 book with 1 chapter

### Test Steps

1. **Open Writers Room**
   - Navigate to Writers Room tab
   - Select Book 1, Chapter 1 (or any existing chapter)

2. **Write Test Chapter Text**
   - Write chapter text that includes:
     - At least one actor name (e.g., "Grimguff")
     - A skill being gained (e.g., "Grimguff learned Fireball")
     - A relationship change (e.g., "Grimguff befriended Pipkins")
     - A stat change (e.g., "Grimguff's STR increased by 5")
   - Example text:
     ```
     Grimguff walked into the room. He had just learned the Fireball skill after weeks of practice. 
     His strength had increased significantly, and he felt stronger than ever. 
     When he saw Pipkins, he smiled warmly - they had become good friends.
     ```

3. **Save Chapter**
   - Click "Save" button
   - Wait for save confirmation
   - Check browser console for any errors

4. **Wait for Auto-Analysis**
   - Wait 5-10 seconds for background analysis to complete
   - Check browser console for "[WritersRoom] Auto-analyzed chapter" message

5. **Verify in Personnel Tab**
   - Navigate to Personnel tab
   - Select the actor mentioned in chapter (e.g., "Grimguff")
   - Select Book 1, Chapter 1 from dropdowns
   - Click "Analyze Chapter" button (if status shows "Needs Re-analysis")
   - Check timeline view to see if snapshot was created
   - Verify snapshot shows:
     - Skills gained
     - Stats changed
     - Relationships added

6. **Verify in Skill Tree**
   - Navigate to Skill Tree Visual
   - Select the actor from dropdown
   - Switch to "Timeline" view
   - Verify skills appear on chapter rings
   - Check if skill gained in chapter appears

7. **Verify in Relationship Tracker**
   - Navigate to Relationship Tracker (Analysis > Relationships)
   - Filter by actor if needed
   - Verify relationship appears in list
   - Check relationship strength and type

8. **Verify in Mind Map**
   - Navigate to Story Mind Map
   - Verify connection between actors appears
   - Check if relationship strength affects connection appearance

### Expected Results

- **Personnel Tab**: Snapshot created with skills, stats, relationships
- **Skill Tree**: Skills appear on correct chapter ring
- **Relationship Tracker**: Relationships displayed with correct strength
- **Mind Map**: Connections between actors visible

### What to Check in Logs

After running test, check debug.log for:
- `analyzeChapter called` - Analysis triggered
- `Extraction completed` - Data extracted (check skillChanges, relationshipChanges counts)
- `Skill added to snapshot` - Skills saved
- `Relationship added to snapshot` - Relationships saved
- `Actor updated in database` - Data persisted
- `loadSkillChapterData started` - Skill Tree loading
- `Snapshot found` - Skills found in snapshots
- `loadRelationshipsFromSnapshots started` - Relationship Tracker loading
