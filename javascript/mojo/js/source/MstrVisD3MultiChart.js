/**
 * MstrVisD3MultiChart is the plugin for Optum project to support Multichart visualization 
 * in HTML5 for Dashboards.
 */
(function () {
    // We need to define this code as plugin in mstrmojo object
    if (!mstrmojo.plugins.Optum) {
        mstrmojo.plugins.Optum = {};
    }
    // Visualization requires library to render, and in this
    mstrmojo.requiresCls("mstrmojo.CustomVisBase");
    // Declaration of the visualization object
    mstrmojo.plugins.Optum.MstrVisD3MultiChart = mstrmojo.declare(
        //We need to declare that our code extends CustomVisBase
        mstrmojo.CustomVisBase,
        null,
        {
            //here scriptClass is defined as mstrmojo.plugins.{plugin name}.{js file name}
            scriptClass: 'mstrmojo.plugins.Optum.MstrVisD3MultiChart',
            model: null,
            cssClass: "MstrVisD3MultiChart",
            errorDetails: "This visualization requires at least 1 metrics.",
            useRichTooltip: true,
            reuseDOMNode: true,
            externalLibraries: [
                {
                    url: "../plugins/Optum/javascript/d3.v3.min.js"              
                },
                {
                    url: "../plugins/Optum/javascript/bullet.js"              
                }
            ],
            /**
            * Rendering Multichart using D3 JS framework for Optum project 
            */
            plot: function () { 
                //...YOUR JS CODE...
                this.domNode.innerText = "Empty text";

                // Define this code as a plugin in the mstrmojo object
                if (!mstrmojo.plugins.Optum) {
                    mstrmojo.plugins.Optum = {};
                }

                if (this.domNode.childNodes.length === 1) {
                    this.domNode.removeChild(this.domNode.childNodes[0]);
                }
                
                var margin = {top: 10, right: 30, bottom: 50, left: 80},
                     width = parseInt(this.width,10) - margin.left - margin.right,
                     height = parseInt(this.height,10) - margin.top - margin.bottom;


                var chart = d3.select(this.domNode).append("svg").attr("width", width + margin.left + margin.right)
                     .attr("height", height + margin.top + margin.bottom)
                     .append("g")
                     .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
                
                debugger;
                var x = d3.scale.ordinal()
                     .rangeRoundBands([0, width], 0.1);
                 

                var data = this.dataInterface.getRawData(mstrmojo.models.template.DataInterface.ENUM_RAW_DATA_FORMAT.TREE).children;
                var metricName = this.dataInterface.getColHeaders(0).getHeader(0).getName();
                
                x.domain(data.map(function(d) {
                    return d.name;
                }));

                var y = d3.scale.linear()
                    .range([height, 0]).domain([0, d3.max(data, function(d) {
                        return d.value;
                })]);
                
                var xAxis = d3.svg.axis()
                    .scale(x)
                    .orient("bottom");
                
                var yAxis = d3.svg.axis()
                    .scale(y)
                    .orient("left");
                
                chart.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + height + ")")
                    .call(xAxis);
                
                chart.append("g")
                    .attr("class", "y axis")
                    .call(yAxis).append("text")
                    .attr("transform", "rotate(-90)")
                    .attr("y", 6)
                    .attr("dy", ".71em")
                    .style("text-anchor", "end")
                    .text(metricName);
                
                chart.selectAll(".bar")
                    .data(data)
                    .enter().append("rect")
                    .attr("class", "bar")
                    .attr("x", function(d) {
                        return x(d.name);
                    })
                    .attr("y", function(d) {
                        return y(d.value);
                    })
                    .attr("height", function(d) {
                        return height - y(d.value);
                    })
                    .attr("width", x.rangeBand());                
            }
        });
})();