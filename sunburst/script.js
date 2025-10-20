// --- CONFIGURATION ---
const width = 1000;
const maxRadius = 100;
const csvPath = "/data/titles_update2.csv"; 

// --- CHARGEMENT ET TRAITEMENT DES DONNÉES ---
d3.csv(csvPath).then(data => {
    // 1. STRATIFICATION : Convertir les données tabulaires en hiérarchie D3.
    const root = d3.stratify()
        .path(d => d.age_certification + '/' + d.type + '/' + d.genres)
        .id(d => d.age_certification + '/' + d.type + '/' + d.genre)
        (data);

    // 2. COMPTAGE (Fréquence)
    root.count();

    // Tri pour une visualisation cohérente
    root.sort((a, b) => b.value - a.value);

    // 3. PARTITION : Calculer la disposition radiale
    const partition = d3.partition()
        .size([2 * Math.PI, root.height + 1]);

    const partitionedRoot = partition(root);

    drawSunburst(partitionedRoot);

}).catch(error => {
    console.error("Erreur lors du chargement ou du traitement du CSV:", error);
    d3.select("#sunburst-chart").append("text")
        .text("Erreur : Impossible de charger le CSV ou les données sont invalides. Vérifiez que le fichier existe.")
        .attr("x", 10)
        .attr("y", 20);
});

// --- FONCTION DE DESSIN ---
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

    const svg = d3.select("#sunburst-chart")
        .attr("viewBox", [-width / 2, -width / 2, width, width])
        .style("font", "10px sans-serif");

    // Groupe pour les arcs
    const g = svg.append("g");

    // DESSINER les arcs
    g.selectAll("path")
        .data(root.descendants().filter(d => d.depth))
        .join("path")
        .attr("fill", colorScale)
        .attr("d", arc)
        .attr("fill-opacity", 0.7)
        .on("mouseover", function () {
            d3.select(this).attr("fill-opacity", 1);
        })
        .on("mouseout", function () {
            d3.select(this).attr("fill-opacity", 0.7);
        })
        .append("title")
        .text(d => {
            const path = d.ancestors().map(node => getNodeName(node)).reverse().filter(name => name).join(" > ");
            return `${path}\nOccurrences: ${d.value.toLocaleString()}`;
        });

    // DESSINER les labels (seuil augmenté pour la lisibilité)
    g.selectAll("text")
        .data(root.descendants().filter(d => d.depth > 0 && (d.x1 - d.x0) > 0.06))
        .join("text")
        .attr("transform", d => {
            const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
            const y = (d.y0 + d.y1) / 2 * maxRadius;
            return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
        })
        .attr("dy", "0.35em")
        .attr("fill", "#222")
        .attr("font-size", "14px")
        .attr("text-anchor", "middle")
        .text(getNodeName);
}