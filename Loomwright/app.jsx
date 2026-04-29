/* global React, DesignCanvas, DCSection, DCArtboard, DCPostIt,
   AB_Selection, AB_Dossier, AB_Suggestions, AB_Margin, AB_Atlas, AB_ItemSkill, AB_Extraction, AB_More,
   AB_StatesMatrix, AB_Search, AB_Tweaks,
   AB_ItemEditor, AB_SkillTreeEditor, AB_SkillDetail, AB_TreeAssignment, AB_BuildSim, AB_EffectsDSL,
   AB_InlineWeaver, AB_DossierCompare, AB_Timeline */

// ───────────────────────────────────────────────────────────────────────────
// App — wires every artboard into a sectioned design canvas.
// Artboard sizes are fixed-pixel (the canvas pans/zooms around them).
// One opinionated version per surface, per the brief. Code Insight Document
// for each ships alongside as CODE-INSIGHT.md.
// ───────────────────────────────────────────────────────────────────────────
function App() {
  return (
    <DesignCanvas>
      <DCSection id="spine" title="01 · Spine" subtitle="The Selection Bus — visual language that everything else inherits.">
        <DCArtboard id="selection" label="Selection language" width={1180} height={1380}>
          <AB_Selection />
        </DCArtboard>
      </DCSection>

      <DCSection id="dossier" title="02 · Dossier" subtitle="Vertical collapsible sections — replaces the horizontal tab scroller.">
        <DCArtboard id="dossier-tom" label="Dossier · Tom (sel.character set)" width={1320} height={1480}>
          <AB_Dossier />
        </DCArtboard>
      </DCSection>

      <DCSection id="suggestions" title="03 · Suggestion Engine" subtitle="The flagship system. Drawer-off-drawer, paper-textured, provenance always visible.">
        <DCArtboard id="suggestions" label="Drawer · cards · detail · accept wizard" width={1480} height={1100}>
          <AB_Suggestions />
        </DCArtboard>
      </DCSection>

      <DCSection id="extraction" title="04 · Extraction" subtitle="Two layers: inline margin (continuous, free) and post-chapter wizard (deliberate).">
        <DCArtboard id="margin" label="Layer 1 · Inline margin extraction" width={1380} height={1020}>
          <AB_Margin />
        </DCArtboard>
        <DCArtboard id="wizard" label="Layer 2 · Post-chapter Extraction Wizard" width={1180} height={1100}>
          <AB_Extraction />
        </DCArtboard>
      </DCSection>

      <DCSection id="atlas" title="05 · Atlas v2" subtitle="Travel lines + intersections + three v1 editor features. Real ↔ parchment basemap toggle.">
        <DCArtboard id="atlas" label="Atlas · Tom + Iris · ch.04 · right-click create / left-click manipulate" width={1320} height={1080}>
          <AB_Atlas />
        </DCArtboard>
      </DCSection>

      <DCSection id="creators" title="06 · Item & Skill Creators" subtitle="Six artboards. Item editor and skill tree editor are split surfaces; then a single-skill detail page, a per-character assignment grid, a build simulator, and the effects DSL reference.">
        <DCArtboard id="creators-overview" label="06 · overview · all six surfaces" width={1320} height={1280}>
          <AB_ItemSkill />
        </DCArtboard>
        <DCArtboard id="06a-item" label="06a · Item editor · stats + skills + actor preview" width={1320} height={1280}>
          {typeof AB_ItemEditor === 'function' ? <AB_ItemEditor /> : <AB_ItemSkill />}
        </DCArtboard>
        <DCArtboard id="06b-skill-tree" label="06b · Skill tree editor · list + canvas + inspector" width={1480} height={1280}>
          {typeof AB_SkillTreeEditor === 'function' ? <AB_SkillTreeEditor /> : <AB_ItemSkill />}
        </DCArtboard>
        <DCArtboard id="06c-skill-detail" label="06c · Single-skill deep editor" width={1320} height={1380}>
          <AB_SkillDetail />
        </DCArtboard>
        <DCArtboard id="06d-tree-assignment" label="06d · Tree assignment · who knows what" width={1280} height={780}>
          <AB_TreeAssignment />
        </DCArtboard>
        <DCArtboard id="06e-build-sim" label="06e · Build simulator · try a build on a character" width={1280} height={920}>
          <AB_BuildSim />
        </DCArtboard>
        <DCArtboard id="06f-dsl" label="06f · Effects DSL · flag namespaces &amp; grammar" width={1280} height={1240}>
          <AB_EffectsDSL />
        </DCArtboard>
      </DCSection>

      <DCSection id="systems" title="07 · Continuity · Knows · Tangle · Marginalia" subtitle="Smaller surfaces — Continuity Checker, Knows ledger, Relationship matrix, accepted-suggestion treatment in the manuscript.">
        <DCArtboard id="more" label="Continuity · Knows · Matrix · Marginalia" width={1080} height={1660}>
          <AB_More />
        </DCArtboard>
      </DCSection>

      <DCSection id="states" title="08 · States Matrix" subtitle="Empty / Loading / Error / Populated for the three high-traffic panels — every panel ships all four.">
        <DCArtboard id="states" label="Dossier · Suggestions · Continuity × four states" width={1280} height={900}>
          <AB_StatesMatrix />
        </DCArtboard>
      </DCSection>

      <DCSection id="search" title="09 · Cmd-K + mention card" subtitle="Cross-cutting surfaces — palette into anything, plus the entity micro-card reused by manuscript / Atlas / Tangle.">
        <DCArtboard id="search" label="Cmd-K palette · @-mention hover micro-card" width={1180} height={1180}>
          <AB_Search />
        </DCArtboard>
      </DCSection>

      <DCSection id="decisions" title="10 · Contested decisions" subtitle="The six choices where reasonable people disagreed. Showing what we picked, what we didn't, and why.">
        <DCArtboard id="decisions" label="Six decisions · chosen vs alternatives" width={1180} height={2160}>
          <AB_Tweaks />
        </DCArtboard>
      </DCSection>

      <DCSection id="weaver" title="11 · Inline Weaver" subtitle="The chapter writing surface — three-column: outline / manuscript / live sidecar. Every other system surfaces here.">
        <DCArtboard id="weaver" label="Manuscript · ch.06 · with caret-context, marginalia, and live sidecar" width={1480} height={920}>
          <AB_InlineWeaver />
        </DCArtboard>
      </DCSection>

      <DCSection id="compare" title="12 · Dossier Compare" subtitle="Two characters side-by-side, with a diff gutter. Use before writing scenes where they meet.">
        <DCArtboard id="compare" label="Tom vs Iris · knows · items · skills · last interaction" width={1320} height={1280}>
          <AB_DossierCompare />
        </DCArtboard>
      </DCSection>

      <DCSection id="timeline" title="13 · Timeline / Pacing" subtitle="Story-time, POV swimlanes, tension curve, word counts, pinned events — diagnostics for tonal flatness and missing POVs.">
        <DCArtboard id="timeline" label="Pacing across chapters 01–08" width={1320} height={780}>
          <AB_Timeline />
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
