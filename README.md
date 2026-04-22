---

# 🎨 FRONTEND ADMIN — `wishlist-admin/README.md`

Remplace le README Angular actuel.

```md
# Wishlist Event — Admin Panel (Angular)

## 🚀 Description

Interface d’administration pour :

- validation des demandes produits
- gestion du catalogue
- supervision des transactions
- gestion utilisateurs

---

## 🧠 Rôle

⚠️ Ce frontend n’est PAS l’app utilisateur.

C’est un **backoffice admin**.

---

## 🧩 Fonctionnalités

### Product Requests

- liste
- review (approve / reject)
- publication

### Catalog

- CRUD produits
- catégorisation

### Transactions

- suivi paiements
- audit

### Users

- gestion comptes
- suspension

---

## 🔗 API

Base URL :

Endpoints utilisés :

- /product-requests
- /catalog
- /payments
- /users

---

## 🏗 Architecture

- Angular 21
- Services par module métier
- Guards pour accès admin

---

## 🧪 Setup

```bash
npm install
ng serve
```
