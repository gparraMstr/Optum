(function() {
	customVisInterface.FMSankey = (function() {
		customVisInterface.newInterface(FMSankey, customVisInterface.BaseInterface);
		FMSankey.prototype.transformData = function() {
			console.log('Entering transformData function.');
			// Get the DataInterface Object
			gridData = this.visualization.dataInterface;
			var rawGridData = gridData.getRawData(mstrmojo.models.template.DataInterface.ENUM_RAW_DATA_FORMAT.TREE, {
				hasSelection : true
			});

			var total = this.performAggregation(rawGridData);

			var createSankeyNodes = function(node, data) {
				if (typeof (node["attributeSelector"]) != "undefined") {
					var existingNode = data["nodes"].find(function(ele) {
						return ele["name"] == node["name"] + " - " + node["attributeHeader"]["n"];
					});
					if (existingNode == null) {
						var newNode = {};
						newNode["name"] = node["name"] + " - " + node["attributeHeader"]["n"];
						newNode["element"] = node["name"];
						if (typeof (node["linkInfo"]) != "undefined") {
							if (node["linkInfo"] != null && node["linkInfo"].length > 0) {
								var target = node["linkInfo"][0]["links"][0]["target"];
								newNode["editLinkTarget"] = target; // document
							}
						}
						newNode["attributeSelector"] = node["attributeSelector"]; // attribute column object
						newNode["attributeHeader"] = node["attributeHeader"]; // This is needed for selectors to work in documents.
						node["sankeyNodeKey"] = data["nodes"].length;
						data["nodes"].push(newNode);
					} else {
						var index = data["nodes"].findIndex(function(ele) {
							return ele === existingNode;
						});
						node["sankeyNodeKey"] = index;
					}
				}
				if (typeof (node["children"]) != "undefined") {
					for (key in node["children"]) {
						createSankeyNodes(node["children"][key], data);
					}
				}
			};

			var createSankeyLinks = function(node, data) {
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
						createSankeyLinks(childNode, data);
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
			createSankeyNodes(rawGridData, data);
			createSankeyLinks(rawGridData, data);

			this.data = data;
			console.log('Exiting transformData function.');
		};

		FMSankey.prototype.render = function() {
			// data: {nodes:[],links:[]}
			console.log('Entering render Function.');
			var units = this.getMetrics()[0];

			if (typeof (this.visualization.zoomFactor) == "undefined") {
				this.visualization.zoomFactor = {
					"width" : 1,
					"height" : 1
				};
			}

			var legendHeight = 14 * this.visualization.zoomFactor.height;

			var margin = {
				top : 75 * this.visualization.zoomFactor.height,
				right : 35 * this.visualization.zoomFactor.width,
				bottom : 45 * this.visualization.zoomFactor.height,
				left : 50 * this.visualization.zoomFactor.width
			}, width = this.visualization.domNode.parentNode.clientWidth - margin.left - margin.right, // mWidth - margin.left - margin.right, 908 or 1003
			height = this.visualization.domNode.parentNode.clientHeight - margin.top - margin.bottom - legendHeight; // mHeight - margin.top - margin.bottom 465 or 601; (14 is for the legend)

			var nodeWidth = 50 * this.visualization.zoomFactor.width;
			var titlesYSpacing = 55 * this.visualization.zoomFactor.height;
			var titles2YSpacing = 40 * this.visualization.zoomFactor.height;
			var titles3YSpacing = 24 * this.visualization.zoomFactor.height;
			var nodeXSpacing = 25 * this.visualization.zoomFactor.width;
			var nodePadding = 15 * this.visualization.zoomFactor.width;

			var fontSize = parseInt(9 * this.visualization.zoomFactor.height);

			var formatNumber = d3.format(",.0f"), // zero decimal places
			format = function(d) {
				return formatNumber(d) + " " + units;
			}, color = d3.scale.ordinal().domain([ "Eligible", "NotEligible", "MISSING" ]).range([ "#40CC5A", "#FF970F", "#8E99A0" ]);

			// append the svg canvas to the page
			d3.select("svg").remove();
			var svg = d3.select(this.visualization.domNode).append("svg").attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

			var attributes = this.getAttributes();
			// Add Attribute names at the top of the column of nodes
			var titles = svg.selectAll("text.titles").data(attributes).enter().append("text").attr("class", "titles").html(function(d) {
				return d;
			}).attr("x", function(d, i) {
				var offset = nodeXSpacing + i * ((width - nodeWidth) / 3);
				return offset;
			}) // offset+ 284
			.attr("y", -titlesYSpacing).style("font-family", "Tahoma,Arial,Verdana").style("font-size", fontSize + "pt").style("fill", "#006693").style("text-anchor", "middle") // middle
			.text(function(d, i) {
				var tempArray = d.split(" ");
				if (tempArray.length > 1) {
					return tempArray[0] + " " + tempArray[1];
				} else {
					return tempArray[0];
				}
			})

			var titles2 = svg.selectAll("text.titles2").data(attributes).enter().append("text").attr("class", "titles").html(function(d) {
				return d;
			}).attr("x", function(d, i) {
				var offset = nodeXSpacing + i * ((width - nodeWidth) / 3);
				return offset;
			}).attr("y", -titles2YSpacing).style("font-family", "Tahoma,Arial,Verdana").style("font-size", fontSize + "pt").style("fill", "#006693").style("text-anchor", "middle") // middle
			.text(function(d, i) {
				var tempArray = d.split(" ");
				if (tempArray.length > 2) {
					return tempArray[2];
				} else {
					return "";
				}
			})

			var titles3 = svg.selectAll("text.titles3").data(attributes).enter().append("text").attr("class", "titles").html(function(d) {
				return d;
			}).attr("x", function(d, i) {
				var offset = nodeXSpacing + i * ((width - nodeWidth) / 3);
				return offset;
			}).attr("y", -titles3YSpacing).style("font-family", "Tahoma,Arial,Verdana").style("font-size", fontSize + "pt").style("fill", "#006693").style("text-anchor", "middle") // middle
			.text(function(d, i) {
				var tempArray = d.split(" ");
				if (tempArray.length > 3) {
					return tempArray[3];
				} else {
					return "";
				}
			})

			// Set the sankey diagram properties
			var sankey = d3.sankey().nodeWidth(nodeWidth).nodePadding(nodePadding).size([ width, height ]);

			var path = sankey.link();

			// load the data

			// var nodeMap = {};
			// data.nodes.forEach(function(x) {
			// nodeMap[x.name] = x;
			// // nodeMap[x.attrName] = colTitles[x];
			// // nodeMap[x.value] = x.value;
			// });
			// data.links = data.links.map(function(x) {
			// return {
			// source : nodeMap[x.source],
			// target : nodeMap[x.target],
			// value : x.value
			// };
			// });
			sankey.nodes(this.data.nodes).links(this.data.links).layout(32);

			// Add in the links
			var link = svg.append("g").selectAll(".link").data(this.data.links).enter().append("path").attr("class", "link").attr("d", path).style("stroke-linecap", "butt").style("stroke-width", function(d) {
				return Math.max(2, d.dy);
			}).style("stroke", function(d) {
				if (d.source.name.indexOf("NotEligible") > -1) {
					return d.source.color = "#FF970F";
				} else {
					if (d.source.name.indexOf("Eligible") > -1) {
						return d.source.color = "#40CC5A";
					} else
						return d.source.color = "#8E99A0";
				}
			}).style("opacity", .9).sort(function(a, b) {
				return b.dy - a.dy;
			})
			// Default tooltip
			.append("title").text(function(d) {
				return d.source.element + " → " + d.target.element + ": " + format(d.value);
			});

			// Add in the nodes
			visInterface = this;
			var node = svg.append("g").selectAll(".node").data(this.data.nodes).enter().append("g").attr("class", "node").attr("transform", function(d) {
				return "translate(" + d.x + "," + d.y + ")";
			})
			// Drill down from Sankey node
			.on("click", function(d) {
				visInterface.applySelection(d); // dashboards
				visInterface.makeSelection(d); // documents
				var linkAction;
				try {
					linkAction = visInterface.visualization.model.getLinkActionImpl({}, d["attributeHeader"]);
				} catch (err) {
					return;
				}
				if (linkAction !== null) { // This code is for edit links only
					if (d.element != "MISSING") {
						var i = 0;
						while (d["attributeHeader"].es[0].n != d.element) {
							d["attributeHeader"].es.shift();
						}
						i = d["attributeHeader"].es.length - 1;
						while (i > 0) {
							if (d["attributeHeader"].es[i].n != d.element) {
								d["attributeHeader"].es.pop();
								i--;
							}
						}
						var elementID = d["attributeHeader"].es[0].id.substring(1, d["attributeHeader"].es[0].id.indexOf(";"));
						var attrID = d["attributeHeader"].es[0].id.substring(d["attributeHeader"].es[0].id.indexOf(";", 4) + 1, d["attributeHeader"].es[0].id.indexOf(";", 15));
						var documentId = d["editLinkTarget"].did
						window.open(window.location.href + "?evt=2048001&src=mstrWeb.2048001&src=mstrWeb.2048001&documentID=" + documentId + "&elementsPromptAnswers=" + attrID + ";" + attrID + ":" + elementID + "&originMessageID=" + mstrApp.getMsgID() + "&selectorMode=1", "_self"); // +"&visMode=0&currentViewMedia=1"
					} // not MISSING
				} // linkAction
			}); // on click

			// Add the rectangles for the nodes
			node.append("rect").attr("height", function(d) {
				return d.dy;
			}).attr("width", sankey.nodeWidth()).style("fill", function(d) {
				if (d.name.indexOf("NotEligible") > -1) {
					return d.color = "#FF970F";
				} else {
					if (d.name.indexOf("Eligible") > -1) {
						return d.color = "#40CC5A";
					} else
						return d.color = "#8E99A0";
				}
			}).style("stroke", function(d) {
				return d3.rgb(d.color);
			}).style("cursor", function(d) {
				if (d.name.indexOf("MISSING") > -1) {
					return "default";
				}
			}).append("title").text(function(d) {
				return d.name;
			});

			// Add in the metric count to the center of the nodes
			node.append("text").attr("x", sankey.nodeWidth() / 2).attr("y", function(d) {
				return (d.dy / 2)
			}).attr("dy", 4.1).style("font-family", "Tahoma,Arial,Verdana").style("font-size", fontSize + "pt").style("color", "#006693").style("text-shadow", "0px 0px 0px #006693") // #998E8E
			.style("font-weight", "300").attr("text-anchor", "middle").text(function(d) {
				return formatNumber(d.value);
			});

			var legendSize = 15 * this.visualization.zoomFactor.width;
			var legendSpacing = 90 * this.visualization.zoomFactor.width;

			// Add a legend
			var legend = svg.append("g").selectAll(".legend").data(color.domain().slice()).enter().append("g").attr("class", "legend").attr("transform", function(d, i) {
				var xOffset = i * legendSpacing;
				var yOffset = height + legendSize;
				return "translate(" + xOffset + "," + yOffset + ")";
			});

			legend.append("rect").attr("x", width).attr("width", width).attr("height", legendSize).style("fill", color).attr("stroke-width", .3).attr("stroke", "black").attr("x", 10).attr("width", legendSize);

			legend.append("text").attr("x", width).attr("width", width).attr("height", legendSize + (3 * this.visualization.zoomFactor.width))
			// .transition()
			.attr("x", 10 + (25 * this.visualization.zoomFactor.width)).attr("y", 9).attr("dy", ".35em").style("text-anchor", "start").style("font-family", "Tahoma,Arial,Verdana").style("font-size", fontSize + "pt").text(function(d) {
				return d;
			});

			function drawNoData(canvas_div_name) {
				var svg = d3.select(canvas_div_name).append("p").html("No data returned for this view. This might be because the applied filter excludes all data.").style("font-family", "Tahoma,Arial,Verdana").style("font-size", (fontSize - (1 * this.visualization.zoomFactor.height)) + "pt").style("color", "rgb(192, 0, 0)").style("font-weight", "bold").attr("text-anchor", "middle").style("font-size", fontSize - (1 * this.visualization.zoomFactor.height) + "pt");
			}
			console.log('Exiting render Function.');
		};
		function FMSankey(visualization) {
			customVisInterface.BaseInterface.apply(this, [ visualization ]);
		}
		return FMSankey;
	})();
})();