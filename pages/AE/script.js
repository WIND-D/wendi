////////////////////////////////////////////////////////////
//////////////////////// Set-up ////////////////////////////
////////////////////////////////////////////////////////////

//Quick fix for resizing some things for mobile-ish viewers
var mobileScreen = ($( window ).innerWidth() < 500 ? true : false);

//Scatterplot
var margin = {left: 150, top: 20, right: 20, bottom: 20},
	width = Math.min($("#chart").width(), 1000) - margin.left - margin.right,
	height = width*3/4;

var svg = d3.select("#chart").append("svg")
			.attr("width", (width + margin.left + margin.right))
			.attr("height", (height + margin.top + margin.bottom));

var wrapper = svg.append("g").attr("class", "chordWrapper")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

//////////////////////////////////////////////////////
///////////// Initialize Axes & Scales ///////////////
//////////////////////////////////////////////////////

var opacityCirclesN = 0.25;
var opacityCirclesP = 0.8;

//Set the color for each region
var color = d3.scale.ordinal()
                    .range(["#E01A25","#EFB605", "#2074A0"])
					.domain(["Penicilin", "Streptomycin", "Neomycin"]);

//Set the new x axis range
var xScale = d3.scale.log()
	.range([0, width])
	.domain([10000,0.0001]) //I prefer this exact scale over the true range and then using "nice"
	//.domain(mics.map(function(d) { return d.MIC; }))
	//.nice();
//Set new x-axis
var xAxis = d3.svg.axis()
    .orient("bottom")
    .tickPadding(5)
	.scale(xScale);
//Append the x-axis
wrapper.append("g")
	.attr("class", "x axis")
	.attr("transform", "translate(" + 0 + "," + (height) + ")")
	.call(xAxis);

//Set the new y axis range
var yScale = d3.scale.ordinal()
    .domain(mics.map(function(d) { return d.Bacteria;}))
	.rangePoints([height,0], 1)
	//.nice();
var yAxis = d3.svg.axis()
	.orient("left")
	.scale(yScale);
//Append the y-axis
wrapper.append("g")
		.attr("class", "y axis")
		.attr("transform", "translate(" + 0 + ","  + ")")
		.call(yAxis);

//Scale for the bubble size
var rScale = d3.scale.sqrt()
			.range([mobileScreen ? 1 : 2, mobileScreen ? 10 : 16])
			.domain(d3.extent(mics, function(d) {return d.logMIC;}));
////////////////////////////////////////////////////////////
/////////////////// Scatterplot Circles ////////////////////
////////////////////////////////////////////////////////////

//Initiate the voronoi group element
var circleGroup = wrapper.append("g")
	.attr("class", "circleWrapper");




//Place the country circles
wrapper.selectAll("mics")
	.data(mics.sort(function(a,b) { return b.MIC > a.MIC; })) //Sort so the biggest circles are below
	.enter().append("circle")
		.attr("class", function(d,i) { return "mics " + d.num; })
		.style("opacity", function(d){
			if (d["Gram Staining"] == "positive")
			return opacityCirclesP;
			else
			return opacityCirclesN;
		})
		.style("fill", function(d) {return color(d.Antibiotics);})
		//.style("fill", t.url())
		.style("stroke", function(d){
			if (d["Gram Staining"] == "positive")
			return "none";
			else
			return "none";
		}) //I use this to look at how the cells are dispersed as a check
		.attr("cx", function(d) {return d3.format(".3f")(xScale(d.MIC));})
		.attr("cy", function(d) {return yScale(d.Bacteria);})
		.attr("r", function(d) {return rScale(0.5 - d.logMIC);})
		.on("mouseover", showTooltip)
	.on("mouseout",  removeTooltip);


	/*wrapper.selectAll("mics")
	.data(mics.sort(function(a,b) { return b.MIC > a.MIC; })) //Sort so the biggest circles are below
	.enter().append("text")
		.attr("class", function(d,i) { return "micsN " + d.num; })
		.attr("x", function(d) {return xScale(d.MIC);})
		.attr("y", function(d) {return yScale(d.Bacteria);})
		.attr('dy', 'opacityCirclesNem')
		.attr("dx", "-0.3em")
		.text(function(d){return d["Gram Staining"]});*/




//////////////////////////////////////////////////////////////
//////////////////////// Voronoi /////////////////////////////
//////////////////////////////////////////////////////////////

//Initiate the voronoi function
//Use the same variables of the data in the .x and .y as used in the cx and cy of the circle call
//The clip extent will make the boundaries end nicely along the chart area instead of splitting up the entire SVG
//(if you do not do this it would mean that you already see a tooltip when your mouse is still in the axis area, which is confusing)
var voronoi = d3.geom.voronoi()
	.x(function(d) { return xScale(d.MIC); })
	.y(function(d) { return yScale(d.Bacteria); })
	.clipExtent([[0, 0], [width, height-10]]);

//Initiate a group element to place the voronoi diagram in
var voronoiGroup = wrapper.append("g")
	.attr("class", "voronoiWrapper");

//Create the Voronoi diagram
/*
voronoiGroup.selectAll("path")
	.data(voronoi(mics)) //Use vononoi() with your dataset inside
	.enter().append("path")
	.attr("d", function(d, i) { return "M" + d.join("L") + "Z"; })
	.datum(function(d, i) { return d.point; })
	.attr("class", function(d,i) { return "voronoi " + d.num; }) //Give each cell a unique class where the unique part corresponds to the circle classes
	//.style("stroke", "#2074A0") //I use this to look at how the cells are dispersed as a check
	//.style("stroke-opacity", 0.5)
	.style("fill", "none")
	.style("pointer-events", "all")
	.on("mouseover", showTooltip)
	.on("mouseout",  removeTooltip);*/


//////////////////////////////////////////////////////
///////////////// Initialize Labels //////////////////
//////////////////////////////////////////////////////

//Set up X axis label
wrapper.append("g")
	.append("text")
	.attr("class", "x title")
	.attr("text-anchor", "end")
	.style("font-size", (mobileScreen ? 8 : 12) + "px")
	.attr("transform", "translate(" + width + "," + (height - 10) + ")")
    .text("Inhibition Antibiotics [MIC] - Note the logarithmic scale")
    .on("mouseover", showMIC)
    .on("mouseout", removeMIC);

    wrapper.append("g")
	.append("text")
	.attr("class", "x title2")
	.attr("text-anchor", "end")
	.style("font-size", (mobileScreen ? 8 : 12) + "px")
	.attr("transform", "translate(" + (width) + "," + (height/2) + ")")
    .text("More effective -->");

    wrapper.append("g")
	.append("text")
	.attr("class", "x title2")
	.attr("text-anchor", "begin")
	.style("font-size", (mobileScreen ? 8 : 12) + "px")
	.attr("transform", "translate("+ "15," + (height/2) + ")")
    .text("<-- Less effective");
//Set up y axis label
wrapper.append("g")
	.append("text")
	.attr("class", "y title")
	.attr("text-anchor", "end")
	.style("font-size", (mobileScreen ? 8 : 12) + "px")
	.attr("transform", "translate(18, 0) rotate(-90)")
	.text("Bacteria");

///////////////////////////////////////////////////////////////////////////
///////////////////////// Create the Legend////////////////////////////////
///////////////////////////////////////////////////////////////////////////

if (!mobileScreen) {
	//Legend
	var	legendMargin = {left: 5, top: 10, right: 5, bottom: 10},
		legendWidth = 145,
		legendHeight = 270;

	var svgLegend = d3.select("#legend").append("svg")
				.attr("width", (legendWidth + legendMargin.left + legendMargin.right))
				.attr("height", (legendHeight + legendMargin.top + legendMargin.bottom));

	var legendWrapper = svgLegend.append("g").attr("class", "legendWrapper")
					.attr("transform", "translate(" + legendMargin.left + "," + legendMargin.top +")");

	var rectSize = 15, //dimensions of the colored square
		rowHeight = 20, //height of a row in the legend
		maxWidth = 144; //widht of each row

	//Create container per rect/text pair
	var legend = legendWrapper.selectAll('.legendSquare')
			  .data(color.range())
			  .enter().append('g')
			  .attr('class', 'legendSquare')
			  .attr("transform", function(d,i) { return "translate(" + 0 + "," + (i * rowHeight) + ")"; })
			  .style("cursor", "pointer")
			  .on("mouseover", selectLegend(0.02))
			  .on("mouseout", selectLegend(function(d){
				if (d["Gram Staining"] == "positive")
				return opacityCirclesP;
				else
				return opacityCirclesN;
			}))
              .on("click", clickLegend);

	//Non visible white rectangle behind square and text for better hover
	legend.append('rect')
		  .attr('width', maxWidth)
		  .attr('height', rowHeight)
		  .style('fill', "white");
	//Append small squares to Legend
	legend.append('rect')
		  .attr('width', rectSize)
		  .attr('height', rectSize)
		  .attr('transform', 'translate(' + '22,0' + ')')
		  .style('fill', function(d) {return d;});
	legend.append('rect')
		  .attr('width', rectSize)
		  .attr('height', rectSize)
		  .style('fill', function(d) {return d;})
		  .style('opacity', opacityCirclesN);
	//Append text to Legend
	legend.append('text')
		  .attr('transform', 'translate(' + 44 + ',' + (rectSize/2) + ')')
		  .attr("class", "legendText")
		  .style("font-size", "10px")
		  .attr("dy", ".35em")
		  .text(function(d,i) { return color.domain()[i]; });



	//Create g element for bubble size legend
	legendWrapper.append("g")
						.attr("transform", "translate(" + "0," + (color.domain().length*rowHeight) +")")
						.append('text')
		  .attr('transform', 'translate(' + (rectSize/2)+',' + (rectSize/2) + ')')
		  .attr("class", "legendTitle")
		  .style("font-size", "18px")
		  .attr("dy", ".35em")
		  .text("-");
		  legendWrapper.append("g")
		  .attr("transform", "translate(" + "0," + (color.domain().length*rowHeight) +")")
		  .append('text')
.attr('transform', 'translate(' + (22+rectSize/2) +',' + (rectSize/2) + ')')
.attr("class", "legendTitle")
.style("font-size", "18px")
.attr("dy", ".35em")
.text("+");

		  legendWrapper.append("g")
		  .attr("transform", "translate(" + "44," + (color.domain().length*rowHeight) +")")
		  .append('text')
		.attr('transform', 'translate(' +'0,' + (rectSize/2) + ')')
.attr("class", "legendText")
.style("font-size", "10px")
.attr("dy", ".35em")
.text("Gram Staining");


	//Create g element for bubble size legend
	var bubbleSizeLegend = legendWrapper.append("g")
						.attr("transform", "translate(" + (legendWidth/2 - 30) + "," + (color.domain().length*rowHeight + 30) +")");
	//Draw the bubble size legend
	bubbleLegend(bubbleSizeLegend, rScale, legendSizes = [-3,0,3], legendName = "MIC");




}//if !mobileScreen
else {
	d3.select("#legend").style("display","none");
}

/////////////////////////////////////////////////////
/////////////////// Bubble Legend ////////////////////
//////////////////////////////////////////////////////

function bubbleLegend(wrapperVar, scale, sizes, titleName) {

var legendSize1 = sizes[0],
    legendSize2 = sizes[1],
    legendSize3 = sizes[2],
    legendCenter = 0,
    legendBottom = 50,
    legendLineLength = 25,
    textPadding = 5,
	numFormat = d3.format(",");



wrapperVar.append("text")
    .attr("class","legendTitle")
    .attr("transform", "translate(" + legendCenter + "," + 0 + ")")
    .attr("x", 0 + "px")
    .attr("y", 0 + "px")
    .attr("dy", "1em")
    .text(titleName);

wrapperVar.append("circle")
    .attr('r', scale(legendSize1))
    .attr('class',"legendCircle")
    .attr('cx', legendCenter)
    .attr('cy', (legendBottom-scale(legendSize1)));
wrapperVar.append("circle")
    .attr('r', scale(legendSize2))
    .attr('class',"legendCircle")
    .attr('cx', legendCenter)
    .attr('cy', (legendBottom-scale(legendSize2)));
wrapperVar.append("circle")
    .attr('r', scale(legendSize3))
    .attr('class',"legendCircle")
    .attr('cx', legendCenter)
    .attr('cy', (legendBottom-scale(legendSize3)));

wrapperVar.append("line")
    .attr('class',"legendLine")
    .attr('x1', legendCenter)
    .attr('y1', (legendBottom-2*scale(legendSize1)))
    .attr('x2', (legendCenter + legendLineLength))
    .attr('y2', (legendBottom-2*scale(legendSize1)));
wrapperVar.append("line")
    .attr('class',"legendLine")
    .attr('x1', legendCenter)
    .attr('y1', (legendBottom-2*scale(legendSize2)))
    .attr('x2', (legendCenter + legendLineLength))
    .attr('y2', (legendBottom-2*scale(legendSize2)));
wrapperVar.append("line")
    .attr('class',"legendLine")
    .attr('x1', legendCenter)
    .attr('y1', (legendBottom-2*scale(legendSize3)))
    .attr('x2', (legendCenter + legendLineLength))
    .attr('y2', (legendBottom-2*scale(legendSize3)));

wrapperVar.append("text")
    .attr('class',"legendText")
    .attr('x', (legendCenter + legendLineLength + textPadding))
    .attr('y', (legendBottom-2*scale(legendSize1)))
    .attr('dy', '0.25em')
    .text("1,000");
wrapperVar.append("text")
    .attr('class',"legendText")
    .attr('x', (legendCenter + legendLineLength + textPadding))
    .attr('y', (legendBottom-2*scale(legendSize2)))
    .attr('dy', '0.25em')
    .text("0");
wrapperVar.append("text")
    .attr('class',"legendText")
    .attr('x', (legendCenter + legendLineLength + textPadding))
    .attr('y', (legendBottom-2*scale(legendSize3)))
    .attr('dy', '0.25em')
	.text("0.001");



}//bubbleLegend

//////////////////////////////////////////////////////////////////////////
//////////////////// Hover function for the legend ////////////////////////
///////////////////////////////////////////////////////////////////////////

//Decrease opacity of non selected circles when hovering in the legend
function selectLegend(opacity) {
	return function(d, i) {
		var chosen = color.domain()[i];

		wrapper.selectAll(".mics")
			.filter(function(d) { return d.Antibiotics != chosen; })
			.transition()
			.style("opacity", opacity);
	  };
}//function selectLegend


///////////////////////////////////////////////////////////////////////////
///////////////////// Click functions for legend //////////////////////////
///////////////////////////////////////////////////////////////////////////
//Function to show only the circles for the clicked sector in the legend
function clickLegend(d,i) {

	event.stopPropagation();

	//deactivate the mouse over and mouse out events
	d3.selectAll(".legendSquare")
		.on("mouseover", null)
		.on("mouseout", null);

	//Chosen legend item
	var chosen = color.domain()[i];

	//Only show the circles of the chosen sector
	wrapper.selectAll(".mics")
		.style("opacity", function(d){
			if (d["Gram Staining"] == "positive")
			return opacityCirclesP;
			else
			return opacityCirclesN;
		})
		.style("visibility", function(d) {
			if (d.Antibiotics != chosen) return "hidden";
			else return "visible";
        });
    //Make sure the pop-ups are only shown for the clicked on legend item
	wrapper.selectAll(".voronoi")
		.on("mouseover", function(d,i) {
			if(d.Antibiotics != chosen) return null;
			else return showTooltip.call(this, d, i);
		})
		.on("mouseout",  function(d,i) {
			if(d.Antibiotics != chosen) return null;
			else return removeTooltip.call(this, d, i);
		});


}//sectorClick
//Show all the cirkels again when clicked outside legend
function resetClick() {

	//Activate the mouse over and mouse out events of the legend
	d3.selectAll(".legendSquare")
		.on("mouseover", selectLegend(0.02))
		.on("mouseout", selectLegend(function(d){
			if (d["Gram Staining"] == "positive")
			return opacityCirclesP;
			else
			return opacityCirclesN;
		}));

	//Show all circles
	wrapper.selectAll(".mics")
		.style("opacity", function(d){
			if (d["Gram Staining"] == "positive")
			return opacityCirclesP;
			else
			return opacityCirclesN;
		})
		.style("visibility", "visible");

	//Activate all pop-over events
	wrapper.selectAll(".voronoi")
		.on("mouseover", showTooltip)
		.on("mouseout",  function (d,i) { removeTooltip.call(this, d, i); });

}//resetClick

//Reset the click event when the user clicks anywhere but the legend
d3.select("body").on("click", resetClick);

///////////////////////////////////////////////////////////////////////////
/////////////////// Hover functions of the circles ////////////////////////
///////////////////////////////////////////////////////////////////////////
//Hide the tooltip when the mouse moves away
function removeMIC() {

    //Fade out the circle to normal opacity
    d3.select(this).style("opacity", function(d){
		if (d["Gram Staining"] == "positive")
		return opacityCirclesP;
		else
		return opacityCirclesN;
	});

    //Hide tooltip
    $('.popover').each(function() {
        $(this).remove();
    });

    }//function removeTooltip

    //Show the tooltip on the hovered over slice
    function showMIC() {
    //Define and show the tooltip
    $(this).popover({
        placement: 'auto top',
        container: '#chart',
        trigger: 'manual',
        html : true,
        content: function() {
            return "<span style='font-size: 11px; text-align: center;'>" +"MIC: minimum inhibitory concentration"+ "</span>"; }
    });
    $(this).popover('show');

    }//function showTooltip
//Hide the tooltip when the mouse moves away
function removeTooltip(d) {

	//Save the chosen circle (so not the voronoi)
	var element = d3.select(this)

	//Fade out the bubble again
	element.style("opacity", function(d){
		if (d["Gram Staining"] == "positive")
		return opacityCirclesP;
		else
		return opacityCirclesN;
	});

	//Hide tooltip
	$('.popover').each(function() {
		$(this).remove();
	});

	//Fade out guide lines, then remove them
	d3.selectAll(".guide")
		.transition().duration(200)
		.style("opacity",  0)
		.remove();

}//function removeTooltip

//Show the tooltip on the hovered over slice
function showTooltip(d) {
		//Define and show the tooltip
		var n;
	$(this).popover({
		placement: 'auto top',
		container: '#chart',
		trigger: 'manual',
		html : true,
		content: function() {
			if (d["Gram Staining"] == "positive")
			n = "+";
			else
			n = "-";
            return "<span style='font-size: 11px; text-align: center;'>" + "Bacteria: "+d.Bacteria + "<br>" + "Antibiotic: "+d.Antibiotics + "<br>"+"Gram Staining: "+n+ "</span>"; }
	});
	$(this).popover('show');

	//Make chosen circle more visible
	d3.select(this).style("opacity", 1);

	//Append lines to bubbles that will be used to show the precise data points
	//vertical line
	wrapper.append("g")
		.attr("class", "guide")
		.append("line")
			.attr("x1", d3.select(this).attr("cx"))
			.attr("x2", d3.select(this).attr("cx"))
			.attr("y1", +d3.select(this).attr("cy"))
			.attr("y2", (height))
			.style("stroke", d3.select(this).style("fill"))
			.style("opacity",  0)
			.style("pointer-events", "none")
			.transition().duration(200)
			.style("opacity", 0.5);

		wrapper
			.append("text")
			.attr("class", "guide")
			.attr("x", d3.select(this).attr("cx"))
			.attr("y", height+20)
			.style("fill", d3.select(this).style("fill"))
			.style("opacity", opacityCirclesP)
			.style("text-anchor", "middle")
			.text( d3.format(".3f")(d.MIC) )
			.transition().duration(200)
	//horizontal line
	wrapper.append("g")
		.attr("class", "guide")
		.append("line")
			.attr("x1", +d3.select(this).attr("cx"))
			.attr("x2", 0)
			.attr("y1", d3.select(this).attr("cy"))
			.attr("y2", d3.select(this).attr("cy"))
			.style("stroke", d3.select(this).style("fill"))
			.style("opacity",  0)
			.style("pointer-events", "none")
			.transition().duration(200)
			.style("opacity", 0.5);
	//Value on the axis
	/*wrapper
		.append("text")
		.attr("class", "guide")
		.attr("x", -25)
		.attr("y", d3.select(this).attr("cy"))
		.attr("dy", "0.35em")
		.style("fill", d3.select(this).style("fill"))
		.style("opacity",  0)
		.style("text-anchor", "end")
		.text( d.Bacteria )
		.transition().duration(200)
		.style("opacity", 0.5);	*/

}//function showTooltip


//iFrame handler
var pymChild = new pym.Child();
pymChild.sendHeight()
setTimeout(function() { pymChild.sendHeight(); },5000);
