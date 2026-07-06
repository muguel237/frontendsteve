import { useEffect, useState } from "react";
import { API_BASE } from "./config.js";

/**
 * Retourne le nombre total de messages non lus, toutes conversations confondues.
 * Interroge /api/chat/mes-conversations toutes les 15s.
 */
export default function useUnreadMessages() {
  const token = localStorage.getItem("token");
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!token) return;
    let actif = true;

    const charger = async () => {
      try {
        const res = await fetch(`${API_BASE}/chat/mes-conversations`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (actif) {
            const somme = data.reduce((acc, c) => acc + (c.nonLus || 0), 0);
            setTotal(somme);
          }
        }
      } catch {}
    };

    charger();
    const interval = setInterval(charger, 15000);
    return () => { actif = false; clearInterval(interval); };
  }, [token]);

  return total;
}
