/**
 * MstrVisD3MultiChart is the plugin for Optum project to support Multichart visualization 
 * in HTML5 for Dashboards.
 */

////////////////////////////////////////////////////////////////////////////////////////////////////
// _HasSelector.js
(function() {

    /**
     * <p>
     * A mixin for creating the supporting Selector action from visualization.
     * <p>
     * 
     * @mixin
     */
    mstrmojo._HasSelector = mstrmojo.provide('mstrmojo._HasSelector',

    /**
     * @lends mstrmojo._HasSelector.prototype
     */
    {
        _mixinName : 'mstrmojo._HasSelector',
        /**
         * Prepare data for this mixin
         */
        postBuildRendering : function() {
            if (this._super) {
                this._super();
            }
            if (!this.dfm) {

                var ts = this.model.gts;
                if (ts) {
                    var tts = (ts.row || []).concat(ts.col || []);
                    var i = 0, tCnt = 0, fCnt = 0, len = tts && tts.length, t = null, r = null;
                    for (; i < len; i++) {
                        t = tts[i];
                        if (t.otp != -1) {
                            tCnt++;
                            if (t.es) {
                                fCnt++;
                                r = t;
                            }
                        }
                    }
                    this.dfm = (fCnt == 1 && tCnt == 1) ? r : null;
                }
            }
        },
        /**
         * Handle simple selector action
         * 
         * @param {string}
         *            Attribute element id, should be as from DataFormater
         */
        makeSelection : function(attElemId, dfm) {
            var sc = dfm && dfm["sc"];
            if (sc != null) {
                var dm = this.model.docModel;
                if (typeof (sc["tks"]) != "undefined") {
                    var ifws = dm.getTargetInfoWin(sc["tks"]);
                    if (ifws && ifws.length) {
                        for (var i = 0; i < ifws.length; i++) {
                            dm.showInfoWin(ifws[i], sc.anchor, "h", true);
                        }
                    }
                }
            }
            var events = [];
            var scm = this.model.getSelectorControlMapInfo();
            if (dfm) {
                // reset previous selections
                for (var i = 0; i < scm.length; i++) {
                    if (scm[i].sc) {
                        events.push(this.getEventForSelection("u;;(All)", scm[i], this.model));
                    }
                }
                // make the selection of the new element
                events.push(this.getEventForSelection(attElemId, dfm, this.model));
                if (events.length > 0) {
                    this.submitEvents(events);
                }
            }
        },
        submitEvents : function(events) {
            this.model.controller.model.slice({
                bufferedSlices : true,
                tks : (mstrmojo.hash.any(events) || {}).tks,
                events : events
            });
        },
        getEventForSelection : function(elementID, dfm, model) {
            var m = model.data, sc = dfm && dfm["sc"];
            if (sc != null) {
                var result = {
                    ck : sc.ck,
                    eid : elementID,
                    src : m.k,
                    tks : sc.tks,
                    ctlKey : sc.ckey,
                    include : true
                };
                return result;
            }
            return null;
        },
        resetSelections : function() {
            var events = [];
            var scm = this.model.getSelectorControlMapInfo();
            // reset previous selections
            for (var i = 0; i < scm.length; i++) {
                if (scm[i].sc) {
                    events.push(this.getEventForSelection("u;;(All)", scm[i], this.model));
                }
            }
            if (events.length > 0) {
                this.submitEvents(events);
            }
        },
        /**
         * Check if given element is currently selected in selector functionality
         * 
         * @param {string}
         *            value should be as from DataFormater
         * @return {bool} is element selected
         */
        isElementSelected : function(attElementID) {
            if (!this.idSelected) {
                this.idSelected = -1;
                if (this.dfm && this.dfm.sc) {
                    if (this.dfm.sc.ces && this.dfm.sc.ces.length > 0) {
                        var idx = this.dfm.sc.ces[0].id;
                        this.idSelected = parseInt(idx.substr(idx.lastIndexOf(":") + 1));
                        if (isNaN(this.idSelected)) {
                            idx = idx.substr(0, idx.lastIndexOf(":"));
                            this.idSelected = parseInt(idx.substr(idx.lastIndexOf(":") + 1));
                        }
                    }
                }
            }
            attElementID = attElementID.substr(0, attElementID.lastIndexOf(":"));
            attElementID = parseInt(attElementID.substr(attElementID.lastIndexOf(":") + 1));
            return attElementID == this.idSelected;
        }
    });
}());
// //////////////////////////////////////////////////////////////////////////////////////////////////
(function () {
    // We need to define this code as plugin in mstrmojo object
    if (!mstrmojo.plugins.Optum) {
        mstrmojo.plugins.Optum = {};
    }
    // Visualization requires library to render, and in this
    mstrmojo.requiresCls("mstrmojo.CustomVisBase", "mstrmojo.models.template.DataInterface", "mstrmojo._HasSelector");

    // Declaration of the visualization object
    mstrmojo.plugins.Optum.MstrVisD3MultiChart = mstrmojo.declare(
        //We need to declare that our code extends CustomVisBase
        mstrmojo.CustomVisBase,
        [ mstrmojo._HasSelector ],
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
                    url: "../plugins/Optum/javascript/jquery-3.1.1.min.js"              
                },
                {
                    url: "../plugins/Optum/javascript/bullet.js"              
                }, 
                {
                    url : "../plugins/Optum/javascript/BaseInterface.js"
                }, 
                {
                    url : "../plugins/Optum/javascript/MstrVisD3MultiChartInterface.js"
                }
            ],
            /**
            * Rendering Multichart using D3 JS framework for Optum project 
            */
            plot: function () { 
                this.customVisInterface = new customVisInterface.MstrVisD3MultiChart(this);
            }
        });
})();

function fetch(d) { debugger;
    var i=0, l = functions.length;
    while (i++ < l) d = functions[i-1].call(this, d);
    return d;
};