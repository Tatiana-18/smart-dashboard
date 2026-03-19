// === 📦 CACHE SERVICE (Оффлайн режим) ===
const CacheService = {
  cacheName: 'smartdash_cache_v1',

  async cacheResources() {
    const cache = await caches.open(this.cacheName);
    const resources = [
      '../index.html',
      '../src/styles/variables.css',
      '../src/styles/reset.css',
      '../src/styles/main.css',
      '../src/main.js'
    ];
    await cache.addAll(resources);
  },

  async getFromCache(url) {
    const cache = await caches.open(this.cacheName);
    const response = await cache.match(url);
    return response;
  },

  async clearCache() {
    await caches.delete(this.cacheName);
  }
};

window.CacheService = CacheService;