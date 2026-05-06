# Images — Proposition de placement

Toutes les images sont des suggestions. Les dimensions indiquées sont les tailles d'affichage recommandées ;
l'upload peut être plus grand (le backend ou un CDN devrait redimensionner/compresser).

---

## 1. Pages publiques

### 1.1 Page d'accueil (`/`)

| Zone | Description | Format | Dimensions |
|------|-------------|--------|-----------|
| **Hero background** | Image d'ambiance plein-écran derrière le titre principal (overlay noir semi-transparent par-dessus) | JPEG/WebP | 1920 × 1080 px |
| **Section "Comment ça marche" — icônes** | 3 icônes illustratives pour les étapes (créer, inviter, offrir) | SVG ou PNG transparent | 80 × 80 px |
| **Social proof / photos** | 2–3 photos de vrai mariage/anniversaire pour crédibiliser la plateforme | JPEG/WebP | 600 × 400 px |

### 1.2 Page catalogue public (`/catalogue`)

| Zone | Description | Format | Dimensions |
|------|-------------|--------|-----------|
| **Vignette produit** (`mainImageUrl`) | Photo du produit sur fond blanc, ratio carré | JPEG/WebP | 400 × 400 px |
| **Image hover / second angle** | Photo alternative visible au survol de la carte | JPEG/WebP | 400 × 400 px |

### 1.3 Page cagnotte publique (`/jackpot/:token`)

| Zone | Description | Format | Dimensions |
|------|-------------|--------|-----------|
| **Hero cagnotte** (`imageUrl`) | Photo ou illustration de l'objet/projet financé, affichée en carré dans le hero noir | JPEG/WebP | 800 × 800 px (affiché 200 × 200 px) |

### 1.4 Liste des cagnottes (`/jackpots`)

| Zone | Description | Format | Dimensions |
|------|-------------|--------|-----------|
| **Vignette carte cagnotte** (`imageUrl`) | Même image que le hero, recadrée 16/9 sur la carte | JPEG/WebP | 800 × 450 px (ratio 16/9) |

---

## 2. Espace utilisateur (`/app/…`)

### 2.1 Événements

| Zone | Description | Format | Dimensions |
|------|-------------|--------|-----------|
| **Bannière événement** | Photo de couverture de l'événement (mariage, anniversaire, etc.), affichée en haut de la page détail | JPEG/WebP | 1280 × 480 px (ratio 8/3) |
| **Avatar organisateur** | Photo de profil de la personne qui crée l'événement | JPEG/WebP carré | 128 × 128 px (affiché 38–48 px) |

### 2.2 Wishlist / produits demandés

| Zone | Description | Format | Dimensions |
|------|-------------|--------|-----------|
| **Photo produit demandé** (`imageUrl` sur ProductRequest) | Photo du produit souhaité, copiée/collée depuis un site e-commerce ou uploadée | JPEG/WebP | 600 × 600 px (affiché ~80 px en liste, pleine largeur en détail) |

### 2.3 Profil utilisateur

| Zone | Description | Format | Dimensions |
|------|-------------|--------|-----------|
| **Avatar utilisateur** | Photo de profil, affichée dans la navbar et le dashboard | JPEG/WebP carré | 256 × 256 px (affiché 28–48 px) |

---

## 3. Interface admin (`/admin/…`)

### 3.1 Catalogue admin

| Zone | Description | Format | Dimensions |
|------|-------------|--------|-----------|
| **Photo principale produit** (`mainImageUrl`) | Photo produit visible sur la carte du catalogue | JPEG/WebP | 800 × 800 px (affiché ~160 × 160 px) |
| **Photos additionnelles** | Galerie optionnelle (angles multiples, détail) | JPEG/WebP | 800 × 800 px |

### 3.2 Cagnottes admin

| Zone | Description | Format | Dimensions |
|------|-------------|--------|-----------|
| **Image cagnotte** (`imageUrl`) | Même asset que la page publique, prévisualisé dans le panel admin | JPEG/WebP | 800 × 800 px |

---

## 4. Layout / navigation

| Zone | Description | Format | Dimensions |
|------|-------------|--------|-----------|
| **Logo navbar (texte "Zwish")** | Logo SVG ou PNG transparent blanc, version inline dans la navbar noire | SVG | 120 × 32 px |
| **Logo favicon** | Icône onglet navigateur | PNG | 32 × 32 px et 192 × 192 px |
| **Logo Open Graph** | Image affichée lors du partage sur WhatsApp / réseaux sociaux | JPEG/WebP | 1200 × 630 px |

---

## 5. Emails transactionnels (hors scope frontend, pour info)

| Zone | Description | Dimensions |
|------|-------------|-----------|
| **Header email** | Logo en version fond blanc | 300 × 80 px |
| **Bannière email** | Image d'ambiance (optionnel) | 600 × 200 px |

---

## Bonnes pratiques

- **Format** : préférer WebP (30–50 % plus léger que JPEG) avec fallback JPEG pour iOS < 14.
- **Poids max** : < 200 KB après compression pour toute image affichée côté client.
- **Nommage** : `{type}-{id}-{timestamp}.webp` ex. `product-42-1714000000.webp`
- **CDN** : toutes les images devraient transiter par un CDN (ex. Cloudinary, ImageKit, Bunny.net) pour le resize automatique et la mise en cache.
- **Alt text** : chaque `<img>` doit avoir un attribut `[alt]` descriptif (déjà en place dans le code).
- **Placeholder** : en attendant une vraie image, les composants affichent déjà un emoji (💰, 🛍️) — penser à conserver ce fallback.
