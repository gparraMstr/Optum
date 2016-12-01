(function() {
	if (typeof (customVisInterface) == "undefined") {
		customVisInterface = {};
	}

	customVisInterface.newInterface = function(newInterface, baseInterface) {
		newInterface.prototype = baseInterface.prototype;
		// newInterface.prototype.constructor = newInterface;
	};

	// Constructor
	customVisInterface.BaseInterface = function(visualization) {
		this.visualization = visualization;
		this.plot();
	};

	customVisInterface.BaseInterface.prototype.plot = function() {
		this.transformData();
		this.render();
	};

	customVisInterface.BaseInterface.prototype.transformData = function() {
	};

	customVisInterface.BaseInterface.prototype.render = function() {
	};

	customVisInterface.BaseInterface.prototype.resetSelections = function(node) {
		this.visualization.resetSelections();
	}
	// Documents
	customVisInterface.BaseInterface.prototype.makeSelection = function(node, x, y) {
		// Only if this is a document
		var attElemId;
		for ( var name in this.visualization._viSelections) {
			for ( var id in this.visualization._viSelections[name]) {
				attElemId = this.visualization._viSelections[name][id][0].id;
			}
			break;
		}

		// Now select the element
		this.visualization.makeSelection(attElemId, node["attributeSelector"]);
	};
	// dashboards
	customVisInterface.BaseInterface.prototype.applySelection = function(node) {
		// Code for using the visualization as selector
		try {
			this.visualization.applySelection(node["attributeSelector"]);
		} catch (err) {
			console.log("An error call while calling applySelection.");
		}
		// End code for using the visualization as selector

	};

	customVisInterface.BaseInterface.prototype.getAttributeKey = function(node) {
		var attributes = this.visualization.model.data.gts.row;
		for (key in attributes) {
			var attribute = attributes[key];
			if (node["attributeSelector"].tid == attribute.id) {
				return key;
			}
		}
		return null;
	};

	customVisInterface.BaseInterface.prototype.getattributeHeader = function(node) {
		var key = node["attributeKey"];
		if (key != null) {
			var attributes = this.visualization.model.data.gts.row;
			return attributes[key];
		}
		return null;
	};

	customVisInterface.BaseInterface.prototype.getLinkInfo = function(node) {
		var key = node["attributeKey"];
		if (key != null) {
			return node["attributeHeader"]["lm"];
		}
		return null;
	};

	customVisInterface.BaseInterface.prototype.performAggregation = function(node) {
		var total = 0;
		if (typeof (node["children"]) != "undefined") {
			for (key in node["children"]) {
				total = total + this.performAggregation(node["children"][key]);
			}
			node["value"] = total;
		} else {
			total = node["value"];
		}
		if (typeof (node["attributeSelector"]) != "undefined") {
			node["attributeKey"] = this.getAttributeKey(node);
			node["attributeHeader"] = this.getattributeHeader(node);
			node["linkInfo"] = this.getLinkInfo(node);
		}
		return total;
	};

	customVisInterface.BaseInterface.prototype.getAttributes = function() {
		try {
			var attributes = [];
			var size = this.visualization.dataInterface.getRowTitles().size();
			for (var i = 0; i < size; i++) {
				var attribute = this.visualization.dataInterface.getRowTitles().getTitle(i).getName();
				attributes.push(attribute);
			}
			return attributes;
		} catch (error) {
			return null;
		}
	};

	customVisInterface.BaseInterface.prototype.getMetrics = function() {
		try {
			var metrics = [];
			var size = this.visualization.dataInterface.getColHeaders(0).size();
			for (var i = 0; i < size; i++) {
				var metric = this.visualization.dataInterface.getColHeaders(0).getHeader(i).getName();
				metrics.push(metric);
			}
			return metrics;
		} catch (error) {
			return null;
		}
	};

	customVisInterface.BaseInterface.prototype.drawNoData = function(divName) {
		var svg = d3.select(divName).append("p").html("No data returned for this view. This might be because the applied filter excludes all data.").style("font-family", "Tahoma,Arial,Verdana").style("font-size", "8pt").style("color", "rgb(192, 0, 0)").style("font-weight", "bold").attr("text-anchor", "middle").style("font-size", "8pt");
	};

})();
