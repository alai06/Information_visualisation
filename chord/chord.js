// chord.js — responsive + tab-safe version

let globalData = null;
let chordInitialized = false;

function initChord() {
    const containerNode = document.getElementById("chord-chart");
    const width = containerNode.clientWidth || 900;
    const height = containerNode.clientHeight || 700;

    // Prevent negative radii
    const outerRadius = Math.max(0, Math.min(width, height) * 0.5 - 40);
    const innerRadius = Math.max(0, outerRadius - 20);

    // Clean previous SVG (in case of reinit)
    d3.select("#chord-chart").selectAll("*").remove();

    const container = d3.select("#chord-chart")
        .style("display", "flex")
        .style("gap", "20px")
        .style("justify-content", "center")
        .style("align-items", "center");

    const svgContainer = container.append("div")
        .style("flex", "1")
        .style("width", "100%")
        .style("height", "100%");

    const svg = svgContainer.append("svg")
        .attr("viewBox", [-width / 2, -height / 2, width, height])
        .attr("preserveAspectRatio", "xMidYMid meet")
        .style("width", "100%")
        .style("height", "100%");

    const tooltip = d3.select("#chord-chart")
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

    // Load data only once
    const dataPromise = globalData
        ? Promise.resolve(globalData)
        : d3.csv("/data/preprocessed.csv").then(d => {
            globalData = d;
            return d;
        });

    dataPromise.then(data => {
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

            const arcGen = d3.arc()
                .innerRadius(innerRadius)
                .outerRadius(outerRadius);

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
                .attr("class", "group-label")
                .style("font-size", "14px")
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
        }

        // Draw initially
        drawChord();

        // Listen for filter changes
        document.addEventListener("filterChange", e => {
            const { type, selection } = e.detail;
            if (!globalData) return;
            if (selection === "All") drawChord();
            else if (type === "Regions") drawChord([selection]);
            else drawChord(null, [selection]);
        });
    });
}

// 🧭 Only render chord when its tab is visible
$('a[data-toggle="tab"][href="#chorddiagram"]').on('shown.bs.tab', function () {
    if (!chordInitialized) {
        chordInitialized = true;
        initChord();
    }
});
