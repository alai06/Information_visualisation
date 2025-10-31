const CSV_PATH = "/data/titles_update3.csv";

// Utiliser window pour éviter les conflits de déclaration
if (!window.sunburstData) {
    window.sunburstData = {
        rawData: [],
        currentMoviesList: [],
        currentSortMode: 'name'
    };
}

// Rendre showMovieModal accessible globalement
window.showMovieModal = function(index) {
    const movie = window.sunburstData.currentMoviesList[index];
    if (!movie) return;
    
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
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
    
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
    
    const parseField = (field) => {
        if (!field) return [];
        try {
            return JSON.parse(field.replace(/'/g, '"'));
        } catch {
            return field.split(',').map(s => s.trim()).filter(Boolean);
        }
    };
    
    const genres = parseField(movie.genres);
    const regions = parseField(movie.production_countries);
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
    
    document.getElementById('close-modal').addEventListener('click', () => {
        modal.style.display = 'none';
    });
};

// ---------- UTILS ----------
function normalizeGenre(s) {
  if (!s && s !== 0) return null;
  return s.toString().replace(/["']/g, "").trim().replace(/\s+/g, " ");
}

function mapToObject(map, name) {
  if (!(map instanceof Map)) return { name, value: map };
  const children = [];
  for (const [key, value] of map.entries()) {
    children.push(mapToObject(value, key));
  }
  return { name, children };
}

// ---------- CHARGEMENT & PREPARATION DES DONNÉES ----------
d3.csv(CSV_PATH).then(raw => {
  window.sunburstData.rawData = raw; // Stocker les données brutes
  
  const expanded = [];
  raw.forEach(d => {
    const type = d.type || "Unknown";
    const age = d.age_certification || "Not Rated";

    const genresField = d.genres || d.genre || "";
    const genres = genresField
      .split(",")
      .map(normalizeGenre)
      .filter(g => g && g.length > 0);

    const uniqueGenres = Array.from(new Set(genres));

    if (uniqueGenres.length === 0) {
      expanded.push({ type, age_certification: age, genre: "Unknown" });
    } else {
      uniqueGenres.forEach(g => {
        expanded.push({ type, age_certification: age, genre: g });
      });
    }
  });

  const nested = d3.rollup(
    expanded,
    v => v.length,
    d => d.type,
    d => d.age_certification,
    d => d.genre
  );

  const hierarchyData = mapToObject(nested, "root");
  const root = d3.hierarchy(hierarchyData)
    .sum(d => d.value || 0)
    .sort((a, b) => b.value - a.value);

  drawSunburst(root);
}).catch(err => {
  console.error("Erreur chargement CSV:", err);
  d3.select("#sunburst-chart")
    .append("text")
    .attr("x", 700)
    .attr("y", 700)
    .attr("text-anchor", "middle")
    .text("Erreur chargement CSV — voir console");
});

// Fonction pour afficher le panneau de détails
function showSunburstDetails(genre, ageCategory, type, items) {
    let panel = document.getElementById('sunburst-details-panel');
    
    if (!panel) {
        // Créer le panneau APRÈS le chart-container (pas dedans)
        const sunburstCardBody = document.querySelector('#sunburst .card-body');
        
        panel = document.createElement('div');
        panel.id = 'sunburst-details-panel';
        panel.className = 'p-3 mt-3';
        panel.style.cssText = `
            background: rgba(0,0,0,0.05);
            border-radius: 8px;
            display: none;
            flex-direction: column;
            max-height: 400px;
            overflow: hidden;
            width: 100%;
            flex-shrink: 0;
        `;
        
        panel.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-2" style="flex-shrink: 0;">
                <h5 id="sunburst-details-title" class="mb-0" style="font-size: 0.95rem;"></h5>
                <button id="sunburst-close-details" class="btn btn-sm btn-secondary">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="text-center mb-2" style="flex-shrink: 0;">
                <div class="font-weight-bold mb-2" style="font-size: 0.9rem;">Trier par:</div>
                <div class="btn-group btn-group-sm" role="group">
                    <button id="sunburst-sort-name" class="btn btn-outline-primary active">Nom</button>
                    <button id="sunburst-sort-rating" class="btn btn-outline-primary">Note</button>
                    <button id="sunburst-sort-date" class="btn btn-outline-primary">Date</button>
                </div>
            </div>
            <div id="sunburst-items-grid" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px;"></div>
        `;
        
        // Ajouter le panneau à la fin de la card-body (après le chart-container)
        if (sunburstCardBody) {
            sunburstCardBody.appendChild(panel);
        }
        
        // Event listener pour fermer
        document.getElementById('sunburst-close-details').addEventListener('click', () => {
            panel.style.display = 'none';
        });
    }
    
    const title = document.getElementById('sunburst-details-title');
    const grid = document.getElementById('sunburst-items-grid');
    
    title.textContent = `${type} - ${ageCategory} - ${genre} (${items.length})`;
    
    window.sunburstData.currentMoviesList = [...items];
    
    const displayMovies = (moviesList) => {
        grid.innerHTML = moviesList.map((item, index) => `
            <div class="card" style="width: 100%; margin: 0; flex-shrink: 0;">
                <div class="card-body p-2">
                    <div class="d-flex justify-content-between align-items-start mb-1">
                        <h6 class="card-title mb-0" style="font-size: 0.85rem; font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;" title="${item.title || 'Sans titre'}">${item.title || 'Sans titre'}</h6>
                        <button class="btn btn-sm btn-outline-info ml-1" style="font-size: 0.65rem; padding: 2px 8px; white-space: nowrap;" onclick="showMovieModal(${index})">
                            <i class="fas fa-info-circle"></i>
                        </button>
                    </div>
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <span class="badge badge-${item.type === 'MOVIE' ? 'primary' : 'success'}" style="font-size: 0.7rem; padding: 2px 6px;">${item.type || 'N/A'}</span>
                        <span class="text-warning" style="font-size: 0.75rem; font-weight: bold;">⭐ ${(+(item.imdb_score || item.tmdb_score || 0)).toFixed(1)}</span>
                    </div>
                    <div class="mb-1">
                        <small class="text-muted" style="font-size: 0.7rem;">📅 ${item.release_year || 'N/A'}</small>
                    </div>
                    <p class="card-text mb-0" style="font-size: 0.7rem; line-height: 1.4; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; color: #666;">${item.description || 'Pas de description'}</p>
                </div>
            </div>
        `).join('');
    };
    
    const applySortMode = (mode) => {
        if (mode === 'name') {
            window.sunburstData.currentMoviesList.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        } else if (mode === 'rating') {
            window.sunburstData.currentMoviesList.sort((a, b) => {
                const scoreB = +(b.imdb_score || b.tmdb_score || 0);
                const scoreA = +(a.imdb_score || a.tmdb_score || 0);
                return scoreB - scoreA;
            });
        } else if (mode === 'date') {
            window.sunburstData.currentMoviesList.sort((a, b) => (+(b.release_year || 0)) - (+(a.release_year || 0)));
        }
        displayMovies(window.sunburstData.currentMoviesList);
    };
    
    applySortMode(window.sunburstData.currentSortMode);
    
    ['sunburst-sort-name', 'sunburst-sort-rating', 'sunburst-sort-date'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.classList.remove('active');
    });
    const activeButton = document.getElementById(`sunburst-sort-${window.sunburstData.currentSortMode}`);
    if (activeButton) activeButton.classList.add('active');
    
    const sortButtons = {
        'sunburst-sort-name': () => {
            window.sunburstData.currentSortMode = 'name';
            applySortMode('name');
        },
        'sunburst-sort-rating': () => {
            window.sunburstData.currentSortMode = 'rating';
            applySortMode('rating');
        },
        'sunburst-sort-date': () => {
            window.sunburstData.currentSortMode = 'date';
            applySortMode('date');
        }
    };
    
    Object.keys(sortButtons).forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.onclick = () => {
                Object.keys(sortButtons).forEach(id => {
                    document.getElementById(id).classList.remove('active');
                });
                btn.classList.add('active');
                sortButtons[btnId]();
            };
        }
    });

    panel.style.display = 'flex';
}

// ---------- DESSIN DU SUNBURST ----------
function drawSunburst(root) {
  const width = 1500;
  const radius = width / 8;

  const svg = d3.select("#sunburst-chart")
    .attr("viewBox", [0, 0, width, width])
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("font", "12px sans-serif")
    .style("width", "100%")
    .style("height", "auto")
    .style("max-width", "1500px")
    .style("max-height", "1500px")
    .style("display", "block")
    .style("margin", "0 auto");

  svg.selectAll("*").remove();

  const g = svg.append("g")
    .attr("transform", `translate(${width/2},${width/2})`);

  d3.partition().size([2 * Math.PI, root.height + 1])(root);
  root.each(d => d.current = d);

  const color = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, Math.max(3, (root.children || []).length + 1)));

  const arc = d3.arc()
    .startAngle(d => d.x0)
    .endAngle(d => d.x1)
    .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
    .padRadius(radius * 1.5)
    .innerRadius(d => d.y0 * radius)
    .outerRadius(d => d.y1 * radius - 1);

  const path = g.append("g")
    .selectAll("path")
    .data(root.descendants().slice(1))
    .join("path")
      .attr("fill", d => {
        let node = d;
        while (node.depth > 1) node = node.parent;
        return color(node.data.name);
      })
      .attr("fill-opacity", d => arcVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0)
      .attr("d", d => arc(d.current))
      .style("cursor", "pointer");

  path.filter(d => d.children)
    .on("click", clicked);
  
  // Ajouter le clic sur les feuilles (genres)
  path.filter(d => !d.children && d.depth === 3)
    .on("click", (event, d) => {
      event.stopPropagation();
      
      // Récupérer le chemin complet: type -> age_certification -> genre
      const genreName = d.data.name;
      const ageCategory = d.parent.data.name;
      const typeName = d.parent.parent.data.name;
      
      // Filtrer les films correspondants
      const matchingMovies = window.sunburstData.rawData.filter(movie => {
        const movieType = movie.type || "Unknown";
        const movieAge = movie.age_certification || "Not Rated";
        const movieGenres = (movie.genres || "").replace(/[\[\]"']/g, "").split(",").map(g => g.trim());
        
        return movieType === typeName && 
               movieAge === ageCategory && 
               movieGenres.includes(genreName);
      });
      
      if (matchingMovies.length > 0) {
        showSunburstDetails(genreName, ageCategory, typeName, matchingMovies);
      }
    });

  path.append("title")
    .text(d => `${d.ancestors().map(a => a.data.name).reverse().join(" / ")}\n${d.value} titres`);

  const label = g.append("g")
    .attr("pointer-events", "none")
    .attr("text-anchor", "middle")
    .selectAll("text")
    .data(root.descendants().slice(1))
    .join("text")
      .attr("dy", "0.35em")
      .attr("fill-opacity", d => +labelVisible(d.current))
      .attr("transform", d => labelTransform(d.current))
      .text(d => d.data.name);

  const parent = g.append("circle")
    .datum(root)
    .attr("r", radius)
    .attr("fill", "none")
    .attr("pointer-events", "all")
    .on("click", clicked);

  function clicked(event, p) {
    parent.datum(p.parent || root);

    root.each(d => d.target = {
      x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
      x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
      y0: Math.max(0, d.y0 - p.depth),
      y1: Math.max(0, d.y1 - p.depth)
    });

    const t = g.transition().duration(750);

    path.transition(t)
      .tween("data", d => {
        const i = d3.interpolate(d.current, d.target);
        return t => d.current = i(t);
      })
      .filter(function(d) { return +this.getAttribute("fill-opacity") || arcVisible(d.target); })
      .attr("fill-opacity", d => arcVisible(d.target) ? (d.children ? 0.6 : 0.4) : 0)
      .attrTween("d", d => () => arc(d.current));

    label.filter(function(d) { return +this.getAttribute("fill-opacity") || labelVisible(d.target); })
      .transition(t)
      .attr("fill-opacity", d => +labelVisible(d.target))
      .attrTween("transform", d => () => labelTransform(d.current));
  }

  function arcVisible(d) {
    return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
  }

  function labelVisible(d) {
    return d.y1 <= 3 && d.y0 >= 1 && (d.x1 - d.x0) > 0.03;
  }

  function labelTransform(d) {
    const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
    const y = (d.y0 + d.y1) / 2 * radius;
    return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
  }
}