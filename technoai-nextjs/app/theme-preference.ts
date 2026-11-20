// Dark-only experience. Clear an old light-mode preference before the first paint.
export const THEME_BOOT_SCRIPT = "(()=>{const d=document.documentElement;d.dataset.theme='dark';d.style.colorScheme='dark';try{localStorage.removeItem('technoai-theme')}catch(e){}})()";
