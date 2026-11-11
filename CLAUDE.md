# Five app

Compteur de points pour le jeu Five, web app statique pour iPhone (HTML/CSS/JS pur, aucune dépendance).

## Fichiers
- `index.html` : les 2 écrans (setup, partie) + la feuille de saisie de manche + la popup du gagnant.
- `app.js` : toute la logique. Un seul objet `state` (`players`, `max`, `rounds`, `started`) sauvegardé dans localStorage (`five-score-v1`). Les totaux et les éliminations sont recalculés à partir de `rounds`, rien d'autre n'est stocké.
- `style.css` : thème sombre, couleurs dans `:root`.
- `icon.png` / `manifest.json` : icône et mode plein écran sur l'écran d'accueil iPhone.

## Règles implémentées
- Éliminé si total > max (strictement). Points >= 0 uniquement.
- Fin : un seul joueur restant gagne ; si tous les restants sautent dans la même manche, le plus petit total parmi eux gagne.

## Pièges
- Après une annulation de manche, il faut rappeler `checkWinner()` pour réactiver le bouton « Nouvelle manche ».
- Le gagnant en cas d'élimination simultanée doit être choisi parmi les joueurs de la dernière manche, pas parmi tous.
- Inputs en 17px minimum, sinon iOS zoome au focus.

## Lancer en local
`python3 -m http.server 8123` (config dans `.claude/launch.json`).
