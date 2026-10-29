# Guide d'Intégration Payzone Maroc & Système d'Abonnement (40 MAD / mois)

Ce document décrit l'architecture complète, la configuration technique et les procédures de mise en production de la solution de paiement récurrent et sécurisé **Payzone Maroc** pour **STUDIA AI**.

---

## 1. Vue d'Ensemble de l'Offre

* **Formule** : STUDIA AI Premium
* **Tarif** : **40 MAD / mois** (40 DH TTC, sans engagement)
* **Période de facturation** : 30 jours calendaires
* **Marché cible** : Étudiants de l'enseignement supérieur au Maroc (Universités, Écoles d'Ingénieurs, Écoles de Commerce, Facultés de Médecine, BTS, CPGE, etc.)
* **Moyens de paiement acceptés** : Cartes bancaires marocaines (CMI, Attijariwafa bank, Banque Populaire, Bank of Africa / BMCE, CIH Bank, BMCI, Crédit du Maroc, Société Générale Maroc, CFG Bank) et cartes internationales (Visa, Mastercard).

---

## 2. Variables d'Environnement

Définir ces variables dans votre environnement de production ou fichier `.env` :

```env
# Identifiant Marchand fourni par Payzone Maroc (Centre Monétique Interbancaire - CMI)
PAYZONE_MERCHANT_ID=PZ-MA-STUDIA-9812

# Clé secrète cryptographique pour la signature SHA-512
PAYZONE_SECRET_KEY=pz_sec_studia_ai_2026_dev_key

# URL officielle de l'API Payzone Maroc (V2 Charge / Checkout)
# Production : https://payment.payzone.ma/v2/charge
# Sandbox : https://test-payment.payzone.ma/v2/charge
PAYZONE_ENDPOINT_URL=https://payment.payzone.ma/v2/charge

# Mode de test (true = sandbox/simulateur 3D Secure actif, false = production réelle)
PAYZONE_TEST_MODE=true
```

---

## 3. Protocole Cryptographique SHA-512

Pour garantir l'intégrité absolue et prévenir les altérations de montants ou attaques par rejeu, Payzone exige une signature cryptographique **SHA-512** calculée sur une chaîne canonique.

### Chaîne Canonique Payzone :
```text
merchantId|orderId|amount|currency|timestamp|secretKey
```

* `merchantId` : Identifiant du compte marchand (ex. `PZ-MA-STUDIA-9812`).
* `orderId` : Identifiant unique de commande (ex. `ORD-STUDIA-1740837291000-4821`).
* `amount` : Montant exact formaté à deux décimales (ex. `40.00`).
* `currency` : Code numérique ISO 4217 du Dirham marocain (`504`) ou `MAD`.
* `timestamp` : Timestamp Unix en secondes.
* `secretKey` : Clé secrète de sécurité fournie lors de l'enrôlement CMI.

### Calcul de la signature (Node.js) :
```typescript
import crypto from 'crypto';

function generatePayzoneSignature(params: Record<string, any>, secretKey: string): string {
  const canonical = `${params.merchantId}|${params.orderId}|${Number(params.amount).toFixed(2)}|${params.currency}|${params.timestamp}|${secretKey}`;
  return crypto.createHash('sha512').update(canonical, 'utf8').digest('hex');
}
```

---

## 4. Cycle de Vie d'un Paiement

```
[Étudiant] ─── 1. Clic "S'abonner (40 DH)" ───> [STUDIA AI Frontend]
                                                        │
                                          2. POST /api/payments/payzone/initiate
                                                        │
                                                        ▼
                                              [STUDIA AI Backend]
                                          (Génère OrderId & Signature SHA-512)
                                                        │
[Étudiant] <─── 3. Page de paiement Payzone / 3D Secure ──┘
    │
    ├──> Saisie Carte + Code SMS OTP (3D Secure)
    │
    ▼
[Serveur Payzone / CMI] ──── 4. Notification Serveur-à-Serveur (IPN Webhook) ───> [POST /api/payments/payzone/webhook]
                                                                                            │
                                                                                Vérification Signature SHA-512
                                                                                Vérification Montant == 40.00 MAD
                                                                                Vérification Idempotence
                                                                                            │
                                                                                            ▼
                                                                                Activation Subscription = "active"
                                                                                currentPeriodEnd = now + 30 jours
                                                                                Enregistrement PaymentTransaction
```

---

## 5. Webhook Officiel (`POST /api/payments/payzone/webhook`)

Le serveur Payzone contacte STUDIA AI de manière asynchrone pour notifier le résultat de la transaction.

### Payload Reçu :
```json
{
  "merchantId": "PZ-MA-STUDIA-9812",
  "orderId": "ORD-STUDIA-1740837291000-4821",
  "amount": "40.00",
  "currency": "504",
  "timestamp": "1740837291",
  "signature": "d98a2f4c1e...",
  "responseCode": "00",
  "transactionRef": "PZ-TX-849120",
  "authCode": "AUTH-773912",
  "cardBrand": "CMI",
  "last4": "4242",
  "userId": "usr-demo-1"
}
```

### Règles de Traitement Serveur :
1. **Rejet si signature invalide** : Répondre `401 Unauthorized`. L'abonnement n'est jamais activé.
2. **Rejet si montant différent de 40.00 MAD** : Répondre `400 Bad Request`.
3. **Contrôle d'Idempotence** : Si la `transactionRef` figure déjà dans `db.processedTransactions`, retourner `200 OK` sans prolonger doublement.
4. **Code d'approbation `00`** :
   * Statut d'abonnement = `active`
   * `currentPeriodEnd` = date actuelle + 30 jours
   * `nextBillingDate` = `currentPeriodEnd`
   * `autoRenew` = true
   * Enregistrement dans l'historique du compte avec reçu.
5. **Code d'échec (ex. `05`, `51`)** :
   * Statut d'abonnement = `payment_failed`
   * Enregistrement dans le journal des incidents administratifs.

---

## 6. Protection des Fonctionnalités IA (Gating Serveur)

Les routes suivantes sont rigoureusement protégées par le middleware `checkSubscription` :

| Point de terminaison | Fonctionnalité | Comportement si non abonné |
| :--- | :--- | :--- |
| `POST /api/courses/from-pdf` | Importation et analyse de cours PDF | `403 Forbidden` + invitation à s'abonner |
| `POST /api/ai/summarize` | Génération de résumés de cours | `403 Forbidden` + invitation à s'abonner |
| `POST /api/ai/quiz-generate` | Génération de quiz intelligents | `403 Forbidden` + invitation à s'abonner |
| `POST /api/ai/flashcards-generate` | Génération de flashcards | `403 Forbidden` + invitation à s'abonner |
| `POST /api/ai/assistant` | Tuteur conversationnel IA | `403 Forbidden` + invitation à s'abonner |

### Préservation des Données :
* Lorsqu'un abonnement expire ou est résilié, **aucun document ni cours de l'étudiant n'est supprimé**.
* L'étudiant peut continuer à lire et consulter tous ses cours déjà enregistrés et accéder à son historique de paiement.

---

## 7. Gestion des Résiliations

* Lorsqu'un étudiant clique sur **"Annuler le renouvellement"**, le système applique :
  * `subscription.status = 'cancelled'`
  * `subscription.autoRenew = false`
  * `subscription.cancelAtPeriodEnd = true`
* **Règle fondamentale** : L'étudiant conserve l'accès complet jusqu'à la fin de sa période de 30 jours déjà payée (`currentPeriodEnd`).
* À tout moment avant expiration, il peut cliquer sur **"Réactiver le renouvellement"** pour redevenir actif.

---

## 8. Environnement de Test & Simulation 3D Secure

* Lorsque `PAYZONE_TEST_MODE=true`, le composant `PayzoneCheckoutModal` propose une interface de simulation fidèle du protocole 3D Secure marocain.
* Code OTP de test : **`123456`**.
* Un bouton dédié permet également de simuler un refus bancaire pour vérifier la robustesse du traitement des erreurs.

---

## 9. Suite de Tests QA Automatisée (14 Scénarios)

La suite de tests intégrée (`POST /api/test-suite/run`) valide automatiquement les 14 scénarios requis :
1. Inscription d’un nouvel étudiant (compte initial)
2. Refus d’accès aux fonctionnalités Premium pour utilisateur inactif
3. Refus d’accès aux fonctionnalités Premium pour utilisateur avec paiement échoué
4. Refus d’accès aux fonctionnalités Premium pour abonnement expiré
5. Préservation absolue des cours et documents existants après expiration
6. Initiation d’un paiement Payzone sécurisé de 40 MAD (SHA-512 valide)
7. Rejet strict d’un webhook Payzone avec signature altérée ou invalide
8. Validation d’un webhook Payzone officiel et activation de l’abonnement
9. Idempotence : traitement sans doublon d’un webhook reçu plusieurs fois
10. Période mensuelle exacte (+30 jours) et date de prochain renouvellement
11. Annulation du renouvellement : maintien de l’accès jusqu’à la fin de la période payée
12. Réactivation du renouvellement avant expiration
13. Sécurisation stricte de l’activation (interdiction d’activation par simple redirection client)
14. Enregistrement rigoureux de l’historique des transactions dans le compte

---

## 10. Checklist de Mise en Production CMI / Payzone

- [ ] Signer le contrat VAD (Vente à Distance) avec votre banque marocaine acquéreuse (Attijariwafa, BCP, CIH, etc.).
- [ ] Obtenir vos identifiants réels de production Payzone (`merchantId` et `secretKey`).
- [ ] Configurer l'URL IPN Webhook sur le back-office marchand Payzone : `https://votre-domaine.com/api/payments/payzone/webhook`.
- [ ] Remplacer `PAYZONE_TEST_MODE=false` dans votre environnement de production.
- [ ] Réaliser une transaction réelle de test de 40.00 MAD avec une carte bancaire marocaine valide pour valider la chaîne de rapprochement CMI.
