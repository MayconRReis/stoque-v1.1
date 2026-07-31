import { useState, useEffect } from 'react';

export function useVersionCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Only check in production
    if (import.meta.env.DEV) return;

    let currentScripts: string[] = [];

    const checkVersion = async () => {
      try {
        const response = await fetch('/?t=' + Date.now(), { cache: 'no-store' });
        const html = await response.text();
        
        // Extract script src attributes
        const scriptMatches = Array.from(html.matchAll(/<script[^>]+src="([^">]+)"/g));
        const newScripts = scriptMatches.map(m => m[1]);

        if (currentScripts.length === 0) {
          currentScripts = newScripts;
        } else {
          // Compare if scripts have changed
          const hasChanged = newScripts.length > 0 && (
            newScripts.length !== currentScripts.length ||
            newScripts.some(src => !currentScripts.includes(src))
          );
                             
          if (hasChanged) {
            setUpdateAvailable(true);
          }
        }
      } catch (error) {
        console.error('Error checking for updates:', error);
      }
    };

    checkVersion(); // Initial check to populate currentScripts
    
    // Check every 3 minutes
    const interval = setInterval(checkVersion, 3 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const reloadPage = () => {
    window.location.reload();
  };

  return { updateAvailable, reloadPage };
}
