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

			visInterface = this;

			var createNodes = function(nodes, data) {
				if (typeof nodes != 'undefined') {
					$.each(nodes, function(index, node) {
						var newNode = {
							"values": [],
							"attributeSelector": null,
							"attributeHeader": null,
							"element": ''
						};
						
						$.each(node.headers, function(index, header) {
							newNode["values"][header.tname] = header.name;

							newNode["element"] = header.name;
							newNode["attributeSelector"] = header.attributeSelector;

							newNode["attributeKey"] = visInterface.getAttributeKey(newNode);
							newNode["attributeHeader"] = visInterface.getAttributeHeader(newNode);;
						});

						var widgetValues = [];

						$.each(node.values.slice(0, 5), function(index, value) {
							widgetValues.push(value.rv);
						});

						while(widgetValues.length < 5) {
							widgetValues.push(0);
						}

						newNode["values"][node.values[0].name] = widgetValues;

						$.each(node.values.slice(5), function(index, value) {
							newNode["values"][value.name] = value.v;
						});	

						data["nodes"].push(newNode);
					});
				}
			};

			var createColumns = function(nodes, data) {
				if (typeof nodes != 'undefined') {
					var index = 0;

					var nodesFiltered = nodes.filter(function(node) {
						return node.otp != -1;
					});

					$.each(nodesFiltered, function(idx, node) {
						if (node.otp == 12) {
							data["columns"].push(node);
						} else {
							index = idx;
							data["columns"].push(node);
							
							return false;
						}
					});

					$.each(nodesFiltered.slice(index + 5), function(idx, node) {
						data["columns"].push(node);
					});
				}
			};

			var createLinks = function(nodes, data) {
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
			
			data["nodes"] = [];
			data["links"] = [];
			data["columns"] = [];

			createNodes(rawGridData, data);
			createColumns(gridData.getColumnHeaderData(), data);
			//createLinks(rawGridData, data);

			this.data = data;
			
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

            // create table
            
            var x = d3.scale.ordinal()
                 .rangeRoundBands([0, width], 0.1);

            var data = this.data.nodes; //this.visualization.dataInterface.getRawData(mstrmojo.models.template.DataInterface.ENUM_RAW_DATA_FORMAT.ROWS);
            var columns = this.data.columns; //this.visualization.dataInterface.getColumnHeaderData();

            var metricName = this.visualization.dataInterface.getColHeaders(0).getHeader(0).getName();

            var table = d3.select(this.visualization.domNode)
                .append('table')
                .attr('cellspacing', '0');


            // create table header
            table.append('colgroup').selectAll('col')
            	.data(columns).enter()
                .append('col');

            // create table header
            table.append('tbody').append('tr')
                .selectAll('th')
                .data(columns).enter()
                .append('th')
                .attr('class', function(d) {
                    return (d['otp'] == 5 ? 'num':'title');
                })
                .text(function(d) {
                    return d['n'];
                });

            visInterface = this;

            // create table body
            table.select('tbody')
                //.attr("height", height - 80)
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

                                cell["element"] = row['element'];
								cell["attributeSelector"] = row['attributeSelector'];
								cell["attributeHeader"] = row['attributeHeader'];

                                cell['id'] = c['id'] + i;
                            } else {
                                cell['html'] = row.values[c['n']];
                                cell['cl'] = 'num';

                                cell['id'] = c['oid'] + i;
                            }
                        }

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
                    	var svg = d3.bullet();
                    	svg.height(25).width(350);

                    	d3.select(td).selectAll("svg")
			                .data([{"title":"Revenue","subtitle":"US$, in thousands","ranges":[d['html'][2],d['html'][3],d['html'][4]],
			                		"measures":[d['html'][1]],"markers":[d['html'][0]]}])
			                .enter().append("svg")
			                .attr("class", "bullet")
			             	.attr("width", "100%")
			                .attr("height", 50)
			                .append("g")
			                .attr("transform", "translate(5, 10)")
			                .call(svg);
                    }

                    $(td).on('click', function(evt) {
                    	d3.event = evt;
                    	return false;
                    });
                  
                	return td;
                })
                .on("click", function(d) {

                	var evt = d3.event;

                	var div = document.createElement("DIV");
					div.style.position = "absolute";

					// Version para Chrome
					if (mstrmojo.dom.isWK) {
						div.style.left = evt.layerX + "px";
						div.style.top = evt.layerY + "px";

					} else {
						// Version para Firefox 37.0
						div.style.left = evt.layerX - visInterface.visualization.domNode.scrollLeft + "px";
						div.style.top = evt.layerY - visInterface.visualization.domNode.scrollTop + "px";

						// Version para Firefox 39.0
						if (typeof fetch != undefined) {
							var posXinfo = evt.pageX + "px";
							var posYinfo = (evt.pageY - 110) + "px";
							div.style.left = posXinfo;
							div.style.top = posYinfo;
						}
					}

					visInterface.visualization.domNode.appendChild(div);

					d.attributeHeader.sc.anchor = div;
					
                    visInterface.applySelection(d); // dashboards
					visInterface.makeSelection(d);

					div.remove();

					return true;
                })
                .attr('class', function(d) {
                	if (typeof d['html'] == 'object') {
                		return 'widget'
                	}
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
    

			console.log('Exiting render Function.');
		};
		function MstrVisD3MultiChart(visualization) {
			customVisInterface.BaseInterface.apply(this, [ visualization ]);
		}
		return MstrVisD3MultiChart;
	})();
})();