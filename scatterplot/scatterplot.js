let scatterplotInitialized = false;
let scatterSelectedYear = 1945; // Commencer à la première année
let scatterIsPlaying = false;
let scatterPlayInterval = null;
let scatterAvailableYears = [];
let scatterLogScale = false;

function initScatterplot() {
    if (!globalData) {
        const listener = setInterval(() => {
            if (globalData) {
                clearInterval(listener);
                initScatterplot();
            }
        }, 200);
        return;
    }

    // Extraire les années disponibles
    scatterAvailableYears = [...new Set(globalData.map(d => +d.release_year))]
        .filter(y => !isNaN(y) && y >= 1945 && y <= 2025)
        .sort((a, b) => a - b);

    console.log("Années disponibles:", scatterAvailableYears.slice(0, 10));

    // Commencer à la première année disponible (même sans données valides)
    scatterSelectedYear = scatterAvailableYears[0] || 1945;


    // Appliquer les filtres globaux si présents
    if (currentYearSelection && currentYearSelection.length === 2) {
        // Filtrer les années disponibles selon le filtre global
        scatterAvailableYears = scatterAvailableYears.filter(y => 
            y >= currentYearSelection[0] && y <= currentYearSelection[1]
        );
        
        // Si l'année sélectionnée n'est pas dans la plage, prendre la première année de la plage
        if (scatterSelectedYear < currentYearSelection[0] || scatterSelectedYear > currentYearSelection[1]) {
            scatterSelectedYear = scatterAvailableYears[0] || currentYearSelection[0];
        }
    }

    // Créer les contrôles spécifiques au scatterplot
    createScatterplotControls();
    
    // Dessiner le scatterplot initial
    drawScatterplot(currentGenreSelection, currentRegionSelection, scatterSelectedYear);

    // Écouter les changements de filtres globaux
    document.addEventListener("filterChange", e => {
        const { genres, regions, yearRange } = e.detail;
        
        // Filtrer les années disponibles selon le filtre global
        scatterAvailableYears = [...new Set(globalData.map(d => +d.release_year))]
            .filter(y => !isNaN(y) && y >= yearRange[0] && y <= yearRange[1])
            .sort((a, b) => a - b);
        
        // Ajuster l'année sélectionnée si elle est hors de la plage
        if (scatterSelectedYear < yearRange[0] || scatterSelectedYear > yearRange[1]) {
            scatterSelectedYear = Math.floor((yearRange[0] + yearRange[1]) / 2);
            // Trouver l'année la plus proche dans les années disponibles
            if (!scatterAvailableYears.includes(scatterSelectedYear)) {
                const closest = scatterAvailableYears.reduce((prev, curr) => 
                    Math.abs(curr - scatterSelectedYear) < Math.abs(prev - scatterSelectedYear) ? curr : prev
                );
                scatterSelectedYear = closest;
            }
            updateScatterYearDisplay();
            updateScatterProgressBar();
        }
        
        drawScatterplot(genres, regions, scatterSelectedYear);
    });

    scatterplotInitialized = true;
}

function createScatterplotControls() {
    const scatterCard = document.querySelector('#scatter .card-body');
    
    // Créer un conteneur pour les contrôles
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'scatterplot-controls mb-3 p-3';
    controlsDiv.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    controlsDiv.style.borderRadius = '10px';
    controlsDiv.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
    controlsDiv.style.color = 'white';
    
    controlsDiv.innerHTML = `
        <div class="mb-3">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <h5 class="mb-0 text-white">
                    <i class="fas fa-chart-scatter"></i> Année: 
                    <span id="scatter-year-display" class="font-weight-bold">${scatterSelectedYear}</span>
                </h5>
                <div class="d-flex align-items-center" style="gap: 10px;">
                    <button id="scatter-play-btn" class="btn btn-light btn-sm">
                        <i class="fas fa-play"></i> Play
                    </button>
                    <button id="scatter-log-btn" class="btn btn-light btn-sm">
                        <i class="fas fa-chart-line"></i> Échelle Log Y
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Barre de progression des années -->
        <div class="mb-3">
            <div class="d-flex align-items-center justify-content-between mb-2">
                <span class="small" id="scatter-min-year" style="color: rgba(255,255,255,0.9);"></span>
                <div class="d-flex align-items-center" style="gap: 10px;">
                    <button id="scatter-year-prev" class="btn btn-sm" style="background: rgba(255,255,255,0.2); color: white; border: none;">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <button id="scatter-year-next" class="btn btn-sm" style="background: rgba(255,255,255,0.2); color: white; border: none;">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
                <span class="small" id="scatter-max-year" style="color: rgba(255,255,255,0.9);"></span>
            </div>
            <input type="range" id="scatter-year-slider" class="custom-range" 
                   min="${scatterAvailableYears[0] || 1945}" 
                   max="${scatterAvailableYears[scatterAvailableYears.length - 1] || 2022}" 
                   value="${scatterSelectedYear}" 
                   step="1"
                   style="width: 100%;">
        </div>
        
        <!-- Options de visualisation -->
        <div class="d-flex flex-wrap align-items-center justify-content-between" style="gap: 10px;">
            <div class="d-flex align-items-center" style="gap: 8px;">
                <label class="mb-0 small" style="color: rgba(255,255,255,0.9);">Axe X:</label>
                <select id="scatter-x-axis" class="form-control form-control-sm" style="width: auto; background: rgba(255,255,255,0.9);">
                    <option value="imdb_votes">Votes IMDB</option>
                    <option value="runtime">Durée (min)</option>
                </select>
            </div>
            
            <div class="d-flex align-items-center" style="gap: 8px;">
                <label class="mb-0 small" style="color: rgba(255,255,255,0.9);">Axe Y:</label>
                <select id="scatter-y-axis" class="form-control form-control-sm" style="width: auto; background: rgba(255,255,255,0.9);">
                    <option value="imdb_score">Score IMDB</option>
                    <option value="runtime">Durée (min)</option>
                </select>
            </div>
            
            <div class="d-flex align-items-center" style="gap: 8px;">
                <label class="mb-0 small" style="color: rgba(255,255,255,0.9);">Taille:</label>
                <select id="scatter-size" class="form-control form-control-sm" style="width: auto; background: rgba(255,255,255,0.9);">
                    <option value="tmdb_popularity">Popularité</option>
                    <option value="imdb_votes">Votes IMDB</option>
                    <option value="runtime">Durée</option>
                </select>
            </div>
            
            <div class="d-flex align-items-center" style="gap: 8px;">
                <label class="mb-0 small" style="color: rgba(255,255,255,0.9);">Couleur:</label>
                <select id="scatter-color" class="form-control form-control-sm" style="width: auto; background: rgba(255,255,255,0.9);">
                    <option value="region">Région</option>
                    <option value="genre">Genre</option>
                    <option value="type">Type (Film/Série)</option>
                </select>
            </div>
        </div>
    `;
    
    // Créer un conteneur pour les statistiques
    const statsDiv = document.createElement('div');
    statsDiv.className = 'mt-3 p-3';
    statsDiv.style.background = 'rgba(255,255,255,0.95)';
    statsDiv.style.borderRadius = '10px';
    statsDiv.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)';
    statsDiv.innerHTML = `
        <div id="scatter-stats-container" class="d-flex justify-content-around text-center">
            <div>
                <h4 class="text-primary mb-0" id="scatter-total-titles">0</h4>
                <small class="text-muted">Titres</small>
            </div>
            <div>
                <h4 class="text-success mb-0" id="scatter-avg-imdb">0</h4>
                <small class="text-muted">Score IMDB moyen</small>
            </div>
            <div>
                <h4 class="text-warning mb-0" id="scatter-movie-show-ratio">0/0</h4>
                <small class="text-muted">Films / Séries</small>
            </div>
        </div>
    `;
    
    // Insérer les contrôles avant le conteneur du graphique
    const chartContainer = scatterCard.querySelector('.chart-container');
    scatterCard.insertBefore(controlsDiv, chartContainer);
    scatterCard.insertBefore(statsDiv, chartContainer);
    
    // Initialiser la barre de progression
    updateScatterProgressBar();
    
    // Ajouter les événements
    document.getElementById('scatter-play-btn').addEventListener('click', toggleScatterPlay);
    document.getElementById('scatter-year-prev').addEventListener('click', () => changeScatterYear(-1));
    document.getElementById('scatter-year-next').addEventListener('click', () => changeScatterYear(1));
    
    // Ajouter l'événement pour le slider d'année
    document.getElementById('scatter-year-slider').addEventListener('input', (e) => {
        const year = parseInt(e.target.value);
        if (scatterAvailableYears.includes(year)) {
            scatterSelectedYear = year;
            updateScatterYearDisplay();
            updateScatterProgressBar();
            drawScatterplot(currentGenreSelection, currentRegionSelection, scatterSelectedYear);
        }
    });
    
    document.getElementById('scatter-log-btn').addEventListener('click', () => {
        scatterLogScale = !scatterLogScale;
        updateScatterLogButton();
        drawScatterplot(currentGenreSelection, currentRegionSelection, scatterSelectedYear);
    });
    
    document.getElementById('scatter-x-axis').addEventListener('change', () => {
        drawScatterplot(currentGenreSelection, currentRegionSelection, scatterSelectedYear);
    });
    
    document.getElementById('scatter-y-axis').addEventListener('change', () => {
        drawScatterplot(currentGenreSelection, currentRegionSelection, scatterSelectedYear);
    });
    
    document.getElementById('scatter-size').addEventListener('change', () => {
        drawScatterplot(currentGenreSelection, currentRegionSelection, scatterSelectedYear);
    });
    
    document.getElementById('scatter-color').addEventListener('change', () => {
        drawScatterplot(currentGenreSelection, currentRegionSelection, scatterSelectedYear);
    });
}

function toggleScatterPlay() {
    scatterIsPlaying = !scatterIsPlaying;
    updateScatterPlayButton();
    
    if (scatterIsPlaying) {
        scatterPlayInterval = setInterval(() => {
            const currentIndex = scatterAvailableYears.indexOf(scatterSelectedYear);
            if (currentIndex < scatterAvailableYears.length - 1) {
                scatterSelectedYear = scatterAvailableYears[currentIndex + 1];
            } else {
                scatterSelectedYear = scatterAvailableYears[0];
            }
            updateScatterYearDisplay();
            updateScatterProgressBar();
            drawScatterplot(currentGenreSelection, currentRegionSelection, scatterSelectedYear);
        }, 2000); // 3 secondes entre chaque année
    } else {
        clearInterval(scatterPlayInterval);
    }
}

function changeScatterYear(direction) {
    const currentIndex = scatterAvailableYears.indexOf(scatterSelectedYear);
    const newIndex = currentIndex + direction;
    
    if (newIndex >= 0 && newIndex < scatterAvailableYears.length) {
        scatterSelectedYear = scatterAvailableYears[newIndex];
        updateScatterYearDisplay();
        updateScatterProgressBar();
        drawScatterplot(currentGenreSelection, currentRegionSelection, scatterSelectedYear);
    }
}

function updateScatterYearDisplay() {
    const displayElement = document.getElementById('scatter-year-display');
    if (displayElement) {
        displayElement.textContent = scatterSelectedYear;
    }
    
    // Mettre à jour aussi le slider
    const slider = document.getElementById('scatter-year-slider');
    if (slider) {
        slider.value = scatterSelectedYear;
    }
}

function updateScatterProgressBar() {
    if (scatterAvailableYears.length === 0) return;
    
    const minYear = Math.min(...scatterAvailableYears);
    const maxYear = Math.max(...scatterAvailableYears);
    
    // Mettre à jour les labels min/max
    const minYearLabel = document.getElementById('scatter-min-year');
    const maxYearLabel = document.getElementById('scatter-max-year');
    if (minYearLabel) minYearLabel.textContent = minYear;
    if (maxYearLabel) maxYearLabel.textContent = maxYear;
}

function updateScatterLogButton() {
    const logBtn = document.getElementById('scatter-log-btn');
    if (logBtn) {
        if (scatterLogScale) {
            logBtn.innerHTML = '<i class="fas fa-chart-line"></i> Échelle Linéaire Y';
            logBtn.classList.remove('btn-light');
            logBtn.classList.add('btn-warning');
        } else {
            logBtn.innerHTML = '<i class="fas fa-chart-line"></i> Échelle Log Y';
            logBtn.classList.remove('btn-warning');
            logBtn.classList.add('btn-light');
        }
    }
}

function updateScatterPlayButton() {
    const playBtn = document.getElementById('scatter-play-btn');
    if (playBtn) {
        if (scatterIsPlaying) {
            playBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
            playBtn.classList.remove('btn-light');
            playBtn.classList.add('btn-warning');
        } else {
            playBtn.innerHTML = '<i class="fas fa-play"></i> Play';
            playBtn.classList.remove('btn-warning');
            playBtn.classList.add('btn-light');
        }
    }
}

function drawScatterplot(selectedGenres, selectedRegions, year) {
    // Récupérer les options de visualisation
    const xAxisOption = document.getElementById('scatter-x-axis')?.value || 'imdb_votes';
    const yAxisOption = document.getElementById('scatter-y-axis')?.value || 'imdb_score';
    const sizeOption = document.getElementById('scatter-size')?.value || 'tmdb_popularity';
    const colorOption = document.getElementById('scatter-color')?.value || 'region';
    
    // Filtrer les données
    console.log(`Filtrage pour l'année ${year}`);
    let filteredData = globalData.filter(d => {
        const releaseYear = +d.release_year;
        if (releaseYear !== year) return false;
        
        // Exclure les films sans pays/région
        const itemRegions = (d.regions || "").replace(/[\[\]"']/g, "").split(",").map(r => r.trim()).filter(Boolean);
        if (itemRegions.length === 0) return false;
        
        // Filtrer par genres
        if (selectedGenres && !selectedGenres.includes("All")) {
            const itemGenres = (d.genres || "").replace(/[\[\]"']/g, "").split(",").map(g => g.trim()).filter(Boolean);
            if (!itemGenres.some(g => selectedGenres.includes(g))) return false;
        }
        
        // Filtrer par régions
        if (selectedRegions && !selectedRegions.includes("All")) {
            if (!itemRegions.some(r => selectedRegions.includes(r))) return false;
        }
        
        return true;
    });
    
    console.log(`Films trouvés pour ${year}: ${filteredData.length}`, filteredData.map(d => `${d.title} (${d.release_year})`));
    
    // Filtrer les données avec valeurs valides pour les axes
    const beforeFilterCount = filteredData.length;
    filteredData = filteredData.filter(d => {
        const xVal = parseFloat(d[xAxisOption]);
        const yVal = parseFloat(d[yAxisOption]);
        const isValid = !isNaN(xVal) && !isNaN(yVal) && xVal > 0 && yVal > 0;
        if (!isValid) {
            console.log(`Film filtré: ${d.title} - X(${xAxisOption})=${d[xAxisOption]}, Y(${yAxisOption})=${d[yAxisOption]}`);
        }
        return isValid;
    });
    console.log(`Après filtrage des valeurs: ${filteredData.length}/${beforeFilterCount} films valides`);
    
    // Mettre à jour les statistiques
    updateScatterStats(filteredData, year);
    
    // Préparer le conteneur
    const containerNode = document.querySelector('#scatter .chart-container');
    
    // Si pas de données valides mais qu'il y a des films de l'année, afficher un message spécial
    if (filteredData.length === 0 && beforeFilterCount > 0) {
        const allYearFilms = globalData.filter(d => +d.release_year === year);
        
        // Supprimer le SVG existant
        d3.select(containerNode).select("svg").remove();
        
        // Afficher un message avec les détails des films non affichables
        const messageDiv = document.createElement('div');
        messageDiv.className = 'no-data-message';
        messageDiv.style.cssText = `
            padding: 30px;
            text-align: center;
            max-width: 800px;
            margin: 0 auto;
        `;
        
        messageDiv.innerHTML = `
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        padding: 20px; 
                        border-radius: 15px; 
                        color: white;
                        margin-bottom: 20px;">
                <i class="fas fa-info-circle" style="font-size: 2rem; margin-bottom: 10px;"></i>
                <h4>Films de ${year} sans données IMDB</h4>
                <p style="margin-bottom: 0;">
                    ${beforeFilterCount} film(s) trouvé(s) pour cette année, mais aucun n'a de données IMDB Score et Votes nécessaires pour l'affichage dans le scatterplot.
                </p>
            </div>
            <div style="text-align: left; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                ${allYearFilms.map(movie => `
                    <div style="margin-bottom: 20px; padding: 15px; border-left: 4px solid #667eea; background: #f8f9fa;">
                        <h5 style="color: #667eea; margin-bottom: 10px;">
                            <i class="fas fa-film"></i> ${movie.title || 'Sans titre'}
                        </h5>
                        <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 10px;">
                            <span class="badge badge-${movie.type === 'MOVIE' ? 'primary' : 'success'}">${movie.type || 'N/A'}</span>
                            <span class="badge badge-secondary">📅 ${movie.release_year}</span>
                            ${movie.runtime ? `<span class="badge badge-info">⏱️ ${movie.runtime} min</span>` : ''}
                        </div>
                        ${movie.description ? `
                            <p style="color: #555; margin-bottom: 10px; line-height: 1.6;">
                                ${movie.description.substring(0, 200)}${movie.description.length > 200 ? '...' : ''}
                            </p>
                        ` : ''}
                        <div style="background: #fff3cd; padding: 10px; border-radius: 5px; border-left: 3px solid #ffc107;">
                            <strong style="color: #856404;">
                                <i class="fas fa-exclamation-triangle"></i> Données manquantes:
                            </strong>
                            <ul style="margin: 5px 0 0 20px; color: #856404;">
                                ${!movie.imdb_score || movie.imdb_score === '' ? '<li>Score IMDB</li>' : ''}
                                ${!movie.imdb_votes || movie.imdb_votes === '' ? '<li>Votes IMDB</li>' : ''}
                            </ul>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        // Supprimer l'ancien message s'il existe
        const existingMessage = containerNode.querySelector('.no-data-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Ajouter le nouveau message
        containerNode.appendChild(messageDiv);
        
        return;
    }
    
    // Supprimer le message s'il existe
    const existingMessage = containerNode.querySelector('.no-data-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Si pas de données du tout, ne rien dessiner
    if (filteredData.length === 0) {
        console.warn(`Aucune donnée à afficher pour l'année ${year}`);
        return;
    }
    
    // Ne vider le conteneur que s'il n'y a pas de SVG existant
    let svg = d3.select(containerNode).select("svg");
    let isFirstDraw = svg.empty();
    
    if (isFirstDraw) {
        containerNode.innerHTML = '';
    }
    
    const width = containerNode.clientWidth || 900;
    const height = containerNode.clientHeight || 600;
    const margin = { top: 20, right: 150, bottom: 60, left: 80 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    // Créer le SVG seulement si nécessaire
    if (isFirstDraw) {
        svg = d3.select(containerNode)
            .append("svg")
            .attr("width", width)
            .attr("height", height);
    }
    
    let g = svg.select("g.main-group");
    if (g.empty()) {
        g = svg.append("g")
            .attr("class", "main-group")
            .attr("transform", `translate(${margin.left},${margin.top})`);
    }
    
    // Créer les échelles basées sur les données FILTRÉES (année actuelle)
    const xScale = d3.scaleLog()
        .domain([
            d3.min(filteredData, d => +d[xAxisOption]) * 0.9,
            d3.max(filteredData, d => +d[xAxisOption]) * 1.1
        ])
        .range([0, innerWidth])
        .nice();
    
    // Créer l'échelle Y (linéaire ou logarithmique selon le mode)
    let yScale;
    const yMin = d3.min(filteredData, d => +d[yAxisOption]);
    const yMax = d3.max(filteredData, d => +d[yAxisOption]);
    
    if (scatterLogScale && yMin > 0) {
        yScale = d3.scaleLog()
            .domain([yMin * 0.9, yMax * 1.1])
            .range([innerHeight, 0])
            .nice();
    } else {
        yScale = d3.scaleLinear()
            .domain([yMin * 0.9, yMax * 1.1])
            .range([innerHeight, 0])
            .nice();
    }
    
    // Fonction de zoom sémantique qui met à jour les échelles et les axes
    const zoom = d3.zoom()
        .scaleExtent([0.5, 20])
        .on("zoom", (event) => {
            // Créer de nouvelles échelles transformées
            const newXScale = event.transform.rescaleX(xScale);
            const newYScale = event.transform.rescaleY(yScale);
            
            // Mettre à jour les axes avec les nouvelles échelles
            g.select(".x-axis").call(d3.axisBottom(newXScale).ticks(5).tickFormat(d => d3.format(".0s")(d)));
            g.select(".y-axis").call(d3.axisLeft(newYScale).ticks(8));
            
            // Mettre à jour la position des bulles
            g.selectAll(".bubble")
                .attr("cx", d => newXScale(+d[xAxisOption]))
                .attr("cy", d => newYScale(+d[yAxisOption]));
        });
    
    // Appliquer le zoom au SVG
    svg.call(zoom);
    
    // Ajouter un bouton pour réinitialiser le zoom en bas à gauche
    let resetBtn = svg.select(".reset-zoom-btn");
    if (resetBtn.empty()) {
        resetBtn = svg.append("g")
            .attr("class", "reset-zoom-btn")
            .attr("cursor", "pointer")
            .attr("transform", `translate(${margin.left}, ${height - 40})`)
            .on("click", function() {
                // Réinitialiser le zoom avec une transition douce
                svg.transition()
                    .duration(750)
                    .call(zoom.transform, d3.zoomIdentity)
                    .on("end", () => {
                        // S'assurer que tout est bien réinitialisé
                        g.select(".x-axis").call(d3.axisBottom(xScale).ticks(5).tickFormat(d => d3.format(".0s")(d)));
                        g.select(".y-axis").call(d3.axisLeft(yScale).ticks(8));
                        g.selectAll(".bubble")
                            .attr("cx", d => xScale(+d[xAxisOption]))
                            .attr("cy", d => yScale(+d[yAxisOption]));
                    });
            });
        
        resetBtn.append("rect")
            .attr("width", 90)
            .attr("height", 30)
            .attr("rx", 5)
            .attr("fill", "#667eea")
            .attr("opacity", 0.9)
            .on("mouseover", function() {
                d3.select(this).attr("fill", "#5568d3");
            })
            .on("mouseout", function() {
                d3.select(this).attr("fill", "#667eea");
            });
        
        resetBtn.append("text")
            .attr("x", 45)
            .attr("y", 20)
            .attr("text-anchor", "middle")
            .attr("fill", "white")
            .attr("font-size", "12px")
            .attr("font-weight", "bold")
            .attr("pointer-events", "none")
            .text("Reset Zoom");
    } else {
        // Mettre à jour la position si le bouton existe déjà
        resetBtn.attr("transform", `translate(${margin.left}, ${height - 40})`);
        
        // Mettre à jour le handler de clic
        resetBtn.on("click", function() {
            svg.transition()
                .duration(750)
                .call(zoom.transform, d3.zoomIdentity)
                .on("end", () => {
                    g.select(".x-axis").call(d3.axisBottom(xScale).ticks(5).tickFormat(d => d3.format(".0s")(d)));
                    g.select(".y-axis").call(d3.axisLeft(yScale).ticks(8));
                    g.selectAll(".bubble")
                        .attr("cx", d => xScale(+d[xAxisOption]))
                        .attr("cy", d => yScale(+d[yAxisOption]));
                });
        });
    }
    
    // Calculer les valeurs min/max pour le debug
    console.log(`🔍 Valeurs brutes de ${sizeOption}:`, filteredData.map(d => ({
        title: d.title,
        raw: d[sizeOption],
        type: typeof d[sizeOption],
        isEmpty: d[sizeOption] === '',
        converted: +(d[sizeOption])
    })));
    
    const sizeValues = filteredData.map(d => {
        const val = d[sizeOption];
        // Si la valeur est vide ou invalide, utiliser 1
        if (!val || val === '' || isNaN(+val)) {
            return 1;
        }
        return +(val);
    }).filter(v => v > 0);
    
    const minSize = d3.min(sizeValues);
    const maxSize = d3.max(sizeValues);
    
    console.log(`📊 Échelle de taille (${sizeOption}):`, {
        min: minSize,
        max: maxSize,
        count: sizeValues.length,
        sample: sizeValues.slice(0, 5)
    });
    
    const sizeScale = d3.scaleSqrt()
        .domain([minSize || 1, maxSize || 100])
        .range([8, 40]);  // Augmenté de [3, 30] à [8, 40]
    
    // Créer l'échelle de couleurs
    let colorScale;
    let colorCategories = [];
    
    if (colorOption === 'region') {
        colorCategories = [...new Set(filteredData.flatMap(d => 
            (d.regions || "").replace(/[\[\]"']/g, "").split(",").map(r => r.trim()).filter(Boolean)
        ))];
        if (colorCategories.length === 0) colorCategories = ['Unknown'];
        colorScale = d3.scaleOrdinal()
            .domain(colorCategories)
            .range(d3.schemeCategory10);
    } else if (colorOption === 'genre') {
        colorCategories = [...new Set(filteredData.flatMap(d => 
            (d.genres || "").replace(/[\[\]"']/g, "").split(",").map(g => g.trim()).filter(Boolean)
        ))].slice(0, 10); // Limiter à 10 genres principaux
        if (colorCategories.length === 0) colorCategories = ['Unknown'];
        colorScale = d3.scaleOrdinal()
            .domain(colorCategories)
            .range(d3.schemeCategory10);
    } else { // type
        colorCategories = ['MOVIE', 'SHOW'];
        colorScale = d3.scaleOrdinal()
            .domain(colorCategories)
            .range(['#4e73df', '#1cc88a']);
    }
    
    // Fonction pour obtenir la couleur d'un item
    function getItemColor(d) {
        if (colorOption === 'region') {
            const regions = (d.regions || "").replace(/[\[\]"']/g, "").split(",").map(r => r.trim()).filter(Boolean);
            return colorScale(regions[0] || 'Unknown');
        } else if (colorOption === 'genre') {
            const genres = (d.genres || "").replace(/[\[\]"']/g, "").split(",").map(g => g.trim()).filter(Boolean);
            return colorScale(genres[0] || 'Unknown');
        } else {
            return colorScale(d.type || 'MOVIE');
        }
    }
    
    // Ajouter les axes
    const xAxis = d3.axisBottom(xScale)
        .ticks(5)
        .tickFormat(d => d3.format(".0s")(d));
    
    const yAxis = d3.axisLeft(yScale)
        .ticks(8);
    
    // Axe X - mise à jour ou création avec transition
    let xAxisGroup = g.select(".x-axis");
    if (xAxisGroup.empty()) {
        xAxisGroup = g.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${innerHeight})`);
        
        xAxisGroup.append("text")
            .attr("class", "x-axis-label")
            .attr("x", innerWidth / 2)
            .attr("y", 45)
            .attr("fill", "black")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .style("text-anchor", "middle");
    }
    
    xAxisGroup.transition().duration(800).call(xAxis);
    xAxisGroup.select(".x-axis-label").text(getAxisLabel(xAxisOption));
    
    // Axe Y - mise à jour ou création avec transition
    let yAxisGroup = g.select(".y-axis");
    if (yAxisGroup.empty()) {
        yAxisGroup = g.append("g")
            .attr("class", "y-axis");
        
        yAxisGroup.append("text")
            .attr("class", "y-axis-label")
            .attr("transform", "rotate(-90)")
            .attr("x", -innerHeight / 2)
            .attr("y", -60)
            .attr("fill", "black")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .style("text-anchor", "middle");
    }
    
    yAxisGroup.transition().duration(800).call(yAxis);
    yAxisGroup.select(".y-axis-label").text(getAxisLabel(yAxisOption));
    
    // Créer le tooltip (une seule fois)
    let tooltip = d3.select(containerNode).select(".scatter-tooltip");
    if (tooltip.empty()) {
        tooltip = d3.select(containerNode)
            .append("div")
            .attr("class", "scatter-tooltip")
            .style("position", "absolute")
            .style("visibility", "hidden")
            .style("background", "rgba(0, 0, 0, 0.9)")
            .style("color", "white")
            .style("padding", "10px 15px")
            .style("border-radius", "8px")
            .style("font-size", "13px")
            .style("pointer-events", "none")
            .style("z-index", "1000")
            .style("max-width", "300px");
    }
    
    // Dessiner les bulles avec pattern UPDATE/ENTER/EXIT
    const bubbles = g.selectAll(".bubble")
        .data(filteredData, d => d.id || d.title); // Utiliser un identifiant unique
    
    // EXIT - Retirer les bulles qui n'existent plus avec fade out progressif
    bubbles.exit()
        .transition()
        .duration(400)  // Réduit de 800 à 400ms
        .ease(d3.easeCubicIn)
        .attr("r", 0)
        .attr("opacity", 0)
        .remove();
    
    // UPDATE - Mettre à jour les bulles existantes avec mouvement fluide
    bubbles.transition()
        .duration(800)  // Réduit de 1500 à 800ms
        .ease(d3.easeCubicInOut)
        .attr("cx", d => xScale(+d[xAxisOption]))
        .attr("cy", d => yScale(+d[yAxisOption]))
        .attr("r", d => sizeScale(+(d[sizeOption] || 1)))
        .attr("fill", d => getItemColor(d));
    
    // ENTER - Ajouter les nouvelles bulles avec fade in progressif
    const newBubbles = bubbles.enter()
        .append("circle")
        .attr("class", "bubble")
        .attr("cx", d => xScale(+d[xAxisOption]))
        .attr("cy", d => yScale(+d[yAxisOption]))
        .attr("r", 0)
        .attr("fill", d => getItemColor(d))
        .attr("stroke", "white")
        .attr("stroke-width", 1.5)
        .attr("opacity", 0)
        .style("cursor", "pointer")
        .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.2))");
    
    // Animation d'entrée fluide pour les nouvelles bulles
    newBubbles.transition()
        .duration(800)  // Réduit de 1500 à 800ms
        .delay((d, i) => i * 2)  // Réduit de 5ms à 2ms entre chaque bulle
        .ease(d3.easeCubicInOut)
        .attr("r", d => sizeScale(+(d[sizeOption] || 1)))
        .attr("opacity", 0.5);  // Opacité encore plus réduite pour mieux voir les chevauchements
    
    // Combiner les nouvelles et anciennes bulles pour les interactions
    const allBubbles = g.selectAll(".bubble");
    
    // Stocker la taille originale de chaque bulle et réinitialiser l'état de survol
    allBubbles.each(function(d) {
        d._originalRadius = sizeScale(+(d[sizeOption] || 1));
        d._isHovered = false;
    });
    
    // Variable pour tracker l'élément actuellement survolé
    let currentHoveredElement = null;
    
    // Fonction pour réinitialiser tous les points
    const resetAllBubbles = () => {
        allBubbles
            .attr("opacity", 0.5)
            .attr("stroke-width", 1.5)
            .attr("stroke", "white")
            .each(function(d) {
                d3.select(this).attr("r", d._originalRadius);
            });
    };
    
    // Interactions
    allBubbles
        .on("mouseenter", function(event, d) {
            d._isHovered = true;
            currentHoveredElement = this;
            
            // Réduire l'opacité de tous les autres points
            allBubbles
                .attr("opacity", 0.15);
            
            // Mettre en avant le point survolé
            d3.select(this)
                .attr("opacity", 1)
                .attr("stroke-width", 3)
                .attr("stroke", "#ff0000")
                .attr("r", d._originalRadius * 1.3);
            
            const genres = (d.genres || "").replace(/[\[\]"']/g, "").split(",").map(g => g.trim()).filter(Boolean);
            const regions = (d.regions || "").replace(/[\[\]"']/g, "").split(",").map(r => r.trim()).filter(Boolean);
            
            tooltip.style("visibility", "visible")
                .html(`
                    <div style="font-weight: bold; margin-bottom: 8px; font-size: 15px; border-bottom: 2px solid #00d4ff; padding-bottom: 5px;">${d.title || 'Sans titre'}</div>
                    <div style="margin-bottom: 3px;"><strong>Type:</strong> <span style="color: #00ff88;">${d.type || 'N/A'}</span>${d.type === 'SHOW' && d.seasons ? ` (${d.seasons} saison${+d.seasons > 1 ? 's' : ''})` : ''}</div>
                    <div style="margin-bottom: 3px;"><strong>Année:</strong> ${d.release_year || 'N/A'}</div>
                    <div style="margin-bottom: 3px;"><strong>${getAxisLabel(xAxisOption)}:</strong> ${d3.format(",.0f")(+d[xAxisOption])}</div>
                    <div style="margin-bottom: 3px;"><strong>${getAxisLabel(yAxisOption)}:</strong> ${d3.format(".2f")(+d[yAxisOption])}</div>
                    <div style="margin-bottom: 3px;"><strong>${getAxisLabel(sizeOption)}:</strong> ${d3.format(",.0f")(+(d[sizeOption] || 0))}</div>
                    <div style="margin-top: 5px; padding-top: 5px; border-top: 1px solid rgba(255,255,255,0.3);"><strong>Genres:</strong> ${genres.slice(0, 3).join(", ")}</div>
                    <div><strong>Régions:</strong> ${regions.slice(0, 2).join(", ")}</div>
                    <div style="margin-top: 8px; font-size: 11px; opacity: 0.7; text-align: center;">Cliquez pour plus de détails</div>
                `);
        })
        .on("mousemove", function(event) {
            tooltip
                .style("top", (event.pageY - 10) + "px")
                .style("left", (event.pageX + 15) + "px");
        })
        .on("mouseleave", function(event, d) {
            d._isHovered = false;
            
            // Si c'était l'élément courant, réinitialiser
            if (currentHoveredElement === this) {
                currentHoveredElement = null;
            }
            
            // Attendre un court instant pour s'assurer qu'on n'entre pas dans un autre élément
            setTimeout(() => {
                // Ne réinitialiser que si aucun autre élément n'est survolé
                if (!currentHoveredElement) {
                    resetAllBubbles();
                    tooltip.style("visibility", "hidden");
                }
            }, 10);
        })
        .on("click", function(event, d) {
            showScatterDetails(d);
        });
    
    // Ajouter un listener global pour capturer les cas où la souris sort de la zone SVG
    svg.on("mouseleave", function() {
        currentHoveredElement = null;
        resetAllBubbles();
        tooltip.style("visibility", "hidden");
        allBubbles.each(function(d) {
            d._isHovered = false;
        });
    });
    
    // Créer une légende dans le coin supérieur droit
    let legendContainer = svg.select(".legend-container");
    
    if (legendContainer.empty()) {
        legendContainer = svg.append("g")
            .attr("class", "legend-container")
            .attr("transform", `translate(${width - 280}, 20)`);
    }
    
    // Supprimer les anciens éléments
    legendContainer.selectAll("*").remove();
    
    // Si c'est par région, afficher une carte du monde
    if (colorOption === 'region') {
        const mapWidth = 270;
        const mapHeight = 180;
        
        // Fond de la légende
        legendContainer.append("rect")
            .attr("x", -10)
            .attr("y", -10)
            .attr("width", mapWidth)
            .attr("height", mapHeight)
            .attr("fill", "white")
            .attr("opacity", 0.97)
            .attr("rx", 10)
            .attr("stroke", "#ccc")
            .attr("stroke-width", 1.5);
        
        // Titre
        legendContainer.append("text")
            .attr("x", mapWidth / 2 - 10)
            .attr("y", 10)
            .attr("text-anchor", "middle")
            .style("font-weight", "bold")
            .style("font-size", "14px")
            .style("fill", "#333")
            .text("🌍 Régions du Monde");
        
        // Créer un groupe pour la carte
        const mapGroup = legendContainer.append("g")
            .attr("transform", "translate(0, 25)");
        
        // Fond océan
        mapGroup.append("rect")
            .attr("width", mapWidth - 20)
            .attr("height", mapHeight - 45)
            .attr("fill", "#e8f4f8")
            .attr("opacity", 0.3)
            .attr("rx", 5);
        
        // Projection
        const projection = d3.geoNaturalEarth1()
            .scale(40)
            .translate([(mapWidth - 20) / 2, (mapHeight - 45) / 2]);
        
        const path = d3.geoPath().projection(projection);
        
        // Données GeoJSON simplifiées
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
        mapGroup.selectAll('.continent')
            .data(continentsGeoJSON.features)
            .enter()
            .append('path')
            .attr('class', 'continent')
            .attr('d', path)
            .attr('fill', d => {
                const region = d.properties.region;
                const isVisible = colorCategories.includes(region);
                return isVisible ? colorScale(region) : '#d0d0d0';
            })
            .attr('opacity', d => colorCategories.includes(d.properties.region) ? 0.85 : 0.35)
            .attr('stroke', '#fff')
            .attr('stroke-width', 1.5)
            .style('cursor', 'pointer')
            .on('mouseover', function(event, d) {
                const region = d.properties.region;
                if (colorCategories.includes(region)) {
                    d3.select(this)
                        .attr('opacity', 1)
                        .attr('stroke-width', 2.5);
                    
                    // Mettre en évidence les bulles de cette région
                    g.selectAll(".bubble")
                        .attr("opacity", data => {
                            const regions = (data.regions || "").replace(/[\[\]"']/g, "").split(",").map(r => r.trim()).filter(Boolean);
                            return regions.includes(region) ? 1 : 0.1;
                        });
                }
            })
            .on('mouseout', function(event, d) {
                d3.select(this)
                    .attr('opacity', colorCategories.includes(d.properties.region) ? 0.85 : 0.35)
                    .attr('stroke-width', 1.5);
                
                // Restaurer toutes les bulles
                g.selectAll(".bubble").attr("opacity", 0.5);
            });
        
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
            if (colorCategories.includes(region)) {
                const projected = projection(coords);
                mapGroup.append('text')
                    .attr('x', projected[0])
                    .attr('y', projected[1])
                    .attr('text-anchor', 'middle')
                    .attr('font-size', '9px')
                    .attr('font-weight', 'bold')
                    .attr('fill', '#fff')
                    .attr('stroke', '#000')
                    .attr('stroke-width', 0.5)
                    .attr('paint-order', 'stroke')
                    .text(region);
            }
        });
        
    } else {
        // Pour les genres ou types, utiliser la légende classique
        const legendWidth = 170;
        
        // Fond de la légende avec ombre
        legendContainer.append("rect")
            .attr("x", -15)
            .attr("y", -15)
            .attr("width", legendWidth)
            .attr("height", Math.min(colorCategories.length, 12) * 24 + 55)
            .attr("fill", "white")
            .attr("opacity", 0.97)
            .attr("rx", 10)
            .attr("stroke", "#ccc")
            .attr("stroke-width", 1.5);
        
        // Titre de la légende
        legendContainer.append("text")
            .attr("x", 5)
            .attr("y", 5)
            .style("font-weight", "bold")
            .style("font-size", "14px")
            .style("fill", "#333")
            .text(colorOption === 'genre' ? '🎬 Genres' : '📺 Type');
        
        // Ligne de séparation
        legendContainer.append("line")
            .attr("x1", 0)
            .attr("y1", 15)
            .attr("x2", 140)
            .attr("y2", 15)
            .attr("stroke", "#e0e0e0")
            .attr("stroke-width", 1);
        
        // Éléments de la légende
        colorCategories.slice(0, 12).forEach((category, i) => {
            const legendRow = legendContainer.append("g")
                .attr("class", "legend-item")
                .attr("transform", `translate(5, ${30 + i * 24})`)
                .style("cursor", "pointer")
                .on("mouseover", function() {
                    d3.select(this).select("text")
                        .style("font-weight", "bold")
                        .style("fill", "#000");
                    d3.select(this).select("circle")
                        .attr("r", 8)
                        .attr("stroke-width", 3);
                    
                    // Mettre en évidence les bulles de cette catégorie
                    g.selectAll(".bubble")
                        .attr("opacity", d => {
                            let itemCategory;
                            if (colorOption === 'genre') {
                                const genres = (d.genres || "").replace(/[\[\]"']/g, "").split(",").map(g => g.trim()).filter(Boolean);
                                itemCategory = genres[0];
                            } else {
                                itemCategory = d.type;
                            }
                            return itemCategory === category ? 1 : 0.1;
                        });
                })
                .on("mouseout", function() {
                    d3.select(this).select("text")
                        .style("font-weight", "normal")
                        .style("fill", "#555");
                    d3.select(this).select("circle")
                        .attr("r", 7)
                        .attr("stroke-width", 2);
                    
                    // Restaurer toutes les bulles
                    g.selectAll(".bubble").attr("opacity", 0.5);
                });
            
            // Cercle de couleur
            legendRow.append("circle")
                .attr("cx", 8)
                .attr("cy", 0)
                .attr("r", 7)
                .attr("fill", colorScale(category))
                .attr("stroke", "white")
                .attr("stroke-width", 2);
            
            // Texte de la catégorie
            legendRow.append("text")
                .attr("x", 22)
                .attr("y", 4)
                .style("font-size", "12px")
                .style("fill", "#555")
                .text(category.length > 15 ? category.substring(0, 15) + '...' : category);
        });
        
        // Ajouter le nombre total de catégories si > 12
        if (colorCategories.length > 12) {
            legendContainer.append("text")
                .attr("x", 5)
                .attr("y", 30 + 12 * 24 + 5)
                .style("font-size", "10px")
                .style("fill", "#999")
                .style("font-style", "italic")
                .text(`+${colorCategories.length - 12} autres...`);
        }
    }
}

function getAxisLabel(option) {
    const labels = {
        'imdb_votes': 'Votes IMDB',
        'tmdb_popularity': 'Popularité TMDB',
        'runtime': 'Durée (minutes)',
        'imdb_score': 'Score IMDB',
        'tmdb_score': 'Score TMDB'
    };
    return labels[option] || option;
}

function updateScatterStats(filteredData, year) {
    const totalTitles = document.getElementById('scatter-total-titles');
    const avgImdb = document.getElementById('scatter-avg-imdb');
    const movieShowRatio = document.getElementById('scatter-movie-show-ratio');
    
    if (!totalTitles) return;
    
    const movieCount = filteredData.filter(d => d.type === 'MOVIE').length;
    const showCount = filteredData.filter(d => d.type === 'SHOW').length;
    const avgImdbScore = d3.mean(filteredData.filter(d => d.imdb_score), d => +d.imdb_score) || 0;
    
    // Animer les changements de valeurs
    totalTitles.textContent = filteredData.length;
    avgImdb.textContent = avgImdbScore.toFixed(2);
    movieShowRatio.textContent = `${movieCount} / ${showCount}`;
}

function showScatterDetails(movie) {
    // Créer une modal pour afficher les détails
    let modal = document.getElementById('scatter-details-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'scatter-details-modal';
        modal.style.cssText = `
            display: none;
            position: fixed;
            z-index: 9999;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.6);
            align-items: center;
            justify-content: center;
        `;
        document.body.appendChild(modal);
    }
    
    const parseField = (field) => {
        if (!field) return [];
        return field.replace(/[\[\]"']/g, "").split(",").map(s => s.trim()).filter(Boolean);
    };
    
    const genres = parseField(movie.genres);
    const regions = parseField(movie.regions);
    const score = +(movie.imdb_score || movie.tmdb_score || 0);
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        border-radius: 15px;
        padding: 30px;
        max-width: 700px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        position: relative;
    `;
    
    modalContent.innerHTML = `
        <button id="close-scatter-modal" style="
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
        " onmouseover="this.style.background='#c82333'; this.style.transform='rotate(90deg)';" 
           onmouseout="this.style.background='#dc3545'; this.style.transform='rotate(0deg)';">
            ×
        </button>
        
        <h2 style="color: #007bff; margin-bottom: 20px; padding-right: 40px; font-size: 1.8rem; font-weight: bold;">
            ${movie.title || 'Sans titre'}
        </h2>
        
        <div style="display: flex; gap: 15px; margin-bottom: 20px; flex-wrap: wrap; align-items: center;">
            <span class="badge badge-${movie.type === 'MOVIE' ? 'primary' : 'success'}" style="font-size: 0.9rem; padding: 6px 12px;">
                ${movie.type || 'N/A'}${movie.type === 'SHOW' && movie.seasons ? ` (${movie.seasons} saison${+movie.seasons > 1 ? 's' : ''})` : ''}
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
        
        <div style="margin-bottom: 15px;">
            <strong style="color: #333; display: block; margin-bottom: 8px;">Scores et Statistiques:</strong>
            ${movie.imdb_score ? `<div>• Score IMDB: ${movie.imdb_score}</div>` : ''}
            ${movie.tmdb_score ? `<div>• Score TMDB: ${movie.tmdb_score}</div>` : ''}
            ${movie.imdb_votes ? `<div>• Votes IMDB: ${d3.format(",.0f")(+movie.imdb_votes)}</div>` : ''}
            ${movie.tmdb_popularity ? `<div>• Popularité TMDB: ${d3.format(",.2f")(+movie.tmdb_popularity)}</div>` : ''}
            ${movie.runtime ? `<div>• Durée: ${movie.runtime} minutes</div>` : ''}
            ${movie.type === 'SHOW' && movie.seasons ? `<div>• Nombre de saisons: ${movie.seasons}</div>` : ''}
        </div>
    `;
    
    modal.innerHTML = '';
    modal.appendChild(modalContent);
    modal.style.display = 'flex';
    
    document.getElementById('close-scatter-modal').addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Initialiser quand l'onglet scatter est activé
$('a[data-toggle="tab"][href="#scatter"]').on('shown.bs.tab', function () {
    if (!scatterplotInitialized) {
        initScatterplot();
    }
});

// Initialiser automatiquement si l'onglet scatter est actif au chargement
$(document).ready(function() {
    // Vérifier si l'onglet scatter est actif au démarrage
    if ($('#scatter').hasClass('active') && $('#scatter').hasClass('show')) {
        // Attendre que globalData soit chargé
        const checkData = setInterval(() => {
            if (globalData && !scatterplotInitialized) {
                clearInterval(checkData);
                initScatterplot();
            }
        }, 100);
    }
});
