// HackoAI Service Worker - Offline Support
const CACHE_NAME = 'hackoai-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/favicon-32x32.png',
  '/favicon-16x16.png',
  '/apple-touch-icon.png',
  'https://fonts.googleapis.com/css2?family=Smooch+Sans:wght@100..900&display=swap',
  'https://cdn.jsdelivr.net/npm/marked/marked.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/styles/github-dark.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/highlight.min.js',
  'https://cdn.jsdelivr.net/npm/katex@0.16.4/dist/katex.min.css',
  'https://cdn.jsdelivr.net/npm/katex@0.16.4/dist/katex.min.js'
];

// Install event - cache critical assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('🔥 HackoAI: Caching app shell');
      return cache.addAll(ASSETS.map(url => new Request(url, {mode: 'no-cors'})))
        .catch(err => console.warn('Cache failed for some assets:', err));
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (e) => {
  // Skip non-GET requests
  if (e.request.method !== 'GET') return;
  
  // Skip API calls to your worker
  if (e.request.url.includes('hackoai-worker') || 
      e.request.url.includes('puter.com')) {
    return; // Let API calls go through without caching
  }

  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // Clone response to cache it
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(e.request).then((cached) => {
          if (cached) return cached;
          
          // If HTML request fails and not cached, return offline page
          if (e.request.headers.get('accept').includes('text/html')) {
            return new Response(
              '<h1>🔌 Offline Mode</h1><p>HackoAI needs internet for AI responses, but your chat history is saved locally!</p>',
              { headers: { 'Content-Type': 'text/html' } }
            );
          }
        });
      })
  );
});

// Handle share target (if manifest includes share_target)
self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
