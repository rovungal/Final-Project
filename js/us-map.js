const Uwidth = 960;
const Uheight = 600;

const svg1 = d3.select("#us-map")
    .append("svg")
    .attr("width", Uwidth)
    .attr("height", Uheight);

const zoomGroup = svg1.append("g").attr("class", "zoom-layer");

const path1 = d3.geoPath();
const color = d3.scaleSequential(d3.interpolateBlues).domain([30, 100]);

const tooltip1 = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

const projection1 = d3.geoAlbersUsa()
    .scale(1300)
    .translate([Uwidth / 2, Uheight / 2]);

const geoPath = d3.geoPath().projection(projection1);

let urbanData = {};
let statesGeo = null;

// Enable zoom and pan
const zoom = d3.zoom()
    .scaleExtent([1, 8])
    .on("zoom", (event) => {
        zoomGroup.attr("transform", event.transform);
    });

svg1.call(zoom);

// Load CSV and TopoJSON
Promise.all([
    d3.csv("data/urban_data.csv"),
    d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json")
]).then(([data, us]) => {
    // Format urban population data
    data.forEach(row => {
        const state = row["Area Name"];
        urbanData[state] = {
            1970: +row["1970"],
            1980: +row["1980"],
            1990: +row["1990"],
            2000: +row["2000"],
            2010: +row["2010"]
        };
    });

    // Convert TopoJSON to GeoJSON
    statesGeo = topojson.feature(us, us.objects.states).features;

    updateMap(1970);

    // Setup slider
    d3.select("#usYearSlider").on("input", function () {
        const year = +this.value;
        d3.select("#usYearLabel").text(year);
        updateMap(year);
    });

    // Improved and repositioned legend
    const legendWidth = 300;
    const legendHeight = 20;

    const defs = svg1.append("defs");

    const linearGradient = defs.append("linearGradient")
        .attr("id", "us-legend-gradient");

    linearGradient.selectAll("stop")
        .data(d3.range(0, 1.01, 0.01))
        .enter()
        .append("stop")
        .attr("offset", d => `${d * 100}%`)
        .attr("stop-color", d => color(30 + d * 70));

    const legendGroup = svg1.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${Uwidth / 2 - legendWidth / 2}, 20)`);

    legendGroup.append("text")
        .attr("x", legendWidth / 2)
        .attr("y", -6)
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .attr("fill", "#333")
        .text("Urban Population (%)");

    legendGroup.append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#us-legend-gradient)")
        .style("stroke", "#ccc");

    const legendScale = d3.scaleLinear()
        .domain([30, 100])
        .range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale)
        .tickValues([30, 50, 75, 100])
        .tickSize(6)
        .tickFormat(d => `${d}%`);

    legendGroup.append("g")
        .attr("transform", `translate(0, ${legendHeight})`)
        .call(legendAxis)
        .selectAll("text")
        .style("font-size", "12px")
        .style("fill", "#333");
});

// Draw the map for a given year
function updateMap(year) {
    zoomGroup.selectAll("path").remove();

    zoomGroup.selectAll("path")
        .data(statesGeo)
        .enter()
        .append("path")
        .attr("d", geoPath)
        .attr("fill", d => {
            const stateName = nameFromId(d.id);
            const value = urbanData[stateName]?.[year];
            return value !== undefined ? color(value) : "#ccc";
        })
        .on("mouseover", (event, d) => {
            const stateName = nameFromId(d.id);
            const value = urbanData[stateName]?.[year];
            tooltip1.transition().duration(200).style("opacity", 0.9);
            tooltip1.html(`<strong>${stateName}</strong><br>${year}: ${value ?? "N/A"}%`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => {
            tooltip1.transition().duration(500).style("opacity", 0);
        });
}

// Mapping from state ID (from GeoJSON) to name
function nameFromId(id) {
    const idMap = {
        "01": "Alabama", "02": "Alaska", "04": "Arizona", "05": "Arkansas", "06": "California",
        "08": "Colorado", "09": "Connecticut", "10": "Delaware", "11": "District of Columbia",
        "12": "Florida", "13": "Georgia", "15": "Hawaii", "16": "Idaho", "17": "Illinois",
        "18": "Indiana", "19": "Iowa", "20": "Kansas", "21": "Kentucky", "22": "Louisiana",
        "23": "Maine", "24": "Maryland", "25": "Massachusetts", "26": "Michigan", "27": "Minnesota",
        "28": "Mississippi", "29": "Missouri", "30": "Montana", "31": "Nebraska", "32": "Nevada",
        "33": "New Hampshire", "34": "New Jersey", "35": "New Mexico", "36": "New York",
        "37": "North Carolina", "38": "North Dakota", "39": "Ohio", "40": "Oklahoma",
        "41": "Oregon", "42": "Pennsylvania", "44": "Rhode Island", "45": "South Carolina",
        "46": "South Dakota", "47": "Tennessee", "48": "Texas", "49": "Utah", "50": "Vermont",
        "51": "Virginia", "53": "Washington", "54": "West Virginia", "55": "Wisconsin", "56": "Wyoming"
    };
    return idMap[id.padStart(2, "0")];
}