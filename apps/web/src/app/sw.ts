/**
 * Serwist service worker — PWA offline shell + cached last lesson.
 * Follows the official @serwist/next template: the precache manifest is
 * injected at the literal `self.__SW_MANIFEST` injection point.
 */
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      // Cache the last-viewed lesson pages for offline review
      urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith("/learn"),
      handler: "NetworkFirst",
      options: {
        cacheName: "last-lesson",
        expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 7 },
      },
    },
    {
      urlPattern: ({ url, sameOrigin }) =>
        sameOrigin && (url.pathname.startsWith("/_next/static") || url.pathname.endsWith(".woff2")),
      handler: "CacheFirst",
      options: {
        cacheName: "static-assets",
        expiration: { maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 * 365 },
      },
    },
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();
