import { useEffect } from 'react';

/**
 * Custom hook to prevent copying, text selection, context menu (right click),
 * and copy keyboard shortcuts (Ctrl+C, Cmd+C, Ctrl+X, Cmd+X, Ctrl+U, Cmd+U, Ctrl+A outside editable elements).
 *
 * @param {boolean} enabled - Whether copy protection should be active (defaults to true)
 * @param {React.RefObject} containerRef - Optional ref to limit protection scope to a specific container
 */
export function useCopyProtection(enabled = true, containerRef = null) {
  useEffect(() => {
    if (!enabled) return;

    const target = containerRef?.current || document;

    // Helper to check if event target is an editable input or textarea
    const isEditable = (el) => {
      if (!el) return false;
      const tagName = el.tagName ? el.tagName.toLowerCase() : '';
      if (tagName === 'input' || tagName === 'textarea') return true;
      if (el.isContentEditable) return true;
      if (el.closest && el.closest('.monaco-editor, input, textarea, [contenteditable="true"]')) return true;
      return false;
    };

    // 1. Prevent copy clipboard event
    const handleCopy = (e) => {
      e.preventDefault();
      if (e.clipboardData) {
        e.clipboardData.setData('text/plain', '');
      }
      return false;
    };

    // 2. Prevent cut clipboard event
    const handleCut = (e) => {
      e.preventDefault();
      return false;
    };

    // 3. Prevent right-click context menu
    const handleContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    // 4. Prevent text selection start (except inside editable fields)
    const handleSelectStart = (e) => {
      if (!isEditable(e.target)) {
        e.preventDefault();
        return false;
      }
    };

    // 5. Prevent drag start of text/images
    const handleDragStart = (e) => {
      if (!isEditable(e.target)) {
        e.preventDefault();
        return false;
      }
    };

    // 6. Prevent copy keyboard shortcuts (Ctrl+C, Cmd+C, Ctrl+X, Cmd+X, Ctrl+U, Cmd+U, Ctrl+A)
    const handleKeyDown = (e) => {
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;
      const key = e.key ? e.key.toLowerCase() : '';

      if (isCmdOrCtrl && ['c', 'x', 'u'].includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Prevent Ctrl+A / Cmd+A outside editable fields
      if (isCmdOrCtrl && key === 'a' && !isEditable(e.target)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Prevent F12 / DevTools shortcuts if desired (Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C)
      if (isCmdOrCtrl && e.shiftKey && ['i', 'j', 'c'].includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    target.addEventListener('copy', handleCopy, true);
    target.addEventListener('cut', handleCut, true);
    target.addEventListener('contextmenu', handleContextMenu, true);
    target.addEventListener('selectstart', handleSelectStart, true);
    target.addEventListener('dragstart', handleDragStart, true);
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      target.removeEventListener('copy', handleCopy, true);
      target.removeEventListener('cut', handleCut, true);
      target.removeEventListener('contextmenu', handleContextMenu, true);
      target.removeEventListener('selectstart', handleSelectStart, true);
      target.removeEventListener('dragstart', handleDragStart, true);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [enabled, containerRef]);
}

/**
 * Request fullscreen on a specified HTML element or fallback to document element.
 */
export function requestFullScreenMode(element = document.documentElement) {
  if (!element) return Promise.reject(new Error("No element specified"));

  if (element.requestFullscreen) {
    return element.requestFullscreen();
  } else if (element.webkitRequestFullscreen) {
    return element.webkitRequestFullscreen();
  } else if (element.mozRequestFullScreen) {
    return element.mozRequestFullScreen();
  } else if (element.msRequestFullscreen) {
    return element.msRequestFullscreen();
  }
  return Promise.reject(new Error("Fullscreen API unavailable"));
}

/**
 * Exit fullscreen if currently active.
 */
export function exitFullScreenMode() {
  if (
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  ) {
    if (document.exitFullscreen) {
      return document.exitFullscreen().catch(() => {});
    } else if (document.webkitExitFullscreen) {
      return document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      return document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
      return document.msExitFullscreen();
    }
  }
}
