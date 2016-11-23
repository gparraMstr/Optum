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


               /* var chart = d3.select(this.domNode).append("svg").attr("width", width + margin.left + margin.right)
                     .attr("height", height + margin.top + margin.bottom)
                     .append("g")
                     .attr("transform", "translate(" + margin.left + "," + margin.top + ")"); */

                // create table
                
                var x = d3.scale.ordinal()
                     .rangeRoundBands([0, width], 0.1);

                var data = this.dataInterface.getRawData(mstrmojo.models.template.DataInterface.ENUM_RAW_DATA_FORMAT.ROWS);
                var columns = this.dataInterface. getColumnHeaderData();

                var metricName = this.dataInterface.getColHeaders(0).getHeader(0).getName();


                var multichart = d3.bullet()
                    .width(width)
                    .height(35);

                var svg = d3.select(this.domNode).selectAll("svg")
                    .data([{"title":"Revenue","subtitle":"US$, in thousands","ranges":[150,225,300],"measures":[220,270],"markers":[250]}])
                    .enter().append("svg")
                    .attr("class", "bullet")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", 80)
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                    .call(multichart);

                var table = d3.select(this.domNode)
                    .append('table');

                // create table header
                table.append('thead').append('tr')
                    .selectAll('th')
                    .data(columns).enter()
                    .append('th')
                    .attr('class', function(d) {
                        return (d['otp'] == 5 ? 'num':'title');
                    })
                    .text(function(d) {
                        return d['n'];
                    });

                // create table body
                table.append('tbody')
                    .attr("height", height - 80)
                    .selectAll('tr')
                    .data(data).enter()
                    .append('tr')
                    .selectAll('td')
                    .data(function(row, i) {
                        return columns.map(function(c) {
                            // compute cell values for this specific row
                            var cell = {};

                            if (typeof row[c['n']] != 'undefined') {
                                if ((c['otp'] == 12) && (typeof row[c['n']] == "string")) {
                                    cell['html'] = row[c['n']];
                                    cell['cl'] = 'title';
                                } else {
                                    cell['html'] = row[c['n']]['v'];
                                    cell['cl'] = 'num';
                                }
                            }
                          /*  d3.keys(c).forEach(function(k) {
                                cell[k] = typeof c[k] == 'function' ? c[k](row,i) : row[c[k]];
                            }); */

                            return cell;
                        });
                    }).enter()
                    .append('td')
                    .html(function(d) { 
                        return d['html'];
                    })
                    .attr('class', function(d) {
                        return d['cl'];
                    });



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
                /*
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
                    */         
            }
        });
})();

function fetch(d) { debugger;
    var i=0, l = functions.length;
    while (i++ < l) d = functions[i-1].call(this, d);
    return d;
};