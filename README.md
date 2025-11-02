# 📊 Dashboard de Visualisation de Données - Films et Séries

## 🎯 Description

Dashboard interactif de visualisation de données pour explorer et analyser un large catalogue de films et séries. Ce projet propose quatre types de visualisations différentes avec des filtres globaux permettant une exploration approfondie des données.

## ✨ Fonctionnalités

### 🔍 Filtres Globaux
- **Genres** : Sélection multiple de genres (Action, Drama, Comedy, etc.)
- **Régions** : Filtrage par régions de production (Europe, Asie, Amérique du Nord, etc.)
- **Années** : Slider de plage d'années (1945-2025)

### 📈 Visualisations

#### 1. **Scatterplot (Nuage de points)**
- Visualisation de la relation entre différentes métriques
- Axes configurables : Votes IMDB, Score IMDB, Durée
- Taille des points : Popularité, Votes, Durée
- Couleur : Région, Genre, Type (Film/Série)
- Animation temporelle avec contrôle Play/Pause
- Échelle logarithmique optionnelle
- Statistiques en temps réel

#### 2. **Treemap (Carte à cases)**
- Exploration hiérarchique par Genre → Région
- Mode comparaison entre deux années
- Tri par nom ou nombre de titres
- Échelle logarithmique pour les surfaces
- Export SVG avec légende de carte du monde
- Animation temporelle
- Statistiques détaillées

#### 3. **Sunburst (Graphique en rayons de soleil)**
- Hiérarchie Type → Certification d'âge → Genre
- Navigation interactive avec zoom
- Panneau de détails latéral avec liste de films
- Tri et filtrage des films affichés
- Modal détaillé pour chaque film

#### 4. **Chord Diagram (Diagramme de cordes)**
- Relations entre Genres et Régions
- Visualisation des co-occurrences
- Liste de films interactive au clic
- Coloration dynamique selon la sélection

## 📦 Structure du Projet

```
Information_visualisation/
├── dashboard.html              # Page principale
├── dashboard.js                # Logique globale et filtres
├── style.css                   # Styles personnalisés
├── filters.js                  # Gestion des filtres (legacy)
├── preprocessing.ipynb         # Notebook de prétraitement
├── README.md                   # Ce fichier
│
├── data/
│   ├── titles.csv             # Données brutes
│   └── preprocessed.csv       # Données traitées
│
├── scatterplot/
│   └── scatterplot.js         # Visualisation scatterplot
│
├── treemap/
│   └── treemap.js             # Visualisation treemap
│
├── sunburst/
│   ├── index.html             # Page standalone (optionnel)
│   ├── style.css              # Styles sunburst
│   └── sunburst.js            # Visualisation sunburst
│
└── chord/
    └── chord.js               # Visualisation chord diagram
```

## 🚀 Installation et Lancement

### Prérequis
- **Python 3.12+** (pour le prétraitement)
- Un serveur web local (Python, Node.js, ou extension VS Code)

### Étape 1 : Prétraitement des Données

1. Installez les dépendances Python :
```bash
pip install pandas numpy pycountry
```

2. Exécutez le notebook `preprocessing.ipynb` pour générer `data/preprocessed.csv`

### Étape 2 : Lancer le Serveur

**Option A : Python**
```bash
python -m http.server 8000
```

**Option B : Python 3**
```bash
python3 -m http.server 8000
```

**Option C : VS Code Live Server**
- Installez l'extension "Live Server"
- Clic droit sur `dashboard.html` → "Open with Live Server"

### Étape 3 : Ouvrir dans le Navigateur

Accédez à : `http://localhost:8000/dashboard.html`

## 📊 Utilisation

### Navigation
1. Utilisez les **onglets** en haut pour basculer entre les visualisations
2. Ajustez les **filtres globaux** en haut de page :
   - Cochez/décochez les genres souhaités
   - Sélectionnez les régions
   - Ajustez la plage d'années avec le slider
3. Les visualisations se mettent à jour automatiquement

### Interactions Spécifiques

**Scatterplot :**
- Cliquez sur Play pour animer l'évolution année par année
- Changez les axes et la taille des points avec les menus déroulants
- Survolez les points pour voir les détails
- Cliquez sur un point pour afficher une modal détaillée
- Zoom avec la molette

**Treemap :**
- Activez le mode comparaison pour comparer deux années
- Utilisez les boutons de tri pour organiser les données
- Cliquez sur "Export SVG" pour télécharger l'image
- Survolez les rectangles pour voir les statistiques

**Sunburst :**
- Cliquez sur un segment pour zoomer
- Cliquez au centre pour revenir en arrière
- Le panneau latéral affiche la liste des films
- Cliquez sur un film pour voir ses détails

**Chord Diagram :**
- Survolez un ruban pour voir la relation
- Cliquez sur un ruban pour afficher les films correspondants
- Les films apparaissent dans la liste à droite

## 🎨 Personnalisation

### Modifier les Couleurs
Éditez `style.css` pour personnaliser le thème général.

### Ajouter des Métriques
1. Ajoutez la colonne dans `preprocessing.ipynb`
2. Modifiez les fichiers JS correspondants pour inclure la nouvelle métrique

### Changer les Filtres
Modifiez `dashboard.js` pour ajouter ou supprimer des catégories de filtres.

## 📝 Format des Données

### Colonnes Principales
- `title` : Titre du film/série
- `type` : MOVIE ou SHOW
- `release_year` : Année de sortie
- `genres` : Liste de genres (format : `["Action", "Drama"]`)
- `regions` : Liste de régions (format : `["Europe", "Asia"]`)
- `production_countries` : Pays de production
- `imdb_score` : Score IMDB (0-10)
- `imdb_votes` : Nombre de votes IMDB
- `tmdb_score` : Score TMDB (0-10)
- `tmdb_popularity` : Score de popularité TMDB
- `runtime` : Durée en minutes
- `age_certification` : Classification par âge
- `description` : Synopsis
- `director` : Réalisateur(s)
- `cast` : Acteurs principaux

## 👥 Contributeurs

Mathis Hartmann, Alexis Dubarry, Noel Shanti, Cherigui Allah-Eddine

## 🔮 Améliorations Futures

- [ ] Export PDF du dashboard complet
- [ ] Sauvegarde des configurations de filtres
- [ ] Visualisation réseau pour les relations acteur-réalisateur
- [ ] Analyse de sentiments des descriptions
- [ ] Recommandations basées sur les sélections
- [ ] Mode dark/light
- [ ] Responsive design amélioré pour mobile

**Bon voyage dans l'exploration des données ! 🎬🍿**