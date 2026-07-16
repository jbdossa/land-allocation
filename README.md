# Attribution de parcelles

Application web statique en français pour attribuer 28 parcelles à des participants, en privilégiant des groupes contigus.

## Lancer localement

Ouvrir `index.html` dans un navigateur moderne, ou servir le dossier avec :

```bash
python3 -m http.server 8000
```

Puis ouvrir `http://localhost:8000`.

## Publication GitHub Pages

1. Envoyer le contenu du dossier à la racine du dépôt.
2. Ouvrir **Settings → Pages**.
3. Choisir **Deploy from a branch**, branche `main`, dossier `/ (root)`.

## Documentation

Voir [SPECIFICATION.md](./SPECIFICATION.md).

## Note importante

La géométrie SVG et le graphe d'adjacence de cette première version sont schématiques et doivent être validés à partir du plan cadastral original avant un tirage officiel.


## Version 4

- Confirmation avant l'attribution d'un participant.
- Confirmation avant la suppression d'un participant.
- Affichage du plan original au-dessus du plan interactif.

## Version 9

La colonne des participants reprend la mise en page générale de la version 5, mais remplace le tableau par des cartes robustes. Les boutons d'action occupent une ligne réservée et restent côte à côte sur ordinateur.

## Version 10

Correction de la colonne des participants : le formulaire d'ajout ne peut plus être comprimé ou coupé. Lorsque la hauteur disponible est insuffisante, la colonne défile uniquement de haut en bas, sans défilement horizontal.

## Version 11

Le plan original conserve désormais strictement son rapport largeur/hauteur et est réduit autant que nécessaire pour apparaître en entier. Aucun recadrage n'est appliqué.

### Export PDF

Dans la version 12, l'export imprime uniquement la liste des participants, puis le plan original sur une seconde page. Les contrôles, le plan interactif et l'historique sont masqués à l'impression.

## Version 15 — amélioration du tirage aléatoire

Le tirage choisit désormais uniformément parmi les groupes ayant le même nombre minimal de blocs contigus. Le précédent critère secondaire de compacité a été supprimé, car il conduisait souvent aux mêmes résultats après réinitialisation. Le générateur sécurisé du navigateur (`crypto.getRandomValues`) est utilisé lorsqu'il est disponible.

## Version 21 — suppression du biais d’ordre

- Les groupes contigus sont désormais énumérés et dédupliqués avant le tirage.
- L’ordre de déclaration des parcelles ne favorise plus le Lot 1, le haut ou le bas du plan.
- Les points de départ et les voisins sont mélangés avec le générateur aléatoire sécurisé du navigateur.
- Le choix final est uniforme parmi les groupes contigus distincts de même qualité.
- Le critère prioritaire reste le nombre minimal de blocs contigus.

## Version 21 — groupage pratique

L'attribution conserve la priorité au nombre minimal de blocs contigus, puis :

1. privilégie une suite continue dans une même colonne ;
2. à défaut, privilégie les formes ayant le plus faible étalement vertical et horizontal ;
3. favorise les groupes qui partagent davantage de frontières internes ;
4. choisit aléatoirement entre les solutions ayant exactement le même score pratique.
