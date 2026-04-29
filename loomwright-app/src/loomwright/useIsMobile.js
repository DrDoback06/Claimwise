/**
 * useIsMobile — tiny responsive helper.
 *
 * Returns { isMobile, isTablet } via matchMedia. Used by the navigation
 * sidebar to collapse to a hamburger below 1024px, and by Write.jsx to stack
 * the editor and Weaver rail vertically below 820px.
 */

import { useEffect, useState } from 'react';

const MOBILE_Q = '(max-width: 820px)';
const TABLET_Q = '(max-width: 1024px)';

function subscribe(query, cb) {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const m = window.matchMedia(query);
  const handler = () => cb(m.matches);
  handler();
  if (m.addEventListener) m.addEventListener('change', handler);
  else m.addListener(handler);
  return () => {
    if (m.removeEventListener) m.removeEventListener('change', handler);
    else m.removeListener(handler);
  };
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  useEffect(() => {
    const off1 = subscribe(MOBILE_Q, setIsMobile);
    const off2 = subscribe(TABLET_Q, setIsTablet);
    return () => { off1(); off2(); };
  }, []);
  return { isMobile, isTablet };
}

export default useIsMobile;
