(function() {
	customVisInterface.MstrVisD3MultiChart = (function() {
		customVisInterface.newInterface(MstrVisD3MultiChart, customVisInterface.BaseInterface);
		
		MstrVisD3MultiChart.prototype.transformData = function() {
			console.log('Entering transformData function.');
			
			// Get the DataInterface Object
			gridData = this.visualization.dataInterface;

			var rawGridData = gridData.getRawData(mstrmojo.models.template.DataInterface.ENUM_RAW_DATA_FORMAT.ROWS_ADV, {
				hasSelection : true,
				hasTitleName: true
			});

			var createNodes = function(nodes, data) {
				if (typeof nodes != 'undefined') {
					$.each(nodes, function(index, node) {
						var newNode = {
							"values": [],
							"attributeSelector": []
						};
						
						$.each(node.headers, function(index, header) {
							newNode["values"][header.tname] = header.name;
							newNode["attributeSelector"].push(header.attributeSelector);
						});

						var widgetValues = [];

						$.each(node.values, function(index, value) {
							if (index < 5) {
								widgetValues.push(value.rv);
							}
						});

						while(widgetValues.length < 5) {
							widgetValues.push(0);
						}

						newNode["values"][node.values[0].name] = widgetValues;

						$.each(node.values, function(index, value) {
							if (index >= 5) {
								newNode["values"][value.name] = value.v;
							}
						});	

						data["nodes"].push(newNode);
					});
				}
			};

			var createColumns = function(nodes, data) {
				if (typeof nodes != 'undefined') {
					var index = 0;

					$.each(nodes, function(idx, node) {
						if (node.otp == 12) {
							data.push(node);
						} else {
							index = idx;

							if (node.otp == -1) {
								index++;
								data.push(nodes[index])

							} else {
								data.push(node);
							}

							return false;
						}
					});

					index += 5;

					$.each(nodes, function(idx, node) {
						if (idx >= index) {
							data.push(node);
						}
					});
				}
			};

			var createLinks = function(node, data) {
				if (typeof (node["children"]) != "undefined") {
					for (key in node["children"]) {
						var childNode = node["children"][key];
						if (typeof (node["attributeKey"]) != "undefined") {
							var existingLink = data["links"].find(function(ele) {
								var sameSource = ele["source"]["name"] == data["nodes"][node["sankeyNodeKey"]]["name"];
								var sameTarget = ele["target"]["name"] == data["nodes"][childNode["sankeyNodeKey"]]["name"];
								return sameSource && sameTarget;
							});
							if (existingLink != null) {
								existingLink.value += childNode.value;
							} else {
								var newLink = {};
								newLink["source"] = data["nodes"][node["sankeyNodeKey"]];
								newLink["target"] = data["nodes"][childNode["sankeyNodeKey"]];
								newLink["value"] = childNode.value;
								data["links"].push(newLink);
							}
						}
						createLinks(childNode, data);
					}
				}
			};

			var createAttributes = function(dataInterface, data) {
				var size = dataInterface.getRowTitles().size();
				for (var i = 0; i < size; i++) {
					var attribute = dataInterface.getRowTitles().getTitle(i).getName();
					data["attributes"].push(attribute);
				}
			};

			var createMetrics = function(dataInterface, data) {
				var size = dataInterface.getColHeaders(0).size();
				for (var i = 0; i < size; i++) {
					var attribute = dataInterface.getColHeaders(0).getHeader(i).getName();
					data["metrics"].push(attribute);
				}
			};

			// Check for no data and display message
			try {
				var last;
				while (last = this.visualization.domNode.lastChild)
					this.visualization.domNode.removeChild(last);
				if (gridData.data.eg) {
					drawNoData(this.visualization.domNode);
					return;
				}
			} catch (err) {
				drawNoData(this.visualization.domNode);
				return;
			}

			var data = {};
			var columns = [];
			
			data["nodes"] = [];
			data["links"] = [];

			createNodes(rawGridData, data);
			createColumns(gridData.getColumnHeaderData(), columns);
			//createLinks(rawGridData, data);

			this.data = data;
			this.columns = columns;
			
			console.log('Exiting transformData function.');
		};

		MstrVisD3MultiChart.prototype.render = function() {
			// data: {nodes:[],links:[]}
			console.log('Entering render Function.');

			//...YOUR JS CODE...
            this.visualization.domNode.innerText = "Empty text";

            // Define this code as a plugin in the mstrmojo object
            if (!mstrmojo.plugins.Optum) {
                mstrmojo.plugins.Optum = {};
            }

            if (this.visualization.domNode.childNodes.length === 1) {
                this.visualization.domNode.removeChild(this.visualization.domNode.childNodes[0]);
            }
            
            var margin = {top: 10, right: 30, bottom: 50, left: 80},
                 width = parseInt(this.visualization.width,10) - margin.left - margin.right,
                 height = parseInt(this.visualization.height,10) - margin.top - margin.bottom;


           /* var chart = d3.select(this.visualization.domNode).append("svg").attr("width", width + margin.left + margin.right)
                 .attr("height", height + margin.top + margin.bottom)
                 .append("g")
                 .attr("transform", "translate(" + margin.left + "," + margin.top + ")"); */

            // create table
            
            var x = d3.scale.ordinal()
                 .rangeRoundBands([0, width], 0.1);

            var data = this.data.nodes; //this.visualization.dataInterface.getRawData(mstrmojo.models.template.DataInterface.ENUM_RAW_DATA_FORMAT.ROWS);
            var columns = this.columns; //this.visualization.dataInterface.getColumnHeaderData();

            debugger;

            var metricName = this.visualization.dataInterface.getColHeaders(0).getHeader(0).getName();

            var table = d3.select(this.visualization.domNode)
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

                        if (typeof row.values[c['n']] != 'undefined') {
                            if ((c['otp'] == 12) && (typeof row.values[c['n']] == "string")) {
                                cell['html'] = row.values[c['n']];
                                cell['cl'] = 'title';

                                cell['id'] = c['id'] + i;
                            } else {
                                cell['html'] = row.values[c['n']];
                                cell['cl'] = 'num';

                                cell['id'] = c['oid'] + i;
                            }

                            
                        }
                      /*  d3.keys(c).forEach(function(k) {
                            cell[k] = typeof c[k] == 'function' ? c[k](row,i) : row[c[k]];
                        }); */

                        return cell;
                    });
                }).enter()
                .append(function(d) {
                	var td = document.createElement("td");
                	td.setAttribute('id', d['id']);

                	if (typeof d['html'] == 'string') {
                		//d3.select(this.parentNode).append("td").text(d['html']);
                    	td.innerHTML = d['html'];
                    } else {
                    	d3.select(td).selectAll("svg")
			                .data([{"title":"Revenue","subtitle":"US$, in thousands","ranges":[d['html'][0],d['html'][1],d['html'][2]],
			                		"measures":[d['html'][3]],"markers":[d['html'][4]]}])
			                .enter().append("svg")
			                .attr("class", "bullet")
			                .attr("width", 400)
			                .attr("height", 75)
			                .append("g")
			                .attr("transform", "translate(10, 10)")
			                .call(d3.bullet().height(35));
                    }

                	return this.appendChild(td);
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

			console.log('Exiting render Function.');
		};
		function MstrVisD3MultiChart(visualization) {
			customVisInterface.BaseInterface.apply(this, [ visualization ]);
		}
		return MstrVisD3MultiChart;
	})();
})();