// Viewport-width hook. Returns booleans for the two breakpoints the
// shell cares about: `mobile` (compact toolbar + bottom tabbar) and
// `narrow` (toolbar collapses chapter strip into its own row but
// individual buttons still fit).

import React from 'react';

const MOBILE_PX = 860;
const NARROW_PX = 1100;

function read() {
  if (typeof window === 'undefined') return { width: 1280, mobile: false, narrow: false };
  const w = window.innerWidth || 1280;
  return { width: w, mobile: w <= MOBILE_PX, narrow: w <= NARROW_PX };
}

export default function useViewport() {
  const [v, setV] = React.useState(read);
  React.useEffect(() => {
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setV(read()));
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);
  return v;
}
