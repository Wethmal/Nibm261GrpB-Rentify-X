/**
 * @file imageHelper.js
 * @module imageHelper
 * @description Centralized helper to resolve listing cover images with high-quality category-specific Unsplash fallbacks.
 */

export const getCategoryFallback = (categoryName, title) => {
  const defaultImg = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=800'; // Modern property/home as generic default
  
  const cat = (categoryName || '').toLowerCase();
  const lowerTitle = (title || '').toLowerCase();

  // 1. Properties
  if (cat.includes('property') || lowerTitle.includes('villa') || lowerTitle.includes('office') || lowerTitle.includes('desk') || lowerTitle.includes('room') || lowerTitle.includes('house')) {
    return 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=800';
  }
  // 2. Services
  if (cat.includes('service') || lowerTitle.includes('clean') || lowerTitle.includes('repair') || lowerTitle.includes('makeup') || lowerTitle.includes('bridal') || lowerTitle.includes('wedding')) {
    return 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=800';
  }
  // 3. Electronics
  if (cat.includes('electronic') || cat.includes('camera') || lowerTitle.includes('lens') || lowerTitle.includes('playstation') || lowerTitle.includes('console') || lowerTitle.includes('tv') || lowerTitle.includes('screen')) {
    return 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&q=80&w=800';
  }
  // 4. Furniture
  if (cat.includes('furniture') || cat.includes('tent') || lowerTitle.includes('table') || lowerTitle.includes('chair') || lowerTitle.includes('sofa') || lowerTitle.includes('canopy')) {
    return 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800';
  }
  // 5. Clothings
  if (cat.includes('clothing') || cat.includes('wear') || lowerTitle.includes('saree') || lowerTitle.includes('tuxedo') || lowerTitle.includes('dress') || lowerTitle.includes('suit')) {
    return 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&q=80&w=800';
  }
  // 6. Machinery
  if (cat.includes('machinery') || cat.includes('tool') || lowerTitle.includes('generator') || lowerTitle.includes('jackhammer') || lowerTitle.includes('drill') || lowerTitle.includes('petrol')) {
    return 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=800';
  }

  return defaultImg;
};

export const getListingCoverImage = (listing) => {
  if (!listing) return '';
  const photos = listing.photos;
  
  if (Array.isArray(photos) && photos.length > 0) {
    return photos[0];
  } else if (typeof photos === 'string' && photos.startsWith('[')) {
    try {
      const parsed = JSON.parse(photos);
      if (parsed.length > 0) return parsed[0];
    } catch (e) {
      // ignore
    }
  } else if (typeof photos === 'string' && photos.length > 0) {
    return photos;
  }

  return getCategoryFallback(listing.category_name, listing.title);
};
