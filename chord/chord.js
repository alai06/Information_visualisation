const width = 900;
const height = 700;
const outerRadius = Math.min(width, height) * 0.5 - 40;
const innerRadius = outerRadius - 20;

const svg = d3.select("#chart")
    .append("svg")
    .attr("viewBox", [-width / 2, -height / 2, width, height]);

d3.csv("titles.csv").then(data => {
    const ageList = Array.from(new Set(data.map(d => (d.age_certification || "").trim()).filter(Boolean)));

    const regionMap = {
        US: "North America", CA: "North America", MX: "North America", PR: "North America",

        BR: "South America", AR: "South America", CL: "South America", CO: "South America", PE: "South America",

        GB: "Europe", FR: "Europe", DE: "Europe", IT: "Europe", ES: "Europe", NL: "Europe", SE: "Europe", NO: "Europe", PL: "Europe",
        CZ: "Europe", GR: "Europe", AT: "Europe", DK: "Europe", CH: "Europe", BE: "Europe", RO: "Europe", PT: "Europe", LU: "Europe",
        HU: "Europe", IS: "Europe", IE: "Europe", MT: "Europe", BG: "Europe", RU: "Europe", FI: "Europe", UA: "Europe", BY: "Europe",
        HR: "Europe", VA: "Europe", MC: "Europe", CY: "Europe", LT: "Europe", AL: "Europe", RS: "Europe",

        CN: "Asia", JP: "Asia", KR: "Asia", IN: "Asia", SG: "Asia", TH: "Asia", TW: "Asia", PH: "Asia", HK: "Asia", ID: "Asia",
        MY: "Asia", KH: "Asia", PK: "Asia",

        AE: "Middle East", SA: "Middle East", LB: "Middle East", IR: "Middle East", IL: "Middle East", TR: "Middle East",
        JO: "Middle East", QA: "Middle East", KW: "Middle East", SY: "Middle East", PS: "Middle East",

        ZA: "Africa", NG: "Africa", EG: "Africa", KE: "Africa", SN: "Africa", MA: "Africa", TN: "Africa", GH: "Africa", ZW: "Africa",

        AU: "Oceania", NZ: "Oceania",

        KN: "Other", MU: "Other", XX: "Other"
    };


    const regionSet = new Set();
    data.forEach(d => {
        const raw = d.production_countries || "";
        const matches = raw.match(/[A-Z]{2}/g) || [];
        matches.forEach(code => {
            const region = regionMap[code] || "Other";
            regionSet.add(region);
        });
    });
    const regionList = Array.from(regionSet);

    const A = ageList.length;
    const R = regionList.length;
    const names = ageList.concat(regionList);
    const n = A + R;

    const matrix = Array.from({ length: n }, () => Array.from({ length: n }, () => 0));
    const ageIndex = new Map(ageList.map((a, i) => [a, i]));
    const regionIndex = new Map(regionList.map((r, i) => [r, i]));

    data.forEach(d => {
        const a = (d.age_certification || "").trim();
        if (!a) return;
        const ai = ageIndex.get(a);
        if (ai === undefined) return;

        const raw = d.production_countries || "";
        const matches = raw.match(/[A-Z]{2}/g) || [];
        matches.forEach(code => {
            const region = regionMap[code];
            if (!region) console.log(code);
            const r = region || "Other";
            const ri = regionIndex.get(r);
            if (ri === undefined) return;
            matrix[ai][A + ri] += 1;
            matrix[A + ri][ai] += 1;
        });

    });

    const chord = d3.chord()
        .padAngle(0.02)
        .sortSubgroups(d3.descending);

    const chords = chord(matrix);

    const color = d3.scaleOrdinal(d3.schemeCategory10).domain(d3.range(n));

    const g = svg.append("g");

    const group = g.append("g")
        .selectAll("g")
        .data(chords.groups)
        .join("g");

    group.append("path")
        .attr("fill", d => color(d.index))
        .attr("stroke", d => d3.rgb(color(d.index)).darker())
        .attr("d", d3.arc().innerRadius(innerRadius).outerRadius(outerRadius));

    group.append("text")
        .each(d => { d.angle = (d.startAngle + d.endAngle) / 2; })
        .attr("dy", "0.35em")
        .attr("transform", d => `
      rotate(${(d.angle * 180 / Math.PI - 90)})
      translate(${outerRadius + 6})
      ${d.angle > Math.PI ? "rotate(180)" : ""}
    `)
        .attr("text-anchor", d => d.angle > Math.PI ? "end" : null)
        .attr("class", "group-label")
        .text(d => names[d.index]);

    g.append("g")
        .attr("fill-opacity", 0.75)
        .selectAll("path")
        .data(chords)
        .join("path")
        .attr("d", d3.ribbon().radius(innerRadius))
        .attr("fill", d => color(d.target.index))
        .attr("stroke", d => d3.rgb(color(d.target.index)).darker())
        .on("mouseover", function (event, d) {
            g.selectAll("path")
                .filter(p => p !== d)
                .transition()
                .style("opacity", 0.1);
        })
        .on("mouseout", function () {
            g.selectAll("path")
                .transition()
                .style("opacity", 1);
        });
});
