let currentFilterType = "Genres";
let currentSelection = "All";

const filterTypeSelect = d3.select("#filter-type");
const subMenuContainer = d3.select("#sub-menu");

function updateSubMenu(type) {
  subMenuContainer.html("");
  if (type === "Regions") {
    subMenuContainer.append("label").text("Sélectionnez une région : ");
    const regionMenu = subMenuContainer.append("select")
      .attr("id", "region-select")
      .attr("class", "form-control")
      .on("change", function() {
        currentSelection = this.value;
        document.dispatchEvent(new CustomEvent("filterChange", { detail: getCurrentFilter() }));
      });

    regionMenu.selectAll("option")
      .data(["All"])
      .enter().append("option").text(d => d);
  } else if (type === "Genres") {
    subMenuContainer.append("label").text("Sélectionnez un genre : ");
    const genreMenu = subMenuContainer.append("select")
      .attr("id", "genre-select")
      .attr("class", "form-control")
      .on("change", function() {
        currentSelection = this.value;
        document.dispatchEvent(new CustomEvent("filterChange", { detail: getCurrentFilter() }));
      });

    genreMenu.selectAll("option")
      .data(["All"])
      .enter().append("option").text(d => d);
  }
}

function getCurrentFilter() {
  return { type: currentFilterType, selection: currentSelection };
}

filterTypeSelect.on("change", function() {
  currentFilterType = this.value;
  updateSubMenu(currentFilterType);
  document.dispatchEvent(new CustomEvent("filterChange", { detail: getCurrentFilter() }));
});

updateSubMenu("Genres");
