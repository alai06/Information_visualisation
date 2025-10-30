const width = 1000;
const maxRadius = width / 2 - 50;
const csvPath = "/data/titles_update.csv";

let currentRoot = null;
let svg, g, tooltip, centerText, centerValue;
let rawData = []; 

d3.csv(csvPath).then(data => {
    rawData = data;
    
    const root = d3.stratify()
        .path(d => d.type + '/' +d.age_certification + '/' +  d.genres)
        .id(d => d.type + '/' +d.age_certification + '/' +  d.genres)
        (data);

    root.count();
    root.sort((a, b) => b.value - a.value);

    const partition = d3.partition()
        .size([2 * Math.PI, root.height + 1]);

    const partitionedRoot = partition(root);
    
    currentRoot = partitionedRoot;
    drawSunburst(partitionedRoot);

}).catch(error => {
    console.error("Erreur lors du chargement:", error);
    d3.select("#sunburst-chart").append("text")
        .text("Erreur : Impossible de charger le CSV")
        .attr("x", 10)
        .attr("y", 20);
});

function getFilmsForNode(node) {
    const nodePath = node.id;
    const pathParts = nodePath.split('/');
    
    return rawData.filter(d => {
        const filmPath = d.age_certification + '/' + d.type + '/' + d.genres;
        return filmPath === nodePath;
    });
}

function getNodeStats(node) {
    const films = getFilmsForNode(node);
    
    if (films.length === 0) return null;
    
    const validScores = films.filter(f => f.imdb_score && f.imdb_score !== '');
    const avgIMDB = validScores.length > 0 
        ? (validScores.reduce((sum, f) => sum + parseFloat(f.imdb_score), 0) / validScores.length).toFixed(1)
        : 'N/A';
    
    const validTMDB = films.filter(f => f.tmdb_score && f.tmdb_score !== '');
    const avgTMDB = validTMDB.length > 0
        ? (validTMDB.reduce((sum, f) => sum + parseFloat(f.tmdb_score), 0) / validTMDB.length).toFixed(1)
        : 'N/A';
    
    const totalVotes = films.reduce((sum, f) => sum + (parseFloat(f.imdb_votes) || 0), 0);
    
    return {
        count: films.length,
        avgIMDB,
        avgTMDB,
        totalVotes: totalVotes.toLocaleString()
    };
}

function drawSunburst(root) {
    const getNodeName = d => d.id.split('/').pop();

    const arc = d3.arc()
        .startAngle(d => d.x0)
        .endAngle(d => d.x1)
        .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
        .padRadius(maxRadius * 1.5)
        .innerRadius(d => d.y0 * maxRadius)
        .outerRadius(d => d.y1 * maxRadius - 1);

    const color = d3.scaleOrdinal()
        .range(d3.quantize(d3.interpolateRainbow, root.children.length + 1));

    const colorScale = d => {
        let topNode = d;
        while (topNode.depth > 1) topNode = topNode.parent;
        return color(getNodeName(topNode));
    };

    svg = d3.select("#sunburst-chart")
        .attr("viewBox", [-width / 2, -width / 2, width, width])
        .style("font", "10px sans-serif");

    svg.selectAll("*").remove();

    tooltip = d3.select("body").append("div")
        .attr("class", "sunburst-tooltip")
        .style("position", "absolute")
        .style("background", "rgba(0,0,0,0.9)")
        .style("color", "white")
        .style("padding", "12px 16px")
        .style("border-radius", "8px")
        .style("pointer-events", "none")
        .style("opacity", 0)
        .style("font-size", "13px")
        .style("line-height", "1.5")
        .style("box-shadow", "0 4px 12px rgba(0,0,0,0.4)")
        .style("z-index", "1000")
        .style("max-width", "350px")
        .style("max-height", "500px")
        .style("overflow-y", "auto");

    g = svg.append("g");

    centerText = svg.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "-0.5em")
        .style("font-size", "20px")
        .style("font-weight", "bold")
        .style("fill", "#333")
        .text(getNodeName(root));

    centerValue = svg.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "1em")
        .style("font-size", "16px")
        .style("fill", "#666")
        .text(`Total: ${root.value.toLocaleString()}`);

    svg.append("circle")
        .attr("r", 40)
        .attr("fill", "rgba(255,255,255,0.1)")
        .attr("stroke", "#999")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "5,5")
        .style("cursor", "pointer")
        .on("click", () => zoomTo(root))
        .append("title")
        .text("Cliquez pour revenir à la vue d'ensemble");

    // DESSINER les arcs
    const paths = g.selectAll("path")
        .data(root.descendants().filter(d => d.depth))
        .join("path")
        .attr("fill", colorScale)
        .attr("d", arc)
        .attr("fill-opacity", 0.7)
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5)
        .style("cursor", "pointer")
        .on("mouseover", function(event, d) {
            d3.select(this)
                .attr("fill-opacity", 1)
                .attr("stroke-width", 2)
                .attr("stroke", "#000");
            
            const path = d.ancestors()
                .map(node => getNodeName(node))
                .reverse()
                .filter(name => name)
                .join(" → ");
            
            // Récupérer les films et stats
            const films = getFilmsForNode(d);
            const stats = getNodeStats(d);
            let filmsHTML = '';
            
            if (films.length > 0 && d.depth === 3) { // Genre level
                const filmTitles = films
                    .sort((a, b) => (parseFloat(b.imdb_score) || 0) - (parseFloat(a.imdb_score) || 0))
                    .slice(0, 8);
                
                filmsHTML = `<div style="margin-top:8px; padding-top:8px; border-top:1px solid rgba(255,255,255,0.3);">`;
                filmsHTML += `<strong>📊 Statistiques:</strong><br/>`;
                filmsHTML += `⭐ IMDB moyen: ${stats.avgIMDB}<br/>`;
                filmsHTML += `🎬 TMDB moyen: ${stats.avgTMDB}<br/>`;
                filmsHTML += `👥 Total votes: ${stats.totalVotes}<br/><br/>`;
                
                filmsHTML += `<strong>🎥 Top films (${films.length} total):</strong><br/>`;
                filmsHTML += filmTitles.map(f => {
                    const score = f.imdb_score ? `⭐${f.imdb_score}` : '';
                    const year = f.release_year ? `(${f.release_year})` : '';
                    return `• ${f.title} ${year} ${score}`;
                }).join('<br/>');
                
                if (films.length > 8) {
                    filmsHTML += `<br/><em style="color:#ffd700;">... et ${films.length - 8} autres</em>`;
                }
                filmsHTML += `</div>`;
            }
            
            tooltip.transition().duration(200).style("opacity", 1);
            tooltip.html(`
                <div style="font-weight:bold; font-size:15px; margin-bottom:5px;">${getNodeName(d)}</div>
                <div style="font-size:11px; color:#aaa; margin-bottom:5px;">${path}</div>
                <strong>Occurrences:</strong> ${d.value.toLocaleString()}${filmsHTML}
                <div style="margin-top:8px; font-style:italic; color:#ffd700; font-size:11px;">Cliquez pour zoomer</div>
            `)
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            d3.select(this)
                .attr("fill-opacity", 0.7)
                .attr("stroke-width", 0.5)
                .attr("stroke", "#fff");
            
            tooltip.transition().duration(200).style("opacity", 0);
        })
        .on("click", (event, d) => {
            event.stopPropagation();
            zoomTo(d);
        });

    // DESSINER les labels
    const labels = g.selectAll("text")
        .data(root.descendants().filter(d => d.depth > 0 && (d.x1 - d.x0) > 0.06))
        .join("text")
        .attr("transform", d => {
            const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
            const y = (d.y0 + d.y1) / 2 * maxRadius;
            return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
        })
        .attr("dy", "0.35em")
        .attr("fill", "#222")
        .attr("font-size", "12px")
        .attr("text-anchor", "middle")
        .style("pointer-events", "none")
        .text(getNodeName);

    let focusedNode = root;

    // FONCTION DE ZOOM
    function zoomTo(p) {
        if (p === focusedNode && p !== root) {
            p = root;
        }
        
        focusedNode = p;

        // Mise à jour du texte central avec stats
        const stats = getNodeStats(p);
        centerText.text(getNodeName(p));
        
        if (stats) {
            centerValue.text(`${stats.count} films | ⭐${stats.avgIMDB}`);
        } else {
            centerValue.text(`Total: ${p.value.toLocaleString()}`);
        }

        // Animation des arcs
        paths.transition()
            .duration(750)
            .attrTween("d", d => {
                const xd = d3.interpolate(d.x0, d.x1);
                return t => {
                    const startAngle = Math.max(0, Math.min(2 * Math.PI, 
                        (d.x0 - p.x0) / (p.x1 - p.x0) * 2 * Math.PI));
                    const endAngle = Math.max(0, Math.min(2 * Math.PI, 
                        (d.x1 - p.x0) / (p.x1 - p.x0) * 2 * Math.PI));
                    const innerRadius = Math.max(0, (d.y0 - p.y0) * maxRadius);
                    const outerRadius = Math.max(0, (d.y1 - p.y0) * maxRadius - 1);
                    
                    return d3.arc()
                        .startAngle(startAngle)
                        .endAngle(endAngle)
                        .innerRadius(innerRadius)
                        .outerRadius(outerRadius)();
                };
            })
            .style("opacity", d => arcVisible(d, p) ? 0.7 : 0);

        // Animation des labels
        labels.transition()
            .duration(750)
            .style("opacity", d => arcVisible(d, p) && labelVisible(d, p) ? 1 : 0);

        // ZOOM SÉMANTIQUE : Afficher les détails pour les feuilles
        if (p.depth >= 2) {
            setTimeout(() => renderLeafDetails(p), 800);
        } else {
            g.selectAll(".leaf-details").remove();
        }
    }

    // RENDU SÉMANTIQUE DES FEUILLES AVEC FILMS
    function renderLeafDetails(node) {
        g.selectAll(".leaf-details").remove();

        const leaves = node.descendants().filter(d => !d.children && d.depth > node.depth);
        
        leaves.forEach(leaf => {
            const leafGroup = g.append("g")
                .attr("class", "leaf-details");

            const startAngle = Math.max(0, Math.min(2 * Math.PI, 
                (leaf.x0 - node.x0) / (node.x1 - node.x0) * 2 * Math.PI));
            const endAngle = Math.max(0, Math.min(2 * Math.PI, 
                (leaf.x1 - node.x0) / (node.x1 - node.x0) * 2 * Math.PI));
            const innerR = Math.max(0, (leaf.y0 - node.y0) * maxRadius);
            const outerR = Math.max(0, (leaf.y1 - node.y0) * maxRadius);
            const arcLength = (endAngle - startAngle) * outerR;

            // Récupérer les films pour cette feuille (triés par score)
            const films = getFilmsForNode(leaf)
                .sort((a, b) => (parseFloat(b.imdb_score) || 0) - (parseFloat(a.imdb_score) || 0));
            
            const numCircles = Math.min(films.length, 40);
            const circleRadius = Math.min(
                arcLength / (numCircles * 2.5), 
                (outerR - innerR) / 3.5,
                8
            );

            // Échelle de couleur basée sur le score IMDB
            const scoreScale = d3.scaleSequential()
                .domain([0, 10])
                .interpolator(d3.interpolateRdYlGn);

            // Dessiner les cercles en arc (un par film)
            for (let i = 0; i < numCircles; i++) {
                const angle = startAngle + (endAngle - startAngle) * ((i + 0.5) / numCircles);
                const r = (innerR + outerR) / 2;
                const x = Math.cos(angle - Math.PI / 2) * r;
                const y = Math.sin(angle - Math.PI / 2) * r;
                
                const film = films[i];
                const imdbScore = parseFloat(film.imdb_score) || 5;
                const circleColor = scoreScale(imdbScore);

                const circle = leafGroup.append("circle")
                    .attr("cx", x)
                    .attr("cy", y)
                    .attr("r", 0)
                    .attr("fill", circleColor)
                    .attr("fill-opacity", 0.85)
                    .attr("stroke", "#333")
                    .attr("stroke-width", 1)
                    .style("cursor", "pointer")
                    .datum(film)
                    .on("mouseover", function(event, d) {
                        d3.select(this)
                            .attr("fill-opacity", 1)
                            .attr("stroke", "#fff")
                            .attr("stroke-width", 2)
                            .attr("r", circleRadius * 1.3);
                        
                        tooltip.transition().duration(200).style("opacity", 1);
                        tooltip.html(`
                            <div style="font-weight:bold; font-size:15px; margin-bottom:8px;">
                                ${d.title || 'N/A'}
                            </div>
                            <div style="display:grid; grid-template-columns:auto 1fr; gap:4px 8px; font-size:12px;">
                                <span>📅</span><span>${d.release_year || 'N/A'}</span>
                                <span>🎭</span><span>${d.type || 'N/A'}</span>
                                <span>⭐</span><span>IMDB: ${d.imdb_score || 'N/A'} (${d.imdb_votes || '0'} votes)</span>
                                <span>🎬</span><span>TMDB: ${d.tmdb_score || 'N/A'}</span>
                                <span>⏱️</span><span>${d.runtime || 'N/A'} min</span>
                                <span>🌍</span><span>${d.production_countries || 'N/A'}</span>
                                ${d.seasons ? `<span>📺</span><span>${d.seasons} saisons</span>` : ''}
                            </div>
                            ${d.description ? `<div style="margin-top:8px; padding-top:8px; border-top:1px solid rgba(255,255,255,0.3); font-size:11px; line-height:1.4;">${d.description.substring(0, 200)}${d.description.length > 200 ? '...' : ''}</div>` : ''}
                        `)
                            .style("left", (event.pageX + 15) + "px")
                            .style("top", (event.pageY - 28) + "px");
                    })
                    .on("mouseout", function() {
                        d3.select(this)
                            .attr("fill-opacity", 0.85)
                            .attr("stroke", "#333")
                            .attr("stroke-width", 1)
                            .attr("r", circleRadius);
                        
                        tooltip.transition().duration(200).style("opacity", 0);
                    })
                    .transition()
                    .duration(400)
                    .delay(i * 15)
                    .attr("r", circleRadius);
            }
        });
    }

    function arcVisible(d, p) {
        return d.y1 > d.y0 && d.y0 >= p.y0 && d.x1 > d.x0;
    }

    function labelVisible(d, p) {
        return (d.y0 >= p.y0 && d.y1 <= p.y1) && (d.x1 - d.x0) > 0.03;
    }
}