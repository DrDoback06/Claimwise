/**
 * Full Paper Doll View Component
 * Diablo-style paper doll with all equipment slots
 */

import React, { useState } from 'react';
import { 
  Shield, HardHat, Shirt, Hand, Footprints, Sword, 
  Gem, Crown, Zap, Package, Users
} from 'lucide-react';
import { getRarityStyles, getHoverEffects } from '../utils/rpgTheme';
import '../styles/rpgComponents.css';
import '../styles/rpgAnimations.css';

const PaperDollView = ({ actor, items, onSlotClick, onItemHover }) => {
  const equipment = actor?.equipment || {};
  const slots = [
    { key: 'helm', label: 'Helm', icon: HardHat, position: 'top-0 left-1/2 -translate-x-1/2' },
    { key: 'cape', label: 'Cape', icon: Shield, position: 'top-12 left-0' },
    { key: 'amulet', label: 'Amulet', icon: Gem, position: 'top-12 left-1/2 -translate-x-1/2' },
    { key: 'armour', label: 'Armour', icon: Shirt, position: 'top-24 left-1/2 -translate-x-1/2' },
    { key: 'leftHand', label: 'Left Hand', icon: Sword, position: 'top-36 left-0' },
    { key: 'rightHand', label: 'Right Hand', icon: Sword, position: 'top-36 right-0' },
    { key: 'gloves', label: 'Gloves', icon: Hand, position: 'top-48 left-1/2 -translate-x-1/2' },
    { key: 'belt', label: 'Belt', icon: Package, position: 'top-60 left-1/2 -translate-x-1/2' },
    { key: 'boots', label: 'Boots', icon: Footprints, position: 'top-72 left-1/2 -translate-x-1/2' },
    { key: 'rings', label: 'Rings', icon: Crown, position: 'bottom-0 left-1/2 -translate-x-1/2', isArray: true },
    { key: 'charms', label: 'Charms', icon: Zap, position: 'bottom-12 left-1/2 -translate-x-1/2', isArray: true }
  ];

  /**
   * Get item for slot
   */
  const getSlotItem = (slot) => {
    if (slot.isArray) {
      const slotItems = equipment[slot.key] || [];
      return slotItems.filter(Boolean).map(id => items.find(i => i.id === id)).filter(Boolean);
    }
    const itemId = equipment[slot.key];
    return itemId ? items.find(i => i.id === itemId) : null;
  };


  return (
    <div className="relative w-full max-w-lg mx-auto">
      {/* Paper Doll Container - WoW-style ornate fantasy frame */}
      {/* #region agent log */}
      {(() => {
        try {
          fetch('http://127.0.0.1:7243/ingest/7f220f75-c016-4c9b-b964-8e91314a01c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PaperDollView.jsx:45',message:'Rendering PaperDoll container',data:{hasActor:!!actor,itemsCount:items?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        } catch(e) {}
        return null;
      })()}
      {/* #endregion */}
      <div 
        className="relative glass-heavy rounded-xl p-10 border-4 border-slate-700/80 ornate-border shadow-2xl" 
        style={{
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          background: 'rgba(15, 23, 42, 0.3)',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          position: 'relative'
        }}
      >
        {/* Decorative corner elements */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-yellow-500/50 rounded-tl-lg" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-yellow-500/50 rounded-tr-lg" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-yellow-500/50 rounded-bl-lg" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-yellow-500/50 rounded-br-lg" />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-800/60 to-slate-900/80 rounded-xl pointer-events-none" />
        
        {/* Character Silhouette Placeholder - Animated */}
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <div className="relative">
            <Users className="w-40 h-40 text-slate-500 animate-float" />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent rounded-full blur-xl" />
          </div>
        </div>

        {/* Equipment Slots - Modern ornate frames */}
        {slots.map((slot) => {
          // #region agent log
          try {
            fetch('http://127.0.0.1:7243/ingest/7f220f75-c016-4c9b-b964-8e91314a01c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PaperDollView.jsx:66',message:'Processing slot',data:{slotKey:slot.key},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          } catch(e) {}
          // #endregion
          const slotItem = getSlotItem(slot);
          const SlotIcon = slot.icon;
          const rarity = slotItem ? (Array.isArray(slotItem) ? slotItem[0]?.rarity : slotItem.rarity) : null;
          // #region agent log
          let rarityStyles = null;
          try {
            rarityStyles = rarity ? getRarityStyles(rarity) : null;
            fetch('http://127.0.0.1:7243/ingest/7f220f75-c016-4c9b-b964-8e91314a01c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PaperDollView.jsx:70',message:'Got rarity styles',data:{rarity,hasStyles:!!rarityStyles,border:rarityStyles?.border},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
          } catch(error) {
            fetch('http://127.0.0.1:7243/ingest/7f220f75-c016-4c9b-b964-8e91314a01c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PaperDollView.jsx:70',message:'getRarityStyles error',data:{rarity,error:error.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
          }
          // #endregion

          return (
            <div
              key={slot.key}
              className={`absolute ${slot.position} w-20 h-20 rounded-lg border-2 ${
                slotItem 
                  ? `${rarityStyles?.border || 'border-blue-500'} ${rarityStyles?.glow || ''} bg-slate-800/70 hover:bg-slate-800 cursor-pointer ${(() => {
                      // #region agent log
                      try {
                        const hover = getHoverEffects('medium');
                        fetch('http://127.0.0.1:7243/ingest/7f220f75-c016-4c9b-b964-8e91314a01c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PaperDollView.jsx:74',message:'Got hover effects',data:{hoverEffects:hover},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
                        return hover;
                      } catch(error) {
                        fetch('http://127.0.0.1:7243/ingest/7f220f75-c016-4c9b-b964-8e91314a01c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PaperDollView.jsx:74',message:'getHoverEffects error',data:{error:error.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
                        return 'transition-all';
                      }
                      // #endregion
                    })()} group` 
                  : 'border-slate-700/50 bg-slate-950/60 hover:bg-slate-900/80 hover:border-slate-600 cursor-pointer transition-all'
              } flex items-center justify-center relative overflow-hidden`}
              onClick={() => onSlotClick?.(slot.key)}
              onMouseEnter={() => slotItem && onItemHover?.(slotItem)}
              onMouseLeave={() => onItemHover?.(null)}
              title={slot.label}
            >
              {/* Slot background glow for equipped items */}
              {slotItem && rarityStyles && (
                <div className={`absolute inset-0 ${rarityStyles.bgGradient} opacity-40 rounded-lg`} />
              )}
              
              {/* Glassmorphism overlay */}
              <div className="absolute inset-0 glass-light rounded-lg pointer-events-none" />
              
              {/* Ornate corner decorations for equipped slots */}
              {slotItem && (
                <>
                  <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-yellow-400/60 rounded-tl" />
                  <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-yellow-400/60 rounded-tr" />
                  <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-yellow-400/60 rounded-bl" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-yellow-400/60 rounded-br" />
                </>
              )}
              
              {/* Shimmer effect for legendary+ */}
              {slotItem && (rarity === 'Legendary' || rarity === 'Mythic') && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer pointer-events-none rounded-lg" />
              )}
              
              <div className="relative z-10 w-full h-full flex items-center justify-center">
                {slotItem ? (
                  <div className="text-center px-1">
                    <div className={`text-[10px] font-bold text-white text-shadow-soft truncate ${rarityStyles?.text || 'text-white'}`}>
                      {Array.isArray(slotItem) 
                        ? slotItem[0]?.name?.substring(0, 6) || 'Item'
                        : slotItem.name?.substring(0, 6) || 'Item'}
                    </div>
                    {Array.isArray(slotItem) && slotItem.length > 1 && (
                      <div className="text-[8px] text-yellow-400 mt-0.5">+{slotItem.length - 1}</div>
                    )}
                  </div>
                ) : (
                  <SlotIcon className={`w-8 h-8 ${slotItem ? 'text-blue-400' : 'text-slate-600'} group-hover:text-slate-400 transition-colors`} />
                )}
              </div>
              
              {/* Hover tooltip indicator */}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity animate-pulse" />
            </div>
          );
        })}
      </div>

      {/* Slot Labels - Modern styling */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        {slots.map(slot => (
          <div 
            key={slot.key} 
            className="text-center glass-light rounded-lg p-2 border border-slate-700/50"
          >
            <div className="text-xs text-slate-300 font-semibold uppercase tracking-wider">
              {slot.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaperDollView;
