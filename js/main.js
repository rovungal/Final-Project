const svg = d3.select("#map");
const width = 960;
const height = 600;

const projection = d3.geoNaturalEarth1().scale(160).translate([width / 2, height / 2]);
const path = d3.geoPath(projection);

const colorScale = d3.scaleDiverging()
  .domain([-2, 0, 10])
  .interpolator(d3.interpolateRdBu);

const yearSlider = d3.select("#yearSlider");
const yearValueDisplay = d3.select("#yearValue");
const tooltip = d3.select("#tooltip");
const yearAnnotation = d3.select("#yearAnnotation");

let year = "1961";

// 🔎 Year-based notes
const annotations = {
  "1961": "Post-colonial independence movements in Africa and Asia drove urban migration as new governments invested in cities.",
  "1973": "The global oil crisis disrupted economies, especially in developing nations, slowing urban development and investment.",
  "1975": "The Khmer Rouge seized control of Cambodia, leading to a genocide that killed an estimated 1.7 million people. Cities were emptied as people were forced into rural labor camps.",
  "1978": "China began its economic reforms and 'Open Door Policy', accelerating urbanization through rapid industrial development and rural-to-urban migration.",
  "1980": "Structural Adjustment Programs from the IMF and World Bank led to austerity measures in Latin America and Africa, reducing urban infrastructure growth.",
  "1989": "The fall of the Berlin Wall marked a shift in Eastern Europe, leading to economic restructuring and significant rural depopulation in favor of urban centers.",
  "1991": "The fall of the Soviet Union caused major shifts in Eastern Europe and Central Asia. Urban areas declined due to economic collapse and industrial slowdown.",
  "1992": "Following the breakup of Yugoslavia, the Bosnian War began. The Siege of Sarajevo and ethnic cleansing campaigns led to mass displacement and long-term urban decline.",
  "1994": "The Rwandan Genocide and regional conflict led to massive rural displacement, altering urban growth in Central Africa. South Africa held its first democratic election, initiating post-apartheid policies that affected urban migration and access to city infrastructure.",
  "1997": "The Asian Financial Crisis hit many Southeast Asian countries, slowing urban investment and halting infrastructure growth in cities like Jakarta, Bangkok, and Manila.",
  "1998": "A downward trend in Kazakhstan due to an unfair presidential campaign and persecution of the opposition. The country also faced challenges related to human rights, including discrimination in favor of ethnic Kazakhs and limitations on worker rights.",
  "2001": "9/11 caused a short-term freeze in global economic activity and urban investment, especially in the U.S. and Western Europe. China joined the World Trade Organization (WTO), boosting urban export hubs and accelerating migration into industrial cities like Shenzhen and Guangzhou.",
  "2003": "The conflict in Darfur, Sudan escalated into a genocide, with large-scale displacement from rural areas and overburdening of urban centers like Nyala and Khartoum.",
  "2008": "The global financial crisis halted many urban development projects, particularly in emerging economies like Brazil, India, and parts of Eastern Europe. Housing and development slumped in urban areas across the U.S. and Spain.",
  "2010": "The Haiti earthquake devastated Port-au-Prince, causing massive urban displacement and long-term impact on city growth.",
  "2011": "The Arab Spring sparked conflicts in Syria, Libya, and beyond, reversing urban growth in several Middle Eastern and North African countries.",
  "2015": "Refugee influxes into European and Middle Eastern cities due to conflicts in Syria and Afghanistan spurred rapid urban demographic shifts. Cities like Berlin and Athens faced intense infrastructure strain.",
  "2017": "The Myanmar military's persecution of the Rohingya led to over 700,000 refugees fleeing to Bangladesh. Northern Myanmar's urban population was severely affected by the loss of an entire ethnic group.",
  "2020": "COVID-19 disrupted urban life worldwide. Migration to cities slowed due to lockdowns, economic uncertainty, and rising remote work trends. Some urban residents relocated to rural areas.",
  "2022": "Russia's invasion of Ukraine reversed urbanization trends as war damaged infrastructure and displaced millions from cities.",
  "2023": "Post-COVID recovery resumed in many cities, but urban growth was uneven due to inflation, climate impacts, and geopolitical tensions."
};


Promise.all([
  d3.json("data/countries-50m.json"),
  d3.csv("data/urban_pop_growth_annual_percentage.csv"),
  d3.json("data/iso_numeric_to_alpha3.json")
]).then(([world, csvData, isoMap]) => {
  const countries = topojson.feature(world, world.objects.countries).features;

  const validAlpha3 = new Set(Object.values(isoMap));
  csvData = csvData.filter(d => validAlpha3.has(d["Country Code"]));

  const dataMap = new Map();
  csvData.forEach(d => {
    const values = {};
    for (let y = 1961; y <= 2023; y++) {
      values[y] = parseFloat(d[y]) || null;
    }
    dataMap.set(d["Country Code"], {
      name: d["Country Name"],
      values: values
    });
  });

  svg.attr("viewBox", [0, 0, width, height]);

  const zoom = d3.zoom()
    .scaleExtent([1, 8])
    .on("zoom", (event) => {
      map.attr("transform", event.transform);
    });

  svg.call(zoom);

  const map = svg.append("g");
  const countryPaths = map.selectAll("path")
    .data(countries)
    .join("path")
    .attr("d", path)
    .attr("stroke", "#ccc")
    .attr("fill", d => getColor(d.id, year))
    .on("mouseover", function (event, d) {
      const iso3 = isoMap[parseInt(d.id)];
      const entry = dataMap.get(iso3);
      if (!entry) return;

      const value = entry.values[year];

      tooltip
        .style("display", "block")
        .html(
          `<strong>Country:</strong> ${entry.name}<br/>
           <strong>POG:</strong> ${value != null ? value.toFixed(2) + "%" : "No data"}`
        )
        .style("left", (event.pageX + 15) + "px")
        .style("top", (event.pageY - 40) + "px");

      d3.select(this)
        .style("stroke", "black")
        .style("stroke-width", "2px");
    })
    .on("mousemove", function (event) {
      tooltip
        .style("left", (event.pageX + 15) + "px")
        .style("top", (event.pageY - 40) + "px");
    })
    .on("mouseout", function () {
      tooltip.style("display", "none");
      d3.select(this)
        .style("stroke", "#ccc")
        .style("stroke-width", "1px");
    });

  function updateMap(selectedYear) {
    countryPaths.transition().duration(300)
      .attr("fill", d => getColor(d.id, selectedYear));
  }

  function updateAnnotation(selectedYear) {
    if (annotations[selectedYear]) {
      yearAnnotation.text(annotations[selectedYear]);
    } else {
      yearAnnotation.text(""); // Clear if no note
    }
  }

  function getColor(numericId, selectedYear) {
    const parsedId = parseInt(numericId);
    const iso3 = isoMap[parsedId];
    if (!iso3) return "#eee";
    const entry = dataMap.get(iso3);
    if (!entry || entry.values[selectedYear] == null) return "#eee";
    return colorScale(entry.values[selectedYear]);
  }

  // Slider interactivity
  yearSlider.on("input", function () {
    year = this.value;
    yearValueDisplay.text(year);
    updateMap(year);
    updateAnnotation(year);
  });

  updateMap(year);
  updateAnnotation(year); // Run on load

  const playButton = d3.select("#playButton");
  let isPlaying = false;
  let playInterval;

  playButton.on("click", () => {
    if (!isPlaying) {
      playButton.text("⏸ Pause");
      isPlaying = true;
      let currentYear = +year;
      playInterval = setInterval(() => {
        if (currentYear <= 2023) {
          year = currentYear.toString();
          yearSlider.property("value", year);
          yearValueDisplay.text(year);
          updateMap(year);
          updateAnnotation(year);
          currentYear++;
        } else {
          clearInterval(playInterval);
          playButton.text("▶️ Play");
          isPlaying = false;
        }
      }, 1000); // Change year every 1000ms (1 second)
    } else {
      clearInterval(playInterval);
      playButton.text("▶️ Play");
      isPlaying = false;
    }
  });

  // Legend
  const legendWidth = 300;
  const legendHeight = 12;
  const defs = svg.append("defs");

  const linearGradient = defs.append("linearGradient")
    .attr("id", "gradient")
    .attr("x1", "0%").attr("y1", "0%")
    .attr("x2", "100%").attr("y2", "0%");

  linearGradient.selectAll("stop")
    .data(d3.range(0, 1.01, 0.01))
    .enter().append("stop")
    .attr("offset", d => `${d * 100}%`)
    .attr("stop-color", d => colorScale(-2 + d * 12));

  const legend = svg.append("g")
    .attr("transform", `translate(${width / 2 - legendWidth / 2}, ${height - 50})`);

  legend.append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#gradient)")
    .style("stroke", "#ccc");

  const legendScale = d3.scaleLinear()
    .domain([-2, 10])
    .range([0, legendWidth]);

  const legendAxis = d3.axisBottom(legendScale)
    .ticks(6)
    .tickFormat(d => `${d}%`);

  legend.append("g")
    .attr("transform", `translate(0, ${legendHeight})`)
    .call(legendAxis)
    .select(".domain").remove();

  legend.append("text")
  .attr("x", legendWidth / 2)
  .attr("y", -6)
  .attr("text-anchor", "middle")
  .attr("fill", "#333")
  .attr("font-size", "12px")
  .text("Urban Population Growth (%)");
});
