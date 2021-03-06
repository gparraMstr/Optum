(function() {
	customVisInterface.MstrVisD3MultiChart = (function() {
		customVisInterface.newInterface(MstrVisD3MultiChart, customVisInterface.BaseInterface);

		MstrVisD3MultiChart.prototype.transformData = function() {
			console.log('Entering transformData function.');

			visInterface = this;

			var createNewNode = function() {
				return {
					"values": [],
					"attributeSelector": null,
					"attributeHeader": null,
					"element": ''
				};
			};

			// Get the DataInterface Object
			gridData = this.visualization.dataInterface;

			//Fetch MSTR raw data from Document/Dashboard
			var rawGridData = gridData.getRawData(mstrmojo.models.template.DataInterface.ENUM_RAW_DATA_FORMAT.ROWS_ADV, {
				hasSelection: true,
				hasTitleName: true
			});

			var createNodes = function(nodes, data) {
				if (typeof nodes != 'undefined') {

					nodes.forEach(function(node, index) {
						var row = [];

						//Process attribute columns
						node.headers.forEach(function(header, index) {
							var newNode = createNewNode();

							newNode["values"] = header.name;

							newNode["element"] = header.name;
							newNode["attributeSelector"] = header.attributeSelector;

							newNode["attributeKey"] = visInterface.getAttributeKey(newNode);
							newNode["attributeHeader"] = visInterface.getAttributeHeader(newNode);
							newNode["linkInfo"] = visInterface.getLinkInfo(newNode);
							row[header.tname] = newNode;
						});

						//Process metrics for Widget
						//Take first 5 metrics that will be used in visualization
						var newNode = createNewNode();

						var widgetValues = [];

						node.values.slice(0, 5).forEach(function(value, index) {
							widgetValues.push(value.rv);
						});

						while (widgetValues.length < 5) {
							widgetValues.push(0);
						}

						newNode["values"] = widgetValues;
						row[node.values[0].name] = newNode;

						//Process remaining metrics
						//Add individual column for each one
						node.values.slice(5).forEach(function(value, index) {
							var newNode = createNewNode();

							newNode["values"] = value.v;

							row[value.name] = newNode;
						});

						data["nodes"].push(row);
					});
				}
			};


			var createColumns = function(nodes, data) {
				if (typeof nodes != 'undefined') {
					var index = 0;

					var nodesFiltered = nodes.filter(function(node) {
						return node.otp != -1;
					});

					nodesFiltered.every(function(node, idx) {
						if (node.otp == 12) {
							data["columns"].push(node);

						} else {
							index = idx;
							data["columns"].push(node);

							return false;
						}

						return true;
					});

					nodesFiltered.slice(index + 5).forEach(function(node, index) {
						data["columns"].push(node);
					});
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

			var data = {
				nodes: [],
				columns: []
			};

			createNodes(rawGridData, data);
			createColumns(gridData.getColumnHeaderData(), data);

			this.data = data;

			console.log('Exiting transformData function.');
		};

		MstrVisD3MultiChart.prototype.render = function() {
			// data: {nodes:[],links:[]}
			console.log('Entering render Function.');

			//...YOUR JS CODE...
			this.visualization.domNode.innerText = "Empty text";

			//Pointer to visualization interface
			visInterface = this;

			// Define this code as a plugin in the mstrmojo object
			if (!mstrmojo.plugins.Optum) {
				mstrmojo.plugins.Optum = {};
			}

			if (this.visualization.domNode.childNodes.length === 1) {
				this.visualization.domNode.removeChild(this.visualization.domNode.childNodes[0]);
			}

			var margin = {
					top: 10,
					right: 30,
					bottom: 50,
					left: 80
				},
				width = parseInt(this.visualization.width, 10) - margin.left - margin.right,
				height = parseInt(this.visualization.height, 10) - margin.top - margin.bottom;

			// create table

			var x = d3.scale.ordinal()
				.rangeRoundBands([0, width], 0.1);

			var data = this.data.nodes;
			// TODO: Figure out why the first row doesn't display without this hack....
			data.unshift({}); 
			var columns = this.data.columns;

			//Create D3 table
			var table = d3.select(this.visualization.domNode)
				.append('table')
				.attr('cellspacing', '0');

			// create table header
			table.append('colgroup').selectAll('col')
				.data(columns).enter()
				.append('col')
				.attr('class', function(d, i) {
					return i;
				});


			// create table header
			var headers = table.append('tbody').append('tr')
				.selectAll('th')
				.data(columns).enter()
				.append(function(d) {
					var th = document.createElement("th");

					//Add jQuery ti release event so 
					//D3 can process it.
					$(th).on('click', function(evt) {
						d3.event = evt;
						return false;
					});

					return th;
				})
				.attr('class', function(d) {
					if (d['otp'] == 12) {
						return 'title';
					}
					if (this.previousSibling.className == 'title') {
						return 'widget';
					}
					return 'num';
				})
				.text(function(d) {
					return d['n'];
				});

			var dropdown = headers.append('input')
				.attr('type', 'button')
				.attr('value', "...")
				.attr('class', 'dropdown-button')
				.on("click", function(d) {
					var dropdownMenu = $(this).next();
					dropdownMenu[0].classList.toggle("show");
				});

			var dropDownContent = headers.append('div')
				.attr('class', 'dropdown-content');

			var sortColumn = function(target, data, sortAsc) {
				//determine sort key (different for attributes and metrics)
				var isAttributeColumn = data['otp'] == 12 ? true : false;
				if (isAttributeColumn) {
					var sortKey = [data['otp'], data['id'], data['fid'], "21", "", "1"];
				} else {
					var sortKey = [data['otp'], data['oid'], "", "", "", "1"];
				}
				sortKey = sortKey.join("!");

				//Retrieve ID
				var id = $(target).closest('table').closest('div').attr("id");
				document.visualization = mstrmojo.all[id];
				var axisSorts = [],
					sorts = [];
				axisSorts.push({
					key: sortKey, //sortKey
					isAsc: sortAsc
				});
				sorts.push(axisSorts);
				document.visualization.parent.controller.onAdvancedSort(document.visualization, sorts, null, null, 1);
			};

			dropDownContent.append('a').attr('href', 'javascript:void(0)')
				.on("click", function(d) {
					sortColumn(this, d, true);
				})
				.text('Sort Ascending');

			dropDownContent.append('a').attr('href', 'javascript:void(0)')
				.on("click", function(d) {
					sortColumn(this, d, false);
				})
				.text('Sort Descending');

			dropDownContent.append('a').attr('href', 'javascript:void(0)')
				.on("click", function(d, i) {
					var tbl = $(this).closest('table');
					var col = i + 1;
					tblHeader = tbl[0].querySelectorAll('th:nth-child(' + col + ')');
					tblHeader.forEach(function(cell) { // iterate and hide
						cell.style.display = 'none';
					});

					tblRows = tbl[0].querySelectorAll('td:nth-child(' + col + ')');
					tblRows.forEach(function(cell) { // iterate and hide
						cell.style.display = 'none';
					});
					document.visualization = mstrmojo.all[visInterface.visualization.id];
					var action = document.visualization.model.getColumnResizeAction(d.id, d.otp, 0, 1, false);
					document.visualization.controller.onXtabColumnsResized(document.visualization, action);
					// document.visualization.model.resizeXtabColumn(
					// 	document.visualization.model.getColumnResizeAction(d.id, d.otp, 0, 1, true) 
					// 	//document.visualization.parent.controller._getXtabCallback(document.visualization)
					// );


				})
				.text('Hide Column');

			// create table body
			var rows = table.select('tbody')
				.selectAll('tr')
				.data(data).enter()
				.append('tr');
			rows.selectAll('td')
				.data(function(row, i) {
					return columns.map(function(c) {
						// compute cell values for this specific row
						var cell = {};

						if (typeof row[c['n']] != 'undefined') {
							if (c['otp'] == 12) {
								cell['html'] = row[c['n']].values;
								cell['cl'] = 'title';

								cell["element"] = row[c['n']]['element'];
								cell["attributeSelector"] = row[c['n']]['attributeSelector'];
								cell["attributeHeader"] = row[c['n']]['attributeHeader'];

								cell['id'] = c['id'] + i;
							} else {
								cell['html'] = row[c['n']].values;
								cell['cl'] = 'num';

								cell['id'] = c['oid'] + i;
							}
						}

						return cell;
					});
				}).enter()
				.append(function(d, i) {
					var td = document.createElement("td");
					td.setAttribute('id', d['id']);

					if (typeof d['html'] == 'string') {
						td.innerHTML = d['html'];
					} else {
						var svg = d3.bullet();
						svg.height(20).width(150);

						d3.select(td).selectAll("svg")
							.data([{
								"ranges": [d['html'][2], d['html'][3], d['html'][4]],
								"measures": [d['html'][0]],
								"markers": [d['html'][1]],
								"thresholdReached": d['html'][0] > d['html'][1] ? true : false
							}])
							.enter().append("svg")
							.attr("class", "bullet")
							.attr("width", 160)
							.attr("height", 40)
							.append("g")
							.attr("transform", "translate(0, 10)")
							.call(svg);
					}

					//Add jQuery ti release event so 
					//D3 can process it.
					$(td).on('click', function(evt) {
						d3.event = evt;
						return false;
					});


					if (this.rowIndex == 1 && typeof d.attributeHeader != 'undefined'&& typeof d.attributeHeader.sc != 'undefined'){
						//force selection of first row 
						visInterface.applySelection(d); // dashboards
						visInterface.makeSelection(d);

						var selected = this.classList.contains("selected-row");

						mstrmojo.css.toggleClass(this, "selected-row", !selected);

					}
					
					return td;
				})
				.on("click", function(d) {

					var previouslySelected = Array.from(document.getElementsByClassName("selected-row"), function(row) {
						row.classList.remove("selected-row");
					});

					if ((typeof d.attributeHeader != 'undefined') &&
						(typeof d.attributeHeader.sc != 'undefined')) {
						var evt = d3.event;

						//var div = document.createElement("DIV");
						//div.style.position = "absolute";

						// // Version para Chrome
						// if (mstrmojo.dom.isWK) {
						// 	div.style.left = evt.layerX + "px";
						// 	div.style.top = evt.layerY + "px";

						// } else {
						// 	// Version para Firefox 37.0
						// 	div.style.left = evt.layerX - visInterface.visualization.domNode.scrollLeft + "px";
						// 	div.style.top = evt.layerY - visInterface.visualization.domNode.scrollTop + "px";

						// 	// Version para Firefox 39.0
						// 	if (typeof fetch != undefined) {
						// 		var posXinfo = evt.pageX + "px";
						// 		var posYinfo = (evt.pageY - 110) + "px";
						// 		div.style.left = posXinfo;
						// 		div.style.top = posYinfo;
						// 	}
						// }

						//visInterface.visualization.domNode.appendChild(div);

						//d.attributeHeader.sc.anchor = div;

						visInterface.applySelection(d); // dashboards
						visInterface.makeSelection(d);

						var selected = document.getElementById(d.id).parentElement.classList.contains("selected-row");

						mstrmojo.css.toggleClass(document.getElementById(d.id).parentElement, "selected-row", !selected);

						//var row = $(this).closest('tr');
						//row[0].className += "selected-row";

						//div.remove();

						//visInterface.resetSelections();
					}

					var linkAction;
					try {
						linkAction = visInterface.visualization.model.getLinkActionImpl({}, d["attributeHeader"], 0);
					} catch (err) {
						return;
					}
					if (linkAction !== null) { // This code is for edit links only
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
						var documentId = linkAction.linkInfo.target.did;
						window.open(window.location.href + "?evt=" + linkAction.evt + "&documentID=" + documentId + "&elementsPromptAnswers=" + d.attributeHeader.id + ";" + d.id + "&originMessageID=" + mstrApp.getMsgID() + "&selectorMode=1", "_blank"); // +"&visMode=0&currentViewMedia=1"
				} // linkAction

					return false;
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
			customVisInterface.BaseInterface.apply(this, [visualization]);
		}
		return MstrVisD3MultiChart;
	})();
})();

// Close the dropdown if the user clicks outside of it
window.onclick = function(event) {
	if (!event.target.matches('.dropdown-button')) {

		var dropdowns = document.getElementsByClassName("dropdown-content");
		var i;
		for (i = 0; i < dropdowns.length; i++) {
			var openDropdown = dropdowns[i];
			if (openDropdown.classList.contains('show')) {
				openDropdown.classList.remove('show');
			}
		}
	}
}