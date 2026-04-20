/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  safelist: [
    { pattern: /text-(green|blue|red|purple|yellow|pink|gray|slate|orange|cyan|emerald|violet|amber|rose)-(300|400|500|600)/ },
    { pattern: /bg-(green|blue|red|purple|yellow|pink|gray|slate|orange|cyan|emerald|violet|amber|rose)-(300|400|500|600|700|800|900)/ },
    { pattern: /border-(green|blue|red|purple|yellow|pink|gray|slate|orange|cyan|emerald|violet|amber|rose)-(300|400|500|600|700|800)/ },
    'glass-light','glass-medium','glass-heavy','ornate-border','ornate-border-corner','quest-tooltip','custom-scrollbar','glow-effect','gradient-overlay','hover-smooth','card-depth','card-depth-hover','text-shadow-soft','text-shadow-glow','badge-pill','progress-bar-modern','glow-common','glow-rare','glow-epic','glow-legendary','glow-mythic','font-rpg','font-rpg-title',
    'animate-pulse-glow','animate-float','animate-shimmer','animate-unlock','animate-particle-burst','animate-progress-fill','animate-glow-pulse','animate-border-glow','animate-fade-in-up','animate-slide-in-right','animate-scale-in','hover-lift','hover-glow','animate-gradient',
  ],
}
