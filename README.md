# Bloc 1 — Auth + Profils + Dashboard

## Installation

```bash
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir
npm install @supabase/ssr @supabase/supabase-js
```

Copier `.env.example` en `.env.local` et remplir avec les clés du projet Supabase
(Project Settings → API).

## Base de données

```bash
npx supabase link --project-ref <ton-project-ref>
npx supabase db push   # applique supabase/migrations/0001_init.sql
```

Puis régénérer les types réels :

```bash
npx supabase gen types typescript --project-id <id> > types/database.types.ts
```

## Ce qui est en place

- `profiles` : 1 ligne par utilisateur, créée automatiquement à l'inscription (trigger DB)
- Rôles : visiteur / membre / etudiant / client / coach / administrateur
- RLS : lecture publique des profils, écriture limitée à soi-même, `role`/`xp`/`level`
  non modifiables depuis le client (réservés à des fonctions serveur futures — ex. la
  gamification du bloc suivant appellera une fonction `security definer` dédiée)
- `middleware.ts` protège `/dashboard/*` (redirige vers `/login`) et `/admin/*`
  (vérifie `role = 'administrateur'`)
- Server Actions : `signUp`, `signIn`, `signOut`, `updateProfile` — aucun appel
  Supabase direct depuis un Client Component, tout passe par le serveur

## Points à décider avant le bloc 2 (Formations)

1. Confirmation email obligatoire avant accès au dashboard ? (actuellement oui,
   via `/verifiez-vos-emails` — page à créer)
2. Faut-il un flux "invité" (accès contenu gratuit sans compte) avant conversion
   en `membre` ?
3. La progression XP sera pilotée par les futures actions "leçon terminée" /
   "quiz réussi" — la colonne `xp`/`level` existe déjà, verrouillée en écriture
   directe pour éviter la triche côté client.

---

# Bloc 2 — Formations / Modules / Chapitres / Leçons

## Migrations ajoutées

- `0002_formations.sql` : catégories, formations, modules, chapitres, leçons
  (métadonnées publiques dès que la formation est publiée), `lecon_contents`
  (contenu réel, gated), `enrollments`, `lesson_progress`
- `0003_complete_lesson.sql` : fonction RPC `complete_lesson` — point d'entrée
  unique pour valider une leçon et créditer l'XP (appelée via
  `supabase.rpc('complete_lesson', ...)`, jamais d'update direct sur `profiles`)

## Logique de verrouillage

- `is_lesson_unlocked(lecon_id, user_id)` (fonction SQL) : une leçon est
  débloquée si (a) elle est marquée `is_free_preview`, ou (b) l'utilisateur a
  accès à la formation ET la leçon précédente (ordre global
  module→chapitre→leçon) est marquée terminée dans `lesson_progress`.
- Cette fonction est **la seule source de vérité** : elle est utilisée à la
  fois dans la policy RLS de `lecon_contents` (empêche de lire le contenu par
  API directe) et dans `lib/formations/get-formation-tree.ts` (pour l'affichage
  des cadenas). Le TS ne fait qu'illustrer visuellement ce que la RLS impose déjà.
- `has_formation_access(formation_id, user_id)` : vrai si la formation est
  gratuite, ou si l'utilisateur est admin, ou s'il existe une ligne dans
  `enrollments`. Ces lignes seront créées par le webhook Stripe (bloc Paiement),
  jamais insérées directement par le client (`policy "No direct enrollment
  inserts"`).

## Ce qu'il reste à faire avant le bloc Quiz

1. `lecons.type = 'quiz'` existe déjà dans l'enum mais la page leçon actuelle
   ne gère que vidéo/texte — le rendu du quiz (types de questions, correction
   auto) est prévu comme bloc dédié.
2. `types/database.types.ts` n'a pas encore été régénéré avec les nouvelles
   tables (`npx supabase gen types ...` après `db push`) — le code présume ces
   colonnes mais TypeScript ne les validera pas tant que ce n'est pas fait.
3. Back-office : aucune interface admin pour créer formations/modules/leçons
   pour l'instant (à faire dans le bloc Administration), le contenu est donc
   à insérer manuellement en base en attendant.

---

# Bloc 3 — Quiz

## Migrations ajoutées

- `0004_quiz.sql` : `quizzes`, `questions`, `question_options`, `question_pairs`,
  `quiz_attempts`, `quiz_attempt_answers`
- `0005_submit_quiz.sql` : fonction RPC `submit_quiz_attempt` — correction
  automatique, seul point d'entrée pour soumettre une tentative

## Types de questions couverts

QCM, choix multiples, vrai/faux, texte libre, association, ordonnancement,
image. **Code** : la soumission est enregistrée mais `is_correct = null` —
une vraie correction automatique de code demande un exécuteur sandboxé
(conteneur éphémère par langage), volontairement hors scope de ce bloc.
À traiter comme un bloc à part si tu veux l'activer.

## Sécurité de la correction (important)

Aucune bonne réponse n'est lisible côté client avant soumission :

- `question_options.is_correct` et `position_correcte` : colonnes retirées
  du `GRANT SELECT` pour le rôle `authenticated` (privilège au niveau colonne,
  pas seulement RLS au niveau ligne)
- `questions.explication` et `reponse_attendue` : même traitement — seule
  la fonction `submit_quiz_attempt` (`security definer`) peut les lire ; elle
  les renvoie dans le champ `details` de sa réponse, donc visibles uniquement
  après correction
- `question_pairs.droite` (la bonne association) : jamais lisible ; seul
  `gauche` (le libellé à associer) est exposé au client
- Les tables `quiz_attempts`/`quiz_attempt_answers` n'acceptent aucun insert
  direct (`policy ... with check (false)`) — tout passe par la fonction RPC

## Simplifications assumées (à connaître avant d'itérer)

- `association` et `ordonnancement` sont corrigés tout-ou-rien par question
  (pas de points partiels si une seule paire/position est fausse)
- `texte_libre` compare en normalisant casse + espaces ; pas de tolérance aux
  fautes de frappe (pas de correction floue/Levenshtein)
- Si réussite du quiz (score ≥ seuil), la leçon est automatiquement marquée
  terminée via `complete_lesson` — donc l'XP et le déverrouillage de la
  leçon suivante suivent la même mécanique que pour une leçon vidéo

## Ce qu'il reste avant le bloc Paiement

Le catalogue affiche déjà `is_premium`/`prix_centimes`, mais rien n'insère
encore de ligne dans `enrollments` — c'est le webhook Stripe (bloc suivant)
qui le fera.

---

# Bloc 4 — Paiement (Stripe)

## Migrations ajoutées

- `0006_paiement.sql` : `orders`, `subscriptions`, `gift_cards`, colonnes
  Stripe sur `formations`, `profiles.credit_centimes`
- `0007_redeem_gift_card.sql` : RPC `redeem_gift_card`
- `0008_debiter_credit.sql` : RPC `debiter_credit`

## Installation Stripe

```bash
npm install stripe
```

Créer le webhook dans le dashboard Stripe (ou via `stripe listen` en local) :

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copier le secret affiché dans `STRIPE_WEBHOOK_SECRET`.

## Ce qui est couvert

- **Paiement unique** : `createFormationCheckout` — Stripe Checkout avec TVA
  automatique (`automatic_tax`) et codes promo natifs Stripe
  (`allow_promotion_codes`, pas de table promo custom nécessaire)
- **Abonnement** : `createAbonnementCheckout` (mode `subscription`) — pour les
  packs annuels type "Au menu" ; le webhook `customer.subscription.*` tient
  `subscriptions` à jour
- **Bons cadeaux** : soit liés à une formation précise (accès direct via
  `enrollments`), soit à montant libre (crédité sur `profiles.credit_centimes`
  et déduit automatiquement au prochain achat, avant même d'ouvrir Stripe si le
  crédit couvre tout le prix)
- **Facturation** : `orders` stocke montant, TVA, session Stripe — Stripe reste
  la source de vérité légale (factures PDF téléchargeables depuis le Customer
  Portal Stripe, pas régénérées côté GPIG)

## Sécurité

- Le webhook vérifie la signature Stripe (`stripe.webhooks.constructEvent`)
  avant tout traitement — jamais de confiance aveugle dans le payload
- `lib/supabase/service-role.ts` n'est importé que par le webhook ; ce fichier
  ne doit **jamais** être importé depuis un Client Component ou toute route
  qui finirait dans le bundle navigateur (la clé service_role contourne RLS
  entièrement)
- `orders`/`subscriptions`/`gift_cards` : aucun insert direct côté client,
  tout passe par le webhook (service_role) ou une fonction `security definer`
- Idempotence : le webhook vérifie `stripe_session_id` avant d'insérer, pour
  survivre aux retries Stripe (garantis par leur système, pas optionnels)

## Ce qui reste à faire / limites assumées

1. **Packs** (`type = 'pack'`) : le type existe dans l'enum `order_type` mais
   aucune UI dédiée pour composer un pack multi-formations — à faire quand tu
   auras défini les packs réels que tu veux vendre.
2. **Génération des bons cadeaux** : pas d'UI encore pour qu'un client en
   achète un (ce serait un `createFormationCheckout`-like dédié qui, au lieu de
   créer un enrollment, insère une ligne `gift_cards` avec un code généré) —
   à faire avant mise en prod si tu veux vendre des cadeaux, pas juste les
   distribuer manuellement depuis l'admin.
3. **Factures téléchargeables dans le dashboard GPIG** : actuellement redirigé
   vers le Customer Portal Stripe plutôt que régénéré ; plus simple et plus
   fiable légalement, mais moins intégré visuellement — à trancher si tu veux
   un vrai espace "Mes factures" dans le design du site.

---

# Bloc 5 — Scaffolding : style, layout, pages manquantes

## Fichiers de config ajoutés

`package.json`, `tsconfig.json` (alias `@/*`), `next.config.mjs`,
`tailwind.config.ts`, `postcss.config.mjs` — le projet peut maintenant
être installé avec `npm install` directement (plus besoin de repartir de
`create-next-app`).

## Identité visuelle

Direction "carnet de laboratoire botanique" (cohérente avec le nom GPIG /
jardin expérimental) plutôt que les patterns par défaut. Tokens dans
`tailwind.config.ts` et `app/globals.css` :

- `paper` / `ink` : fond papier herbier, texte encre vert-noir
- `moss` : accent primaire (remplace l'`emerald` générique utilisé dans les
  blocs précédents — déjà appliqué partout via un renommage global)
- `amber` (Tailwind par défaut) : XP, badges, éléments premium
- Fraunces (display) / Public Sans (corps) / IBM Plex Mono (utilitaire :
  timers, codes, étiquettes de classement)
- Signature : `components/growth-meter.tsx` — jauge de progression en
  stades de croissance (graine → arbre), utilisée sur la home ET le
  dashboard à la place d'une barre de progression générique

## Pages qui manquaient et sont maintenant en place

- `app/layout.tsx` — layout racine, polices, nav, footer, métadonnées SEO
- `app/page.tsx` — page d'accueil
- `app/(auth)/verifiez-vos-emails/page.tsx` — référencée par `signUp` mais
  jamais créée jusqu'ici
- `app/classement/page.tsx` — référencée par la nav, absente jusqu'ici
- `app/not-found.tsx` — 404 dans le ton du site
- `components/site-nav.tsx` — nav consciente de l'état de connexion

## Reste à faire pour la cohérence visuelle

Les pages des blocs précédents (login, register, formations, quiz,
dashboard) utilisent encore des `gray-*` Tailwind par défaut pour les
textes secondaires/bordures — fonctionnel, mais pas encore aligné sur les
tokens `ink-soft`/`line`. À uniformiser dans une passe dédiée si tu veux
un rendu 100% cohérent avant mise en ligne.
