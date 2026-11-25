
// =========================================================
// VERBLYX — configuration
// Remplace les deux valeurs ci-dessous par celles de TON projet Supabase :
// Supabase > Project Settings > API
// (la clé « anon public » est faite pour être visible dans le navigateur : c'est normal)
// =========================================================
window.VERBLYX_CONFIG = {
  supabaseUrl: "https://aexgefwmfmmhzfzninyk.supabase.co",
  supabaseAnonKey: "sb_publishable_tw-mqEpHZJo1cIJLLyoN_A_UdpnHCdv",
  // Captcha anti-robots Cloudflare Turnstile : colle ici la « Site Key » (elle est publique, c'est normal).
  // Laisse vide pour désactiver. La « Secret Key », elle, va UNIQUEMENT dans Supabase.
  turnstileSiteKey: "0x4AAAAAAGS1JXM9Lgghlv1F",
  // Connexion Google : colle ici l'« ID client » Google (se termine par .apps.googleusercontent.com).
  // Il est public, c'est normal. Laisse vide pour garder l'ancienne connexion Google.
  googleClientId: "",
  // Publicité Google AdSense en fin de leçon (laisse vide pour ne rien afficher) :
  // adsenseClient = ton identifiant éditeur « ca-pub-… », adsenseSlot = l'identifiant du bloc d'annonces.
  adsenseClient: "ca-pub-9120600278428355",
  adsenseSlot: "",
};
