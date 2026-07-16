# Spécification fonctionnelle — Attribution interactive de parcelles

## 1. Objectif

Créer une application web statique, en français, permettant d'enregistrer des participants et d'attribuer aléatoirement des parcelles en privilégiant des groupes contigus.

L'application utilise uniquement HTML, CSS, JavaScript et SVG. Elle ne nécessite ni serveur, ni base de données, ni authentification et peut être publiée sur GitHub Pages.

Dépôt cible : `https://github.com/jbdossa/land-allocation`.

## 2. Parcelles

Le terrain contient 29 zones physiques :

- Lot 1 : `L1-a` à `L1-j` — 10 parcelles attribuables ;
- Lot 2 : `L2-a` à `L2-s` — 19 parcelles physiques ;
- `L2-s` est visible mais exclue de toute attribution.

Il y a donc **28 parcelles attribuables**.

`L2-s` doit rester grise, porter le statut « Non attribuable » et ne jamais apparaître dans le groupe des parcelles disponibles.

## 3. Interface générale

L'application tient sur une seule page responsive.

### 3.1 Panneau de gauche

Il contient :

- le formulaire d'ajout d'un participant ;
- la référence du participant ;
- le nombre de parcelles demandé ;
- le tableau des participants ;
- un bouton **Attribuer** sur chaque ligne ;
- les actions de réinitialisation, d'export PDF et de verrouillage ;
- les outils de débogage, masqués par défaut.

### 3.2 Panneau de droite

Il contient :

- la carte SVG interactive ;
- les informations de la parcelle sélectionnée ;
- un panneau récapitulatif indiquant ce qui est attribué à chaque participant.

La carte d'adjacence interne n'est jamais affichée par défaut.

## 4. Participants

Un participant est défini par :

- une **référence** libre : nom complet, famille, entreprise, association, etc. ;
- un **nombre de parcelles demandé**, entier strictement positif.

Avant attribution, un participant peut être modifié ou supprimé. Après attribution, sa ligne devient en lecture seule jusqu'à une réinitialisation.

## 5. Tableau des participants

Colonnes prévues :

| Référence | Nombre demandé | Statut | Parcelles attribuées | Action |
|---|---:|---|---|---|
| Famille DOSSA | 4 | En attente | — | Attribuer |
| Entreprise ABC | 2 | Attribué | L2-c, L2-d | Attribué |

### 5.1 Avant attribution

- statut : `En attente` ;
- bouton actif : `Attribuer`.

### 5.2 Après attribution réussie

- statut : `Attribué` ;
- bouton vert ;
- libellé : `Attribué` ;
- bouton désactivé ;
- parcelles affichées dans la ligne ;
- parcelles colorées sur la carte ;
- parcelles retirées du groupe disponible.

Une parcelle ne peut jamais être attribuée deux fois.

## 6. Carte SVG interactive

Chaque parcelle est une forme SVG indépendante portant un identifiant unique.

Au clic, le panneau d'information indique :

- l'identifiant de la parcelle ;
- son statut ;
- son bénéficiaire éventuel.

Lorsqu'une parcelle attribuée est sélectionnée, toutes les parcelles du même participant sont mises en évidence.

### 6.1 Couleurs

La règle demandant des bordures différentes pour deux parcelles adjacentes est abandonnée.

Les règles retenues sont :

- bordures uniformes noires ou gris foncé ;
- une couleur de remplissage distincte par participant ;
- même couleur pour toutes les parcelles d'un participant ;
- `L2-s` en gris ;
- survol et sélection visibles par un contour renforcé.

## 7. Graphe d'adjacence

L'application contient un graphe interne indiquant les parcelles qui partagent une frontière.

Ce graphe sert uniquement à l'algorithme et au débogage.

Un bouton **Afficher les données de débogage** permet d'afficher ponctuellement :

- la carte d'adjacence ;
- les parcelles disponibles ;
- les attributions internes ;
- le nombre de blocs contigus.

Le panneau est masqué par défaut.

La géométrie et l'adjacence devront être validées avec une version haute résolution du plan, en particulier autour de l'extrémité supérieure de la voie de 10 mètres et des parcelles irrégulières de droite.

## 8. Règles d'attribution

### 8.1 Déclenchement individuel

L'utilisateur clique sur **Attribuer** dans la ligne du participant concerné.

L'ordre des clics détermine l'ordre de priorité. Les premiers participants disposent de plus de choix que les suivants.

### 8.2 Quantité exacte

Le participant reçoit exactement le nombre demandé, à condition qu'un nombre suffisant de parcelles soit disponible.

Aucune attribution partielle automatique n'est autorisée.

### 8.3 Continuité prioritaire

Pour plusieurs parcelles, l'algorithme cherche d'abord un seul groupe connecté.

Ordre de préférence :

1. un bloc contigu ;
2. deux blocs contigus ;
3. trois blocs ;
4. etc.

### 8.4 Division minimale

Si un bloc unique est impossible, l'algorithme choisit une solution ayant le plus petit nombre de composantes connexes.

### 8.5 Aléatoire contrôlé

Lorsqu'il existe plusieurs solutions de qualité équivalente, l'une d'elles est choisie aléatoirement.

### 8.6 Exclusions

Sont exclues de chaque nouveau calcul :

- `L2-s` ;
- toutes les parcelles déjà attribuées.

### 8.7 Insuffisance

Si le nombre de parcelles disponibles est insuffisant, aucune modification n'est effectuée et un message explicite est affiché.

## 9. Panneau récapitulatif

Pour chaque participant servi, le panneau affiche :

- sa référence ;
- le nombre attribué ;
- la liste des parcelles ;
- le nombre de blocs contigus.

Un clic sur un participant du récapitulatif met en évidence toutes ses parcelles.

## 10. Validation

Le formulaire refuse :

- une référence vide ;
- zéro ou une valeur négative ;
- une valeur non entière ;
- une demande supérieure à 28.

L'application signale également si le total demandé par les participants dépasse le nombre de parcelles encore attribuables.

## 11. Sauvegarde locale

L'état est sauvegardé dans `localStorage` :

- participants ;
- parcelles attribuées ;
- couleurs ;
- état verrouillé ou non.

Les données restent limitées au navigateur et à l'appareil utilisés.

## 12. Réinitialisation

Deux actions sont prévues :

### 12.1 Réinitialiser les attributions

- conserve les participants ;
- libère toutes les parcelles ;
- remet les participants en attente ;
- retire le verrouillage.

### 12.2 Tout effacer

- supprime participants et attributions ;
- remet l'application à son état initial.

Une confirmation est demandée avant chaque opération destructive.

## 13. Export PDF

Un bouton **Exporter en PDF** ouvre une version d'impression contenant :

- la date et l'heure ;
- le tableau des participants ;
- les parcelles attribuées ;
- le nombre de blocs ;
- la carte colorée.

Le navigateur permet ensuite d'enregistrer le document au format PDF via la boîte de dialogue d'impression.

## 14. Verrouillage

Un bouton **Verrouiller les attributions** finalise le tirage.

Après confirmation :

- aucune attribution supplémentaire n'est possible ;
- aucun participant ne peut être ajouté, modifié ou supprimé ;
- les boutons d'attribution sont désactivés ;
- l'application passe en lecture seule ;
- l'export PDF reste disponible.

Pour modifier les résultats, une réinitialisation explicite est nécessaire.

## 15. Organisation du développement

### Bloc 1 — Carte interactive

- reconstruction du plan en SVG ;
- parcelles cliquables ;
- états visuels ;
- panneau d'information ;
- mise en évidence d'un bénéficiaire.

### Bloc 2 — Gestion des participants

- formulaire ;
- tableau ;
- validations ;
- suppression avant attribution ;
- sauvegarde locale ;
- récapitulatif.

### Bloc 3 — Attribution et finalisation

- graphe d'adjacence ;
- recherche de blocs contigus ;
- minimisation des blocs ;
- choix aléatoire ;
- export PDF ;
- verrouillage.

## 16. Critères de réussite

L'application est fonctionnelle lorsque :

- les participants peuvent être ajoutés ;
- chaque ligne possède son bouton d'attribution ;
- la quantité attribuée est exacte ;
- la continuité est privilégiée ;
- aucune double attribution n'est possible ;
- `L2-s` reste exclue ;
- la carte se met à jour immédiatement ;
- un clic identifie le bénéficiaire ;
- le récapitulatif reste synchronisé ;
- l'état est conservé localement ;
- les résultats peuvent être exportés en PDF ;
- le tirage peut être verrouillé ;
- le site fonctionne sur GitHub Pages.

## 17. Limite connue de la première implémentation

La première version utilise une reconstruction SVG schématique et un graphe d'adjacence déduit du plan fourni. Une validation finale devra être effectuée à partir du plan cadastral original ou d'une image de meilleure résolution avant utilisation officielle.


## Mise à jour — confirmations et double affichage du plan

### Confirmation des actions par participant

- Le bouton **Attribuer** demande une confirmation avant tout tirage.
- La confirmation indique la référence du participant, le nombre demandé et le nombre de parcelles encore disponibles.
- Le bouton **Supprimer** demande également une confirmation explicite avant de retirer un participant.
- Une annulation de la boîte de confirmation ne modifie aucune donnée.

### Plan original et plan interactif

La colonne de droite affiche désormais, dans cet ordre :

1. l'image originale du domaine morcelé, afin que les participants voient le plan réel ;
2. le plan SVG interactif, utilisé pour consulter les attributions en temps réel ;
3. les panneaux d'information et de récapitulatif.

L'image originale est une référence visuelle temporaire. À terme, le SVG interactif devra être redessiné trait pour trait à partir de ce plan.

### Affichage intégral du plan original

Le plan original doit toujours être visible dans son intégralité. Il conserve ses proportions réelles et peut être réduit pour tenir dans son panneau. Aucun recadrage, étirement ou remplissage de type `cover` n'est autorisé.

## Export PDF — version 12

L'export PDF contient uniquement :

1. la liste complète des participants et leurs parcelles attribuées ;
2. le plan original du domaine, affiché intégralement sur la page suivante.

Le formulaire d'ajout, les boutons d'action, le plan interactif, la parcelle sélectionnée et l'historique ne sont pas imprimés.

## Mise à jour — caractère aléatoire du tirage

Lorsqu'il existe plusieurs solutions présentant le même nombre minimal de blocs contigus, elles sont considérées comme équivalentes. L'application choisit aléatoirement et uniformément parmi les solutions distinctes trouvées. Aucun critère secondaire de compacité ne doit favoriser systématiquement la même zone du plan. Le générateur aléatoire sécurisé du navigateur est utilisé lorsqu'il est disponible.

---

## Version 21 — exigences de tirage aléatoire

L’algorithme ne doit pas dépendre de l’ordre interne des identifiants de parcelles.
Pour une demande donnée, il doit rechercher les groupes contigus distincts disponibles,
les dédupliquer, puis choisir aléatoirement parmi toutes les solutions ayant le même
nombre minimal de blocs. Le générateur aléatoire sécurisé du navigateur est utilisé
lorsqu’il est disponible. Aucun lot, aucune lettre et aucune position verticale ne doit
être privilégié par l’ordre d’exploration du graphe.

## Règle de groupage pratique — Version 21

Après minimisation du nombre de composantes contiguës, les solutions sont classées selon leur facilité d'utilisation :

1. une suite continue dans une seule colonne est prioritaire ;
2. sinon, l'étalement vertical et horizontal doit être réduit ;
3. les formes compactes partageant davantage de frontières internes sont préférées ;
4. le diamètre du groupe dans le graphe d'adjacence est minimisé ;
5. le choix demeure aléatoire entre toutes les solutions ayant exactement le même score.
