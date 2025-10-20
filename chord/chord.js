const width = 900;
const height = 700;
const outerRadius = Math.min(width, height) * 0.5 - 40;
const innerRadius = outerRadius - 20;

const container = d3.select("#chart")
    .style("display", "flex")
    .style("gap", "20px");

const sidebar = container.append("div")
    .attr("id", "sidebar")
    .style("width", "200px")
    .style("font-family", "sans-serif");

sidebar.append("h3").text("Filter").style("margin-bottom", "10px");

const menu = sidebar.append("select")
    .attr("id", "filter-type")
    .style("width", "100%")
    .style("padding", "6px");

menu.selectAll("option")
    .data(["Genres", "Regions"])
    .enter()
    .append("option")
    .text(d => d);

const subMenuContainer = sidebar.append("div").attr("id", "sub-menu");

const svgContainer = container.append("div")
    .style("flex", "1");

const svg = svgContainer.append("svg")
    .attr("viewBox", [-width / 2, -height / 2, width, height]);

const movieList = container.append("div")
    .attr("id", "movie-list")
    .style("width", "300px")
    .style("max-height", "700px")
    .style("overflow-y", "auto")
    .style("font-family", "sans-serif")
    .style("border-left", "1px solid #ccc")
    .style("padding-left", "15px");

movieList.append("h3")
    .text("Movies")
    .style("position", "sticky")
    .style("top", "0")
    .style("background", "white")
    .style("margin", "0 0 10px 0")
    .style("padding", "10px 0");

const movieContainer = movieList.append("div")
    .attr("id", "movie-container");

const tooltip = d3.select("#chart")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background", "rgba(0,0,0,0.8)")
    .style("color", "white")
    .style("padding", "6px 10px")
    .style("border-radius", "8px")
    .style("pointer-events", "none")
    .style("font-size", "14px")
    .style("visibility", "hidden");

const g = svg.append("g");

d3.csv("/data/preprocessed.csv").then(data => {
    const genreSet = new Set();
    const regionSet = new Set();

    data.forEach(d => {
        const rawGenres = (d.genres || "").replace(/[\[\]"']/g, "").trim();
        const genres = rawGenres.split(",").map(g => g.trim()).filter(Boolean);
        genres.forEach(g => genreSet.add(g));

        const rawRegions = (d.regions || "").replace(/[\[\]"']/g, "").trim();
        const regions = rawRegions.split(",").map(r => r.trim()).filter(Boolean);
        regions.forEach(r => regionSet.add(r));
    });

    const genreList = Array.from(genreSet);
    const regionList = Array.from(regionSet);

    const G = genreList.length;
    const R = regionList.length;
    const names = genreList.concat(regionList);
    const n = G + R;

    const matrix = Array.from({ length: n }, () => Array.from({ length: n }, () => 0));
    const genreIndex = new Map(genreList.map((g, i) => [g, i]));
    const regionIndex = new Map(regionList.map((r, i) => [r, i]));

    data.forEach(d => {
        const rawGenres = (d.genres || "").replace(/[\[\]"']/g, "").trim();
        const genres = rawGenres.split(",").map(g => g.trim()).filter(Boolean);

        const rawRegions = (d.regions || "").replace(/[\[\]"']/g, "").trim();
        const regions = rawRegions.split(",").map(r => r.trim()).filter(Boolean);

        genres.forEach(g => {
            const gi = genreIndex.get(g);
            if (gi === undefined) return;

            regions.forEach(r => {
                const ri = regionIndex.get(r);
                if (ri === undefined) return;
                matrix[gi][G + ri] += 1;
                matrix[G + ri][gi] += 1;
            });
        });
    });

    const genreColor = d3.scaleLinear()
        .domain([0, G - 1])
        .range(["#ff0000ff", "#9900ffff"])
        .interpolate(d3.interpolateRgb);

    const regionColor = d3.scaleLinear()
        .domain([0, R - 1])
        .range(["#2bff00ff", "#005effff"])
        .interpolate(d3.interpolateRgb);

    const color = i => (i < G ? genreColor(i) : regionColor(i - G));

    const chordLayout = d3.chord().padAngle(0.02).sortSubgroups(d3.descending);

    function updateMovieList(filteredRegions = null, filteredGenres = null) {
        const filteredData = data.filter(d => {
            const rawGenres = (d.genres || "").replace(/[\[\]"']/g, "").trim();
            const genres = rawGenres.split(",").map(g => g.trim()).filter(Boolean);

            const rawRegions = (d.regions || "").replace(/[\[\]"']/g, "").trim();
            const regions = rawRegions.split(",").map(r => r.trim()).filter(Boolean);

            const genreMatch = !filteredGenres || filteredGenres.some(fg => genres.includes(fg));
            const regionMatch = !filteredRegions || filteredRegions.some(fr => regions.includes(fr));

            return genreMatch && regionMatch;
        });

        movieContainer.html("");

        const movieCount = movieContainer.append("p")
            .style("font-size", "14px")
            .style("color", "#666")
            .style("margin-bottom", "10px")
            .text(`${filteredData.length} movies found`);

        filteredData.forEach(movie => {
            const movieCard = movieContainer.append("div")
                .style("margin-bottom", "15px")
                .style("padding", "10px")
                .style("border", "1px solid #e0e0e0")
                .style("border-radius", "4px")
                .style("background", "#f9f9f9");

            Object.keys(movie).forEach(key => {
                if (movie[key]) {
                    const row = movieCard.append("div")
                        .style("margin-bottom", "5px")
                        .style("font-size", "13px");

                    row.append("strong")
                        .text(key + ": ")
                        .style("color", "#333");

                    row.append("span")
                        .text(movie[key])
                        .style("color", "#666");
                }
            });
        });
    }

    function drawChord(filteredRegions = null, filteredGenres = null) {
        g.selectAll("*").remove();

        const includedRegionIndices = filteredRegions
            ? filteredRegions.map(r => G + regionIndex.get(r))
            : regionList.map(r => G + regionIndex.get(r));

        const includedGenreIndices = filteredGenres
            ? filteredGenres.map(g => genreIndex.get(g))
            : Array.from({ length: G }, (_, i) => i);

        const includedIndices = [...new Set([...includedGenreIndices, ...includedRegionIndices])];

        const filteredMatrix = includedIndices.map(i =>
            includedIndices.map(j => matrix[i][j])
        );

        const filteredChord = chordLayout(filteredMatrix);
        const filteredNames = includedIndices.map(i => names[i]);

        const groups = g.append("g")
            .selectAll("g")
            .data(filteredChord.groups)
            .join("g");

        groups.append("path")
            .attr("fill", d => color(includedIndices[d.index]))
            .attr("stroke", d => d3.rgb(color(includedIndices[d.index])).darker())
            .attr("d", d3.arc().innerRadius(innerRadius).outerRadius(outerRadius));

        groups.append("text")
            .each(d => { d.angle = (d.startAngle + d.endAngle) / 2; })
            .attr("dy", "0.35em")
            .attr("transform", d => `
                      rotate(${(d.angle * 180 / Math.PI - 90)})
                      translate(${outerRadius + 6})
                      ${d.angle > Math.PI ? "rotate(180)" : ""}
                    `)
            .attr("text-anchor", d => d.angle > Math.PI ? "end" : null)
            .attr("class", "group-label")
            .style("font-size", "16px")
            .text(d => filteredNames[d.index]);

        const ribbons = g.append("g")
            .attr("fill-opacity", 0.75)
            .selectAll("path")
            .data(filteredChord)
            .join("path")
            .attr("d", d3.ribbon().radius(innerRadius))
            .attr("fill", d => {
                if (filteredGenres && filteredGenres.length > 0) {
                    return color(includedIndices[d.target.index]);
                }
                return color(includedIndices[d.source.index]);
            })
            .attr("stroke", d => {
                if (filteredGenres && filteredGenres.length > 0) {
                    return d3.rgb(color(includedIndices[d.target.index])).darker();
                }
                return d3.rgb(color(includedIndices[d.source.index])).darker();
            });


        ribbons
            .on("mouseover", function (event, d) {
                g.selectAll("path").filter(p => p !== d).transition().style("opacity", 0.1);
                const sourceName = filteredNames[d.source.index];
                const targetName = filteredNames[d.target.index];
                const value = d.source.value;
                tooltip
                    .style("visibility", "visible")
                    .html(`<strong>${sourceName}</strong> ↔ <strong>${targetName}</strong><br>Occurrences: ${value}`);
            })
            .on("mousemove", event => {
                tooltip.style("top", (event.pageY - 40) + "px")
                    .style("left", (event.pageX + 15) + "px");
            })
            .on("mouseout", function () {
                g.selectAll("path").transition().style("opacity", 1);
                tooltip.style("visibility", "hidden");
            });

        //updateMovieList(filteredRegions, filteredGenres);
    }

    drawChord();

    function updateSubMenu(type) {
        subMenuContainer.html("");
        if (type === "Regions") {
            subMenuContainer.append("h4").text("Select Region:");
            const regionMenu = subMenuContainer.append("select")
                .attr("id", "region-select")
                .style("width", "100%")
                .style("padding", "6px");

            regionMenu.selectAll("option")
                .data(["All"].concat(regionList))
                .enter()
                .append("option")
                .text(d => d);

            regionMenu.on("change", function () {
                const selected = this.value;
                if (selected === "All") drawChord();
                else drawChord([selected]);
            });
        } else if (type === "Genres") {
            subMenuContainer.append("h4").text("Select Genre:");
            const genreMenu = subMenuContainer.append("select")
                .attr("id", "genre-select")
                .style("width", "100%")
                .style("padding", "6px");

            genreMenu.selectAll("option")
                .data(["All"].concat(genreList))
                .enter()
                .append("option")
                .text(d => d);

            genreMenu.on("change", function () {
                const selected = this.value;
                if (selected === "All") drawChord();
                else drawChord(null, [selected]);
            });
        }
    }

    menu.on("change", function () {
        updateSubMenu(this.value);
    });

    updateSubMenu("Genres");
});
