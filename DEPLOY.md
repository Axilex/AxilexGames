# Guide de déploiement — Vercel + Render

## Vue d'ensemble

| Service | Plateforme | URL finale (exemple) |
|---------|-----------|----------------------|
| Frontend (Vue) | Vercel | `https://axilex-games.vercel.app` |
| Backend (NestJS API) | Render | `https://axilex-games-api.onrender.com` |

Les deux services se connaissent via des variables d'environnement :
- Vercel a besoin de l'URL Render → `VITE_API_URL`
- Render a besoin de l'URL Vercel → `CORS_ORIGINS`

---

## Ordre de déploiement

Il y a une dépendance circulaire : chaque service a besoin de l'URL de l'autre.
La solution : **déployer Render en premier**, récupérer son URL, puis configurer Vercel.

```
1. Déployer Render  →  obtenir l'URL API
2. Ajouter VITE_API_URL sur Vercel  →  redéployer Vercel
3. Ajouter CORS_ORIGINS sur Render  →  redéployer Render
```

---

## Étape 1 — Render (Backend)

### Importer le projet

1. Sur [render.com](https://render.com), **New → Blueprint**
2. Connecter le repo GitHub et sélectionner la branche `main`
3. Render détecte `render.yaml` et crée le service `axilex-games-api` automatiquement

### Variables d'environnement à configurer manuellement

Dans **Render → Service → Environment** :

| Clé | Valeur | Notes |
|-----|--------|-------|
| `NODE_ENV` | `production` | déjà dans render.yaml |
| `PORT` | `3000` | déjà dans render.yaml |
| `CORS_ORIGINS` | *(à remplir après étape 2)* | URL Vercel du frontend |

> `CORS_ORIGINS` est marqué `sync: false` dans `render.yaml` — Render ne le pré-remplit pas,
> il faut le saisir à la main dans le dashboard.

### Récupérer l'URL de l'API

Une fois le premier déploiement terminé, l'URL est visible en haut du dashboard Render :
```
https://axilex-games-api.onrender.com
```
Copie cette URL, elle sera utilisée à l'étape 2.

### Tester que l'API répond

```bash
curl https://axilex-games-api.onrender.com/health
# doit retourner 200 OK
```

> **Plan Free** : le service s'endort après 15 min d'inactivité.
> Le premier appel après une période d'inactivité prend ~30s (cold start).
> Le plan Starter ($7/mois) supprime ce comportement.

---

## Étape 2 — Vercel (Frontend)

### Importer le projet (déjà fait selon tes indications)

`vercel.json` est déjà configuré avec :
- `buildCommand` : `pnpm --filter shared build && pnpm --filter web build`
- `outputDirectory` : `apps/web/dist`
- `rewrites` : SPA fallback vers `index.html`

### Variables d'environnement à ajouter

Dans **Vercel → Project → Settings → Environment Variables** :

| Clé | Valeur | Environnements |
|-----|--------|---------------|
| `VITE_API_URL` | `https://axilex-games-api.onrender.com` | Production, Preview, Development |

> Les variables `VITE_*` sont embarquées dans le bundle au moment du build.
> Après l'avoir ajoutée, **redéclenche un déploiement** (Vercel → Deployments → Redeploy).

### URL finale du frontend

Récupère l'URL Vercel (ex: `https://axilex-games.vercel.app`) pour l'étape suivante.

---

## Étape 3 — Finaliser Render (CORS)

Maintenant que tu as l'URL Vercel, retourne dans **Render → Environment** et remplis :

| Clé | Valeur |
|-----|--------|
| `CORS_ORIGINS` | `https://axilex-games.vercel.app` |

Si tu as plusieurs URLs (preview Vercel, domaine custom…), sépare-les par des virgules :
```
https://axilex-games.vercel.app,https://axilexgames.com
```

Puis **Manual Deploy → Deploy latest commit** pour appliquer.

---

## Résumé des variables par service

### Vercel (Frontend)

```
VITE_API_URL=https://axilex-games-api.onrender.com
```

### Render (Backend)

```
NODE_ENV=production
PORT=3000
CORS_ORIGINS=https://axilex-games.vercel.app
```

---

## Vérification finale

1. Ouvre `https://axilex-games.vercel.app`
2. Crée une partie WikiRace — si la connexion Socket.IO s'établit, tout fonctionne
3. Si la connexion échoue, ouvre la console navigateur (F12) et vérifie :
   - `VITE_API_URL` pointe bien vers Render (pas `localhost`)
   - Pas d'erreur CORS dans la console (→ vérifier `CORS_ORIGINS` sur Render)

---

## Domaine custom (optionnel)

Si tu veux utiliser `axilexgames.com` :

**Vercel** : Settings → Domains → ajouter `axilexgames.com` + suivre les instructions DNS

**Render** : Settings → Custom Domains → ajouter `api.axilexgames.com`

Ensuite mettre à jour les variables :
- Vercel : `VITE_API_URL=https://api.axilexgames.com`
- Render : `CORS_ORIGINS=https://axilexgames.com`
