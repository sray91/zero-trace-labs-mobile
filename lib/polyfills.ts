// Polyfills for browser APIs needed by Convex in React Native

// Polyfill window object for Convex's web socket manager
if (typeof window !== "undefined") {
  // Store event listeners for online/offline events
  const networkListeners: { [key: string]: Set<EventListener> } = {
    online: new Set(),
    offline: new Set(),
  };

  // Only polyfill if addEventListener doesn't exist
  if (typeof window.addEventListener !== "function") {
    (window as any).addEventListener = (
      event: string,
      listener: EventListener
    ) => {
      if (event === "online" || event === "offline") {
        networkListeners[event].add(listener);
      }
    };
  }

  // Only polyfill if removeEventListener doesn't exist
  if (typeof window.removeEventListener !== "function") {
    (window as any).removeEventListener = (
      event: string,
      listener: EventListener
    ) => {
      if (event === "online" || event === "offline") {
        networkListeners[event].delete(listener);
      }
    };
  }
}
