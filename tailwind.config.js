/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // Loomwright token-mapped colors. Lets new components say `bg-lw-bg`,
      // `text-lw-ink`, `border-lw-rule` and have them flip with Night/Day via
      // the bridge CSS. Values reference CSS custom properties defined in
      // src/styles/loomwright-bridge.css under body[data-lw-theme="..."].
      colors: {
        lw: {
          bg: 'var(--lw-bg)',
          paper: 'var(--lw-paper)',
          paper2: 'var(--lw-paper2)',
          sidebar: 'var(--lw-sidebar)',
          ink: 'var(--lw-ink)',
          'ink-2': 'var(--lw-ink-2)',
          'ink-3': 'var(--lw-ink-3)',
          rule: 'var(--lw-rule)',
          accent: 'var(--lw-accent)',
          'accent-soft': 'var(--lw-accent-soft)',
          'accent-2': 'var(--lw-accent-2)',
          good: 'var(--lw-good)',
          warn: 'var(--lw-warn)',
          bad: 'var(--lw-bad)',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
  safelist: [
    { pattern: /text-(green|blue|red|purple|yellow|pink|gray|slate|orange|cyan|emerald|violet|amber|rose)-(300|400|500|600)/ },
    { pattern: /bg-(green|blue|red|purple|yellow|pink|gray|slate|orange|cyan|emerald|violet|amber|rose)-(300|400|500|600|700|800|900)/ },
    { pattern: /border-(green|blue|red|purple|yellow|pink|gray|slate|orange|cyan|emerald|violet|amber|rose)-(300|400|500|600|700|800)/ },
    'glass-light','glass-medium','glass-heavy','ornate-border','ornate-border-corner','quest-tooltip','custom-scrollbar','glow-effect','gradient-overlay','hover-smooth','card-depth','card-depth-hover','text-shadow-soft','text-shadow-glow','badge-pill','progress-bar-modern','glow-common','glow-rare','glow-epic','glow-legendary','glow-mythic','font-rpg','font-rpg-title',
    'animate-pulse-glow','animate-float','animate-shimmer','animate-unlock','animate-particle-burst','animate-progress-fill','animate-glow-pulse','animate-border-glow','animate-fade-in-up','animate-slide-in-right','animate-scale-in','hover-lift','hover-glow','animate-gradient',
    'loomwright-onboarding',
  ],
}
