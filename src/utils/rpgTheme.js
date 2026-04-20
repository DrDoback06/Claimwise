/**
 * RPG Theme Utilities
 * Centralized styling functions for modern RPG visual design
 * Combines WoW-style fantasy elements with modern UI aesthetics
 */

/**
 * Get complete rarity styles (border, glow, gradient, text)
 */
export const getRarityStyles = (rarity) => {
  const styles = {
    Common: {
      border: 'border-slate-600',
      borderGlow: 'border-slate-500/50',
      bg: 'bg-slate-900/40',
      bgGradient: 'bg-gradient-to-br from-slate-900/50 to-slate-800/30',
      text: 'text-slate-300',
      textAccent: 'text-slate-400',
      glow: '',
      shadow: 'shadow-lg shadow-slate-900/50',
      glass: 'backdrop-blur-sm bg-slate-900/20'
    },
    Rare: {
      border: 'border-blue-500',
      borderGlow: 'border-blue-400/70',
      bg: 'bg-blue-900/30',
      bgGradient: 'bg-gradient-to-br from-blue-900/40 to-blue-800/20',
      text: 'text-blue-200',
      textAccent: 'text-blue-400',
      glow: 'shadow-[0_0_15px_rgba(59,130,246,0.6)]',
      shadow: 'shadow-lg shadow-blue-900/50',
      glass: 'backdrop-blur-sm bg-blue-900/15'
    },
    Epic: {
      border: 'border-purple-500',
      borderGlow: 'border-purple-400/70',
      bg: 'bg-purple-900/30',
      bgGradient: 'bg-gradient-to-br from-purple-900/40 to-purple-800/20',
      text: 'text-purple-200',
      textAccent: 'text-purple-400',
      glow: 'shadow-[0_0_20px_rgba(147,51,234,0.7)]',
      shadow: 'shadow-lg shadow-purple-900/50',
      glass: 'backdrop-blur-sm bg-purple-900/15'
    },
    Legendary: {
      border: 'border-orange-500',
      borderGlow: 'border-orange-400/80',
      bg: 'bg-orange-900/30',
      bgGradient: 'bg-gradient-to-br from-orange-900/40 via-amber-900/30 to-orange-800/20',
      text: 'text-orange-200',
      textAccent: 'text-orange-400',
      glow: 'shadow-[0_0_25px_rgba(255,165,0,0.8)]',
      shadow: 'shadow-xl shadow-orange-900/60',
      glass: 'backdrop-blur-md bg-orange-900/20',
      pulse: 'animate-pulse-glow'
    },
    Mythic: {
      border: 'border-red-500',
      borderGlow: 'border-red-400/90',
      bg: 'bg-red-900/30',
      bgGradient: 'bg-gradient-to-br from-red-900/40 via-rose-900/30 to-red-800/20',
      text: 'text-red-200',
      textAccent: 'text-red-400',
      glow: 'shadow-[0_0_30px_rgba(255,69,0,0.9)]',
      shadow: 'shadow-2xl shadow-red-900/70',
      glass: 'backdrop-blur-md bg-red-900/25',
      pulse: 'animate-pulse-glow',
      shimmer: 'animate-shimmer'
    }
  };
  return styles[rarity] || styles.Common;
};

/**
 * Get power level-based visual styles
 */
export const getPowerLevelStyles = (powerLevel) => {
  if (powerLevel >= 1000) return getRarityStyles('Mythic');
  if (powerLevel >= 750) return getRarityStyles('Legendary');
  if (powerLevel >= 500) return getRarityStyles('Epic');
  if (powerLevel >= 250) return getRarityStyles('Rare');
  return getRarityStyles('Common');
};

/**
 * Get status-based colors and effects
 */
export const getStatusStyles = (status) => {
  const styles = {
    active: {
      border: 'border-green-500',
      bg: 'bg-green-900/30',
      text: 'text-green-400',
      glow: 'shadow-[0_0_10px_rgba(34,197,94,0.5)]',
      icon: 'text-green-400'
    },
    ongoing: {
      border: 'border-blue-500',
      bg: 'bg-blue-900/30',
      text: 'text-blue-400',
      glow: 'shadow-[0_0_10px_rgba(59,130,246,0.5)]',
      icon: 'text-blue-400'
    },
    paused: {
      border: 'border-yellow-500',
      bg: 'bg-yellow-900/30',
      text: 'text-yellow-400',
      glow: 'shadow-[0_0_10px_rgba(234,179,8,0.5)]',
      icon: 'text-yellow-400'
    },
    resolved: {
      border: 'border-slate-500',
      bg: 'bg-slate-900/30',
      text: 'text-slate-400',
      glow: '',
      icon: 'text-slate-400'
    },
    completed: {
      border: 'border-purple-500',
      bg: 'bg-purple-900/30',
      text: 'text-purple-400',
      glow: 'shadow-[0_0_10px_rgba(147,51,234,0.5)]',
      icon: 'text-purple-400'
    }
  };
  return styles[status] || styles.active;
};

/**
 * Get modern gradient combinations
 */
export const getRPGGradient = (type) => {
  const gradients = {
    'quest-card': 'bg-gradient-to-br from-slate-900/80 via-slate-800/60 to-slate-900/80',
    'item-card': 'bg-gradient-to-br from-slate-900/70 via-slate-800/50 to-slate-900/70',
    'character-card': 'bg-gradient-to-br from-slate-900/90 via-slate-800/70 to-slate-900/90',
    'progress-bar': 'bg-gradient-to-r from-green-500 via-emerald-400 to-green-500',
    'progress-bar-epic': 'bg-gradient-to-r from-purple-500 via-violet-400 to-purple-500',
    'progress-bar-legendary': 'bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500',
    'glass-overlay': 'bg-gradient-to-b from-transparent via-white/5 to-transparent',
    'glow-effect': 'bg-gradient-radial from-white/20 via-transparent to-transparent'
  };
  return gradients[type] || gradients['quest-card'];
};

/**
 * Get glassmorphism styles
 */
export const getGlassmorphismStyles = (intensity = 'medium') => {
  const styles = {
    light: 'backdrop-blur-sm bg-slate-900/10 border border-white/10',
    medium: 'backdrop-blur-md bg-slate-900/20 border border-white/20',
    heavy: 'backdrop-blur-lg bg-slate-900/30 border border-white/30',
    colored: 'backdrop-blur-md bg-slate-900/25 border border-white/25'
  };
  return styles[intensity] || styles.medium;
};

/**
 * Get ornate border styles (WoW-style decorative borders)
 */
export const getOrnateBorderStyles = (rarity = 'Common') => {
  const rarityStyles = getRarityStyles(rarity);
  return {
    base: `border-2 ${rarityStyles.border} ${rarityStyles.borderGlow}`,
    rounded: 'rounded-lg',
    decorative: 'relative before:absolute before:inset-0 before:rounded-lg before:border before:border-white/10 before:pointer-events-none',
    glow: rarityStyles.glow,
    shadow: rarityStyles.shadow
  };
};

/**
 * Get card container styles with modern RPG design
 */
export const getCardContainerStyles = (rarity = 'Common', variant = 'default') => {
  const rarityStyles = getRarityStyles(rarity);
  const glassStyles = getGlassmorphismStyles('medium');
  const borderStyles = getOrnateBorderStyles(rarity);
  const baseStyles = `${glassStyles} ${borderStyles.base} ${borderStyles.rounded} ${rarityStyles.glow} ${rarityStyles.shadow} transition-all duration-300 hover:scale-[1.02] hover:shadow-xl`;
  
  const variants = {
    default: baseStyles,
    interactive: `${baseStyles} cursor-pointer hover:border-opacity-100`,
    quest: `${baseStyles} ${getRPGGradient('quest-card')}`,
    item: `${baseStyles} ${getRPGGradient('item-card')}`,
    character: `${baseStyles} ${getRPGGradient('character-card')}`
  };
  
  return variants[variant] || variants.default;
};

/**
 * Get badge styles (pill-shaped with glassmorphism)
 */
export const getBadgeStyles = (type, color = 'blue') => {
  const colorMap = {
    blue: 'bg-blue-900/30 text-blue-400 border-blue-800/50',
    green: 'bg-green-900/30 text-green-400 border-green-800/50',
    purple: 'bg-purple-900/30 text-purple-400 border-purple-800/50',
    yellow: 'bg-yellow-900/30 text-yellow-400 border-yellow-800/50',
    red: 'bg-red-900/30 text-red-400 border-red-800/50',
    slate: 'bg-slate-900/30 text-slate-400 border-slate-800/50',
    orange: 'bg-orange-900/30 text-orange-400 border-orange-800/50',
    pink: 'bg-pink-900/30 text-pink-400 border-pink-800/50'
  };
  
  return `px-2 py-1 rounded-full text-xs font-semibold border ${colorMap[color] || colorMap.blue} backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:brightness-110`;
};

/**
 * Get progress bar styles with modern gradients
 */
export const getProgressBarStyles = (rarity = 'Common', animated = true) => {
  const rarityStyles = getRarityStyles(rarity);
  const gradient = rarity === 'Epic' 
    ? getRPGGradient('progress-bar-epic')
    : rarity === 'Legendary' || rarity === 'Mythic'
    ? getRPGGradient('progress-bar-legendary')
    : getRPGGradient('progress-bar');
  
  return {
    container: 'w-full bg-slate-800/50 rounded-full h-2.5 overflow-hidden border border-slate-700/50',
    fill: `${gradient} h-full rounded-full transition-all duration-500 ${animated ? 'animate-progress-fill' : ''}`,
    glow: rarityStyles.glow
  };
};

/**
 * Get tooltip container styles
 */
export const getTooltipStyles = () => {
  return `${getGlassmorphismStyles('heavy')} rounded-lg p-3 border border-white/30 shadow-2xl text-sm max-w-xs z-50`;
};

/**
 * Get hover effect styles
 */
export const getHoverEffects = (intensity = 'medium') => {
  const effects = {
    light: 'hover:scale-105 hover:brightness-110 transition-all duration-200',
    medium: 'hover:scale-[1.02] hover:brightness-110 hover:shadow-lg transition-all duration-300',
    strong: 'hover:scale-110 hover:brightness-125 hover:shadow-xl transition-all duration-300',
    lift: 'hover:-translate-y-1 hover:shadow-xl transition-all duration-300'
  };
  return effects[intensity] || effects.medium;
};

/**
 * Get text gradient effect
 */
export const getTextGradient = (color = 'blue') => {
  const gradients = {
    blue: 'bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent',
    purple: 'bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent',
    orange: 'bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent',
    green: 'bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent',
    gold: 'bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-300 bg-clip-text text-transparent'
  };
  return gradients[color] || gradients.blue;
};
