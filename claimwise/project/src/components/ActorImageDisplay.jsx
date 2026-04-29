import React, { useState, useEffect } from 'react';
import imageGenerationService from '../../services/imageGenerationService';

/**
 * Actor Image Display Component
 * Shows character portrait for current chapter
 */
const ActorImageDisplay = ({ actor, bookTab, currentChapter, books }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (!actor) {
      setImageUrl(null);
      setLoading(false);
      return;
    }
    
    const currentBook = books && books[bookTab];
    const currentCh = currentBook?.chapters?.find(c => c.id === currentChapter);
    const imageKey = currentCh ? `image_${currentCh.id}` : 'imagePath';
    const actorImagePath = actor[imageKey] || actor.imagePath;
    
    console.log('ActorImageDisplay - Loading image:', { 
      actorId: actor.id, 
      bookTab, 
      currentChapter, 
      imageKey, 
      actorImagePath,
      actorKeys: Object.keys(actor).filter(k => k.startsWith('image'))
    });
    
    if (actorImagePath) {
      setLoading(true);
      imageGenerationService.getImageUrl(actorImagePath)
        .then(url => {
          console.log('ActorImageDisplay - Image loaded successfully:', url);
          setImageUrl(url);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to load actor image:', err);
          setImageUrl(null);
          setLoading(false);
        });
    } else {
      console.log('ActorImageDisplay - No image path found');
      setImageUrl(null);
      setLoading(false);
    }
  }, [actor?.id, bookTab, currentChapter, actor?.imagePath, actor]);
  
  // Always show the container, even if no image (for consistency)
  
  const currentBook = books[bookTab];
  const currentCh = currentBook?.chapters?.find(c => c.id === currentChapter);
  
  return (
    <div className="mb-6 p-4 bg-slate-950 border border-blue-700 rounded-lg">
      <div className="text-xs font-bold text-blue-400 mb-2 uppercase">Character Portrait</div>
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      ) : imageUrl ? (
        <>
          <div className="flex justify-center">
            <img 
              src={imageUrl} 
              alt={`${actor.name} portrait`}
              className="max-w-xs max-h-64 rounded-lg border-2 border-blue-500/50 shadow-xl object-contain bg-slate-900/50 p-2"
            />
          </div>
          {currentCh && (
            <div className="text-xs text-slate-400 mt-2 text-center">
              Chapter {currentCh.id}: {currentCh.title}
            </div>
          )}
        </>
      ) : (
        <div className="flex items-center justify-center h-48 text-slate-500 text-xs">
          No portrait generated yet
        </div>
      )}
    </div>
  );
};

export default ActorImageDisplay;

