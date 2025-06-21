export class CacheManager {
    constructor() {
        this.maxCacheSize = 10;
        this.cacheExpiryDays = 7;
    }

    /**
     * Save original CV to cache
     * @param {string} originalContent - The original CV content
     * @param {string} fileName - CV file name
     * @param {Object} metadata - Additional metadata (file type, upload date, etc.)
     */
    saveOriginalCV(originalContent, fileName, metadata = {}) {
        try {
            const cache = this.getOriginalCVCache();
            const cacheItem = {
                id: this.generateOriginalCVId(fileName),
                originalContent,
                fileName,
                timestamp: Date.now(),
                metadata
            };

            // Remove existing item with same filename
            const filteredCache = cache.filter(item => item.fileName !== fileName);
            
            // Add new item at the beginning
            filteredCache.unshift(cacheItem);
            
            // Keep only the most recent items
            const trimmedCache = filteredCache.slice(0, this.maxCacheSize);
            
            localStorage.setItem('cv_original_cache', JSON.stringify(trimmedCache));
            return cacheItem.id;
        } catch (error) {
            console.error('Error saving original CV to cache:', error);
            return null;
        }
    }

    /**
     * Get original CV from cache by filename
     */
    getOriginalCV(fileName) {
        try {
            const cache = this.getOriginalCVCache();
            return cache.find(item => item.fileName === fileName) || null;
        } catch (error) {
            console.error('Error getting original CV from cache:', error);
            return null;
        }
    }

    /**
     * Get all original CVs from cache
     */
    getOriginalCVCache() {
        try {
            const cache = localStorage.getItem('cv_original_cache');
            if (!cache) return [];
            
            const parsedCache = JSON.parse(cache);
            const now = Date.now();
            const expiryTime = this.cacheExpiryDays * 24 * 60 * 60 * 1000;
            
            return parsedCache.filter(item => 
                now - item.timestamp < expiryTime
            );
        } catch (error) {
            console.error('Error reading original CV cache:', error);
            return [];
        }
    }

    /**
     * Generate ID for original CV cache
     */
    generateOriginalCVId(fileName) {
        let hash = 0;
        for (let i = 0; i < fileName.length; i++) {
            const char = fileName.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return `original_cv_${Math.abs(hash).toString(36)}`;
    }


}
