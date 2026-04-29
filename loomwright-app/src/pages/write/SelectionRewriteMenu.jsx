/**
 * SelectionRewriteMenu — inline rewrite actions on text selection.
 *
 * Attaches to the `.lw-writer-surface` element (the editor container). When
 * the user selects text inside it, a floating Loomwright-themed menu appears
 * with rewrite actions (Shorten, Lengthen, Tighten, Flip voice, Vary rhythm,
 * Change register). Picking one pipes the selection through aiService and
 * copies the result to clipboard while flashing a toast — the Write pane
 * surfaces the result so the writer can paste it back deliberately (keeps
 * the editor's tracked-changes discipline intact).
 *
 * If aiService or the expected hook is missing, the menu still opens but
 * rewrites short-circuit with a toast.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Scissors, AlignLeft, Zap, Type, ArrowRight, Check } from 'lucide-react';
import { useTheme } from '../../loomwright/theme';
import aiService from '../../services/aiService';
import toastService from '../../services/toastService';

const ACTIONS = [
  { id: 'shorten',  label: 'Shorten',  icon: Scissors, prompt: 'Rewrite the following passage in 40% fewer words while keeping voice and meaning.' },
  { id: 'lengthen', label: 'Lengthen', icon: AlignLeft, prompt: 'Expand the following passage by 50% with richer sensory detail, keeping voice and meaning.' },
  { id: 'tighten',  label: 'Tighten',  icon: Zap,      prompt: 'Tighten the following passage: remove filler, crisp verbs, preserve voice and meaning.' },
  { id: 'flip',     label: 'Flip voice', icon: ArrowRight, prompt: 'Rewrite: if the passage is passive, make it active; if active, make it passive. Preserve meaning.' },
  { id: 'vary',     label: 'Vary rhythm', icon: Type,   prompt: 'Rewrite varying sentence length for rhythm without changing meaning.' },
  { id: 'register', label: 'Register',  icon: Check,     prompt: 'Rewrite raising the register one notch — slightly more formal/literary — preserving voice and meaning.' },
];

function getSelectionRect() {
  if (typeof window === 'undefined') return null;
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null;
  const range = sel.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  if (!rect || (rect.width === 0 && rect.height === 0)) return null;
  return { rect, text: String(sel.toString() || '') };
}

export default function SelectionRewriteMenu({ scopeSelector = '.lw-writer-surface' }) {
  const t = useTheme();
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [busy, setBusy] = useState(null);
  const menuRef = useRef(null);

  const tryShow = useCallback(() => {
    const scope = typeof document !== 'undefined' ? document.querySelector(scopeSelector) : null;
    if (!scope) { setVisible(false); return; }
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) { setVisible(false); return; }
    const anchor = sel.anchorNode;
    if (!anchor || !scope.contains(anchor.nodeType === 1 ? anchor : anchor.parentNode)) {
      setVisible(false);
      return;
    }
    const info = getSelectionRect();
    if (!info) { setVisible(false); return; }
    setSelectedText(info.text);
    // position just above the selection, constrained horizontally
    const width = 380;
    const top = Math.max(8, info.rect.top - 52 + (typeof window !== 'undefined' ? 0 : 0));
    const left = Math.min(
      Math.max(8, info.rect.left + info.rect.width / 2 - width / 2),
      (typeof window !== 'undefined' ? window.innerWidth - width - 8 : 1200),
    );
    setPos({ top, left, width });
    setVisible(true);
  }, [scopeSelector]);

  useEffect(() => {
    const onUp = () => { setTimeout(tryShow, 10); };
    const onDown = (e) => {
      if (menuRef.current && menuRef.current.contains(e.target)) return;
      setVisible(false);
    };
    document.addEventListener('mouseup', onUp);
    document.addEventListener('keyup', onUp);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('keyup', onUp);
      document.removeEventListener('mousedown', onDown);
    };
  }, [tryShow]);

  const run = async (action) => {
    if (!selectedText) return;
    setBusy(action.id);
    try {
      let result = null;
      // Prefer a dedicated rewrite API if aiService exposes one.
      if (typeof aiService.rewriteSelection === 'function') {
        result = await aiService.rewriteSelection(selectedText, { action: action.id });
      } else if (typeof aiService.complete === 'function') {
        result = await aiService.complete({
          system: 'You are a precise prose editor. Return ONLY the rewritten passage, nothing else.',
          prompt: `${action.prompt}\n\nPassage:\n${selectedText}`,
        });
      } else if (typeof aiService.generate === 'function') {
        result = await aiService.generate(`${action.prompt}\n\nPassage:\n${selectedText}`);
      }
      if (!result) throw new Error('AI service returned no text');
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(String(result).trim());
      }
      toastService.success?.(`${action.label}: result copied to clipboard. Paste to replace.`);
    } catch (e) {
      console.error('[SelectionRewriteMenu] rewrite failed:', e);
      toastService.error?.('Rewrite failed. Check AI provider keys in Settings.');
    } finally {
      setBusy(null);
      setVisible(false);
    }
  };

  if (!visible) return null;

  return (
    <div
      ref={menuRef}
      role="menu"
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        width: pos.width,
        background: t.paper,
        border: `1px solid ${t.rule}`,
        borderRadius: t.radius,
        boxShadow: '0 12px 36px rgba(0,0,0,0.35)',
        zIndex: 80,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 4,
        padding: 6,
      }}
    >
      {ACTIONS.map((a) => {
        const Icon = a.icon;
        const on = busy === a.id;
        return (
          <button
            key={a.id}
            type="button"
            onClick={() => run(a)}
            disabled={!!busy}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 8px',
              background: on ? t.accent : 'transparent',
              color: on ? t.onAccent : t.ink,
              border: `1px solid ${on ? t.accent : t.rule}`,
              borderRadius: t.radius,
              cursor: busy ? 'wait' : 'pointer',
              fontFamily: t.mono,
              fontSize: 10,
              letterSpacing: 0.08,
              textTransform: 'uppercase',
            }}
          >
            <Icon size={11} /> {a.label}
          </button>
        );
      })}
    </div>
  );
}
