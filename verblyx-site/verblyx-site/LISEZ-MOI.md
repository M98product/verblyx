# VERBLYX — mise en ligne (version Supabase + Gemini)

Ce dossier contient tout le site :

| Fichier | Rôle |
|---|---|
| `index.html` | L'application complète (Vex, parcours A1→C2, leçons, vies, boutique…) |
| `course.json` | Le programme : niveaux, chapitres, leçons. Modifiable sans toucher au code |
| `config.js` | Les deux clés de TON projet Supabase (à remplir) |
| `supabase/migrations/001_verblyx.sql` | La base de données et sa sécurité |
| `supabase/functions/ai/index.ts` | Le professeur IA (appelle Gemini, clé cachée côté serveur) |

Compte environ 20 minutes. Tout est gratuit.

## 1. Créer le projet Supabase
1. Va sur **supabase.com** → crée un compte → **New project**.
2. Choisis un nom (« verblyx »), un mot de passe de base de données (garde-le), la région **Europe (Paris ou Francfort)** → **Create**.
3. Attends 1 à 2 minutes que le projet soit prêt.

## 2. Créer la base de données
1. Menu de gauche → **SQL Editor** → **New query**.
2. Ouvre `supabase/migrations/001_verblyx.sql`, copie **tout** le contenu, colle-le.
3. Clique sur **Run**. Le message « Success. No rows returned » est normal.

## 3. Régler les comptes
1. Menu → **Authentication** → **Sign In / Providers** → **Email** : vérifie qu'il est activé.
2. *(Recommandé pour commencer)* désactive **Confirm email** : tes élèves pourront commencer tout de suite après l'inscription. Si tu le laisses activé, ils recevront un e-mail de confirmation (le site le gère).

## 4. Récupérer tes deux clés
1. Menu → **Project Settings** → **API** (parfois appelé **Data API** / **API Keys**).
2. Copie **Project URL** (`https://xxxx.supabase.co`) et la clé **anon public**.
3. Ouvre `config.js` et remplace les deux valeurs. Enregistre.

## 5. Obtenir une clé Gemini
1. Va sur **aistudio.google.com/apikey** (connecte-toi avec un compte Google).
2. **Create API key** → copie la clé. Ne la mets **jamais** dans `config.js`.

## 6. Installer le professeur IA (la fonction « ai »)
**Sans terminal (le plus simple) :**
1. Supabase → **Edge Functions** → **Secrets** → **Add new secret** : nom `GEMINI_API_KEY`, valeur = ta clé Gemini → **Save**.
2. **Edge Functions** → **Deploy a new function** → **Via Editor**.
3. Nom de la fonction : **`ai`** (exactement).
4. Remplace tout le code par le contenu de `supabase/functions/ai/index.ts` → **Deploy**.
5. Laisse l'option **Verify JWT** activée.

**Avec un terminal (si tu as Node.js) :**
```bash
npx supabase login
npx supabase link --project-ref TON_REF
npx supabase secrets set GEMINI_API_KEY=ta_cle_gemini
npx supabase functions deploy ai
```
(`TON_REF` = le code dans l'adresse de ton projet : `https://TON_REF.supabase.co`)

## 7. Mettre le site en ligne
1. Va sur **app.netlify.com/drop** (crée un compte gratuit si besoin).
2. **Glisse-dépose le dossier `verblyx-site`** entier dans la page.
3. Netlify te donne une adresse (ex. `https://verblyx-123.netlify.app`). Tu pourras la renommer dans **Site configuration → Change site name**, ou brancher ton nom de domaine.

## 8. Dernier réglage dans Supabase
1. **Authentication** → **URL Configuration**.
2. **Site URL** : colle l'adresse Netlify.
3. **Redirect URLs** : ajoute la même adresse suivie de `/**`.
   (Sert aux e-mails de confirmation et de mot de passe oublié.)

## 9. Tester
Ouvre ton site → **Commencer mon parcours** → réponds aux questions → crée ton compte → fais le test de niveau → lance une leçon. Ouvre ensuite une leçon du chapitre 2 : la première fois, Vex la prépare (~30 s) puis elle est enregistrée pour tout le monde.

---

### Réglages utiles (Edge Functions → Secrets)
| Secret | Rôle | Par défaut |
|---|---|---|
| `GEMINI_API_KEY` | Ta clé Gemini | obligatoire |
| `GEMINI_MODEL` | Le modèle Gemini | `gemini-2.5-flash` |
| `AI_DAILY_LIMIT` | Actions IA max par élève et par jour | `80` |

### Mettre à jour le site
Modifie les fichiers puis glisse à nouveau le dossier dans Netlify (**Deploys** → zone de dépôt).

### Bon à savoir
- **Leçons** : la table `content` (Table Editor) contient les leçons générées. Tu peux en corriger une, ou en supprimer une pour que Vex la régénère.
- **Programme** : pour changer un titre ou un objectif de leçon, modifie `course.json`.
- **Voix et micro** : ils utilisent ceux du navigateur (meilleurs sur Chrome et Edge). Sans micro, les exercices de prononciation deviennent des exercices de remise en ordre.
- **Limites** : la progression (pièces, vies) est enregistrée dans le profil de l'élève. Un utilisateur très technique pourrait la modifier ; pour une vraie boutique payante, il faudra déplacer ces calculs côté serveur.
