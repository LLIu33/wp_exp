$ = jQuery;
function App() {}
    App.prototype.draw = function (config) {
        this.config = config;
        this.init();
        this.setDataProvider(this.config.dataProvider);
        this.drawFloor();
    };
    App.prototype.init = function () {
        this.margin = { top: 100, right: 120, bottom: 100, left: 120 };
        this.width = 1600 - this.margin.right - this.margin.left;
        this.height = 960 - this.margin.top - this.margin.bottom;
        this.duration = 1000;
        this.shapes = [];
        self = this;

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
                } else {
                    if(d3.event.target.nodeName !== 'svg') {
                        if(d3.event.shiftKey) {
                            self.removeShapes();
                        }
                    }
                    d3.event.sourceEvent.stopPropagation();
                    var e = d3.event,
                        g = this.parentNode,
                        isSelected = d3.select(g).classed("selected");

                    if(!e.ctrlKey) {
                        d3.selectAll('g.point').classed("selected", false);
                    }

                    d3.select(g).classed("selected", !isSelected);

                    g.parentNode.appendChild(g);

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
            .attr("width", '100%')//this.width + this.margin.right + this.margin.left)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append('g')
            .attr("transform", "translate(" + (this.width / 3) + "," + this.margin.top * 2 + ")");
    };
    App.prototype.drawFloor = function () {
        this.getData().then(function (response) {
            self.shapes = response;
            self.createShapes(self.shapes);
        });
    };
    App.prototype.createShapes = function (data, grouped) {
        var i = 0;

        if( ! _.isUndefined (grouped)){
            /*var groupCount = this.graph.selectAll("g.group").size();
            var grpX = this.width / 3;
            var grpY = this.margin.top * 2 + (40*groupCount);
            this.groupContainer = this.graph.append('g')
                .attr("class", "group")
                .attr("transform", "translate(" + grpX + "," + grpY + ")");
            this.node = this.groupContainer.selectAll("g.group").data(data, function(d) {
                return d.id || (d.id = ++i);
            });*/
        } else {
            this.node = this.graph.selectAll("g.point").data(data, function(d) {
                return d.id || (d.id = ++i);
            });
        }

        this.nodeEnter = this.node.enter().append("g")
            .attr("class", "point")
            .attr("cursor", "pointer")
            .call(this.draggable())
            /*.on("mousedown", function (d, i) {
                var e = d3.event,
                    g = this.parentNode,
                    isSelected = d3.select(g).classed("selected");

                if(!e.ctrlKey) {
                    d3.selectAll('g.point').classed("selected", false);
                }

                d3.select(g).classed("selected", !isSelected);

                g.parentNode.appendChild(g);
            })*/;

        this.nodeEnter.append("rect")
            .attr("x", -25)
            .attr("y", -25)
            .attr("width", 40 + 10)
            .attr("height", 40 + 10)
            .attr("class", "outer");

        this.shapeType(this.nodeEnter);

        this.nodeEnter.append("text")
            .attr("x", 0)
            .attr("y", ".35em")
            .attr("text-anchor", "middle")
            .text(function(d){
                return d.number;
            })
            .style("fill-opacity", 1);

        this.rotate(this.node);

        this.nodeExit = this.node.exit().transition()
            .duration(this.duration).attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
            .remove();
        this.nodeExit.select("text")
            .remove();
    };
    App.prototype.createSeatsLine = function (shapesQty, startFrom) {
        var maxIdShape = _.max(self.shapes, function (shape) {
            return shape.id;
        });
        for(var i = 1;  i <= shapesQty; i++) {
            var shape = self.createDummyShape('rect', self.shapes.length);
            if( ! _.isUndefined(startFrom)) {
                shape.number = +startFrom + i-1;
            }

            shape.id = maxIdShape.id++;
            self.shapes.push(shape);
        }
        self.createShapes(self.shapes);
        self.saveGraph();
    };
    App.prototype.createDummyShape = function (type, shapesLength) {
        return { x: 10 + 40 * shapesLength, y: 10, w: 40, h:40, color: 'red', number: Math.floor((Math.random() * 500) + 251), type: type };
    };
    App.prototype.shapeType = function (element) {
        element.append(function(d) {
            return document.createElementNS("http://www.w3.org/2000/svg", d.type);
        })
            .attr("x", -20)
            .attr("y", -20)
            .attr("width", 40)
            .attr("height", 40)
            .attr("stroke", "black")
            .attr("stroke-width", "2")
            /*.attr("fill",function(d){
                return d.color;
            })*/
            .attr("class", "inner")
            .on("mouseover", function(){
                d3.select(this).style( "fill", "aliceblue");
            })
            .on("mouseout", function() {
                d3.select(this).style("fill", "white");
            })
            ;
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
                    d.x += d3.event.dx;
                    d.y += d3.event.dy;
                    return "translate(" + [ d.x,d.y ] + ")"
                });
                //this.parentNode.appendChild(this);
            })
            .on("dragend", function(d){
                self.saveGraph();
            });
    };
    App.prototype.removeShapes = function() {
        var shapes = d3.selectAll('g.selected').each(function (d) {
            console.log(d);
            //retu
        });
        /*_.each(shapes, function(shape) {
            console.log(shape);
        });*/
        /*d3.selectAll('g.point').data(shapes, function (d) {
            return(d);
        })
        .exit()
        .transition()
        .remove();*/
        //console.log();

    };
    App.prototype.menu = function () {
        console.log('menu');
    };
    App.prototype.saveGraphtoLocalStorage = function (data) {
        localStorage.setItem('graph', JSON.stringify(data));
    };
    App.prototype.loadGraphFromLocalStorage = function () {
        var data = localStorage.getItem('graph');
        return JSON.parse(data);
    };
    App.prototype.resetGraph = function () {
        localStorage.setItem('graph', null);
        this.drawFloor();
    };
    App.prototype.saveGraph = function () {
        var shapes = [];
        d3.selectAll('g.point').each(function (d) {
            shapes.push(d);
        });
        d3.selectAll('group.point').each(function (d){
            console.log(d);
        });
        self.saveGraphtoLocalStorage(shapes);
    };

    App.prototype.setDataProvider = function (provider) {
        this.provider = null;
        if(_.isUndefined(provider)) {
            this.provider = this.fakeData();
        } else {
            this.provider = eval('this.'+provider+'()');
        }
    };
    App.prototype.fakeData = function () {
        return $.Deferred(function () {
            var self = this;
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
                self.resolve(shapes);
            },0);
        })
    };
    App.prototype.serverData = function () {
        return [];
    };
    App.prototype.getData = function () {
        var localData = this.loadGraphFromLocalStorage();
        if(localData !== null) {
            return $.Deferred(function () {
                this.resolve(localData);
            })
        }
        return this.provider;
    };