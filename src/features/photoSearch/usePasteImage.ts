import { useEffect } from 'react';

export function usePasteImage(onFiles: (files: File[]) => void) {
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items?.length) return;
      const files: File[] = [];
      for (const it of Array.from(items)) {
        if (it.kind !== 'file') continue;
        const f = it.getAsFile();
        if (!f) continue;
        if (f.type.startsWith('image/')) files.push(f);
      }
      if (files.length) {
        e.preventDefault();
        onFiles(files);
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [onFiles]);
}


