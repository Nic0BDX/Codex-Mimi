# Les Soirées de Mimi et Nini

Prototype privé initial confirmé sur
https://soiree-nini-copie.coralaspen259.chatgpt.site.
Les sources sont publiées dans https://github.com/Nic0BDX/Codex-Mimi, branche `main`.

Copie autonome et modifiable de l’interface crème, violet et orange des Soirées de
Dédé : cartes à bordure épaisse, illustrations originales, typographies Baloo 2
et Nunito, navigation mobile, inventaire et thèmes clair/sombre.

Deux profils uniquement, Nini et Mimi, avec surnoms modifiables. Chaque profil
choisit son PIN à quatre chiffres à la première connexion ; PIN haché PBKDF2,
limitation des essais et cookie de session HttpOnly. Aucun compte ni base
Supabase du site original n’est utilisé. Les données de test locales ne sont pas
publiées dans la base distante.

MÉGANOPOLY est le seul jeu conservé : plateau et cartes, robots, achats, loyers,
enchères, constructions, hypothèques, échanges, prison et faillites. Les soirées,
messages, invitations et résultats sont persistés dans PostgreSQL pour la version Vercel, avec vérification du
joueur et contrôle de version pour chaque action de jeu.

## Vérifications

- TypeScript et compilation Next.js de production réussis pour Vercel.
- 90 parties simulées à 2, 3 et 6 joueurs, sans blocage et sans solde négatif.
- Deux navigateurs isolés : PIN distincts, création, invitation, code de salon,
  confirmations, démarrage, dés, chat, rechargement, inventaire, thème et déconnexion.
- Un adversaire automatique progresse réellement côté serveur.
- Aucun débordement horizontal ni erreur JavaScript pendant le parcours.
- Captures et résultats dans [docs/previews](docs/previews).

Le serveur `wrangler dev` sous Windows interrompait certaines requêtes POST ; le
parcours complet a été vérifié avec le serveur de développement Vinext. La
compilation destinée à l’hébergement est également validée.

## Modifier la copie

- `app/config.ts` : titre et configuration des profils.
- `app/components/DedeApp.tsx` : interface et navigation.
- `app/soiree.css` : couleurs, formes et espacements.
- `app/components/MeganopolyGame.tsx` et `app/game/meganopoly/` : plateau et règles.
- `app/api/[...path]/route.ts` : profils, sessions, parties et chat.
- `db/vercel.ts` et `db/migrations/001-postgres.sql` : PostgreSQL et migration Vercel.

Les petits textes illisibles de l’image MÉGANOPOLY restent adaptés en français.
Les robots et échéances progressent pendant qu’un participant consulte sa soirée.
Le site est créé avec une audience privée ; l’audience ne change pas implicitement.

## Préparation Vercel

À la demande de l’utilisateur, le dépôt principal cible Next.js standard sur
Vercel. Une connexion `DATABASE_URL` est requise ; la migration automatique utilise
un schéma séparé `mimi_nini`. Le déploiement Vercel reste à effectuer par
l’utilisateur. Le prototype Sites précédent reste distinct et ne reçoit pas
cette adaptation PostgreSQL.
La compilation Next.js de production puis le parcours Chrome complet ont été
validés avec PostgreSQL : PIN séparés, soirée à deux, invitation, chat, reprise,
inventaire, thème, déconnexion et robot. La vérification des origines utilise le
nom d’hôte public et les cookies tiennent compte du proxy HTTPS de Vercel.
