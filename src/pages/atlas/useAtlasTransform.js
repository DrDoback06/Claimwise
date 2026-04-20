/**
 * useAtlasTransform - pan + zoom state for an SVG atlas viewport.
 *
 * Stores transform per-region key in localStorage so the user returns to
 * their last zoom/pan when switching regions. Produces handlers you can
 * spread onto an SVG root element.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'lw-atlas-transform';

function loadAll() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
}

function saveAll(store) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); }
  catch (_e) { /* noop */ }
}

export default function useAtlasTransform(regionKey = 'default') {
  const [transform, setTransform] = useState(() => {
    const all = loadAll();
    return all[regionKey] || { x: 0, y: 0, scale: 1 };
  });
  const panning = useRef(null); // { startX, startY, origX, origY }
  const suppressClick = useRef(false);

  useEffect(() => {
    const all = loadAll();
    all[regionKey] = transform;
    saveAll(all);
  }, [transform, regionKey]);

  const onWheel = useCallback((e) => {
    if (!e.ctrlKey && !e.metaKey && !e.altKey && e.deltaY === 0) return;
    // Allow plain wheel to zoom. Scroll direction: down -> zoom out.
    e.preventDefault();
    const delta = -e.deltaY * 0.0015;
    setTransform((prev) => {
      const nextScale = Math.min(6, Math.max(0.4, prev.scale * (1 + delta)));
      // Zoom toward cursor.
      const host = e.currentTarget.getBoundingClientRect();
      const mx = e.clientX - host.left;
      const my = e.clientY - host.top;
      const worldX = (mx - prev.x) / prev.scale;
      const worldY = (my - prev.y) / prev.scale;
      const nx = mx - worldX * nextScale;
      const ny = my - worldY * nextScale;
      return { x: nx, y: ny, scale: nextScale };
    });
  }, []);

  const onMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    // Only pan when the mousedown lands on the SVG surface, not a child
    // (pins, polygons, etc. have their own handlers).
    if (e.target !== e.currentTarget && !e.target.classList?.contains?.('lw-atlas-base')) return;
    panning.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: transform.x,
      origY: transform.y,
    };
  }, [transform]);

  const onMouseMove = useCallback((e) => {
    if (!panning.current) return;
    const dx = e.clientX - panning.current.startX;
    const dy = e.clientY - panning.current.startY;
    if (Math.abs(dx) + Math.abs(dy) > 4) suppressClick.current = true;
    setTransform((prev) => ({
      ...prev,
      x: panning.current.origX + dx,
      y: panning.current.origY + dy,
    }));
  }, []);

  const stopPan = useCallback(() => {
    panning.current = null;
    setTimeout(() => { suppressClick.current = false; }, 40);
  }, []);

  const reset = useCallback(() => {
    setTransform({ x: 0, y: 0, scale: 1 });
  }, []);

  const zoomBy = useCallback((factor) => {
    setTransform((prev) => ({
      ...prev,
      scale: Math.min(6, Math.max(0.4, prev.scale * factor)),
    }));
  }, []);

  const shouldSuppressClick = () => suppressClick.current;

  return {
    transform,
    setTransform,
    reset,
    zoomBy,
    shouldSuppressClick,
    handlers: {
      onWheel,
      onMouseDown,
      onMouseMove,
      onMouseUp: stopPan,
      onMouseLeave: stopPan,
    },
  };
}
