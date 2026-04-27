// Loomwright — section completeness scorer (traffic-light system).
//
// Two signals combine into red / amber / green:
//   1. Section validation — does the wizard data match the schema?
//   2. Reference connection — does the writer have a reference linked to
//      this section in any of the section's `referenceCategories`? Even
//      one matching reference flips a section from amber → green.
//
// Reasoning surfaced via `reasons` so we can show a tooltip explaining why
// a light isn't green yet.

import { SECTIONS } from './schemas';

export function evaluateSection(section, data, references = []) {
  const reasons = [];
  const refs = Array.isArray(references) ? references : [];

  // 1. Required fields populated?
  let requiredOk = true;
  for (const key of section.required || []) {
    const val = data?.[key];
    const empty =
      val == null ||
      (typeof val === 'string' && !val.trim()) ||
      (Array.isArray(val) && val.length === 0);
    if (empty) {
      requiredOk = false;
      reasons.push(`Required: ${key}`);
    }
  }

  // 2. Schema validation passes?
  let schemaOk = true;
  try {
    if (section.validate) schemaOk = !!section.validate(data);
  } catch { schemaOk = false; }

  // 3. Reference connection? Either category-matched OR explicitly
  //    section-linked via linkedTo.sectionIds.
  const wantsRefs = (section.referenceCategories || []).length > 0;
  const matchedRefs = wantsRefs ? refs.filter(r => {
    const cat = r?.category || 'other';
    if ((section.referenceCategories || []).includes(cat)) return true;
    if (Array.isArray(r?.linkedTo?.sectionIds) && r.linkedTo.sectionIds.includes(section.id)) return true;
    return false;
  }) : [];

  // Decide colour:
  //   red    — no required field set
  //   amber  — required fields filled but section unwanted-empty OR schema
  //            invalid OR section wants references and has none
  //   green  — required fields filled AND (no reference categories OR
  //            at least one matching reference connected)
  let status = 'red';
  if (requiredOk) {
    if (!schemaOk) {
      status = 'amber';
      reasons.push('Schema looks incomplete');
    } else if (wantsRefs && matchedRefs.length === 0) {
      status = 'amber';
      reasons.push(`Add a ${(section.referenceCategories || []).join(' / ')} reference for green`);
    } else {
      status = 'green';
    }
  } else if (schemaOk) {
    // Schema passed but a soft-required field still missing.
    status = 'amber';
  }

  return {
    status,
    reasons,
    matchedReferenceCount: matchedRefs.length,
  };
}

export function evaluateAll(data, references) {
  const out = {};
  for (const s of SECTIONS) out[s.id] = evaluateSection(s, data, references);
  return out;
}

export const TRAFFIC_LIGHT_COLOR = {
  red: '#c44',
  amber: '#d80',
  green: '#2a8',
};
