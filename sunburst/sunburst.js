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
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(10px);
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
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 20px;
        padding: 40px;
        max-width: 750px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        position: relative;
        color: white;
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
        <style>
            .modal-badge { 
                background: rgba(255, 255, 255, 0.2); 
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.3);
                padding: 8px 16px;
                border-radius: 20px;
                font-weight: 600;
            }
        </style>
        
        <button id="close-modal" style="
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            color: white;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            width: 45px;
            height: 45px;
            font-size: 24px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 300;
        ">
            ×
        </button>
        
        <h2 style="color: white; margin-bottom: 25px; padding-right: 60px; font-size: 2rem; font-weight: 700; text-shadow: 2px 2px 8px rgba(0,0,0,0.3);">
            ${movie.title || 'Sans titre'}
        </h2>
        
        <div style="display: flex; gap: 12px; margin-bottom: 25px; flex-wrap: wrap; align-items: center;">
            <span class="modal-badge" style="font-size: 0.95rem;">
                ${movie.type || 'N/A'}
            </span>
            <span class="modal-badge" style="font-size: 1.1rem;">
                ⭐ ${score.toFixed(1)} / 10
            </span>
            <span class="modal-badge" style="font-size: 0.95rem;">
                📅 ${movie.release_year || 'N/A'}
            </span>
        </div>
        
        ${genres.length > 0 ? `
        <div style="margin-bottom: 20px; background: rgba(255, 255, 255, 0.1); padding: 15px; border-radius: 12px; backdrop-filter: blur(10px);">
            <strong style="display: block; margin-bottom: 10px; font-size: 1rem;">
                <i class="fas fa-tags"></i> Genres
            </strong>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                ${genres.map(g => `<span class="modal-badge" style="font-size: 0.85rem;">${g}</span>`).join('')}
            </div>
        </div>
        ` : ''}
        
        ${regions.length > 0 ? `
        <div style="margin-bottom: 20px; background: rgba(255, 255, 255, 0.1); padding: 15px; border-radius: 12px; backdrop-filter: blur(10px);">
            <strong style="display: block; margin-bottom: 10px; font-size: 1rem;">
                <i class="fas fa-globe"></i> Régions
            </strong>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                ${regions.map(r => `<span class="modal-badge" style="font-size: 0.85rem;">${r}</span>`).join('')}
            </div>
        </div>
        ` : ''}
        
        ${movie.description ? `
        <div style="margin-bottom: 20px; background: rgba(255, 255, 255, 0.1); padding: 15px; border-radius: 12px; backdrop-filter: blur(10px);">
            <strong style="display: block; margin-bottom: 10px; font-size: 1rem;">
                <i class="fas fa-align-left"></i> Description
            </strong>
            <p style="margin: 0; line-height: 1.8; text-align: justify;">
                ${movie.description}
            </p>
        </div>
        ` : ''}
        
        ${movie.runtime ? `
        <div style="background: rgba(255, 255, 255, 0.1); padding: 12px 15px; border-radius: 12px; backdrop-filter: blur(10px); display: inline-block;">
            <strong style="margin-right: 10px;">
                <i class="fas fa-clock"></i> Durée:
            </strong>
            <span>${movie.runtime} minutes</span>
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
  window.sunburstData.rawData = raw;
  
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
        const sunburstCardBody = document.querySelector('#sunburst .card-body');
        
        panel = document.createElement('div');
        panel.id = 'sunburst-details-panel';
        panel.className = 'p-3 mt-3';
        panel.style.cssText = `
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
            border-radius: 15px;
            border: 2px solid rgba(102, 126, 234, 0.3);
            display: none;
            flex-direction: column;
            max-height: 500px;
            overflow: hidden;
            width: 100%;
            flex-shrink: 0;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        `;
        
        panel.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3" style="flex-shrink: 0;">
                <h5 id="sunburst-details-title" class="mb-0" style="font-size: 1.1rem; font-weight: 700; color: #667eea;"></h5>
                <button id="sunburst-close-details" class="btn btn-sm" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; padding: 5px 15px; font-weight: 600;">
                    <i class="fas fa-times"></i> Fermer
                </button>
            </div>
            <div class="text-center mb-3" style="flex-shrink: 0;">
                <div class="font-weight-bold mb-2" style="font-size: 0.95rem; color: #555;">Trier par:</div>
                <div class="btn-group btn-group-sm" role="group">
                    <button id="sunburst-sort-name" class="btn btn-outline-primary active" style="border-radius: 8px 0 0 8px; font-weight: 600;">Nom</button>
                    <button id="sunburst-sort-rating" class="btn btn-outline-primary" style="font-weight: 600;">Note</button>
                    <button id="sunburst-sort-date" class="btn btn-outline-primary" style="border-radius: 0 8px 8px 0; font-weight: 600;">Date</button>
                </div>
            </div>
            <div id="sunburst-items-grid" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; padding-right: 5px;"></div>
        `;
        
        if (sunburstCardBody) {
            sunburstCardBody.appendChild(panel);
        }
        
        document.getElementById('sunburst-close-details').addEventListener('click', () => {
            panel.style.display = 'none';
        });
    }
    
    const title = document.getElementById('sunburst-details-title');
    const grid = document.getElementById('sunburst-items-grid');
    
    title.textContent = `${type} • ${ageCategory} • ${genre} (${items.length})`;
    
    window.sunburstData.currentMoviesList = [...items];
    
    const displayMovies = (moviesList) => {
        grid.innerHTML = moviesList.map((item, index) => `
            <div class="card" style="width: 100%; margin: 0; flex-shrink: 0; border-radius: 12px; overflow: hidden; border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                <div class="card-body p-3" style="background: white;">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h6 class="card-title mb-0" style="font-size: 0.95rem; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; color: #333;" title="${item.title || 'Sans titre'}">${item.title || 'Sans titre'}</h6>
                        <button class="btn btn-sm ml-2" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; font-size: 0.7rem; padding: 4px 10px; border-radius: 8px; white-space: nowrap; font-weight: 600;" onclick="showMovieModal(${index})">
                            <i class="fas fa-info-circle"></i> Détails
                        </button>
                    </div>
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="badge" style="background: linear-gradient(135deg, ${item.type === 'MOVIE' ? '#667eea' : '#48bb78'} 0%, ${item.type === 'MOVIE' ? '#764ba2' : '#38a169'} 100%); font-size: 0.75rem; padding: 4px 10px; border-radius: 8px; font-weight: 600;">${item.type || 'N/A'}</span>
                        <span style="color: #f59e0b; font-size: 0.85rem; font-weight: 700;">⭐ ${(+(item.imdb_score || item.tmdb_score || 0)).toFixed(1)}</span>
                    </div>
                    <div class="mb-2">
                        <small style="color: #666; font-size: 0.75rem; font-weight: 600;">📅 ${item.release_year || 'N/A'}</small>
                    </div>
                    <p class="card-text mb-0" style="font-size: 0.75rem; line-height: 1.5; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; color: #555;">${item.description || 'Pas de description disponible'}</p>
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
  const width = 1400;
  const radius = width / 11;

  const svg = d3.select("#sunburst-chart")
    .attr("viewBox", [0, 0, width, width])
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("font", "14px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif")
    .style("width", "100%")
    .style("height", "auto")
    .style("max-width", "1500px")
    .style("max-height", "1500px")
    .style("display", "block")
    .style("margin", "0 auto")
    .style("filter", "drop-shadow(0px 10px 30px rgba(0, 0, 0, 0.15))");

  svg.selectAll("*").remove();

  const defs = svg.append("defs");
  
  const radialGradient = defs.append("radialGradient")
    .attr("id", "sunburst-gradient")
    .attr("cx", "50%")
    .attr("cy", "50%")
    .attr("r", "50%");
  
  radialGradient.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", "#667eea")
    .attr("stop-opacity", 0.1);
  
  radialGradient.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", "#764ba2")
    .attr("stop-opacity", 0.05);

  const g = svg.append("g")
    .attr("transform", `translate(${width/2},${width/2})`);

  g.append("circle")
    .attr("r", radius * 4)
    .attr("fill", "url(#sunburst-gradient)")
    .attr("opacity", 0.6);

  d3.partition().size([2 * Math.PI, root.height + 1])(root);
  root.each(d => d.current = d);

  const colorSchemes = {
    'MOVIE': d3.scaleOrdinal()
      .range(['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a']),
    'SHOW': d3.scaleOrdinal()
      .range(['#38ef7d', '#11998e', '#fa709a', '#fee140', '#30cfd0', '#a8edea'])
  };

  const arc = d3.arc()
    .startAngle(d => d.x0)
    .endAngle(d => d.x1)
    .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.008))
    .padRadius(radius * 1.5)
    .innerRadius(d => d.y0 * radius)
    .outerRadius(d => d.y1 * radius - 1)
    .cornerRadius(3);

  const path = g.append("g")
    .selectAll("path")
    .data(root.descendants().slice(1))
    .join("path")
      .attr("fill", d => {
        let node = d;
        while (node.depth > 1) node = node.parent;
        const type = node.data.name;
        const colorScale = colorSchemes[type] || colorSchemes['MOVIE'];
        return colorScale(d.data.name);
      })
      .attr("fill-opacity", d => arcVisible(d.current) ? (d.children ? 0.85 : 0.95) : 0)
      .attr("d", d => arc(d.current))
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .style("cursor", "pointer");

  path.on("mouseenter", function(event, d) {
    d3.select(this)
      .attr("fill-opacity", 1)
      .attr("stroke-width", 3);
  })
  .on("mouseleave", function(event, d) {
    d3.select(this)
      .attr("fill-opacity", arcVisible(d.current) ? (d.children ? 0.85 : 0.95) : 0)
      .attr("stroke-width", 2);
  });

  path.each(function(d) {
    const element = d3.select(this);
    
    if (d.children) {
      element.on("click", clicked);
    }
    else if (d.depth === 3) {
      element.on("click", (event, d) => {
        event.stopPropagation();
        
        const genreName = d.data.name;
        const ageCategory = d.parent.data.name;
        const typeName = d.parent.parent.data.name;
        
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
    }
  });

  path.append("title")
    .text(d => `${d.ancestors().map(a => a.data.name).reverse().join(" → ")}\n${d.value} titre${d.value > 1 ? 's' : ''}`);

  const label = g.append("g")
    .attr("pointer-events", "none")
    .attr("text-anchor", "middle")
    .selectAll("text")
    .data(root.descendants().slice(1))
    .join("text")
      .attr("dy", "0.35em")
      .attr("fill", "#333")
      .attr("fill-opacity", d => +labelVisible(d.current))
      .attr("font-weight", "600")
      .attr("font-size", d => d.depth === 1 ? "14px" : "12px")
      .attr("text-shadow", "0 1px 3px rgba(255,255,255,0.8)")
      .attr("transform", d => labelTransform(d.current))
      .text(d => d.data.name);

  const parent = g.append("circle")
    .datum(root)
    .attr("r", radius)
    .attr("fill", "white")
    .attr("stroke", "#667eea")
    .attr("stroke-width", 4)
    .attr("pointer-events", "all")
    .attr("cursor", "pointer")
    .style("filter", "drop-shadow(0 4px 8px rgba(102, 126, 234, 0.3))")
    .on("click", clicked);

  const centerText = g.append("text")
    .attr("text-anchor", "middle")
    .attr("dy", "0.35em")
    .attr("font-size", "18px")
    .attr("font-weight", "700")
    .attr("fill", "#667eea")
    .text("Cliquez pour explorer");

  function clicked(event, p) {
    if (!p.children && p.depth === 3) return;
    
    parent.datum(p.parent || root);
    centerText.text(p.parent ? "← Retour" : "Cliquez pour explorer");

    root.each(d => d.target = {
      x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
      x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
      y0: Math.max(0, d.y0 - p.depth),
      y1: Math.max(0, d.y1 - p.depth)
    });

    const t = g.transition().duration(500);

    path.transition(t)
      .tween("data", d => {
        const i = d3.interpolate(d.current, d.target);
        return t => d.current = i(t);
      })
      .attr("fill-opacity", d => arcVisible(d.target) ? (d.children ? 0.85 : 0.95) : 0)
      .attrTween("d", d => () => arc(d.current))
      .style("pointer-events", d => arcVisible(d.target) ? "auto" : "none");

    label.transition(t)
      .attr("fill-opacity", d => +labelVisible(d.target))
      .attrTween("transform", d => () => labelTransform(d.current));
  }

  function arcVisible(d) {
    return d.y1 <= 4 && d.y0 >= 1 && (d.x1 - d.x0) > 0.001;
  }

  function labelVisible(d) {
    return d.y1 <= 4 && d.y0 >= 1 && (d.x1 - d.x0) > 0.03;
  }

  function labelTransform(d) {
    const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
    const y = (d.y0 + d.y1) / 2 * radius;
    return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
  }
}