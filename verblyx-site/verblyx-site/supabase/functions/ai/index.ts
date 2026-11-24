// =========================================================
// VERBLYX — fonction serveur « ai » : le professeur IA (Gemini)
// La clé GEMINI_API_KEY reste ici, côté serveur : le navigateur ne la voit jamais.
// Seuls les élèves connectés peuvent l'appeler, avec une limite par jour.
// =========================================================
import { createClient } from "npm:@supabase/supabase-js@2.46.1";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") ?? "gemini-2.5-flash";
const DAILY_LIMIT = Number(Deno.env.get("AI_DAILY_LIMIT") ?? "80");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

type Msg = { role?: string; content?: unknown };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    if (!GEMINI_API_KEY) return json({ error: "La clé GEMINI_API_KEY n'est pas configurée sur le serveur." }, 500);

    // 1. Qui appelle ? (élève connecté obligatoire)
    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Session expirée. Reconnecte-toi." }, 401);

    // 2. Limite par jour (protège les crédits gratuits)
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const day = new Date().toISOString().slice(0, 10);
    const { data: usage } = await admin.from("ai_usage").select("calls").eq("user_id", user.id).eq("day", day).maybeSingle();
    const calls = usage?.calls ?? 0;
    if (calls >= DAILY_LIMIT) return json({ error: `Tu as atteint la limite de ${DAILY_LIMIT} actions IA pour aujourd'hui. Reviens demain !` }, 429);
    await admin.from("ai_usage").upsert({ user_id: user.id, day, calls: calls + 1 });

    // 3. La demande
    const body = await req.json().catch(() => ({}));
    const kind = body.kind === "json" ? "json" : "text";
    const msgs: Msg[] = (Array.isArray(body.messages) ? body.messages : []).slice(-14)
      .filter((m: Msg) => typeof m?.content === "string" && (m.content as string).trim());
    const size = msgs.reduce((n, m) => n + String(m.content).length, 0);
    if (!msgs.length || size > 60000) return json({ error: "Demande invalide." }, 400);

    // Gemini veut des tours alternés : on fusionne les messages consécutifs du même rôle
    const contents: { role: string; parts: { text: string }[] }[] = [];
    for (const m of msgs) {
      const role = m.role === "assistant" ? "model" : "user";
      const last = contents[contents.length - 1];
      if (last && last.role === role) last.parts[0].text += "\n\n" + String(m.content);
      else contents.push({ role, parts: [{ text: String(m.content) }] });
    }
    if (contents[0].role !== "user") contents.unshift({ role: "user", parts: [{ text: "Bonjour" }] });

    const system = kind === "json"
      ? "Tu es Vex, professeur d'anglais de l'application Verblyx. Tu réponds UNIQUEMENT avec du JSON valide, sans texte autour, en respectant exactement le format demandé."
      : "Tu es Vex, le professeur d'anglais de l'application Verblyx. Tu suis les consignes du premier message.";

    // 4. Appel à Gemini
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents,
        generationConfig: { temperature: kind === "json" ? 0.5 : 0.7, maxOutputTokens: 8192, ...(kind === "json" ? { responseMimeType: "application/json" } : {}) },
      }),
    });
    if (res.status === 429) return json({ error: "Le quota gratuit de Gemini est atteint pour le moment. Réessaie dans quelques minutes." }, 429);
    if (!res.ok) { console.error("Gemini", res.status, await res.text()); return json({ error: "Vex n'a pas pu répondre. Réessaie dans un instant." }, 502); }
    const data = await res.json();
    const text = (data?.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("").trim();
    if (!text) return json({ error: "Vex n'a rien répondu. Réessaie." }, 502);
    return json({ text });
  } catch (e) {
    console.error(e);
    return json({ error: "Erreur serveur inattendue." }, 500);
  }
});
