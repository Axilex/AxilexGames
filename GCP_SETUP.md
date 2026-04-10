# Déploiement GKE — Guide de configuration GCP

Ce guide détaille toutes les étapes à faire **une seule fois** dans la console GCP et en CLI avant de pouvoir déployer via `git tag`.

---

## Prérequis

- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) installé (`gcloud`)
- Compte GCP avec facturation activée
- Repo GitHub connecté à Cloud Build (étape 5)

Remplace `YOUR_PROJECT_ID` par ton vrai Project ID dans toutes les commandes.

```bash
gcloud config set project YOUR_PROJECT_ID
```

---

## Étape 1 — Activer les APIs GCP

```bash
gcloud services enable \
  cloudbuild.googleapis.com \
  container.googleapis.com \
  artifactregistry.googleapis.com
```

---

## Étape 2 — Créer le repo Artifact Registry

Stocke les images Docker (`api` et `web`).

```bash
gcloud artifacts repositories create axilex-games \
  --repository-format=docker \
  --location=europe-west1 \
  --description="AxilexGames Docker images"
```

Vérifie dans la console : **Artifact Registry → Repositories → axilex-games**

---

## Étape 3 — Créer le cluster GKE

Mode **Autopilot** (recommandé) : pas de gestion de nœuds, facturation à la ressource.

```bash
gcloud container clusters create-auto axilex-games-cluster \
  --region=europe-west1
```

> Durée : ~5 minutes. Vérifie dans **Kubernetes Engine → Clusters**.

---

## Étape 4 — Accorder les droits au compte de service Cloud Build

Cloud Build a besoin de pouvoir pousser des images et déployer sur GKE.

**Linux / macOS (bash) :**
```bash
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format='value(projectNumber)')

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:$PROJECT_NUMBER@cloudbuild.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:$PROJECT_NUMBER@cloudbuild.gserviceaccount.com" \
  --role="roles/container.developer"
```

**Windows — PowerShell :**
```powershell
$PROJECT_NUMBER = gcloud projects describe YOUR_PROJECT_ID --format='value(projectNumber)'

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID `
  --member="serviceAccount:$PROJECT_NUMBER@cloudbuild.gserviceaccount.com" `
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID `
  --member="serviceAccount:$PROJECT_NUMBER@cloudbuild.gserviceaccount.com" `
  --role="roles/container.developer"
```

**Windows — CMD :**
```cmd
for /f "tokens=*" %i in ('gcloud projects describe YOUR_PROJECT_ID --format="value(projectNumber)"') do set PROJECT_NUMBER=%i

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID --member="serviceAccount:%PROJECT_NUMBER%@cloudbuild.gserviceaccount.com" --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID --member="serviceAccount:%PROJECT_NUMBER%@cloudbuild.gserviceaccount.com" --role="roles/container.developer"
```

Vérifie dans **IAM & Admin → IAM** que le compte `@cloudbuild.gserviceaccount.com` a bien ces deux rôles.

### Droits du compte de service Compute (logs Cloud Build)

Le compte Compute par défaut doit aussi pouvoir écrire les logs, sinon Cloud Build affiche une erreur de permission.

**PowerShell :**
```powershell
$PROJECT_NUMBER = gcloud projects describe YOUR_PROJECT_ID --format='value(projectNumber)'

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID `
  --member="serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com" `
  --role="roles/logging.logWriter"
```

**CMD :**
```cmd
for /f "tokens=*" %i in ('gcloud projects describe YOUR_PROJECT_ID --format="value(projectNumber)"') do set PROJECT_NUMBER=%i

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID --member="serviceAccount:%PROJECT_NUMBER%-compute@developer.gserviceaccount.com" --role="roles/logging.logWriter"
```

---

## Étape 5 — Connecter le repo GitHub à Cloud Build

**Dans la console GCP :**

1. Va dans **Cloud Build → Triggers**
2. Clique **Connect repository**
3. Sélectionne **GitHub (Cloud Build GitHub App)**
4. Authentifie-toi sur GitHub et autorise l'accès au repo `wiki_race`
5. Clique **Done**

> Si c'est la première fois, GCP installe l'app GitHub "Google Cloud Build" sur ton compte.

---

## Étape 6 — Créer le trigger Cloud Build

Toujours dans **Cloud Build → Triggers**, clique **Create trigger**.

| Champ | Valeur |
|---|---|
| Name | `deploy-on-tag` |
| Region | `europe-west1` |
| Event | **Push new tag** |
| Source | Le repo GitHub connecté à l'étape 5 |
| Tag pattern (regex) | `^v.*` |
| Build configuration | **Cloud Build configuration file** |
| File location | `cloudbuild.yaml` |

### Substitution variables (section en bas du formulaire)

Clique **Add variable** pour chaque ligne :

| Variable | Value |
|---|---|
| `_CLUSTER_NAME` | `axilex-games-cluster` |
| `_REGION` | `europe-west1` |
| `_REPO` | `axilex-games` |

Clique **Save**.

---

## Étape 7 — Remplir les placeholders dans k8s/

Pas de domaine DNS — on utilise l'IP externe directement (HTTP simple, pas de TLS).

**`k8s/api-deployment.yaml`** — ligne `CORS_ORIGINS` :
```yaml
value: "http://EXTERNAL_IP"
```

**`k8s/web-deployment.yaml`** — ligne `DOMAIN` :
```yaml
value: "localhost"
```

> L'`EXTERNAL_IP` n'est connue qu'après le premier déploiement (étape 9). Pour le tout premier push, mets `localhost` dans les deux fichiers — le site fonctionnera en accès direct via l'IP une fois l'IP récupérée et les fichiers mis à jour.

> Quand tu auras un domaine DNS : remplace `localhost` par ton domaine dans les deux fichiers, pousse un nouveau tag — Caddy obtiendra le certificat TLS automatiquement.

---

## Étape 8 — Premier déploiement

```bash
git add k8s/api-deployment.yaml k8s/web-deployment.yaml
git commit -m "chore: configure domain for GKE"
git tag v0.1.1
git push origin main --tags
```

Suit l'avancement dans **Cloud Build → History**.

---

## Étape 9 — Récupérer l'IP externe

Une fois le déploiement terminé (~3-5 min) :

```bash
gcloud container clusters get-credentials axilex-games-cluster --region=europe-west1
kubectl get svc -n axilex-games
```

La colonne `EXTERNAL-IP` du service `web` contient l'IP publique.

- Sans domaine : accès via `http://EXTERNAL_IP`
- Avec domaine : pointe ton enregistrement DNS `A` vers cette IP → Caddy obtient le certificat TLS automatiquement

---

## Déploiements suivants

```bash
git tag v1.2.3 && git push origin v1.2.3
```

Cloud Build détecte le tag → build → push → déploiement automatique sur GKE.
