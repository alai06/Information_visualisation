let globalData = null;
let globalGenres = [];
let globalRegions = [];
let currentGenreSelection = ["All"];
let currentRegionSelection = ["All"];
let currentYearSelection = [2000, 2025];

const subMenuContainer = d3.select("#sub-menu");

d3.csv("/data/preprocessed.csv").then(data => {
    globalData = data;

    const genreSet = new Set();
    const regionSet = new Set();
    const years = [];

    data.forEach(d => {
        const rawGenres = (d.genres || "").replace(/[\[\]"']/g, "").trim();
        const genres = rawGenres.split(",").map(g => g.trim()).filter(Boolean);
        genres.forEach(g => genreSet.add(g));

        const rawRegions = (d.regions || "").replace(/[\[\]"']/g, "").trim();
        const regions = rawRegions.split(",").map(r => r.trim()).filter(Boolean);
        regions.forEach(r => regionSet.add(r));

        const year = +d.release_year;
        if (!isNaN(year)) years.push(year);
    });

    globalGenres = Array.from(genreSet).sort();
    globalRegions = Array.from(regionSet).sort();

    // Render checkboxes
    renderCheckboxLine("Genres", globalGenres, currentGenreSelection);
    renderCheckboxLine("Regions", globalRegions, currentRegionSelection);

    // Initialize slider
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    currentYearSelection = [minYear, maxYear];

    const yearSlider = document.getElementById("year-slider");
    const yearLabel = d3.select("#year-range-label");

    noUiSlider.create(yearSlider, {
        start: [minYear, maxYear],
        connect: true,
        step: 1,
        range: { min: minYear, max: maxYear },
        tooltips: true,
        format: { to: v => Math.round(v), from: v => Number(v) }
    });

    // Update label
    yearLabel.text(`${currentYearSelection[0]} - ${currentYearSelection[1]}`);

    // Slider events
    yearSlider.noUiSlider.on('update', (values) => {
        currentYearSelection = values.map(v => +v);
        yearLabel.text(`${currentYearSelection[0]} - ${currentYearSelection[1]}`);
    });

    yearSlider.noUiSlider.on('change', () => {
        dispatchFilterChange();
    });

    // Ensure the initial filter uses the slider value
    currentYearSelection = yearSlider.noUiSlider.get().map(v => +v);
    dispatchFilterChange();
});

function renderCheckboxLine(type, items, selection) {
    subMenuContainer.append("label").attr("class", "font-weight-bold d-block mt-2 mb-1").text(type);

    const container = subMenuContainer.append("div").attr("class", "d-flex flex-wrap mb-2").style("gap", "10px");
    const allItems = ["All"].concat(items);

    const checkboxes = container.selectAll("div.checkbox-item").data(allItems).enter().append("div").attr("class", "checkbox-item form-check");

    checkboxes.append("input")
        .attr("type", "checkbox")
        .attr("class", "form-check-input")
        .attr("id", d => `chk-${type}-${d}`)
        .attr("value", d => d)
        .property("checked", d => selection.includes(d))
        .on("change", function(event, d) {
            if (type === "Genres") handleSelectionChange(d, this.checked, currentGenreSelection, globalGenres, type);
            else handleSelectionChange(d, this.checked, currentRegionSelection, globalRegions, type);
            dispatchFilterChange();
        });

    checkboxes.append("label")
        .attr("class", "form-check-label")
        .attr("for", d => `chk-${type}-${d}`)
        .text(d => d);
}

function handleSelectionChange(item, checked, selectionArray, allItemsArray, type) {
    if (item === "All") {
        if (checked) {
            selectionArray.length = 0; selectionArray.push("All");
            allItemsArray.forEach(i => { if (i !== "All") d3.select(`#chk-${type}-${i}`).property("checked", false); });
        } else selectionArray.length = 0;
    } else {
        selectionArray = selectionArray.filter(x => x !== "All");
        if (checked) selectionArray.push(item);
        else selectionArray = selectionArray.filter(x => x !== item);
        if (selectionArray.length === 0) selectionArray.push("All");
    }

    allItemsArray.concat(["All"]).forEach(i => {
        d3.select(`#chk-${type}-${i}`).property("checked", selectionArray.includes(i));
    });

    if (type === "Genres") currentGenreSelection = selectionArray;
    else currentRegionSelection = selectionArray;
}

function dispatchFilterChange() {
    document.dispatchEvent(new CustomEvent("filterChange", {
        detail: {
            genres: currentGenreSelection,
            regions: currentRegionSelection,
            yearRange: currentYearSelection
        }
    }));
}
