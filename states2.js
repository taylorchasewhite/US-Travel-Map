/*  This visualization was made possible by modifying code provided by:

Scott Murray, Choropleth example from "Interactive Data Visualization for the Web" 
https://github.com/alignedleft/d3-book/blob/master/chapter_12/05_choropleth.html   
		
Malcolm Maclean, tooltips example tutorial
http://www.d3noob.org/2013/01/adding-tooltips-to-d3js-graph.html

Mike Bostock, Pie Chart Legend
http://bl.ocks.org/mbostock/3888852  */

var cityLivedColor,cityLivedColorStroke,color,div,funPinColor,height,legendText,noContactColor,path,pin,pinLength,pinRadius,projection,stateLivedColor,stateVisitedColor,svg,tooltipBorder,tooltipText,tooltipTimer,tooltipTriangle,tooltipWidth,tooltipHeight,tooltipTriangleHeight,triangleBuffer,width,workPinColor;

/**
 * Read in the JSON/CSV data, Render the SVG
 * @public
 * 
 */
function initialize() {
	initGlobalVariables();
	renderStates();
}

/**
 * Instantiate global variables meant to be used across the code
 * @private
 */
function initGlobalVariables() {
	width = 960;
	height = 500;
	pinLength=13;
	pinRadius = 4;
	tooltipWidth = 200;
	tooltipHeight=33;
	triangleBuffer = 2;
	tooltipTriangleHeight=10;
	tooltipTriangleWidth=10;
	cityLivedColor = "rgb(191, 85, 236)";
	stateLivedColor = "rgb(84,36,55)";
	stateLivedColor = "rgb(72, 95, 135)";
	stateVisitedColor = "rgb(69,173,168)";
	stateVisitedColor = "rgb(169, 73, 68)";
	stateVisitedColor = "rgb(202, 98, 101)";
	noContactColor= "rgb(213,222,217)";
	funPinColor = "rgb(214, 69, 65)";
	workPinColor = "rgb(88, 171, 235)";
	workPinColor = "rgb(191, 85, 236)";
	workPinColor = "rgb(119, 175, 116)";
	workPinColor = "rgb(85, 190, 98)";
	//workPinColor = "rgb(137, 228, 148)";
	funPinColor = "rgb(245, 215, 110)";
	//workPinColor="rgb(214, 69, 65)";
	//noContactColor= "rgb(255, 240, 213)";
	cityLivedColorStroke = "rgb(154, 18, 179)";
	// D3 Projection
	projection = d3.geoAlbersUsa()
				   .translate([width/2, height/2])    // translate to center of screen
				   .scale([1000]);          // scale things down so see entire US

	// Define path generator
	path = d3.geoPath()               // path generator that will convert GeoJSON to SVG paths
		  	 .projection(projection);  // tell path generator to use albersUsa projection
	
	legendText = ["Cities Lived", "States Lived", "States Visited", "Nada"];
	
	// Define linear scale for output
	color = d3.scaleLinear()
			  .range([noContactColor,stateVisitedColor,stateLivedColor,cityLivedColor]);
	
	//Create SVG element and append map to the SVG
	svg = d3.select("body").append("svg")
	.attr("class","map")
	.attr("id","svgMap")
	.attr("width", "100%")
	.attr("viewBox", function() {
		return "0 0 " + width +" " + height;
	})
	.attr("height", "100%");
	// Append Div for tooltip to SVG

	tooltipTimer= d3.timer(function(elapsed) {
		if (elapsed > 50) {
			tooltipTimer.stop();
		}
	}, 100);	
}

/**
 * Render the US Map from the JSON data, and compare to the "States lived" document
 * @private
 * 
 */
function renderStates() {
	// Load in my states data!
	d3.tsv("./data/StatesLived.tsv", stateType,function(statesError,data) {
		if (statesError) {
			logError(statesError,"Rendering states lived");
			return;
		}
		color.domain([0,1,2,3]); // setting the range of the input data

		// Load GeoJSON data and merge with states data
		d3.json('https://raw.githubusercontent.com/taylorchasewhite/US-Travel-Map/master/data/US-States.json', function(jsonStatesError,json) {
			if (jsonStatesError) {
				logError(jsonStatesError,"Rendering states json");
				return;
			}
			// Loop through each state data value in the .tsv file
			for (var i = 0; i < data.length; i++) {

				// Grab State Name
				var dataState = data[i].State;

				// Grab data value 
				var dataValue = data[i].Visited;

				// Find the corresponding state inside the GeoJSON
				for (var j = 0; j < json.features.length; j++)  {
					var jsonState = json.features[j].properties.name;

					if (dataState == jsonState) {

					// Copy the data value into the JSON
					json.features[j].properties.Visited = dataValue; 

					// Stop looking through the JSON
					break;
					}
				}
			}
				
			// Bind the data to the SVG and create one path per GeoJSON feature
			var statesPath= svg.append("g");
			statesPath.attr("id","states")
				.selectAll("path")
				.data(json.features)
				.enter()
				.append("path")
				.attr("d", path)
				.style("stroke", "#fff")
				.style("stroke-width", "1")
				.style("fill", function(d) {
					// Get data value
					var value = d.properties.Visited;

					if (value) {
						//If value exists…
						return color(value);
					} 
					else {
						//If value is undefined…
						return noContactColor;
					}
				});
			renderCitiesLived();
			renderLegend();
		});
	});
}

/**
 * Render a purple circle for the cities I've lived in by the amount of time I've lived in them
 * @private
 * 
 */
function renderCitiesLived() {
	// Map the cities I have lived in!
	d3.tsv('https://raw.githubusercontent.com/taylorchasewhite/US-Travel-Map/master/data/CitiesLived.tsv', cityType, function(data) {
		var cities = svg.append("g")
			.attr("class","citiesLivedGroup");
		cities.selectAll("circle")
			.data(data)
			.enter()
			.append("circle")
			.attr("cx", function(d) {
				d.cx= projection([d.Longitude, d.Latitude])[0];
				return d.cx;
			})
			.attr("cy", function(d) {
				d.cy = projection([d.Longitude, d.Latitude])[1];
				return d.cy;
			})
			.attr("r", function(d) {
				return Math.sqrt(d.YearsLived) * 3;
			})
				.style("fill", cityLivedColor)	
				.style("fill-opacity", 0.55)	
				.attr("stroke",cityLivedColorStroke)
				.attr("stroke-width",1)

			// Modification of custom tooltip code provided by Malcolm Maclean, "D3 Tips and Tricks" 
			// http://www.d3noob.org/2013/01/adding-tooltips-to-d3js-graph.html
			.on("mouseover", function(d) {
				tooltipTimer.stop();
				div.transition()
					.duration(200)
					.style("opacity", .9);
				tooltipText.text(d.City + ", " + d.State)
				div.attr("transform", function() {
					var tooltipX = (projection([d.Longitude, d.Latitude])[0]);
					var tooltipY = projection([d.Longitude, d.Latitude])[1];
					
					var circleRadius = Math.sqrt(d.YearsLived) * 3;
					
					var xPosition = tooltipX-(tooltipWidth/2);
					var yPosition = tooltipY - circleRadius - (tooltipHeight)-tooltipTriangleHeight-triangleBuffer;
					return  "translate("+xPosition+","+yPosition+")";
				});
				
				tooltipBorder.attr("stroke", cityLivedColor);
				tooltipTriangle.attr("fill", cityLivedColor);
				//div.append("path").attr("class","arrow-down");
			})   

			// fade out tooltip on mouse out               
			.on("mouseout", function(d) {       
				div.transition()        
				   .duration(500)      
				   .style("opacity", 0);
				tooltipTimer= d3.timer(function(elapsed) {
					if (elapsed > 500) {
						tooltipTimer.stop();
						div.attr("transform","translate(0,0)");
					}
				}, 100);				   
			});
		renderParksArea();
	});
}
/**
 * Render the national park boundaries in the SVG
 * @private
 * 
 */
function renderParksArea() {
	color.domain([0,1,2,3]); // setting the range of the input data

	d3.tsv("./data/nationalParks.tsv", parkType,function(data) {
		// Load GeoJSON data and merge with states data
		d3.json('https://gist.githubusercontent.com/pdbartsch/d4f05d9c65d80f8d4dfb/raw/6b7d62c7f648a5e6b3dedd38a645b09ac4935f9c/natparks.json', function(error,json) {
			if (error) {
				logError(error,"Rendering parks");	
			}

			// Bind the data to the SVG and create one path per GeoJSON feature
			var parksPath=svg.append("g")
				.attr("id","parks");

			var parkJSONData = topojson.feature(json, json.objects.natparks4326)
			var parkData = parksPath.selectAll("path")
				.data(parkJSONData.features);

			// Loop through each state data value in the .tsv file
			for (var i = 0; i < data.length; i++) {
				var currentPark=data[i];

				// Find the corresponding state inside the GeoJSON
				for (var j = 0; j < parkJSONData.features.length; j++)  {
					var jsonPark = parkJSONData.features[j];
					
					if (currentPark.Name == jsonPark.properties.UNIT_NAME) {

						for (var prop in currentPark) {
							if (currentPark.hasOwnProperty(prop)) {
								jsonPark.properties[prop] = currentPark[prop];
							}
						}
						// Stop looking through the JSON
						break;
					}
				}
			}
			
			var parkAreas = parkData
				.enter()
				.append("path")
				.attr("d", path)
				.attr("id",function(d){
					var name = d.properties.Name;
					if (name) {
						return "path"+(name.replace(/\s+/g, ''));
					}
					return "";
				})
				.classed("park",true)
				.classed("visited",function(d) {
					return d.properties.Visited==="Yes";
				});
			//renderTooltip();
			addTooltipToElement(parkAreas,true);
		});
		renderCitiesVisited();
	});
}

/**
 * Render the pins for the cities visited
 * @private
 */
function renderCitiesVisited() {
	d3.tsv('./data/CitiesTraveledTo.tsv',cityVisited, function(data) {
		var cityParentGroup = svg.append("g").attr("id","cities");
		var cities = cityParentGroup.selectAll(".city")
			.data(data)
			.enter()
			.append("g")
			.classed("city",true);
			
		try {
			cities.append("line")
				.attr("x1", function(d) {
					return projection([d.Longitude, d.Latitude])[0];						
				})
				.attr("x2", function(d) {
					return projection([d.Longitude, d.Latitude])[0];
				})
				.attr("y1", function(d) {
					return projection([d.Longitude, d.Latitude])[1]-pinLength;
				})
				.attr("y2", function(d) {
					return (projection([d.Longitude, d.Latitude])[1]);
				})
				.attr("stroke-width",function(d) {
					return 2;
				})
				.attr("stroke",function(d) {
					return "grey";
				});
		}
		catch(error) {
			logError(error,"CitiesVisited");
		}
		
		try {
			cities.append("circle")
				.attr("cx", function(d) {
					return projection([d.Longitude, d.Latitude])[0];
				})
				.attr("cy", function(d) {
					return projection([d.Longitude, d.Latitude])[1]-pinLength;
				})
				.attr("r", function(d) {
					return pinRadius;
				})
				.style("fill", function(d) {
					return getCityVisitedColor(d);
				})	
				.style("opacity", 1.0)	

				// Modification of custom tooltip code provided by Malcolm Maclean, "D3 Tips and Tricks" 
				// http://www.d3noob.org/2013/01/adding-tooltips-to-d3js-graph.html
				.on("mouseover", function(d) {
					tooltipTimer.stop();
					div.transition()
						.duration(200)
						.style("opacity", .9);
					tooltipText.text(d.City + ", " + d.State)
					div.attr("transform", function() {
						var tooltipX = (projection([d.Longitude, d.Latitude])[0]);
						var tooltipY = projection([d.Longitude, d.Latitude])[1];
						
						var xPosition = tooltipX-(tooltipWidth/2);
						var yPosition = tooltipY - pinRadius - (tooltipHeight)-pinLength-tooltipTriangleHeight-triangleBuffer;
						return  "translate("+xPosition+","+yPosition+")";
					});
					
					tooltipBorder.attr("stroke", function () {
						return getCityVisitedColor(d);
					});
					tooltipTriangle.attr("fill", function() {
						return getCityVisitedColor(d);
					});
				})   

				// fade out tooltip on mouse out               
				.on("mouseout", function(d) {       
					div.transition()        
					.duration(500)      
					.style("opacity", 0);   
					tooltipTimer = d3.timer(function(elapsed) {
						if (elapsed > 500) {
							tooltipTimer.stop();
							div.attr("transform","translate(0,0)");
						}
					}, 100);
				});	
		}
		catch(error) {
			logError(error,"CitiesVisited");
		}	
	});
	//renderTooltip();
	renderAccents();
}

/**
 * Wait a second or two for other elements to render before rendering the error.
 * 
 * @param {Object} error - The error object thrown from the calling function
 * @param {string} callingFuncName - The origin of the error message, displayed in the console for debugging
 */
function logError(error,callingFuncName) {
	var t =	d3.timer(function(elapsed) {
		if (elapsed > 500) {
			t.stop();
			renderError(error,callingFuncName);
			console.log("Problem with " + callingFuncName);
			throw(error);
		}
	}, 150);

}

/**
 * Actually render the rectangle and text based on the error passed.
 * 
 * @private
 * @param {Object} error - the error object thrown from the consuming function
 * @param {string} callingFuncName - The name of the consuming function (shown in the console)
 */
function renderError(error,callingFuncName) {
	var errorHeight = tooltipHeight*4;
	var errorWidth = 600;

	var errors= d3.select("#svgMap");
	
	errors.select(".errorMessage").remove();

	var errorGroup = errors.append("g")
		//.attr("id","groupError")
		.attr("class","errorMessage fade-in shadow");

	errorGroup.append("rect")
		.attr("width",errorWidth)
		.attr("height",errorHeight)
		.attr("rx",10)
		.attr("ry",0);
	var errorText=errorGroup.append("text")
		.attr("x",errorWidth/2)
		.attr("y",errorHeight/4)
		.attr("dy", ".35em")
		.attr("text-anchor",'middle');
	errorText.append("tspan")
		.text("It looks like we're having trouble reading the data files.")
		.attr("x",errorWidth/2)
		.attr("dy","1.2em");
	errorText.append("tspan")
		.text("Please contact the owner of this map to let them know!")
		.attr("x",errorWidth/2)
		.attr("dy","1.2em");


	errorGroup.attr("transform","translate(" + (width/2 - errorWidth/2) + ", "+ (height/2-errorHeight/2)+")");
}

/**
 * Render the tooltip for pins, render the pins themselves
 * @private
 * 
 */
function renderAccents() {
	var t = d3.timer(function(elapsed) {
		if (elapsed > 1000) {
			t.stop();
			//renderParks();
		}
	}, 150);

	var t2 = d3.timer(function(elapsed) {
		if (elapsed > 1000) {
			t2.stop();
			renderTooltip();
		}
	}, 150);
	
}

/**
 * Tooltip for the city or park being hovered over
 * @private
 */
function renderTooltip() {
	defineFilter();
	div = svg.append("g")
		.attr("class", "tooltip")
		.style("opacity", 0)
		.style("filter", "url(#drop-shadow)");
	div.append("rect")
		.attr("width",tooltipWidth)
		.attr("height",tooltipHeight)
		.attr("x",0)
		.attr("y",0)
		.attr("fill","white");
	tooltipText=  div.append("g");
	// triangle
	tooltipTriangle = div.append("path")          						// attach a path
		.attr("d", "M "+((tooltipWidth/2)-tooltipTriangleWidth) +","+tooltipHeight+ ", L "+(tooltipWidth/2)+","+ (tooltipHeight+tooltipTriangleHeight)+", L " +((tooltipWidth/2)+tooltipTriangleWidth)+"," + (tooltipHeight)+" Z");	// path commands 
	
	// border
	tooltipBorder = div.append("line")
		.attr("id","tooltipBorder")
		.attr("x1",0)
		.attr("x2",tooltipWidth)
		.attr("y1",tooltipHeight)
		.attr("y2",tooltipHeight)
		.attr("stroke",funPinColor)
		.attr("stroke-width",4);
	tooltipText= div.append("text")
    .attr("x", tooltipWidth/2)
    .attr("y", tooltipHeight/2)
    .attr("dy", ".35em")
	.attr("text-anchor","middle");
}

/**
 * Note: Not currently used. Meant to render a percentage of the states traveled to
 * @deprecated
 * 
 */
function renderProgressRing() {
	var colors = {
		'pink': '#E1499A',
		'yellow': '#f0ff08',
		'green': '#47e495'
	};

	var color = colors.pink;

	var radius = 100;
	var border = 5;
	var padding = 30;
	var startPercent = 0;
	var endPercent = 0.85;


	var twoPi = Math.PI * 2;
	var formatPercent = d3.format('.0%');
	var boxSize = (radius + padding) * 2;


	var count = Math.abs((endPercent - startPercent) / 0.01);
	var step = endPercent < startPercent ? -0.01 : 0.01;

	var arc = d3.svg.arc()
		.startAngle(0)
		.innerRadius(radius)
		.outerRadius(radius - border);

	var parent = d3.select('div#content');

	var svg = parent.append('svg')
		.attr('width', boxSize)
		.attr('height', boxSize);

	var defs = svg.append('defs');

	var filter = defs.append('filter')
		.attr('id', 'blur');

	filter.append('feGaussianBlur')
		.attr('in', 'SourceGraphic')
		.attr('stdDeviation', '7');

	var g = svg.append('g')
		.attr('transform', 'translate(' + boxSize / 2 + ',' + boxSize / 2 + ')');

	var meter = g.append('g')
		.attr('class', 'progress-meter');

	meter.append('path')
		.attr('class', 'background')
		.attr('fill', '#ccc')
		.attr('fill-opacity', 0.5)
		.attr('d', arc.endAngle(twoPi));

	var foreground = meter.append('path')
		.attr('class', 'foreground')
		.attr('fill', color)
		.attr('fill-opacity', 1)
		.attr('stroke', color)
		.attr('stroke-width', 5)
		.attr('stroke-opacity', 1)
		.attr('filter', 'url(#blur)');

	var front = meter.append('path')
		.attr('class', 'foreground')
		.attr('fill', color)
		.attr('fill-opacity', 1);

	var numberText = meter.append('text')
		.attr('fill', '#fff')
		.attr('text-anchor', 'middle')
		.attr('dy', '.35em');

	function updateProgress(progress) {
		foreground.attr('d', arc.endAngle(twoPi * progress));
		front.attr('d', arc.endAngle(twoPi * progress));
		numberText.text(formatPercent(progress));
	}

	var progress = startPercent;

	(function loops() {
		updateProgress(progress);

		if (count > 0) {
			count--;
			progress += step;
			setTimeout(loops, 10);
		}
	})();
}

/**
 * Render the actual legend in the bottom right hand corner
 * @private
 * 
 */
function renderLegend() {
	// Modified Legend Code from Mike Bostock: http://bl.ocks.org/mbostock/3888852
	var legend = d3.select("body").append("svg")
			.attr("class", "legend")
			.attr("width", 140)
			.attr("height", 200)
			.selectAll("g")
			.data(color.domain().slice().reverse())
			.enter()
			.append("g")
			.attr("transform", function(d, i) { 
				return "translate(0," + i * 20 + ")"; 
			});

	legend.append("rect")
		.attr("width", 18)
		.attr("height", 18)
		.style("fill", color);

	legend.append("text")
		.data(legendText)
		.attr("x", 24)
		.attr("y", 9)
		.attr("dy", ".35em")
		.text(function(d) { 
			return d; 
		});
}

/**
 * Get the fill color of the pinhead based on the reason for visiting it.
 * 
 * @param {Object} city - The city object with all of its parameters
 * @param {string} city.City - The name of the city visited
 * @param {string} city.State - The state it resides in
 * @param {number} city.Latitude - The latitudal location on earth
 * @param {number} city.Longitude - The longitudinal location on earth
 * @param {string} city.Reason - Reason for visiting (can be Work, Fun)
 * @param {string} city.Desc - Details about the trip
 * @param {string} city.Link - A link to additional information about the trip
 * @param {DateTime} city.Date - The date the city was visited
 * @returns string - The color of the pinhead
 */
function getCityVisitedColor(city) {
	if (city.Reason === "Work") {
		return workPinColor;
	}
	else if (city.Reason === "Fun") {
		return funPinColor;
	}
	else {
		return workPinColor;
	}
}

/**
 * Helper function to format the attributes of the city object from the CSV file.
 * @private
 * 
 * @param {Object} type - The city object with all of its parameters
 * @param {string} type.City - The name of the city visited
 * @param {string} type.State - The state it resides in
 * @param {number} type.Latitude - The latitudal location on earth
 * @param {number} type.Longitude - The longitudinal location on earth
 * @param {string} type.Reason - Reason for visiting (can be Work, Fun)
 * @param {string} type.Description - Details about the trip
 * @param {string} type.Link - A link to additional information about the trip
 * @param {DateTime} city.DateTravelled - The date the city was visited
 * @returns {Object} - City Object
 */
function cityVisited (type) {
	d = new Object();
	
	d.City = type["City"];
	d.State = type["State"];

	d.Date = type["Date Travelled"];
	d.Link = type["Link"];
	d.Reason = type["Reason"];
	d.Desc = type["Description"];
	
	d.Latitude = type["Latitude"];
	d.Longitude = type["Longitude"];
	
	return d;
}

/**
 * Helper function to format the attributes of the city lived object from the CSV file.
 * @private
 * 
 * @param {Object} type - The city object with all of its parameters
 * @param {string} type.City - The name of the city visited
 * @param {string} type.State - The state it resides in
 * @param {number} type.Latitude - The latitudal location on earth
 * @param {number} type.Longitude - The longitudinal location on earth
 * @param {string} type.YearsLived - Details about the trip
 * @returns {Object} - City Object
 */
function cityType(type) {
	d = new Object();
	
	d.City = type["City"];
	d.State = type["State"];
	d.YearsLived = type["Years Lived"];
	d.Latitude = type["Latitude"];
	d.Longitude = type["Longitude"];
	
	return d;
}

/**
 * Represents the states in the U.S. and whether I've lived there, travelled, or nada
 * 
 * @param {Object} type - The dataset object
 * @returns Object - State object 
 */
function stateType(type) {
	d = new Object();
	
	d.State = type["State"];
	d.Status = type["Status"];
	switch (type["Status"]) {
		case "Visited":
			d.Visited=1;
			break;
		case "Lived":
			d.Visited=2;
			break;
		case "Not Visited":
			d.Visited=0;
			break;
		default:
			d.Visited=0;
			break;
	}
	
	return d;
}

/**
 * Read in the park data and return a properly formatted object.
 * 
 * @param {Object} type - The park object with its default properties from D3.tsv
 * @returns Object, park object with the properties seen in the code.
 */
function parkType(type) {
	d = new Object();
	
	d.Name = type["Park"];
	d.Suffix = type["Park Suffix"];

	d.Link = type["Park Website"];
	d.State= type["States"];

	d.Photos = type["Google Photos"];
	d.Visitors = type["Number of Visitors"];
	d.Visited = type["Visited?"];
	d.Date = type ["Date Visited"];
	d.Rank = type["Rank"];
	d.Desc = type["Notes"];

	d.Latitude = type["Latitude"];
	d.Longitude = type["Longitude"];
	
	return d;	
}

/**
 * Pass in the dataset you want to display a tooltip over. If the dataset is a park then we'll
 * approach it a bit differently.
 * 
 * @param {any} tooltipElData 
 * @param {boolean} isPath - Is this a geoJSON object or a normal JSON?
 */
function addTooltipToElement(tooltipElData,isParkArea) {
	// Modification of custom tooltip code provided by Malcolm Maclean, "D3 Tips and Tricks" 
	// http://www.d3noob.org/2013/01/adding-tooltips-to-d3js-graph.html
	tooltipElData.on("mouseover", function(d) {
		tooltipTimer.stop();
		div.transition()
			.duration(200)
			.style("opacity", .9);
		div.attr("transform", function() {
			var tooltipX,tooltipY,xPosition=0,yPosition=0;
			if (isParkArea==null || isParkArea==undefined) {
				tooltipX = (projection([d.Longitude, d.Latitude])[0]);
				tooltipY = projection([d.Longitude, d.Latitude])[1];
				xPosition = tooltipX-(tooltipWidth/2);
				yPosition = tooltipY - pinRadius - (tooltipHeight)-pinLength-tooltipTriangleHeight-triangleBuffer;
				tooltipText.text(d.Name + ", " + d.State);
			} else {
				var coordinates = [0, 0];
				coordinates = d3.mouse(d3.select("#svgMap").node());
				tooltipX=coordinates[0];
				tooltipY=coordinates[1];
				xPosition = tooltipX-(tooltipWidth/2);
				yPosition = tooltipY - pinRadius - (tooltipHeight)-tooltipTriangleHeight-triangleBuffer;
				tooltipText.text(function() {
					var tooltipText=d.properties.UNIT_NAME;
					if (d.properties.State!=null || d.properties.State!=undefined) {
						tooltipText+= ", " + d.properties.State;
					}
					else {
						tooltipText+= " "+ d.properties.UNIT_TYPE;
					}
					return tooltipText;
				});				
			}
			
			return  "translate("+xPosition+","+yPosition+")";
		});
		
		tooltipBorder.attr("stroke", function () {
			return getCityVisitedColor(d);
		});
		tooltipTriangle.attr("fill", function() {
			return getCityVisitedColor(d);
		});
	})   
	// fade out tooltip on mouse out               
	.on("mouseout", function(d) {       
		div.transition()        
			.duration(500)      
			.style("opacity", 0);   
		tooltipTimer = d3.timer(function(elapsed) {
			if (elapsed > 500) {
				tooltipTimer.stop();
				div.attr("transform","translate(0,0)");
			}
		}, 100);
	});
}

/**
 * Resize the map on the resize of the window
 * @private
 * 
 */
function onResize() {
	var map = d3.select("#svgMap");
	var width=map.style("width");
	var height=map.style("height");
	var width = 960;
	var height = 500;
	//projection = d3.geoAlbersUsa()
	//			   .translate([width/2, height/2])    // translate to center of screen
	//			   .scale([width]);          // scale things down so see entire US
}

var addEvent = function(object, type, callback) {
    if (object == null || typeof(object) == 'undefined') return;
    if (object.addEventListener) {
        object.addEventListener(type, callback, false);
    } else if (object.attachEvent) {
        object.attachEvent("on" + type, callback);
    } else {
        object["on"+type] = callback;
    }
};

addEvent(window, "resize", onResize);


function defineFilter () {
	// create filter with id #drop-shadow
	// height=130% so that the shadow is not clipped
	var defs = svg.append("defs");
	var filter = defs.append("filter")
		.attr("id", "drop-shadow")
		.attr("height", "130%");

	// SourceAlpha refers to opacity of graphic that this filter will be applied to
	// convolve that with a Gaussian with standard deviation 3 and store result
	// in blur
	filter.append("feGaussianBlur")
		.attr("in", "SourceAlpha")
		.attr("stdDeviation", 2)
		.attr("result", "blur");

	// translate output of Gaussian blur to the right and downwards with 2px
	// store result in offsetBlur
	filter.append("feOffset")
		.attr("in", "blur")
		.attr("dx", 3)
		.attr("dy", 3)
		.attr("result", "offsetBlur");
	filter.append("feComponentTransfer")
		.append("feFuncA")
			.attr("type","linear")
			.attr("slope",1);

	// overlay original SourceGraphic over translated blurred opacity by using
	// feMerge filter. Order of specifying inputs is important!
	var feMerge = filter.append("feMerge");

	feMerge.append("feMergeNode")
		.attr("in", "offsetBlur")
	feMerge.append("feMergeNode")
		.attr("in", "SourceGraphic");
}