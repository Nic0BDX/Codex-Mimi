# Les Soirées de Mimi et Nini

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
messages, invitations et résultats sont persistés dans D1, avec vérification du
joueur et contrôle de version pour chaque action de jeu.

## Vérifications

- TypeScript et compilation du Worker réussis.
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
- `db/schema.ts` et `drizzle/` : schéma et migration.

Les petits textes illisibles de l’image MÉGANOPOLY restent adaptés en français.
Les robots et échéances progressent pendant qu’un participant consulte sa soirée.
Le site est créé avec une audience privée ; l’audience ne change pas implicitement.
