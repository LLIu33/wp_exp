function App() {}
    App.prototype.draw = function (config) {
        this.config = config;
        this._init();
        this._setDataProvider(this.config.dataProvider);
        this._drawFloor();
    };
    App.prototype.createSeatsLine = function (shapesQty, startFrom) {
        var maxIdShape = _.max(self.shapes, function (shape) {
            return shape.id;
        });
        var maxId = maxIdShape.id + 1;
        for(var i = 1;  i <= shapesQty; i++) {
            var shape = self.createDummyShape('rect', self.shapes.length);
            if( ! _.isUndefined(startFrom)) {
                shape.number = +startFrom + i-1;
            }

            shape.id = maxId++;
            self.shapes.push(shape);
        }
        self._createShapes(self.shapes);
        self.saveGraph();
    };
    App.prototype.createDummyShape = function (type, shapesLength) {
        return { x: 10 + 40 * shapesLength, y: 10, w: 40, h:40, color: 'red', number: Math.floor((Math.random() * 500) + 251), type: type };
    };
    App.prototype.rotate = function (element) {
        element.transition()
            .duration(this.duration)
            .attr("transform", function(d) {
                var degree = 0;
                if( ! _.isUndefined(d.rotate)) {
                    degree = d.rotate;
                }
                var x = d.x;
                var y =  d.y;
                return d3.svg.transform()
                    .rotate(degree)
                    .translate(x, y)();
            })
    };
    App.prototype.draggable = function () {
        return d3.behavior.drag()
            .on("drag", function(d,i) {
                var selection = d3.selectAll('.selected');
                if( selection[0].indexOf(this) == -1) {
                    selection.classed("selected", false);
                    selection = d3.select(this);
                    selection.classed("selected", true);
                }
                selection.attr("transform", function( d, i) {
                    if( ! _.isUndefined(d)) {
                        d.x += d3.event.dx;
                        d.y += d3.event.dy;
                        return "translate(" + [ d.x,d.y ] + ")"
                    }
                });
            })
            .on("dragend", function(d){
                self.saveGraph();
            });
    };
    /*App.prototype.removeShapes = function() {

    };*/
    App.prototype.selectAllShapes = function () {
        var shapes = [];
        d3.selectAll('g.point').each(function (d) {
            shapes.push(d);
        });
        return shapes;
    };
    App.prototype.getCategoriesInfo = function () {
        var shapesList = this.selectAllShapes();
        var colorsList = this._getUniqueColorsList(shapesList);
        var result = {};

        _.each(colorsList, function(color){
            result[color] = [];
            _.each(shapesList, function(shape) {
                if(shape.color === color) {
                    result[color].push(shape);
                }
            });
        });
        return result;
    };
    App.prototype.updateColorsAndCountsForTheElements = function () {
        var cathegories = this.getCategoriesInfo();
        var board = jQuery('#shapes_calculations_tickets_app').empty();

        _.each(cathegories,function (cathegory, key) {
            var badge = jQuery('<span class="badge" style="background-color:'+key+'">'+cathegory.length+'</span>');
            board.append(badge);
        });
    };
    App.prototype.menu = function () {
        alert('not implemented');
    };
    App.prototype._init = function () {
        this.margin = this.config.margin;
        this.width = this.calculateGraphWidthConfig();
        this.height = this.config.height - this.margin.top - this.margin.bottom;
        this.duration = this.config.duration;
        this.shapes = [];
        self = this;

        d3.select("body")
            .on("keydown", function() {
                if(d3.event.keyCode === 46) {
                    d3.selectAll('g.selected').each(function (d) {
                        var existing = _.find(self.shapes, d);
                        if(existing) {
                            self.shapes = _.reject(self.shapes, function(shape) {
                                return shape.id === d.id;
                            });
                            self._createShapes(self.shapes);
                            self.saveGraph()
                        }
                    });
                }
            });
        d3.select("#graph")
            .attr("align","center")
            .attr("style", "margin-top: 10px");

        this.svg = d3.select("#graph")
            .append("svg")
            .attr("style", "border:2px solid black;")
            .on("mousedown", function() {
                if(d3.event.target.nodeName === 'svg') {
                    if( !d3.event.ctrlKey) {
                        d3.selectAll( 'g.selected').classed( "selected", false);
                    }
                    var p = d3.mouse(this);

                    self.svg.append("rect")
                        .attr({
                            rx      : 6,
                            ry      : 6,
                            class   : "selection",
                            x       : p[0],
                            y       : p[1],
                            width   : 0,
                            height  : 0
                        });
                } else if(d3.event.target.nodeName === 'rect' || d3.event.target.nodeName === 'text') {
                    if(!d3.event.ctrlKey) {
                        var e = d3.event,
                            g = d3.event.target.parentNode,
                            isSelected = d3.select(g).classed("selected");

                        if(!e.ctrlKey) {
                            d3.selectAll('g.point').classed("selected", false);
                        }
                        d3.select(g).classed("selected", !isSelected);
                        g.parentNode.appendChild(g);
                    }
                } else {
                    d3.event.sourceEvent.stopPropagation();
                }
            })
            .on("mousemove", function() {
                var s = self.svg.select("rect.selection");

                if(!s.empty()) {
                    var p = d3.mouse(this),
                        d = {
                            x       : parseInt( s.attr("x"), 10),
                            y       : parseInt( s.attr("y"), 10),
                            width   : parseInt( s.attr("width"), 10),
                            height  : parseInt( s.attr("height"), 10)
                        },
                        move = {
                            x : p[0] - d.x,
                            y : p[1] - d.y
                        }
                        ;

                    if( move.x < 1 || (move.x*2 < d.width)) {
                        d.x = p[0];
                        d.width -= move.x;
                    } else {
                        d.width = move.x;
                    }

                    if( move.y < 1 || (move.y*2<d.height)) {
                        d.y = p[1];
                        d.height -= move.y;
                    } else {
                        d.height = move.y;
                    }

                    s.attr(d);

                    d3.selectAll('g.point.selection.selected').classed("selected", false);

                    d3.selectAll('g.point > rect.inner').each( function(state_data) {
                        var elementAbsoluteCoords = this.getBoundingClientRect();
                        if(
                            !d3.select(this).classed("selected") &&
                            elementAbsoluteCoords.left >= d.x && elementAbsoluteCoords.right <= d.x+d.width &&
                            elementAbsoluteCoords.top >= d.y && elementAbsoluteCoords.bottom <= d.y+d.height
                        ) {

                            d3.select(this.parentNode)
                                .classed("selection", true)
                                .classed("selected", true);
                        }
                    });
                }
            })
            .on("mouseup", function() {
                self.svg.selectAll("rect.selection").remove();
                d3.selectAll('g.point.selection').classed("selection", false);
            })
            .on("mouseout", function() {
                if( d3.event.relatedTarget.tagName=='HTML') {
                    self.svg.selectAll("rect.selection").remove();
                    d3.selectAll('g.point.selection').classed( "selection", false);
                }
            });

        this.graph = this.svg
            .attr("width", this.calculateGraphWidthCorrection())
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append('g')
            .attr("transform", "translate(" + (this.width / 3) + "," + this.margin.top * 2 + ")");
    };
    App.prototype._drawFloor = function () {
        this.getData().then(function (response) {
            self.shapes = JSON.parse(JSON.stringify(response));
            self._createShapes(self.shapes);
        });
    };
    App.prototype._createShapes = function (data) {
        var i = 0;

        this.node = this.graph.selectAll("g.point").data(data, function(d) {
            return d.id || (d.id = ++i);
        });

        this.nodeEnter = this.node.enter().append("g")
            .attr("class", "point")
            .attr("cursor", "pointer")
            .call(this.draggable());

        this.nodeEnter.append("rect")
            .attr("x", -25)
            .attr("y", -25)
            .attr("width", 40 + 10)
            .attr("height", 40 + 10)
            .attr("class", "outer");

        this._shapeType(this.nodeEnter);

        this.nodeEnter.append("text")
            .attr("x", 0)
            .attr("y", ".35em")
            .attr("text-anchor", "middle")
            .text(function(d){
                return d.number;
            })
            .style("fill-opacity", 1);

        this.rotate(this.node);

        this.nodeExit = this.node.exit()
            .remove();
        this.nodeExit.select("text")
            .remove();
        this.updateColorsAndCountsForTheElements();
    };
    App.prototype._shapeType = function (element) {
    element.append(function(d) {
        return document.createElementNS("http://www.w3.org/2000/svg", d.type);
    })
        .attr("x", -20)
        .attr("y", -20)
        .attr("width", 40)
        .attr("height", 40)
        .attr("stroke", "black")
        .attr("stroke-width", "2")
        .attr("fill",function(d){
            return d.color;
         })
        .attr("class", "inner");
};
    App.prototype._getUniqueColorsList = function (shapes) {
    return _(shapes)
        .chain()
        .flatten()
        .pluck('color')
        .unique()
        .value();
};

    App.prototype.resetGraph = function () {
        localStorage.setItem('graph', null);
        this._drawFloor();
    };
    App.prototype.saveGraph = function () {
        this._saveGraphToLocalStorage(this.selectAllShapes());
    };
    App.prototype.exportGraph = function () {
        this._saveGraphToExternalStorage(this.selectAllShapes());
    };
    App.prototype._saveGraphToLocalStorage = function (data) {
        localStorage.setItem('graph', JSON.stringify(data));
    };
    App.prototype._loadGraphFromLocalStorage = function () {
        var data = localStorage.getItem('graph');
        return JSON.parse(data);
    };
    App.prototype._saveGraphToExternalStorage = function (data) {
        console.log('Shapes List: ', JSON.stringify(data));
        alert('You need to implement _saveGraphToExternalStorage method to be able to save')
    };

    App.prototype.fakeData = function () {
        return jQuery.Deferred(function () {
            var that = this;
            setTimeout(function() {
                var shapes = [
                    { x: 100, y: 10, w: 40, h:40, color: 'red', number: '200', type: 'rect' },
                    { x: 140, y: 10, w: 40, h:40, color: 'red', number: '201', type: 'rect' },
                    { x: 180, y: 10, w: 40, h:40, color: 'red', number: '202', type: 'rect' },
                    { x: 220, y: 10, w: 40, h:40, color: 'red', number: '203', type: 'rect' },
                    { x: 260, y: 10, w: 40, h:40, color: 'red', number: '203', type: 'rect' },
                    { x: 300, y: 10, w: 40, h:40, color: 'red', number: '203', type: 'rect' },
                    //Below is a rotate example configuration
                    //{ x: 10, y: 10, w: 40, h:40, color: 'green', number: '312', rotate: 45, type: 'rect' },
                    { x: 10, y: 30, w: 40, h:40, color: 'green', number: '312', type: 'rect' },
                    { x: 50, y: 30, w: 40, h:40, color: 'green', number: '313', type: 'rect' },
                    { x: 90, y: 30, w: 40, h:40, color: 'green', number: '314', type: 'rect' },
                    { x: 130, y: 30, w: 40, h:40, color: 'green', number: '315', type: 'rect' },
                    { x: 10, y: 0, w: 40, h:40, color: 'green', number: '112', type: 'rect' },
                    { x: 50, y: 0, w: 40, h:40, color: 'green', number: '113', type: 'rect' },
                    { x: 90, y: 0, w: 40, h:40, color: 'green', number: '114', type: 'rect' },
                    { x: 130, y: 0, w: 40, h:40, color: 'green', number: '115', type: 'rect' }
                ];
                that.resolve(shapes);
            },0);
        })
    };
    App.prototype.serverData = function () {
        alert('You need to describe how to receive data from server');
        return [];
    };
    App.prototype.getData = function () {
        var localData = this._loadGraphFromLocalStorage();
        if(localData !== null) {
            return jQuery.Deferred(function () {
                this.resolve(localData);
            })
        }
        return this.provider;
    };
    App.prototype._setDataProvider = function (provider) {
    if(_.isUndefined(provider)) {
        this.provider = this.fakeData();
    }
    this.provider = eval('this.'+provider+'()');
};

    App.prototype.calculateGraphWidthConfig = function () {
        var width = this.config.width;
        if(width.indexOf('%') === -1) {
            return width - this.margin.right - this.margin.left;
        }
        return width;
    };
    App.prototype.calculateGraphWidthCorrection = function () {
        var width = this.config.width;
        if(width.indexOf('%') === -1) {
            return +width + this.margin.right + this.margin.left;
        }
        return width;
    };