export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "theme";

// Runs in <head> before first paint (see app/layout.tsx) so a saved dark
// preference doesn't flash light first. Light is the default: nothing is
// applied unless the user has explicitly picked dark.
export const THEME_INIT_SCRIPT = `(function(){try{if(localStorage.getItem("${THEME_STORAGE_KEY}")==="dark"){var d=document.documentElement;d.classList.add("dark");d.style.colorScheme="dark"}}catch(e){}})()`;
