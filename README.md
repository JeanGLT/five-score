# Five – Compteur de points

Petite web app pour compter les points au jeu Five, pensée pour iPhone.

- Choisir le nombre de joueurs (2 à 8), leurs noms et la limite (50, 100, 150, 200).
- Saisir les points manche par manche : le total cumulé s'affiche en direct.
- Un joueur qui **dépasse** la limite est éliminé (tomber pile dessus ne l'élimine pas).
- Le dernier joueur en jeu gagne. Si tous les joueurs restants sautent dans la même manche, le plus petit score gagne.
- Annuler la dernière manche, historique des manches, partie sauvegardée sur le téléphone.

## Installer sur iPhone

1. Ouvrir l'adresse GitHub Pages dans **Safari**.
2. Bouton Partager → **Sur l'écran d'accueil**.

## Lancer en local

```bash
python3 -m http.server 8123
```

Puis ouvrir http://localhost:8123.
