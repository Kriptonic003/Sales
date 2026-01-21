import { useEffect, useState } from "react";

export function useDarkMode() {
  const [dark, setDark] = useState<boolean>(() => {
    const stored = localStorage.getItem("dark-mode");
    return stored ? stored === "true" : true;
  });

  useEffect(() => {
    localStorage.setItem("dark-mode", String(dark));
    const body = document.body;
    if (dark) {
      body.classList.remove("theme-light");
    } else {
      body.classList.add("theme-light");
    }
  }, [dark]);

  return { dark, toggle: () => setDark((d) => !d) };
}

