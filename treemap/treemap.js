let treemapInitialized = false;
let selectedYear = 2020;
let isPlaying = false;
let playInterval = null;
let availableYears = [];
let logScaleMode = false;
let currentMoviesList = []; // Stocker la liste des films actuelle
let currentSortMode = 'name'; // Mémoriser le tri actuel (par défaut : nom)

// Rendre showMovieModal accessible globalement
window.showMovieModal = function(index) {
    const movie = currentMoviesList[index];
    if (!movie) return;
    
    // Créer la modal si elle n'existe pas
    let modal = document.getElementById('movie-details-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'movie-details-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            padding: 20px;
        `;
        document.body.appendChild(modal);
        
        // Fermer la modal en cliquant sur le fond
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
    
    // Créer le contenu de la modal
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        border-radius: 15px;
        padding: 30px;
        max-width: 700px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        position: relative;
    `;
    
    // Parse des données
    const parseField = (field) => {
        if (!field) return [];
        try {
            return JSON.parse(field.replace(/'/g, '"'));
        } catch {
            return field.split(',').map(s => s.trim()).filter(Boolean);
        }
    };
    
    const genres = parseField(movie.genres);
    const regions = parseField(movie.regions);
    const directors = movie.director ? movie.director.split(',').map(s => s.trim()).filter(Boolean) : [];
    const actors = movie.cast ? movie.cast.split(',').map(s => s.trim()).filter(Boolean) : [];
    
    const score = +(movie.imdb_score || movie.tmdb_score || 0);
    
    modalContent.innerHTML = `
        <button id="close-modal" style="
            position: absolute;
            top: 15px;
            right: 15px;
            background: #dc3545;
            color: white;
            border: none;
            border-radius: 50%;
            width: 35px;
            height: 35px;
            font-size: 18px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(220, 53, 69, 0.3);
            transition: all 0.3s ease;
        " onmouseover="this.style.background='#c82333'; this.style.transform='rotate(90deg)';" onmouseout="this.style.background='#dc3545'; this.style.transform='rotate(0deg)';">
            ×
        </button>
        
        <h2 style="color: #007bff; margin-bottom: 20px; padding-right: 40px; font-size: 1.8rem; font-weight: bold;">
            ${movie.title || 'Sans titre'}
        </h2>
        
        <div style="display: flex; gap: 15px; margin-bottom: 20px; flex-wrap: wrap; align-items: center;">
            <span class="badge badge-${movie.type === 'MOVIE' ? 'primary' : 'success'}" style="font-size: 0.9rem; padding: 6px 12px;">
                ${movie.type || 'N/A'}
            </span>
            <span style="color: #ffc107; font-size: 1.2rem; font-weight: bold;">
                ⭐ ${score.toFixed(1)} / 10
            </span>
            <span class="badge badge-secondary" style="font-size: 0.9rem; padding: 6px 12px;">
                📅 ${movie.release_year || 'N/A'}
            </span>
        </div>
        
        ${genres.length > 0 ? `
        <div style="margin-bottom: 15px;">
            <strong style="color: #333; display: block; margin-bottom: 8px;">
                <i class="fas fa-tags"></i> Genres:
            </strong>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                ${genres.map(g => `<span class="badge badge-info" style="font-size: 0.85rem; padding: 4px 10px;">${g}</span>`).join('')}
            </div>
        </div>
        ` : ''}
        
        ${regions.length > 0 ? `
        <div style="margin-bottom: 15px;">
            <strong style="color: #333; display: block; margin-bottom: 8px;">
                <i class="fas fa-globe"></i> Régions:
            </strong>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                ${regions.map(r => `<span class="badge badge-secondary" style="font-size: 0.85rem; padding: 4px 10px;">${r}</span>`).join('')}
            </div>
        </div>
        ` : ''}
        
        ${directors.length > 0 ? `
        <div style="margin-bottom: 15px;">
            <strong style="color: #333; display: block; margin-bottom: 8px;">
                <i class="fas fa-film"></i> Réalisateur${directors.length > 1 ? 's' : ''}:
            </strong>
            <p style="margin: 0; color: #555; line-height: 1.6;">
                ${directors.join(', ')}
            </p>
        </div>
        ` : ''}
        
        ${actors.length > 0 ? `
        <div style="margin-bottom: 15px;">
            <strong style="color: #333; display: block; margin-bottom: 8px;">
                <i class="fas fa-user-friends"></i> Acteurs principaux:
            </strong>
            <p style="margin: 0; color: #555; line-height: 1.6;">
                ${actors.slice(0, 5).join(', ')}${actors.length > 5 ? '...' : ''}
            </p>
        </div>
        ` : ''}
        
        ${movie.description ? `
        <div style="margin-bottom: 15px;">
            <strong style="color: #333; display: block; margin-bottom: 8px;">
                <i class="fas fa-align-left"></i> Description:
            </strong>
            <p style="margin: 0; color: #555; line-height: 1.8; text-align: justify;">
                ${movie.description}
            </p>
        </div>
        ` : ''}
        
        ${movie.runtime ? `
        <div style="margin-bottom: 15px;">
            <strong style="color: #333; display: inline-block; margin-right: 10px;">
                <i class="fas fa-clock"></i> Durée:
            </strong>
            <span style="color: #555;">${movie.runtime} minutes</span>
        </div>
        ` : ''}
    `;
    
    modal.innerHTML = '';
    modal.appendChild(modalContent);
    modal.style.display = 'flex';
    
    // Ajouter l'événement de fermeture au bouton
    document.getElementById('close-modal').addEventListener('click', () => {
        modal.style.display = 'none';
    });
};


function initTreemap() {
    if (!globalData) {
        const listener = setInterval(() => { 
            if (globalData) { 
                clearInterval(listener); 
                initTreemap(); 
            } 
        }, 200);
        return;
    }

    // Extraire les années disponibles
    availableYears = [...new Set(globalData.map(d => +d.release_year))]
        .filter(y => !isNaN(y) && y >= 1945 && y <= 2025)
        .sort((a, b) => a - b);

    // Initialiser selectedYear avec currentYearSelection
    if (currentYearSelection && currentYearSelection.length === 2) {
        selectedYear = currentYearSelection[1]; // Prendre la fin de la plage
    }

    // Créer les contrôles spécifiques au treemap
    createTreemapControls();
    
    // Dessiner le treemap initial
    drawTreemap(currentGenreSelection, currentRegionSelection, currentYearSelection);

    // Écouter les changements de filtres globaux
    document.addEventListener("filterChange", e => {
        const { genres, regions, yearRange } = e.detail;
        // Mettre à jour selectedYear avec la fin de la plage
        if (yearRange && yearRange.length === 2) {
            // Mettre à jour les limites du slider
            const slider = document.getElementById('treemap-year-slider');
            if (slider) {
                slider.min = yearRange[0];
                slider.max = yearRange[1];
                
                // Ajuster selectedYear si nécessaire
                if (selectedYear < yearRange[0]) {
                    selectedYear = yearRange[0];
                } else if (selectedYear > yearRange[1]) {
                    selectedYear = yearRange[1];
                }
                slider.value = selectedYear;
            }
            
            // Mettre à jour les labels min/max
            const marks = document.querySelector('#treemap-year-slider').parentElement.querySelector('.d-flex.justify-content-between');
            if (marks) {
                marks.innerHTML = `
                    <small class="text-muted">${yearRange[0]}</small>
                    <small class="text-muted">${yearRange[1]}</small>
                `;
            }
            
            updateYearDisplay();
        }
        drawTreemap(genres, regions, yearRange);
    });
}

function createTreemapControls() {
    const treemapCard = document.querySelector('#treemap .card-body');
    
    // Créer un conteneur pour les contrôles
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'treemap-controls mb-3 p-3';
    controlsDiv.style.background = 'rgba(0,0,0,0.05)';
    controlsDiv.style.borderRadius = '8px';
    controlsDiv.innerHTML = `
        <div class="d-flex justify-content-between align-items-center flex-wrap" style="gap: 15px;">
            <div>
                <h5 class="mb-0">Année sélectionnée: <span id="treemap-year-display" class="text-primary font-weight-bold">${selectedYear}</span></h5>
            </div>
            <div class="d-flex align-items-center" style="gap: 10px;">
                <button id="treemap-play-btn" class="btn btn-sm btn-primary">
                    <i class="fas fa-play"></i> Lecture
                </button>
                <button id="treemap-log-btn" class="btn btn-sm btn-secondary">
                    <i class="fas fa-times"></i> Échelle Log
                </button>
                <button id="treemap-export-svg-btn" class="btn btn-sm btn-success">
                    <i class="fas fa-download"></i> Export SVG
                </button>
            </div>
        </div>
        <div class="mt-3">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <small class="text-muted">Ligne du temps (année affichée)</small>
            </div>
            <input type="range" id="treemap-year-slider" class="custom-range" 
                   min="${currentYearSelection[0]}" 
                   max="${currentYearSelection[1]}" 
                   value="${selectedYear}">
            <div class="d-flex justify-content-between">
                <small class="text-muted">${currentYearSelection[0]}</small>
                <small class="text-muted">${currentYearSelection[1]}</small>
            </div>
        </div>
        <div id="treemap-stats" class="mt-3 d-flex justify-content-around text-center">
            <div>
                <h4 class="text-primary mb-0" id="treemap-total-titles">0</h4>
                <small class="text-muted">Titres</small>
            </div>
            <div>
                <h4 class="text-primary mb-0" id="treemap-total-regions">0</h4>
                <small class="text-muted">Régions</small>
            </div>
            <div>
                <h4 class="text-primary mb-0" id="treemap-total-genres">0</h4>
                <small class="text-muted">Genres</small>
            </div>
        </div>
    `;

    // Remplacer le contenu du chart-container
    const chartContainer = treemapCard.querySelector('.chart-container');
    chartContainer.innerHTML = '';
    chartContainer.style.height = 'auto';
    chartContainer.style.display = 'block';
    
    treemapCard.insertBefore(controlsDiv, chartContainer);

    // Créer un conteneur flex principal avec 2 colonnes
    const mainContainer = document.createElement('div');
    mainContainer.style.display = 'flex';
    mainContainer.style.gap = '20px';
    mainContainer.style.alignItems = 'flex-start';
    chartContainer.appendChild(mainContainer);

    // COLONNE GAUCHE : TreeMap uniquement (70% de largeur)
    const svgContainer = document.createElement('div');
    svgContainer.id = 'treemap-svg-container';
    svgContainer.style.flex = '0 0 70%';
    svgContainer.style.minHeight = '600px';
    svgContainer.style.position = 'relative';
    mainContainer.appendChild(svgContainer);

    // COLONNE DROITE : Carte du monde + Liste des films (30% de largeur)
    const rightColumn = document.createElement('div');
    rightColumn.style.flex = '0 0 28%';
    rightColumn.style.display = 'flex';
    rightColumn.style.flexDirection = 'column';
    rightColumn.style.gap = '20px';
    rightColumn.style.height = '600px'; // Même hauteur que le treemap
    rightColumn.style.overflow = 'hidden';
    mainContainer.appendChild(rightColumn);

    // Créer la légende avec carte du monde (en haut de la colonne droite, taille fixe)
    const legendContainer = document.createElement('div');
    legendContainer.id = 'treemap-legend';
    legendContainer.className = 'p-2';
    legendContainer.style.background = 'rgba(0,0,0,0.05)';
    legendContainer.style.borderRadius = '8px';
    legendContainer.style.flexShrink = '0'; // Ne se réduit jamais
    legendContainer.innerHTML = `
        <h6 class="mb-1 font-weight-bold text-center" style="font-size: 0.85rem;">Légende des régions</h6>
        <div id="treemap-world-map" style="text-align: center;"></div>
    `;
    rightColumn.appendChild(legendContainer);

    // Créer le panneau de détails (en dessous de la carte dans la colonne droite)
    const detailsPanel = document.createElement('div');
    detailsPanel.id = 'treemap-details-panel';
    detailsPanel.className = 'p-3';
    detailsPanel.style.background = 'rgba(0,0,0,0.05)';
    detailsPanel.style.borderRadius = '8px';
    detailsPanel.style.display = 'none';
    detailsPanel.style.flex = '1 1 auto'; // Prend tout l'espace disponible
    detailsPanel.style.minHeight = '0';
    detailsPanel.style.flexDirection = 'column';
    detailsPanel.style.overflow = 'hidden';
    detailsPanel.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-2" style="flex-shrink: 0;">
            <h5 id="treemap-details-title" class="mb-0" style="font-size: 0.95rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"></h5>
            <button id="treemap-close-details" class="btn btn-sm btn-secondary" style="flex-shrink: 0;">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="text-center mb-2" style="flex-shrink: 0;">
            <div class="font-weight-bold mb-2" style="font-size: 0.9rem;">Trier par:</div>
            <div class="btn-group btn-group-sm" role="group" style="display: inline-flex;">
                <button id="sort-name" class="btn btn-outline-primary active">Nom</button>
                <button id="sort-rating" class="btn btn-outline-primary">Note</button>
                <button id="sort-date" class="btn btn-outline-primary">Date</button>
            </div>
        </div>
        <div id="treemap-items-grid" style="flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; gap: 8px; overflow-y: scroll; overflow-x: hidden; padding-right: 3px;"></div>
    `;
    rightColumn.appendChild(detailsPanel);

    // Event listeners
    document.getElementById('treemap-year-slider').addEventListener('input', (e) => {
        selectedYear = parseInt(e.target.value);
        isPlaying = false;
        clearInterval(playInterval);
        updatePlayButton();
        updateYearDisplay();
        drawTreemap(currentGenreSelection, currentRegionSelection, [currentYearSelection[0], selectedYear]);
    });

    document.getElementById('treemap-play-btn').addEventListener('click', () => {
        isPlaying = !isPlaying;
        
        if (isPlaying) {
            updatePlayButton();
            playInterval = setInterval(() => {
                const currentIndex = availableYears.indexOf(selectedYear);
                if (currentIndex >= availableYears.length - 1) {
                    selectedYear = availableYears[0];
                    isPlaying = false;
                    clearInterval(playInterval);
                    updatePlayButton();
                } else {
                    selectedYear = availableYears[currentIndex + 1];
                }
                document.getElementById('treemap-year-slider').value = selectedYear;
                updateYearDisplay();
                drawTreemap(currentGenreSelection, currentRegionSelection, [currentYearSelection[0], selectedYear]);
            }, 800);
        } else {
            clearInterval(playInterval);
            updatePlayButton();
        }
    });

    document.getElementById('treemap-log-btn').addEventListener('click', () => {
        logScaleMode = !logScaleMode;
        updateLogButton();
        drawTreemap(currentGenreSelection, currentRegionSelection, currentYearSelection);
    });

    document.getElementById('treemap-export-svg-btn').addEventListener('click', () => {
        exportTreemapAsSVG();
    });

    document.getElementById('treemap-close-details').addEventListener('click', () => {
        document.getElementById('treemap-details-panel').style.display = 'none';
    });
}

function updateYearDisplay() {
    const display = document.getElementById('treemap-year-display');
    if (display) display.textContent = selectedYear;
}

function updatePlayButton() {
    const btn = document.getElementById('treemap-play-btn');
    if (btn) {
        btn.innerHTML = isPlaying 
            ? '<i class="fas fa-pause"></i> Pause' 
            : '<i class="fas fa-play"></i> Lecture';
    }
}

function updateLogButton() {
    const btn = document.getElementById('treemap-log-btn');
    if (btn) {
        if (logScaleMode) {
            btn.className = 'btn btn-sm btn-warning';
            btn.innerHTML = '<i class="fas fa-check"></i> Échelle Log';
        } else {
            btn.className = 'btn btn-sm btn-secondary';
            btn.innerHTML = '<i class="fas fa-times"></i> Échelle Log';
        }
    }
}

function exportTreemapAsSVG() {
    // Récupérer le SVG du treemap
    const svgElement = document.querySelector('#treemap-svg-container svg');
    
    if (!svgElement) {
        alert('Aucun treemap à exporter. Veuillez d\'abord générer une visualisation.');
        return;
    }
    
    // Cloner le SVG pour ne pas modifier l'original
    const svgClone = svgElement.cloneNode(true);
    
    // Ajouter les styles inline pour que le SVG soit autonome
    svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svgClone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    
    // Ajouter un style pour les textes et formes
    const styleElement = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    styleElement.textContent = `
        text {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .genre-label {
            font-weight: bold;
            pointer-events: none;
        }
        .count-label {
            font-size: 12px;
            pointer-events: none;
        }
    `;
    svgClone.insertBefore(styleElement, svgClone.firstChild);
    
    // Ajouter un titre avec les informations de contexte
    const titleGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    titleGroup.setAttribute('transform', 'translate(10, 20)');
    
    const titleText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    titleText.setAttribute('font-size', '16');
    titleText.setAttribute('font-weight', 'bold');
    titleText.setAttribute('fill', '#333');
    titleText.textContent = `Netflix Treemap - Année ${selectedYear}`;
    titleGroup.appendChild(titleText);
    
    const subtitleText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    subtitleText.setAttribute('y', '18');
    subtitleText.setAttribute('font-size', '12');
    subtitleText.setAttribute('fill', '#666');
    
    const genreText = currentGenreSelection.includes('All') ? 'Tous les genres' : currentGenreSelection.join(', ');
    const regionText = currentRegionSelection.includes('All') ? 'Toutes les régions' : currentRegionSelection.join(', ');
    subtitleText.textContent = `${genreText} | ${regionText}`;
    titleGroup.appendChild(subtitleText);
    
    svgClone.insertBefore(titleGroup, svgClone.firstChild);
    
    // Convertir le SVG en string
    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(svgClone);
    
    // Ajouter la déclaration XML
    svgString = '<?xml version="1.0" encoding="UTF-8"?>\n' + svgString;
    
    // Créer un Blob
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    
    // Créer un lien de téléchargement
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Nom du fichier avec contexte
    const fileName = `netflix_treemap_${selectedYear}_${new Date().toISOString().split('T')[0]}.svg`;
    link.download = fileName;
    
    // Déclencher le téléchargement
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Libérer l'URL
    URL.revokeObjectURL(url);
    
    // Message de confirmation
    const btn = document.getElementById('treemap-export-svg-btn');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check"></i> Exporté !';
    btn.classList.remove('btn-success');
    btn.classList.add('btn-primary');
    
    setTimeout(() => {
        btn.innerHTML = originalHTML;
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-success');
    }, 2000);
}

function drawWorldMapLegend(visibleRegions) {
    const container = d3.select('#treemap-world-map');
    container.selectAll('*').remove();

    const width = 250;
    const height = 150; // Réduit de 200 à 150 pour laisser plus d'espace aux films

    const svg = container.append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('width', '100%')
        .attr('height', 'auto')
        .style('max-width', '100%')
        .style('max-height', '150px');

    // Définir les couleurs par région (mêmes que le treemap)
    const regionColors = {
        'Africa': '#e50914',
        'Asia': '#f5c518',
        'Europe': '#00b4d8',
        'North America': '#90e0ef',
        'South America': '#ff006e',
        'Oceania': '#8338ec',
        'Middle East': '#3a86ff',
        'Central America': '#fb5607'
    };

    // Projection centrée et ZOOMÉE (scale augmenté)
    const projection = d3.geoNaturalEarth1()
        .scale(60)  // Ajusté pour la nouvelle hauteur
        .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    // Créer un fond d'océan
    svg.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', '#e8f4f8')
        .attr('opacity', 0.3);

    // Données GeoJSON simplifiées pour les continents
    const continentsGeoJSON = {
        type: "FeatureCollection",
        features: [
            {
                type: "Feature",
                properties: { region: "Africa" },
                geometry: {
                    type: "Polygon",
                    coordinates: [[
                        [-17, 35], [10, 35], [35, 30], [42, 15], [51, 12], [40, -10], 
                        [35, -25], [30, -33], [20, -34], [15, -28], [10, -5], 
                        [-10, -5], [-15, 5], [-17, 20], [-17, 35]
                    ]]
                }
            },
            {
                type: "Feature",
                properties: { region: "Europe" },
                geometry: {
                    type: "Polygon",
                    coordinates: [[
                        [-10, 35], [-10, 60], [0, 70], [20, 70], [40, 60], 
                        [40, 40], [35, 35], [20, 35], [-10, 35]
                    ]]
                }
            },
            {
                type: "Feature",
                properties: { region: "Asia" },
                geometry: {
                    type: "Polygon",
                    coordinates: [[
                        [40, 75], [60, 75], [100, 70], [140, 60], [145, 50], 
                        [140, 20], [100, 5], [70, 10], [60, 20], [50, 35], 
                        [40, 40], [40, 75]
                    ]]
                }
            },
            {
                type: "Feature",
                properties: { region: "North America" },
                geometry: {
                    type: "Polygon",
                    coordinates: [[
                        [-170, 70], [-140, 75], [-100, 75], [-80, 70], [-75, 50], 
                        [-80, 30], [-95, 20], [-105, 15], [-115, 30], [-130, 50], 
                        [-160, 60], [-170, 70]
                    ]]
                }
            },
            {
                type: "Feature",
                properties: { region: "Central America" },
                geometry: {
                    type: "Polygon",
                    coordinates: [[
                        [-95, 20], [-80, 20], [-75, 10], [-85, 5], [-95, 10], [-95, 20]
                    ]]
                }
            },
            {
                type: "Feature",
                properties: { region: "South America" },
                geometry: {
                    type: "Polygon",
                    coordinates: [[
                        [-80, 10], [-75, 10], [-60, 0], [-50, -10], [-45, -25], 
                        [-50, -40], [-65, -52], [-70, -55], [-75, -50], [-80, -20], 
                        [-82, 0], [-80, 10]
                    ]]
                }
            },
            {
                type: "Feature",
                properties: { region: "Oceania" },
                geometry: {
                    type: "Polygon",
                    coordinates: [[
                        [110, -10], [155, -10], [155, -45], [140, -45], 
                        [115, -35], [110, -10]
                    ]]
                }
            },
            {
                type: "Feature",
                properties: { region: "Middle East" },
                geometry: {
                    type: "Polygon",
                    coordinates: [[
                        [35, 35], [60, 40], [60, 20], [50, 12], [40, 15], [35, 25], [35, 35]
                    ]]
                }
            }
        ]
    };

    // Dessiner les continents
    svg.selectAll('.continent')
        .data(continentsGeoJSON.features)
        .enter()
        .append('path')
        .attr('class', 'continent')
        .attr('d', path)
        .attr('fill', d => {
            const region = d.properties.region;
            const isVisible = visibleRegions.has(region);
            return isVisible ? regionColors[region] : '#d0d0d0';
        })
        .attr('opacity', d => visibleRegions.has(d.properties.region) ? 0.85 : 0.35)
        .attr('stroke', '#fff')
        .attr('stroke-width', 1.5)
        .style('transition', 'all 0.3s ease');

    // Ajouter les labels pour les régions visibles
    const labelPositions = {
        'Africa': [20, 5],
        'Europe': [15, 50],
        'Asia': [90, 45],
        'North America': [-100, 50],
        'Central America': [-85, 12],
        'South America': [-60, -20],
        'Oceania': [135, -25],
        'Middle East': [48, 28]
    };

    Object.entries(labelPositions).forEach(([region, coords]) => {
        if (visibleRegions.has(region)) {
            const projected = projection(coords);
            svg.append('text')
                .attr('x', projected[0])
                .attr('y', projected[1])
                .attr('text-anchor', 'middle')
                .attr('font-size', '11px')
                .attr('font-weight', 'bold')
                .attr('fill', '#fff')
                .attr('stroke', '#000')
                .attr('stroke-width', 0.5)
                .attr('paint-order', 'stroke')
                .text(region);
        }
    });
}

function drawTreemap(selectedGenres, selectedRegions, yearRange) {
    // Filtrer les données
    let filteredData = globalData.filter(d => {
        const year = +d.release_year;
        
        // Utiliser la plage yearRange des filtres globaux
        const yearCondition = !isNaN(year) && year >= yearRange[0] && year <= yearRange[1];
        
        if (!yearCondition) return false;

        // Filtrer par genres
        if (selectedGenres && !selectedGenres.includes("All")) {
            const itemGenres = (d.genres || "").replace(/[\[\]"']/g, "").split(",").map(g => g.trim()).filter(Boolean);
            if (!itemGenres.some(g => selectedGenres.includes(g))) return false;
        }

        // Filtrer par régions
        if (selectedRegions && !selectedRegions.includes("All")) {
            const itemRegions = (d.regions || "").replace(/[\[\]"']/g, "").split(",").map(r => r.trim()).filter(Boolean).filter(r => r !== "Unknown");
            if (itemRegions.length === 0 || !itemRegions.some(r => selectedRegions.includes(r))) return false;
        } else {
            // Même si "All" est sélectionné, exclure les "Unknown"
            const itemRegions = (d.regions || "").replace(/[\[\]"']/g, "").split(",").map(r => r.trim()).filter(Boolean).filter(r => r !== "Unknown");
            if (itemRegions.length === 0) return false;
        }

        return true;
    });

    // Créer la structure hiérarchique
    const width = 800;  // Largeur pour la colonne de gauche
    const height = 600; // Hauteur standard

    const container = d3.select('#treemap-svg-container');
    container.selectAll('*').remove();

    const svg = container.append('svg')
        .attr('width', '100%')
        .attr('height', height)
        .attr('viewBox', [0, 0, width, height])
        .attr('preserveAspectRatio', 'xMidYMid meet');

    // Si pas de données, afficher un message
    if (filteredData.length === 0) {
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', height / 2)
            .attr('text-anchor', 'middle')
            .attr('font-size', '24px')
            .attr('fill', '#999')
            .text('Aucun résultat pour cette période');
        return;
    }

    const hierarchy = { name: 'Netflix', children: [] };
    const regionMap = new Map();

    filteredData.forEach(item => {
        let regions = (item.regions || "").replace(/[\[\]"']/g, "").split(",").map(r => r.trim()).filter(Boolean).filter(r => r !== "Unknown");
        let genres = (item.genres || "").replace(/[\[\]"']/g, "").split(",").map(g => g.trim()).filter(Boolean).filter(g => g !== "Unknown");
        
        // Filtrer les régions selon la sélection globale
        if (selectedRegions && !selectedRegions.includes("All")) {
            regions = regions.filter(r => selectedRegions.includes(r));
        }
        
        // Filtrer les genres selon la sélection globale
        if (selectedGenres && !selectedGenres.includes("All")) {
            genres = genres.filter(g => selectedGenres.includes(g));
        }
        
        // Ignorer complètement les éléments sans région ou genre valide
        if (regions.length === 0 || genres.length === 0) return;
        
        regions.forEach(region => {
            if (!regionMap.has(region)) {
                regionMap.set(region, new Map());
            }
            
            genres.forEach(genre => {
                const genreMap = regionMap.get(region);
                if (!genreMap.has(genre)) {
                    genreMap.set(genre, []);
                }
                genreMap.get(genre).push(item);
            });
        });
    });

    // Mettre à jour les statistiques avec les données réellement affichées dans le treemap
    const displayedRegions = new Set();
    const displayedGenres = new Set();
    regionMap.forEach((genreMap, region) => {
        displayedRegions.add(region);
        genreMap.forEach((items, genre) => {
            displayedGenres.add(genre);
        });
    });
    updateTreemapStatsWithDisplayed(filteredData.length, displayedRegions.size, displayedGenres.size);

    // Mettre à jour la carte du monde avec les régions visibles
    drawWorldMapLegend(displayedRegions);

    // Créer la hiérarchie complète avec genres
    regionMap.forEach((genreMap, region) => {
        const regionNode = { name: region, children: [] };

        genreMap.forEach((items, genre) => {
            const rawValue = items.length;
            const displayValue = logScaleMode ? Math.log10(rawValue + 1) : rawValue;
            
            regionNode.children.push({
                name: genre,
                value: displayValue,
                rawValue: rawValue,
                items: items,
                avgScore: d3.mean(items, d => +(d.imdb_score || d.tmdb_score || 0))
            });
        });

        hierarchy.children.push(regionNode);
    });

    const colorScale = d3.scaleOrdinal()
        .domain(['Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania', 'Middle East', 'Central America'])
        .range(['#e50914', '#f5c518', '#00b4d8', '#90e0ef', '#ff006e', '#8338ec', '#3a86ff', '#fb5607']);

    // Créer un tooltip élégant
    const tooltip = container.append('div')
        .attr('class', 'treemap-tooltip')
        .style('position', 'absolute')
        .style('visibility', 'hidden')
        .style('background', 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.95) 100%)')
        .style('color', 'white')
        .style('padding', '12px 16px')
        .style('border-radius', '8px')
        .style('pointer-events', 'none')
        .style('font-size', '14px')
        .style('z-index', '10000')
        .style('box-shadow', '0 4px 12px rgba(0,0,0,0.4)')
        .style('border', '1px solid rgba(255,255,255,0.1)')
        .style('min-width', '150px');

    // Fonction pour dessiner le treemap (collapsed ou expanded)
    function renderTreemap(expandedRegion = null) {
        svg.selectAll('g').remove();
        
        const currentHierarchy = { name: 'Netflix', children: [] };
        
        hierarchy.children.forEach(regionNode => {
            if (expandedRegion === regionNode.name) {
                // Région survolée : afficher avec les genres
                currentHierarchy.children.push(regionNode);
            } else {
                // Région non-survolée : afficher comme un seul bloc
                const totalValue = d3.sum(regionNode.children, d => d.value);
                const totalRawValue = d3.sum(regionNode.children, d => d.rawValue);
                const genreCount = regionNode.children.length;
                const avgScore = d3.mean(regionNode.children, d => d.avgScore);
                
                currentHierarchy.children.push({
                    name: regionNode.name,
                    value: totalValue,
                    rawValue: totalRawValue,
                    genreCount: genreCount,
                    avgScore: avgScore,
                    isCollapsed: true
                });
            }
        });

        const root = d3.hierarchy(currentHierarchy)
            .sum(d => d.value || 0)
            .sort((a, b) => b.value - a.value);

        const treemap = d3.treemap()
            .size([width, height])
            .padding(2)
            .round(true);

        treemap(root);

        const g = svg.append('g');

        const cell = g.selectAll('g')
            .data(root.leaves())
            .join('g')
            .attr('transform', d => `translate(${d.x0},${d.y0})`)
            .style('cursor', 'pointer');

        cell.append('rect')
            .attr('width', d => d.x1 - d.x0)
            .attr('height', d => d.y1 - d.y0)
            .attr('fill', d => {
                // Si c'est collapsed, utiliser la couleur de la région directement
                if (d.data.isCollapsed) {
                    return colorScale(d.data.name);
                } else {
                    return colorScale(d.parent.data.name);
                }
            })
            .attr('opacity', 0.85)
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .attr('rx', 4);

        // Texte principal : nom de la région (collapsed) ou genre (expanded)
        cell.append('text')
            .attr('x', d => {
                if (d.data.isCollapsed) {
                    return (d.x1 - d.x0) / 2; // Centré pour les régions
                } else {
                    return 5; // Aligné à gauche pour les genres
                }
            })
            .attr('y', d => {
                if (d.data.isCollapsed) {
                    return (d.y1 - d.y0) / 2 - 10; // Centré verticalement, légèrement au-dessus
                } else {
                    const width = d.x1 - d.x0;
                    return width < 60 ? 20 : 20; // Position normale pour les genres
                }
            })
            .attr('text-anchor', d => d.data.isCollapsed ? 'middle' : 'start')
            .attr('dx', d => d.data.isCollapsed ? 0 : 0)
            .attr('font-size', d => d.data.isCollapsed ? '18px' : '14px')
            .attr('font-weight', 'bold')
            .attr('fill', '#fff')
            .text(d => {
                const width = d.x1 - d.x0;
                if (!d.data.isCollapsed && width < 60) return '';
                return d.data.name;
            });

        // Texte secondaire : informations supplémentaires
        cell.append('text')
            .attr('x', d => d.data.isCollapsed ? (d.x1 - d.x0) / 2 : 5)
            .attr('y', d => d.data.isCollapsed ? (d.y1 - d.y0) / 2 + 15 : 45)
            .attr('text-anchor', d => d.data.isCollapsed ? 'middle' : 'start')
            .attr('font-size', '13px')
            .attr('fill', '#fff')
            .attr('opacity', 0.95)
            .text(d => {
                const width = d.x1 - d.x0;
                if (d.data.isCollapsed) {
                    return `${d.data.rawValue} titres`;
                } else {
                    if (width < 80) return '';
                    return `${d.data.rawValue} titres`;
                }
            });

        // Texte tertiaire : genre count pour collapsed uniquement
        cell.append('text')
            .attr('x', d => (d.x1 - d.x0) / 2)
            .attr('y', d => (d.y1 - d.y0) / 2 + 35)
            .attr('text-anchor', 'middle')
            .attr('font-size', '12px')
            .attr('fill', '#fff')
            .attr('opacity', 0.9)
            .text(d => {
                if (d.data.isCollapsed) {
                    const width = d.x1 - d.x0;
                    if (width < 100) return '';
                    return `${d.data.genreCount} genres`;
                }
                return ''; // Pas de score pour les genres
            });

        // Événements de survol
        let hoverTimeout = null;
        
        cell.on('mouseover', function(event, d) {
            // Si c'est une région collapsed, on redessine en mode expanded
            if (d.data.isCollapsed) {
                renderTreemap(d.data.name);
            } else {
                // Pour les genres, afficher le tooltip après 0.5 seconde
                hoverTimeout = setTimeout(() => {
                    tooltip.style('visibility', 'visible')
                        .html(`
                            <div style="font-weight: bold; margin-bottom: 6px; font-size: 15px;">${d.data.name}</div>
                            <div style="opacity: 0.9; font-size: 13px;">Région: ${d.parent.data.name}</div>
                            <div style="opacity: 0.9; font-size: 13px; margin-top: 4px;">${d.data.rawValue} titres</div>
                        `);
                    
                    // Obtenir les coordonnées du conteneur
                    const containerRect = container.node().getBoundingClientRect();
                    
                    // Positionner le tooltip avec son coin supérieur gauche exactement à l'emplacement de la souris
                    tooltip.style('top', (event.clientY - containerRect.top) + 'px')
                           .style('left', (event.clientX - containerRect.left) + 'px');
                }, 500); // Attendre 0.5 seconde
                
                // Effet hover visuel
                d3.select(this).select('rect')
                    .transition()
                    .duration(200)
                    .attr('opacity', 1)
                    .attr('stroke-width', 3);
            }
        })
        .on('mousemove', function(event, d) {
            // Mettre à jour la position du tooltip si visible pour qu'il suive la souris exactement
            if (!d.data.isCollapsed && tooltip.style('visibility') === 'visible') {
                const containerRect = container.node().getBoundingClientRect();
                tooltip.style('top', (event.clientY - containerRect.top) + 'px')
                       .style('left', (event.clientX - containerRect.left) + 'px');
            }
        })
        .on('mouseout', function(event, d) {
            // Annuler le timeout si on sort avant 0.5 seconde
            if (hoverTimeout) {
                clearTimeout(hoverTimeout);
                hoverTimeout = null;
            }
            
            // Cacher le tooltip
            tooltip.style('visibility', 'hidden');
            
            // Réinitialiser l'effet hover visuel pour les genres
            if (!d.data.isCollapsed) {
                d3.select(this).select('rect')
                    .transition()
                    .duration(200)
                    .attr('opacity', 0.85)
                    .attr('stroke-width', 2);
            }
        })
        .on('click', (event, d) => {
            if (d.data.items && d.data.items.length > 0) {
                showTreemapDetails(d.data.name, d.parent.data.name, d.data.items);
            }
        });
        
        // Événement pour revenir à l'état collapsed quand on sort du SVG
        svg.on('mouseleave', () => {
            if (hoverTimeout) {
                clearTimeout(hoverTimeout);
                hoverTimeout = null;
            }
            tooltip.style('visibility', 'hidden');
            renderTreemap(null);
        });
    }
    
    // Dessiner initialement en mode collapsed (toutes les régions)
    renderTreemap(null);
}

function updateTreemapStats(filteredData) {
    const animateNumber = (elementId, newValue) => {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const oldValue = parseInt(element.textContent) || 0;
        if (oldValue === newValue) return;
        
        const duration = 500;
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const easeProgress = progress < 0.5 
                ? 2 * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            
            const current = Math.floor(oldValue + (newValue - oldValue) * easeProgress);
            element.textContent = current;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.textContent = newValue;
            }
        };
        
        requestAnimationFrame(animate);
    };
    
    const totalTitles = filteredData.length;
    
    const regions = new Set();
    const genres = new Set();
    
    filteredData.forEach(item => {
        const itemRegions = (item.regions || "").replace(/[\[\]"']/g, "").split(",").map(r => r.trim()).filter(Boolean);
        const itemGenres = (item.genres || "").replace(/[\[\]"']/g, "").split(",").map(g => g.trim()).filter(Boolean);
        
        itemRegions.forEach(r => regions.add(r));
        itemGenres.forEach(g => genres.add(g));
    });

    animateNumber('treemap-total-titles', totalTitles);
    animateNumber('treemap-total-regions', regions.size);
    animateNumber('treemap-total-genres', genres.size);
}

function updateTreemapStatsWithDisplayed(totalTitles, regionsCount, genresCount) {
    const animateNumber = (elementId, newValue) => {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const oldValue = parseInt(element.textContent) || 0;
        if (oldValue === newValue) return;
        
        const duration = 500;
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const easeProgress = progress < 0.5 
                ? 2 * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            
            const current = Math.floor(oldValue + (newValue - oldValue) * easeProgress);
            element.textContent = current;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.textContent = newValue;
            }
        };
        
        requestAnimationFrame(animate);
    };

    animateNumber('treemap-total-titles', totalTitles);
    animateNumber('treemap-total-regions', regionsCount);
    animateNumber('treemap-total-genres', genresCount);
}

function showTreemapDetails(genre, region, items) {
    const panel = document.getElementById('treemap-details-panel');
    const title = document.getElementById('treemap-details-title');
    const grid = document.getElementById('treemap-items-grid');

    title.textContent = `${genre} - ${region} (${items.length})`;
    
    // Stocker les films pour le tri
    currentMoviesList = [...items];
    
    // Fonction pour afficher les films
    const displayMovies = (moviesList) => {
        grid.innerHTML = moviesList.map((item, index) => `
            <div class="card" style="width: 100%; margin: 0; flex-shrink: 0;">
                <div class="card-body p-2">
                    <div class="d-flex justify-content-between align-items-start mb-1">
                        <h6 class="card-title mb-0" style="font-size: 0.85rem; font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;" title="${item.title || 'Sans titre'}">${item.title || 'Sans titre'}</h6>
                        <button class="btn btn-sm btn-outline-info ml-1" style="font-size: 0.65rem; padding: 2px 8px; white-space: nowrap;" onclick="showMovieModal(${index})">
                            <i class="fas fa-info-circle"></i> Plus d'infos...
                        </button>
                    </div>
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <span class="badge badge-${item.type === 'MOVIE' ? 'primary' : 'success'}" style="font-size: 0.7rem; padding: 2px 6px;">${item.type || 'N/A'}</span>
                        <span class="text-warning" style="font-size: 0.75rem; font-weight: bold;">⭐ ${(+(item.imdb_score || item.tmdb_score || 0)).toFixed(1)}</span>
                    </div>
                    <div class="mb-1">
                        <small class="text-muted" style="font-size: 0.7rem;">📅 ${item.release_year || 'N/A'}</small>
                    </div>
                    <p class="card-text mb-0" style="font-size: 0.7rem; line-height: 1.4; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; color: #666;">${item.description || 'Pas de description disponible'}</p>
                </div>
            </div>
        `).join('');
    };
    
    // Fonction pour appliquer le tri
    const applySortMode = (mode) => {
        if (mode === 'name') {
            currentMoviesList.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        } else if (mode === 'rating') {
            currentMoviesList.sort((a, b) => {
                const scoreB = +(b.imdb_score || b.tmdb_score || 0);
                const scoreA = +(a.imdb_score || a.tmdb_score || 0);
                return scoreB - scoreA;
            });
        } else if (mode === 'date') {
            currentMoviesList.sort((a, b) => (+(b.release_year || 0)) - (+(a.release_year || 0)));
        }
        displayMovies(currentMoviesList);
    };
    
    // Appliquer le tri mémorisé
    applySortMode(currentSortMode);
    
    // Mettre à jour les boutons pour refléter le tri actuel
    ['sort-name', 'sort-rating', 'sort-date'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.classList.remove('active');
        }
    });
    const activeButton = document.getElementById(`sort-${currentSortMode}`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
    
    // Gérer les boutons de tri
    const sortButtons = {
        'sort-name': () => {
            currentSortMode = 'name';
            applySortMode('name');
        },
        'sort-rating': () => {
            currentSortMode = 'rating';
            applySortMode('rating');
        },
        'sort-date': () => {
            currentSortMode = 'date';
            applySortMode('date');
        }
    };
    
    // Attacher les événements aux boutons
    Object.keys(sortButtons).forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.onclick = () => {
                // Retirer la classe active de tous les boutons
                Object.keys(sortButtons).forEach(id => {
                    document.getElementById(id).classList.remove('active');
                });
                // Ajouter la classe active au bouton cliqué
                btn.classList.add('active');
                // Exécuter le tri
                sortButtons[btnId]();
            };
        }
    });

    panel.style.display = 'flex';
}

// Initialiser quand l'onglet treemap est activé
$('a[data-toggle="tab"][href="#treemap"]').on('shown.bs.tab', function () {
    if (!treemapInitialized) {
        treemapInitialized = true;
        initTreemap();
    }
});
