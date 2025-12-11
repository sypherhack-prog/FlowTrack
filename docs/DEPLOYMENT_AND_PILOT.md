# FlowTrack – Déploiement & Pilote

Ce document résume :

- le **process de déploiement** (Docker / production),
- le **guide d’onboarding** pour un client pilote (admin + membres),
- une **checklist sécurité / conformité** de base,
- une **mini roadmap produit** après le pilote.

---

## 1. Déploiement avec Docker

### 1.1. Services

Le fichier `docker-compose.yml` démarre 4 services :

- `web` : application Next.js (API + dashboard) sur le port 3000.
- `socket` : serveur Socket.io sur le port 3001.
- `mongo` : base de données MongoDB (données FlowTrack).
- `minio` : stockage compatible S3 pour les captures d’écran.

### 1.2. Variables d’environnement clés

À configurer via `.env` ou directement dans l’environnement du serveur (CI, orchestrateur…) :

**Core / Auth**
- `MONGODB_URI` : URL MongoDB (ex. `mongodb://mongo:27017/flowtrack`).
- `JWT_SECRET` : *clé secrète forte* pour signer les JWT.
- `ADMIN_EMAIL` : email du compte admin global (accès à la section Admin).

**URLs publiques & extensions / desktop**
- `APP_URL` : URL publique de l’app (ex. `https://app.mondomaine.com`).
- `NEXT_PUBLIC_SOCKET_URL` : URL publique du serveur Socket.io (ex. `https://socket.mondomaine.com` ou `http://socket:3001` en interne).
- `NEXT_PUBLIC_EXTENSION_CHROME_URL`, `NEXT_PUBLIC_EXTENSION_EDGE_URL`, `NEXT_PUBLIC_EXTENSION_FIREFOX_URL` : liens vers les extensions si publiées.
- `NEXT_PUBLIC_DESKTOP_WIN_URL`, `NEXT_PUBLIC_DESKTOP_MAC_URL` : liens de téléchargement vers l’agent desktop.

**Stockage S3 / MinIO**
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` : credentials S3/Minio.
- `S3_BUCKET_NAME` : nom du bucket pour les screenshots.
- `S3_ENDPOINT` : endpoint S3 (ex. `http://minio:9000` en local, ou endpoint cloud).
- `S3_PUBLIC_URL` : base d’URL publique pour accéder aux images (ex. `http://localhost:9000/flowtrack` ou CDN).

**Email / notifications**
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` : serveur SMTP pour les emails (invites, vérification, etc.).

**Essai / trial (optionnel)**
- `NEXT_PUBLIC_ENFORCE_TRIAL` : `true` ou `false` pour activer la logique d’essai (redirection vers `billing/choose-plan`).

### 1.3. Démarrage en prototype

Sur un serveur (ou en local) :

```bash
# À la racine du projet
docker compose build web socket
docker compose up -d
```

- `web` sera exposé en `http://localhost:3000` (ou sur le host du serveur).
- `socket` en `http://localhost:3001`.

En prod, placer un **reverse proxy HTTPS** (Nginx/Traefik) devant le service `web` et exposer uniquement le port 80/443 du proxy.

---

## 2. Guide d’onboarding pour un client pilote

### 2.1. Pour l’admin / owner

1. **Créer le compte admin**
   - Aller sur `APP_URL`.
   - Créer un compte avec l’email qui correspond à `ADMIN_EMAIL` si tu veux qu’il ait la vue Admin globale.

2. **Créer l’organisation et inviter les membres**
   - Depuis le dashboard (compte owner) :
     - Créer/renommer l’organisation.
     - Inviter les membres (emails professionnels) via la page des membres / invitations.
   - Les membres reçoivent un email et créent leur mot de passe.

3. **Configurer les sites bloqués**
   - Dans le dashboard : `Settings → Blocked sites`.
   - Ajouter les domaines à surveiller (ex. `facebook.com`, `youtube.com`, `tiktok.com`, `instagram.com`, etc.).

4. **Communiquer le guide aux membres**
   - Leur envoyer un court message avec :
     - lien vers l’app,
     - étapes d’installation de l’extension,
     - étapes d’installation de l’agent desktop.

---

### 2.2. Pour les membres – Extension navigateur

**Pré-requis** : Chrome/Edge (ou navigateur compatible MV3) installé.

1. **Installer l’extension (mode pilote)**
   - Fournir le dossier `browser-extension` (zippé) ou une version déployée.
   - Dans Chrome :
     - Ouvrir `chrome://extensions`.
     - Activer le **Mode développeur**.
     - Cliquer **« Charger l’extension non empaquetée »**.
     - Sélectionner le dossier de l’extension.

2. **Connecter l’extension à FlowTrack**
   - Clic sur l’icône FlowTrack → “Options”.
   - `Base URL` : `APP_URL` (ex. `https://app.mondomaine.com`).
   - Email + mot de passe du compte FlowTrack membre.
   - Cliquer **“Se connecter”**.
   - Vérifier que le statut devient “Connecté”.

3. **Tester**
   - Ouvrir un ou plusieurs sites bloqués définis par l’orga (FB, YouTube, etc.).
   - L’owner/manager doit voir :
     - dans le widget **Blocked sites alerts**, une ligne par (membre, site),
     - dans `Activity → URLs`, tous les domaines bloqués avec le nombre d’événements.

---

### 2.3. Pour les membres – Agent desktop (Windows)

1. **Installer l’agent**
   - Télécharger `FlowTrack Desktop Agent Setup X.Y.Z.exe` (généré par `npm run dist` dans `agent-desktop`).
   - Lancer l’installeur, suivre les étapes par défaut.

2. **Configurer l’agent**
   - Ouvrir **FlowTrack Agent**.
   - `URL FlowTrack` : `APP_URL` (ex. `https://app.mondomaine.com`).
   - Email + mot de passe du compte FlowTrack membre.
   - Cliquer **“Se connecter à FlowTrack”**.

3. **Démarrer un suivi**
   - Renseigner un nom de projet/tâche (ou laisser “desktop-agent” par défaut).
   - Cliquer **“Démarrer le suivi”**.
   - Travailler normalement quelques minutes.
   - Optionnel : cliquer sur **“Test capture”** pour forcer une capture et vérifier en direct.
   - Après 2–3 minutes, cliquer **“Arrêter le suivi”**.

4. **Vérifier côté owner/manager**
   - `Activity → Screenshots` : voir la dernière capture du membre.
   - `Activity → Screenshots timeline` : voir toutes les captures sur la période (≈ toutes les 10s) + celles du bouton Test.

---

## 3. Checklist sécurité / conformité (base)

> À adapter avec ton équipe sécurité / conseil juridique.

### 3.1. Secrets & configuration

- [ ] `JWT_SECRET` défini avec une valeur forte et non committée dans Git.
- [ ] Accès à MongoDB restreint (réseau privé, firewall, pas d’exposition directe au public).
- [ ] Credentials S3/MinIO (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`) forts et stockés en secret.

### 3.2. HTTPS & réseau

- [ ] Reverse proxy HTTPS configuré devant le service `web` (certificats valides).
- [ ] Redirection HTTP → HTTPS activée.
- [ ] Ports Docker internes (`3000`, `3001`, `27017`, `9000`, `9001`) non exposés publiquement, sauf besoin spécifique.

### 3.3. Accès & rôles

- [ ] `ADMIN_EMAIL` défini et utilisé uniquement par un compte admin de confiance.
- [ ] Vérifié que la section **Admin** du dashboard est invisible pour les autres comptes.
- [ ] Rôles (owner/manager/member) correctement attribués par organisation.

### 3.4. Données & rétention

- [ ] Politique de rétention décidée (combien de temps garder les TimeEntry + captures).
- [ ] Procédure d’export/suppression des données utilisateurs définie.
- [ ] Backups réguliers de MongoDB en place et testés.

### 3.5. Légal

- [ ] Pages légales publiées et adaptées :
  - `/privacy` – Politique de confidentialité,
  - `/terms` – Conditions d’utilisation (CGU),
  - `/security` – Résumé des mesures de sécurité.
- [ ] Informations légales (raison sociale, adresse, pays de droit applicable) intégrées.

---

## 4. Mini roadmap produit après le pilote

Une fois 1–2 clients pilotes en place et des retours collectés :

### 4.1. UX / polish

- Harmoniser les libellés (FR/EN) et les messages (toasts, erreurs, états vides).
- Améliorer la navigation du dashboard (titres, sous-titres, aide contextuelle).
- Ajouter des écrans “empty state” clairs pour chaque page (URLs, Screenshots, Messages, etc.).

### 4.2. Reporting avancé

- Rapports par **projet / client** :
  - temps cumulé par membre,
  - niveau d’activité moyen,
  - éventuellement TOP sites bloqués par projet.
- Exports **CSV** des timesheets et de l’activité.

### 4.3. Intégrations

- Intégrations notifications (Slack / Teams) pour :
  - sites bloqués fréquents,
  - inactivité prolongée,
  - anomalies d’activité.
- Plus tard : intégrations outils de gestion de projet (Jira, Trello, etc.).

---

## 5. Quand est-on prêt pour un premier déploiement ?

Sur la base de l’état actuel du code (build OK, features principales en place) et de cette doc :

- ✅ prêt pour un **déploiement prototype / pilote** chez un client de confiance,
- ⚠️ pour une **ouverture large**, prévoir :
  - un passage avec ton équipe sécurité / juridique (adaptation des pages légales, revue config),
  - la mise en place d’un monitoring de base (logs, métriques).

Ce document sert de base pour t’aider à reproduire le setup que tu as déjà en local et à l’appliquer sur un environnement serveur pour un premier client pilote.
