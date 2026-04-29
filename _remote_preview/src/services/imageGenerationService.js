/**
 * Image Generation Service
 * Handles AI-generated images via DALL-E API and local image storage
 */

class ImageGenerationService {
  constructor() {
    // Runtime-only key (never persisted in browser storage)
    this.apiKey = '';
    this.baseUrl = 'https://api.openai.com/v1/images/generations';
    this.imageBasePath = '/images';
  }

  /**
   * Set OpenAI API key
   */
  setApiKey(key) {
    this.apiKey = key;
  }

  /**
   * Refresh API key from localStorage (call after Settings update)
   */
  refreshApiKey() {
    // Intentionally no-op: key storage is runtime/session only.
  }

  /**
   * Get API key (refresh from localStorage each time)
   */
  getApiKey() {
    this.refreshApiKey();
if (!this.apiKey) {
      throw new Error('OpenAI API key not set. Please configure in Settings (OpenAI API Key for DALL-E).');
    }
    return this.apiKey;
  }

  /**
   * Generate item image using DALL-E
   */
  async generateItemImage(itemData) {
    let apiKey;
    try {
      apiKey = this.getApiKey();
    } catch (error) {
      throw new Error('OpenAI API key not configured. Please set your API key in Settings.');
    }

    if (!apiKey || apiKey.trim() === '') {
      throw new Error('OpenAI API key is empty. Please configure it in Settings.');
    }

    // Validate API key format (should start with sk-)
    if (!apiKey.startsWith('sk-')) {
      throw new Error('Invalid API key format. OpenAI API keys should start with "sk-". Please check your Settings.');
    }

    try {
      const prompt = this.buildItemPrompt(itemData);
      
      console.log('Generating image with prompt:', prompt.substring(0, 100) + '...');
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: prompt,
          n: 1,
          size: '1024x1024',
          quality: 'standard',
          style: 'vivid'
        })
      });

      if (!response.ok) {
        let errorMessage = 'Image generation failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error?.message || errorData.message || errorMessage;
          console.error('OpenAI API Error:', errorData);
        } catch (e) {
          console.error('Failed to parse error response:', e);
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (!data.data || !data.data[0] || !data.data[0].url) {
        throw new Error('Invalid response from OpenAI API. No image URL received.');
      }

      const imageUrl = data.data[0].url;

      // Save image to local storage
      const filename = `item_${itemData.id || Date.now()}.png`;
      const localPath = await this.saveImageToLocal(imageUrl, `items/${filename}`);

      return localPath;
    } catch (error) {
      console.error('Item image generation error:', error);
      
      // Provide more helpful error messages
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Network error: Could not connect to OpenAI API. Please check your internet connection and try again.');
      } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        throw new Error('Invalid API key. Please check your OpenAI API key in Settings.');
      } else if (error.message.includes('429') || error.message.includes('rate limit')) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      } else if (error.message.includes('insufficient_quota')) {
        throw new Error('API quota exceeded. Please check your OpenAI account billing.');
      }
      
      throw error;
    }
  }

  /**
   * Generate skill symbol using DALL-E
   */
  async generateSkillSymbol(skillData) {
    let apiKey;
    try {
      apiKey = this.getApiKey();
    } catch (error) {
      throw new Error('OpenAI API key not configured. Please set your API key in Settings.');
    }

    if (!apiKey || apiKey.trim() === '') {
      throw new Error('OpenAI API key is empty. Please configure it in Settings.');
    }

    try {
      let prompt = this.buildSkillPrompt(skillData);
      let attempt = 1;
      const maxAttempts = 2;
      let response = null;
      
      while (attempt <= maxAttempts) {
response = await fetch(this.baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'dall-e-3',
            prompt: prompt,
            n: 1,
            size: '1024x1024',
            quality: 'standard',
            style: 'vivid'
          })
        }).catch((fetchError) => {
throw fetchError;
        });
if (!response.ok) {
          let errorMessage = 'Symbol generation failed';
          let errorData = null;
          try {
            errorData = await response.json();
            errorMessage = errorData.error?.message || errorData.message || errorMessage;
// If it's a safety system rejection and we haven't tried the fallback yet
            if ((errorMessage.includes('safety system') || errorMessage.includes('content policy') || errorMessage.includes('rejected')) && attempt < maxAttempts) {
              // Use an even more generic prompt
              prompt = 'Minimalist UI symbol icon, simple geometric design, single color, dark fantasy game interface style, clean abstract symbol';
              attempt++;
              continue; // Retry with simpler prompt
            }
          } catch (e) {
            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
}
          
          // If it's a safety system rejection after all attempts, provide a more helpful message
          if (errorMessage.includes('safety system') || errorMessage.includes('content policy')) {
            throw new Error(`Image generation was blocked by safety filters. Try using a more generic skill name or description. Original error: ${errorMessage}`);
          }
          
          throw new Error(errorMessage);
        }
        
        // Success - break out of retry loop
        break;
      }

      const data = await response.json();
      
      if (!data.data || !data.data[0] || !data.data[0].url) {
        throw new Error('Invalid response from OpenAI API. No image URL received.');
      }

      const imageUrl = data.data[0].url;

      // Save image to local storage
      const filename = `skill_${skillData.id || Date.now()}.png`;
      const localPath = await this.saveImageToLocal(imageUrl, `skills/${filename}`);

      return localPath;
    } catch (error) {
      console.error('Skill symbol generation error:', error);
      
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Network error: Could not connect to OpenAI API. Please check your internet connection.');
      }
      
      throw error;
    }
  }

  /**
   * Generate book symbol
   */
  async generateBookSymbol(bookData) {
    const apiKey = this.getApiKey();

    try {
      const prompt = `Minimalist symbol icon representing "${bookData.title || 'book'}", dark fantasy theme, game UI style, simple geometric design, single color scheme`;
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: prompt,
          n: 1,
          size: '1024x1024',
          quality: 'standard',
          style: 'vivid'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Book symbol generation failed');
      }

      const data = await response.json();
      const imageUrl = data.data[0].url;

      const filename = `book_${bookData.id || Date.now()}.png`;
      const localPath = await this.saveImageToLocal(imageUrl, `books/${filename}`);

      return localPath;
    } catch (error) {
      console.error('Book symbol generation error:', error);
      throw error;
    }
  }

  /**
   * Generate chapter symbol
   */
  async generateChapterSymbol(chapterData, bookTitle = '') {
    const apiKey = this.getApiKey();

    try {
      const prompt = `Minimalist symbol icon representing "${chapterData.title || 'chapter'}" from "${bookTitle}", dark fantasy theme, game UI style, simple geometric design, single color scheme`;
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: prompt,
          n: 1,
          size: '1024x1024',
          quality: 'standard',
          style: 'vivid'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Chapter symbol generation failed');
      }

      const data = await response.json();
      const imageUrl = data.data[0].url;

      const filename = `chapter_${chapterData.id || Date.now()}.png`;
      const localPath = await this.saveImageToLocal(imageUrl, `chapters/${filename}`);

      return localPath;
    } catch (error) {
      console.error('Chapter symbol generation error:', error);
      throw error;
    }
  }

  /**
   * Generate actor/character image with full context
   */
  async generateActorImage(actorData, context = {}) {
    const apiKey = this.getApiKey();

    if (!apiKey || apiKey.trim() === '' || !apiKey.startsWith('sk-')) {
      throw new Error('OpenAI API key not configured. Please set your API key in Settings.');
    }

    try {
      const prompt = this.buildActorPrompt(actorData, context);
      
      console.log('Generating actor image with prompt:', prompt.substring(0, 150) + '...');
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: prompt,
          n: 1,
          size: '1024x1024',
          quality: 'standard',
          style: 'vivid'
        })
      });

      if (!response.ok) {
        let errorMessage = 'Actor image generation failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error?.message || errorData.message || errorMessage;
          console.error('OpenAI API Error:', errorData);
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (!data.data || !data.data[0] || !data.data[0].url) {
        throw new Error('Invalid response from OpenAI API. No image URL received.');
      }

      const imageUrl = data.data[0].url;

      // Save image to local storage
      const filename = `actor_${actorData.id || Date.now()}_${context.chapterId || 'snapshot'}.png`;
      const localPath = await this.saveImageToLocal(imageUrl, `actors/${filename}`);

      return localPath;
    } catch (error) {
      console.error('Actor image generation error:', error);
      throw error;
    }
  }

  /**
   * Build actor image prompt with full context
   */
  buildActorPrompt(actorData, context = {}) {
    const name = actorData.name || '';
    const desc = actorData.desc || actorData.description || '';
    const role = actorData.role || '';
    const classType = actorData.class || '';
    const baseStats = actorData.baseStats || {};
    const additionalStats = actorData.additionalStats || {};
    const equipment = context.equipment || {};
    const skills = context.skills || [];
    const chapterContext = context.chapterContext || '';
    
    // Build character description
    let characterDesc = '';
    
    if (name) {
      characterDesc += name;
      if (role) characterDesc += `, ${role}`;
      if (classType) characterDesc += `, ${classType}`;
    }
    
    // Add physical description
    if (desc) {
      const safeDesc = this.sanitizePrompt(desc).substring(0, 200);
      if (safeDesc) {
        characterDesc += `. ${safeDesc}`;
      }
    }
    
    // Add equipment description
    const equipmentItems = [];
    if (equipment.helm) equipmentItems.push('helmet');
    if (equipment.armour) equipmentItems.push('armor');
    if (equipment.leftHand || equipment.rightHand) equipmentItems.push('weapon');
    if (equipment.boots) equipmentItems.push('boots');
    if (equipment.gloves) equipmentItems.push('gloves');
    if (equipment.belt) equipmentItems.push('belt');
    if (equipment.cape) equipmentItems.push('cape');
    if (equipment.amulet) equipmentItems.push('amulet');
    
    if (equipmentItems.length > 0) {
      characterDesc += `. Wearing ${equipmentItems.join(', ')}`;
    }
    
    // Add stats context (for visual representation)
    const mainStats = [];
    if (baseStats.STR > 50) mainStats.push('very strong');
    if (baseStats.INT > 50) mainStats.push('intelligent');
    if (baseStats.DEX > 50) mainStats.push('agile');
    if (baseStats.VIT > 50) mainStats.push('tough');
    
    if (mainStats.length > 0) {
      characterDesc += `. ${mainStats.join(', ')}`;
    }
    
    // Add chapter context if available
    if (chapterContext) {
      const safeContext = this.sanitizePrompt(chapterContext).substring(0, 100);
      if (safeContext) {
        characterDesc += `. Current situation: ${safeContext}`;
      }
    }
    
    // Build full prompt
    let prompt = `2D digital illustration, character portrait, Diablo II meets Hearthstone art style, dark fantasy bureaucratic apocalypse theme`;
    
    if (characterDesc) {
      prompt += `, ${characterDesc}`;
    }
    
    prompt += ', detailed character artwork, full body or portrait view, rich colors, game asset quality, The Compliance Run style';
    
    return prompt;
  }

  /**
   * Build item generation prompt (uses actual item data)
   */
  buildItemPrompt(itemData) {
    const rarity = itemData.rarity || 'Common';
    // Use the specific item type (itemClass) first, fallback to baseType
    const type = itemData.type || itemData.baseType || 'item';
    const baseType = itemData.baseType || '';
    const name = itemData.name || '';
    const desc = itemData.desc || itemData.description || '';
    const stats = itemData.stats || {};
    
    // Build detailed description from item data
    let itemDescription = '';
    const safeType = type.toLowerCase();
    const safeBaseType = baseType.toLowerCase();
    
    // Determine item category - check specific type first, then baseType
    if (safeType.includes('sword') || safeType.includes('blade')) {
      itemDescription = 'fantasy sword';
    } else if (safeType.includes('bow')) {
      itemDescription = 'fantasy bow';
    } else if (safeType.includes('axe')) {
      itemDescription = 'fantasy axe';
    } else if (safeType.includes('hammer') || safeType.includes('mace')) {
      itemDescription = 'fantasy hammer';
    } else if (safeType.includes('dagger')) {
      itemDescription = 'fantasy dagger';
    } else if (safeType.includes('staff') || safeType.includes('wand')) {
      itemDescription = 'fantasy staff';
    } else if (safeType.includes('shield')) {
      itemDescription = 'fantasy shield';
    } else if (safeBaseType === 'weapon' || safeType.includes('weapon')) {
      itemDescription = 'fantasy weapon';
    } else if (safeType.includes('armor') || safeType.includes('armour') || safeType.includes('chest')) {
      itemDescription = 'fantasy armor piece';
    } else if (safeType.includes('helm') || safeType.includes('hat')) {
      itemDescription = 'fantasy helmet';
    } else if (safeType.includes('boots') || safeType.includes('shoes')) {
      itemDescription = 'fantasy boots';
    } else if (safeType.includes('gloves') || safeType.includes('gauntlets')) {
      itemDescription = 'fantasy gloves';
    } else if (safeType.includes('belt')) {
      itemDescription = 'fantasy belt';
    } else if (safeType.includes('ring')) {
      itemDescription = 'fantasy ring';
    } else if (safeType.includes('amulet') || safeType.includes('necklace')) {
      itemDescription = 'fantasy amulet';
    } else if (safeType.includes('cape') || safeType.includes('cloak')) {
      itemDescription = 'fantasy cape';
    } else if (safeType.includes('potion') || safeType.includes('consumable')) {
      itemDescription = 'fantasy consumable potion';
    } else if (safeType.includes('shield')) {
      itemDescription = 'fantasy shield';
    } else {
      itemDescription = 'fantasy game item';
    }
    
    // Build stat description
    const statDesc = Object.entries(stats)
      .filter(([key, val]) => key !== 'CAPACITY' && typeof val === 'number')
      .map(([key, val]) => `${val > 0 ? '+' : ''}${val} ${key}`)
      .join(', ');
    
    // Create rich prompt with item details
    let prompt = `2D digital illustration, Diablo II meets Hearthstone art style, ${rarity} ${itemDescription}`;
    
    if (name) {
      // Sanitize name for prompt
      const safeName = name.replace(/[^\w\s-]/g, ' ').trim().substring(0, 50);
      if (safeName) {
        prompt += ` named "${safeName}"`;
      }
    }
    
    if (desc) {
      // Use description but sanitize it
      const safeDesc = this.sanitizePrompt(desc).substring(0, 100);
      if (safeDesc) {
        prompt += `, ${safeDesc}`;
      }
    }
    
    if (statDesc) {
      prompt += `, ${statDesc}`;
    }
    
    prompt += ', dark fantasy bureaucratic apocalypse theme, isolated item on transparent background, no card frame or border, just the item itself, isometric view, rich colors, game asset quality, Diablo II style';
    
    return prompt;
  }

  /**
   * Sanitize prompt text to avoid safety filter triggers
   * Keeps content but makes it safer for AI content filters
   */
  sanitizePrompt(text) {
    if (!text) return '';
    // Clean up text but keep meaningful content
    let sanitized = text
      .replace(/[^\w\s\-]/g, ' ') // Remove special characters except hyphens
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    // Replace potentially problematic terms with safer alternatives
    const replacements = {
      'kill': 'defeat',
      'death': 'end',
      'blood': 'life',
      'violence': 'combat',
      'weapon': 'tool',
      'attack': 'strike',
      'damage': 'effect',
      'destroy': 'remove',
      'harm': 'affect'
    };
    
    Object.entries(replacements).forEach(([term, replacement]) => {
      sanitized = sanitized.replace(new RegExp(`\\b${term}\\b`, 'gi'), replacement);
    });
    
    return sanitized.trim() || 'game ability';
  }

  /**
   * Build skill symbol prompt (uses actual skill data)
   */
  buildSkillPrompt(skillData) {
    const type = skillData.type || 'Skill';
    const name = skillData.name || '';
    const desc = skillData.desc || skillData.description || '';
    const statMod = skillData.statMod || {};
    const tier = skillData.tier || 1;
    
    const skillType = type.toLowerCase();
    
    // Determine skill category
    let skillCategory = 'game ability';
    if (skillType.includes('combat') || skillType.includes('strike') || skillType.includes('attack')) {
      skillCategory = 'combat ability';
    } else if (skillType.includes('magic') || skillType.includes('spell') || skillType.includes('magical')) {
      skillCategory = 'magical ability';
    } else if (skillType.includes('social') || skillType.includes('dialogue')) {
      skillCategory = 'social ability';
    } else if (skillType.includes('passive')) {
      skillCategory = 'passive ability';
    } else if (skillType.includes('aura')) {
      skillCategory = 'aura ability';
    } else if (skillType.includes('crowd control') || skillType.includes('control')) {
      skillCategory = 'control ability';
    } else if (skillType.includes('support') || skillType.includes('heal')) {
      skillCategory = 'support ability';
    }
    
    // Build prompt with skill details
    let prompt = `Minimalist UI symbol icon for a ${skillCategory}`;
    
    if (name) {
      const safeName = this.sanitizePrompt(name).substring(0, 40);
      if (safeName) {
        prompt += ` called "${safeName}"`;
      }
    }
    
    if (desc) {
      const safeDesc = this.sanitizePrompt(desc).substring(0, 60);
      if (safeDesc) {
        prompt += `, ${safeDesc}`;
      }
    }
    
    // Add tier/level info
    if (tier > 1) {
      prompt += `, tier ${tier}`;
    }
    
    // Add stat modifiers if any
    const statModDesc = Object.entries(statMod)
      .filter(([key, val]) => typeof val === 'number' && val !== 0)
      .map(([key, val]) => `${val > 0 ? '+' : ''}${val} ${key}`)
      .join(', ');
    
    if (statModDesc) {
      prompt += `, ${statModDesc}`;
    }
    
    prompt += ', simple geometric design, single color scheme, dark fantasy game interface style, clean abstract symbol, game UI element, Diablo II skill icon style';
    
    return prompt;
  }

  /**
   * Save image from URL to local filesystem
   * Note: In browser environment, we'll use base64 and store in IndexedDB
   * Uses canvas approach to bypass CORS restrictions on OpenAI blob URLs
   */
  async saveImageToLocal(imageUrl, relativePath) {
    try {
// OpenAI blob URLs have CORS restrictions, so we need to use a proxy
      // Try CORS proxy first since direct fetch will fail
      let base64Data;
      let blob;
      
      // Try multiple CORS proxy services as fallbacks
      const proxyServices = [
        `https://api.allorigins.win/raw?url=${encodeURIComponent(imageUrl)}`,
        `https://corsproxy.io/?${encodeURIComponent(imageUrl)}`,
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(imageUrl)}`
      ];
      
      let lastError = null;
      
      for (let i = 0; i < proxyServices.length; i++) {
        try {
const proxyResponse = await fetch(proxyServices[i], {
            method: 'GET',
            headers: {
              'Accept': 'image/*'
            }
          });
          
          if (proxyResponse.ok) {
            blob = await proxyResponse.blob();
            const reader = new FileReader();
            base64Data = await new Promise((resolve, reject) => {
              reader.onloadend = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
break; // Success, exit loop
          } else {
            lastError = new Error(`Proxy ${i+1} failed: ${proxyResponse.status}`);
          }
        } catch (proxyError) {
          lastError = proxyError;
          // Continue to next proxy
        }
      }
      
      // If all proxies failed, try direct fetch (might work if server allows CORS)
      if (!base64Data) {
        try {
const directResponse = await fetch(imageUrl, {
            mode: 'cors',
            credentials: 'omit'
          });
          
          if (directResponse.ok) {
            blob = await directResponse.blob();
            const reader = new FileReader();
            base64Data = await new Promise((resolve, reject) => {
              reader.onloadend = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
          } else {
            throw new Error(`Direct fetch failed: ${directResponse.status}`);
          }
        } catch (directError) {
throw new Error(`Failed to convert image to base64 due to CORS restrictions. Tried ${proxyServices.length} proxy services and direct fetch. Error: ${directError?.message || lastError?.message}`);
        }
      }
// Store in IndexedDB
      const dbModule = await import('./database');
      const db = dbModule.default;
      await db.init();
const imageData = {
        id: relativePath.replace(/\//g, '_'),
        path: relativePath,
        data: base64Data,
        createdAt: Date.now()
      };

      try {
        await db.add('images', imageData);
} catch (e) {
        // Update if exists
        await db.update('images', imageData);
}

      // Return path for use in img src
      return `${this.imageBasePath}/${relativePath}`;
    } catch (error) {
      console.error('Error saving image:', error);
throw error;
    }
  }

  /**
   * Upload custom image file
   */
  async uploadCustomImage(file, category, entityId) {
    try {
      const reader = new FileReader();
      const base64Promise = new Promise((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const base64Data = await base64Promise;
      const filename = `${category}_${entityId || Date.now()}.png`;
      const relativePath = `${category}s/${filename}`;

      // Store in IndexedDB
      const dbModule = await import('./database');
      const db = dbModule.default;
      await db.init();
      const imageData = {
        id: relativePath.replace(/\//g, '_'),
        path: relativePath,
        data: base64Data,
        createdAt: Date.now()
      };

      try {
        await db.add('images', imageData);
      } catch (e) {
        await db.update('images', imageData);
      }

      return `${this.imageBasePath}/${relativePath}`;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  /**
   * Get image data from storage
   */
  async getImageData(imagePath) {
    try {
const dbModule = await import('./database');
      const db = dbModule.default;
      await db.init();
      
      // Extract ID from path - handle both /images/... and images/... formats
      let imageId = imagePath;
      // Remove leading /images/ or images/
      imageId = imageId.replace(/^\/?images\//, '');
      // Remove leading / if present
      imageId = imageId.replace(/^\//, '');
      // Replace all / with _ to match storage format
      imageId = imageId.replace(/\//g, '_');
const imageData = await db.get('images', imageId);
return imageData?.data || null;
    } catch (error) {
      console.error('Error getting image:', error);
return null;
    }
  }

  /**
   * Get image URL for use in img src
   */
  async getImageUrl(imagePath) {
    if (!imagePath) return null;
// If it's already a full URL, return it
    if (imagePath.startsWith('http')) return imagePath;
    
    // Try to get from IndexedDB
    const imageData = await this.getImageData(imagePath);
    if (imageData) {
return imageData; // base64 data URL
    }
// Fallback to public path
    return imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  }
}

const imageGenerationService = new ImageGenerationService();
export default imageGenerationService;
