let chordInitialized = false;

function initChord() {
    if (!globalData) {
        const listener = setInterval(() => { if (globalData) { clearInterval(listener); initChord(); } }, 200);
        return;
    }

    const containerNode = document.getElementById("chord-chart");
    const width = containerNode.clientWidth || 900;
    const height = containerNode.clientHeight || 700;
    const outerRadius = Math.max(0, Math.min(width, height) * 0.45 - 40);
    const innerRadius = Math.max(0, outerRadius - 20);

    d3.select("#chord-chart").selectAll("*").remove();

    const svg = d3.select("#chord-chart")
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("viewBox", [-width / 2, -height / 2, width, height])
        .attr("preserveAspectRatio", "xMidYMid meet");

    const tooltip = d3.select("#chord-chart").append("div")
        .attr("class", "tooltip")
        .style("visibility", "hidden")
        .style("position", "absolute")
        .style("background", "rgba(0,0,0,0.8)")
        .style("color", "white")
        .style("padding", "6px 10px")
        .style("border-radius", "8px")
        .style("pointer-events", "none")
        .style("font-size", "14px");

    const g = svg.append("g");

    const genreList = globalGenres;
    const regionList = globalRegions;
    const G = genreList.length;
    const R = regionList.length;
    const names = genreList.concat(regionList);
    const n = G + R;

    const matrix = Array.from({ length: n }, () => Array.from({ length: n }, () => 0));
    const genreIndex = new Map(genreList.map((g, i) => [g, i]));
    const regionIndex = new Map(regionList.map((r, i) => [r, i]));
    const movieMap = new Map();

    globalData.forEach(d => {
        const genres = (d.genres || "").replace(/[\[\]"']/g, "").split(",").map(g => g.trim()).filter(Boolean);
        const regions = (d.regions || "").replace(/[\[\]"']/g, "").split(",").map(r => r.trim()).filter(Boolean);
        genres.forEach(g => {
            const gi = genreIndex.get(g);
            if (gi === undefined) return;
            regions.forEach(r => {
                const ri = regionIndex.get(r);
                if (ri === undefined) return;

                matrix[gi][G + ri] += 1;
                matrix[G + ri][gi] += 1;

                const key = `${g}|||${r}`;
                if (!movieMap.has(key)) movieMap.set(key, []);
                movieMap.get(key).push(d.title || d.movie || "Titre inconnu");
            });
        });
    });

    const genreColor = d3.scaleLinear().domain([0, G - 1]).range(["#ff0000", "#9900ff"]);
    const regionColor = d3.scaleLinear().domain([0, R - 1]).range(["#2bff00", "#005eff"]);
    const color = i => (i < G ? genreColor(i) : regionColor(i - G));

    const chordLayout = d3.chord().padAngle(0.02).sortSubgroups(d3.descending);

    function drawChord(selectedRegions, selectedGenres, selectedYearRange) {
        g.selectAll("*").remove();

        const filteredData = globalData.filter(d => {
            const y = +d.release_year;
            return y >= selectedYearRange[0] && y <= selectedYearRange[1];
        });

        const includedGenreIndices = selectedGenres && !selectedGenres.includes("All")
            ? selectedGenres.map(g => genreIndex.get(g))
            : Array.from({ length: G }, (_, i) => i);
        const includedRegionIndices = selectedRegions && !selectedRegions.includes("All")
            ? selectedRegions.map(r => G + regionIndex.get(r))
            : regionList.map(r => G + regionIndex.get(r));

        const includedIndices = [...new Set([...includedGenreIndices, ...includedRegionIndices])];
        const filteredNames = includedIndices.map(i => names[i]);

        const filteredMatrix = Array.from({ length: includedIndices.length }, () => Array.from({ length: includedIndices.length }, () => 0));
        const filteredMovieMap = new Map();

        filteredData.forEach(d => {
            const genres = (d.genres || "").replace(/[\[\]"']/g, "").split(",").map(g => g.trim()).filter(Boolean);
            const regions = (d.regions || "").replace(/[\[\]"']/g, "").split(",").map(r => r.trim()).filter(Boolean);
            genres.forEach(g => {
                const gi = genreIndex.get(g);
                if (!includedGenreIndices.includes(gi)) return;
                regions.forEach(r => {
                    const ri = regionIndex.get(r) + G;
                    if (!includedRegionIndices.includes(ri)) return;

                    const fi = includedIndices.indexOf(gi);
                    const fj = includedIndices.indexOf(ri);
                    filteredMatrix[fi][fj] += 1;
                    filteredMatrix[fj][fi] += 1;

                    const key = `${g}|||${r}`;
                    if (!filteredMovieMap.has(key)) filteredMovieMap.set(key, []);
                    filteredMovieMap.get(key).push(d.title || d.movie || "Titre inconnu");
                });
            });
        });

        const chord = chordLayout(filteredMatrix);
        const groups = g.append("g").selectAll("g").data(chord.groups).join("g");
        const arcGen = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius);

        groups.append("path")
            .attr("fill", d => color(includedIndices[d.index]))
            .attr("stroke", d => d3.rgb(color(includedIndices[d.index])).darker())
            .attr("d", arcGen);

        groups.append("text")
            .each(d => { d.angle = (d.startAngle + d.endAngle) / 2; })
            .attr("dy", "0.35em")
            .attr("transform", d => `
                rotate(${(d.angle * 180 / Math.PI - 90)})
                translate(${outerRadius + 6})
                ${d.angle > Math.PI ? "rotate(180)" : ""}
            `)
            .attr("text-anchor", d => d.angle > Math.PI ? "end" : null)
            .style("font-size", "13px")
            .text(d => filteredNames[d.index]);

        const colorBy = includedGenreIndices.length >= includedRegionIndices.length ? "genre" : "region";

        const ribbons = g.append("g")
            .attr("fill-opacity", 0.75)
            .selectAll("path")
            .data(chord)
            .join("path")
            .attr("d", d3.ribbon().radius(innerRadius))
            .attr("fill", d => colorBy === "genre" ? color(includedIndices[d.source.index]) : color(includedIndices[d.target.index]))
            .attr("stroke", d => colorBy === "genre" ? d3.rgb(color(includedIndices[d.source.index])).darker() : d3.rgb(color(includedIndices[d.target.index])).darker());

        ribbons
            .on("mouseover", function(event, d) {
                g.selectAll("path").filter(p => p !== d).transition().style("opacity", 0.1);
                tooltip.style("visibility", "visible")
                    .html(`<strong>${filteredNames[d.source.index]}</strong> ↔ <strong>${filteredNames[d.target.index]}</strong><br>Occurrences: ${d.source.value}`);
            })
            .on("mousemove", event => {
                tooltip.style("top", (event.pageY - 40) + "px").style("left", (event.pageX + 15) + "px");
            })
            .on("mouseout", function() {
                g.selectAll("path").transition().style("opacity", 1);
                tooltip.style("visibility", "hidden");
            })
            .on("click", function(event, d) {
                const sourceName = filteredNames[d.source.index];
                const targetName = filteredNames[d.target.index];
                let genre, region;
                if (genreList.includes(sourceName)) { genre = sourceName; region = targetName; } else { genre = targetName; region = sourceName; }
                const key = `${genre}|||${region}`;
                const movies = filteredMovieMap.get(key) || [];

                const movieItems = d3.select("#movie-items");
                movieItems.html("");
                movieItems.append("li").style("font-weight", "bold").text(`Occurrences: ${d.source.value}`);
                if (movies.length === 0) movieItems.append("li").text("Aucun film trouvé");
                else movies.forEach(m => movieItems.append("li").text(m));
            });
    }

    drawChord(null, null, currentYearSelection);

    document.addEventListener("filterChange", e => {
        const { genres, regions, yearRange } = e.detail;
        drawChord(regions, genres, yearRange);
    });
}

$('a[data-toggle="tab"][href="#chorddiagram"]').on('shown.bs.tab', function () {
    if (!chordInitialized) {
        chordInitialized = true;
        initChord();
    }
});
