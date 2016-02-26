function App() {}
    App.prototype.draw = function (config) {
        this.config = config;
        this._createItemExamples();
        this._init();
        this._setDataProvider(this.config.dataProvider);
        this._drawFloor();
    };

    //Application Something
    App.prototype.createSeatsLine = function (shapesQty, startFrom, categoryName) {
        var startFrom = startFrom || 1;
        var type = $('input[name=itemType]:checked').val();
        var maxIdShape = _.max(self.shapes, function (shape) {
            return shape.id;
        });
        var maxId = maxIdShape.id + 1;
        for(var i = 1;  i <= shapesQty; i++) {
            var shape = self.createDummyShape(type, self.shapes.length);
            shape.number = +startFrom + i-1;

            if( !_.isUndefined(categoryName)) {
                var cat =_.find(self.categories, {name: categoryName});
                if( ! _.isUndefined(cat)) {
                    shape.color = cat.color;
                } else {
                    shape.color = null;
                }
            }
            shape.id = maxId++;
            self.shapes.push(shape);
        }
        self._createShapes(self.shapes);
        self.saveGraph();
    };
    App.prototype.natCreateSeatsLine = function (shapesQty, numOfColumns, startFrom, rotation, radius) {
        var shapes = [];
        var res, extra_rotate;
        var numOfColumns = numOfColumns || 1;
        var rotation = rotation || 0;
        var startFrom = startFrom || 1;
        var type = $('input[name=itemType]:checked').val();

        for (var j = 0; j < numOfColumns; j++) {
            shapes[j] = [];
            for (var i = 0;  i <= shapesQty; i++) {
                var shape = self.createDummyShape(type, shapes[j].length);
                shape.number = +startFrom + i;
                shapes[j].push(shape);
            }
            if ( radius ) {
                shapes[j] = self.makeAnArc(shapes[j], radius);
                rotation = rotation - 5; //correction
            }

            self._createShapes(shapes[j], true, rotation);
            self.saveGraph();    
        }
    };
    App.prototype.makeAnArc = function (shapes, r) {
        console.log(shapes);
        var new_x, new_y = null;
        var arc_scale = 4;
        var rect_width = shapes[0]['w'],
            rect_height = shapes[0]['h'];
        var row_len = shapes.length * rect_width,
            center = row_len / 2;
        var x = center - rect_width / 2,
            y = arc_scale * rect_height;
        r = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
        var x0 = shapes[0]['x'],
            y0 = shapes[0]['y'];
        var x_center = x0 + center - rect_width / 2,
            y_center = y0 + y;
        var angle = 2 * Math.asin(row_len / (2 * r)) / (shapes.length);


        for (var i = 0;  i < shapes.length; i++) {
            alpha = angle * (shapes.length / 2 - i);
            var TH = Math.sin(alpha) * r;
            var HO = Math.sqrt(Math.pow(r, 2) - Math.pow(TH, 2));

            new_y = shapes[i]['y'] - (HO - y);
            new_x = x_center - TH;

            shapes[i]['x'] = new_x;
            shapes[i]['y'] = new_y;
            shapes[i]['rotate'] = - 180 * alpha / Math.PI;
        }
        return shapes;
    };

    //Main Application Section
    App.prototype.uploadPic = function () {
        var preview = jQuery('#fon-size img'); //selects the query named img
        var file    = jQuery('.background_pic')[0]['files'][0]; //sames as here
        var reader  = new FileReader();

        reader.onloadend = function () {
            preview.attr('src', reader.result);
            jQuery('.zoom_plus').show();
            jQuery('.zoom_minus').show();
            jQuery('#fon-size')
                .css('width', parseInt(jQuery('#graph svg').css('width')) + 15 + 'px')
                .css('height', parseInt(jQuery('#graph svg').css('height')) + 15 + 'px')
                .css('margin-left', '-15px')
                .css('overflow', 'scroll');
        };

        if (file) {
            reader.readAsDataURL(file); //reads the data as a URL
        } else {
            preview.attr('src', '');
        }
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
            });
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
    App.prototype.updateColorsAndCountsForTheElements = function () {
        var cathegories = this.getCategoriesInfo();
        var board = jQuery('#shapes_calculations_tickets_app').empty();

        _.each(cathegories,function (cathegory, key) {
            var badge = jQuery('<span class="badge" style="background-color:' + self._getElementColor(key) + '">'+cathegory.length+'</span>');
            board.append(badge);
        });
    };
    App.prototype.zoomBackground = function (scale) {
        //var scale = 2;
        var current_height = jQuery('#fon-size img').css('height'),
            current_width = jQuery('#fon-size img').css('width');
        var new_height = scale * parseInt(current_height),
            new_width = scale * parseInt(current_width);

        jQuery('#fon-size img').css('height', new_height + 'px'),
            jQuery('#fon-size img').css('width', new_width + 'px');
    };
    App.prototype._init = function () {
        this.margin = this.config.margin;
        this.width = this.calculateGraphWidthConfig();
        this.height = this.config.height - this.margin.top - this.margin.bottom;
        this.duration = this.config.duration;
        this.toolSvgWidth = this.config.toolWidth;
        this.toolSvgHeight = this.config.toolHeight;
        this.graphContainer = this.config.graphContainer;
        this.toolContainer = this.config.toolContainer;
        this.shapes = [];
        //below is the hardcoded selection corrections constants
        this.widthCorrection = 50;
        this.heightCorrection = 225;
        //end of correction constants
        this.graphId = function () {
            var id = jQuery('input[name="post_ID"]').val();
            if(! id) return 'graph';
            return id;
        };
        self = this;

        this.zoom = d3.behavior.zoom().scaleExtent([0, 8]).on("zoom", this.zoomed);
        d3.selectAll('.zoom_btn').on('click', this.zoomClick);
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

        this.svg = d3.select(this.graphContainer)
            .append("svg")
            .attr("style", "border:2px solid black;")
            .on("mousedown", function() {
                var ctrlKey = d3.event.ctrlKey,
                    cmdKey = d3.event.metaKey,
                    shiftKey = d3.event.shiftKey;
                var target = d3.event.target,
                    targetName = d3.event.target.nodeName;
                var cancel_pan = shiftKey || ctrlKey || cmdKey;

                self._cancelSelectionEventDispatcher(d3.event);

                if ( cancel_pan ) {
                    d3.event.stopImmediatePropagation(); // stop zoom
                    if(targetName === 'svg') {
                        self._createSelectionRectAt(target);
                    } else if(targetName === 'rect' || targetName === 'text' || targetName === 'circle') {
                        self._selectionEventDispatcher(d3.event);
                    } else {
                        d3.event.sourceEvent.stopPropagation();
                    }
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

                    d3.selectAll('g.point > .inner').each( function(state_data) {
                        var elementAbsoluteCoords = this.getBoundingClientRect();
                        var dAbsoluteCoords = s[0][0].getBoundingClientRect();
                        if(
                            !d3.select(this).classed("selected") &&
                            elementAbsoluteCoords.left >= dAbsoluteCoords.left && elementAbsoluteCoords.right <= dAbsoluteCoords.right &&
                            elementAbsoluteCoords.top >= dAbsoluteCoords.top && elementAbsoluteCoords.bottom <= dAbsoluteCoords.bottom
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
            .call(this.zoom)
            .on("touchstart.zoom", null)
            .on("touchmove.zoom", null)
            .on("touchend.zoom", null)
            .on("dblclick.zoom", null)
            .on("wheel.zoom", null)
            .on("mousewheel.zoom", null)
            .on("MozMousePixelScroll.zoom", null)
            .append('g')
            .attr("transform", "translate(" + (jQuery('svg').width() / 4) + "," + this.margin.top * 2 + ")");

        this.toolSvg = d3.select(this.toolContainer)
            .append("svg")
            .attr("transform", "translate(" + (jQuery('svg').width()) + "," + 0 + ")")
            .attr("style", "border:2px solid black;")
            .attr("width", this.toolSvgWidth)
            .attr("height", this.toolSvgHeight)
            .append('g')
            .attr("transform", "translate(" + 0 + "," + 0 + ")");

        jQuery(this.graphContainer)
            .css('width', this.calculateGraphWidthCorrection())
            .css('height', this.height + this.margin.top + this.margin.bottom);
        jQuery(this.toolContainer)
            .css('width', this.toolSvgWidth)
            .css('height', this.toolSvgHeight);
        jQuery('#fon-size')
            .css('width', this.calculateGraphWidthCorrection())
            .css('height', this.height + this.margin.top + this.margin.bottom);
        jQuery('#fon-size img')
            .css('width', this.calculateGraphWidthCorrection())
            .css('height', this.height + this.margin.top + this.margin.bottom);
    };
    App.prototype._createSelectionRectAt = function (target) {
        var p = d3.mouse(target);

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
    };
    App.prototype._cancelSelectionEventDispatcher = function (e) {
        if(e.target.nodeName === 'svg' && !e.ctrlKey && !e.metaKey) {
            d3.selectAll( 'g.selected').classed( "selected", false);
        }
    }
    App.prototype._selectionEventDispatcher = function (e) {
        if ( ! e.ctrlKey && e.metaKey) {
            var g = e.target.parentNode,
                isSelected = d3.select(g).classed("selected");
            d3.selectAll('g.point').classed("selected", false);
            d3.select(g).classed("selected", !isSelected);
            g.parentNode.appendChild(g);
        }

    }
    App.prototype._drawFloor = function () {
        this.getData().then(function (response) {
            self.shapes = response.graphData;
            self.categories = response.categories;
            self._createShapes(self.shapes);
            self._createTool('categories');
            //self._createTool('ff');
        });
    };
    App.prototype._createShapes = function (data, grouped, rotation) {
        if ( ! data ) return;
        var i = 0;
        var rotation = -1 * rotation || 0;
        if ( ! _.isUndefined (grouped)) {
            var groupCount = this.graph.selectAll("g.group").size();
            var grpX = parseInt(this.width) / 10;
            var grpY = this.margin.top * 2 + (40*groupCount);

            this.groupContainer = this.graph.append('g')
                .attr("class", "group")
                .attr("transform", function () {
                    return d3.svg.transform()
                        .translate(grpX, grpY)
                        .rotate(rotation)();
                    //return "translate(" + grpX + "," + grpY + ")"; 
                });
            this.node = this.groupContainer.selectAll("g.group").data(data, function(d) {
                return d.id || (d.id = ++i);
            });
        } else {
            this.node = this.graph.selectAll("g.point").data(data, function(d) {
                return d.id || (d.id = ++i);
            });
        }

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
    App.prototype._createItemExamples = function () {
        var circle_container = d3.select('div.radio_circle label');
        var circle_svg = circle_container.append("svg")
                                                    .attr("width", 40)
                                                    .attr("height", 30);
        circle_svg.append("circle")
                                .attr("cx", 14)
                                .attr("cy", 14)
                                .attr("r", 12)
                                .attr("stroke", "black")
                                .attr("stroke-width", "2")
                                .style("fill", "green");

        var rect_container = d3.select('div.radio_rect label');
        var rect_svg = rect_container.append("svg")
                                                .attr("width", 40)
                                                .attr("height", 30);
        rect_svg.append("rect")
                            .attr("x", 10)
                            .attr("y", 2)
                            .attr("width", 24)
                            .attr("height", 24)
                            .attr("stroke", "black")
                            .attr("stroke-width", "2")
                            .style("fill", "red");
    };
    App.prototype._shapeType = function (element) {
        element.append(function(d) {
            return document.createElementNS("http://www.w3.org/2000/svg", d.type);
        })
            .attr("x", -20)
            .attr("y", -20)
            .attr("width", 40)
            .attr("height", 40)
            .attr("r", 20)
            .attr("stroke", "black")
            .attr("stroke-width", "2")
            .attr("fill",function(d){
               return self._getElementColor(d.color);
             })
            .attr("class", "inner");
        };
    App.prototype.zoomed = function () {
        self.graph.attr("transform",
            "translate(" + self.zoom.translate() + ")" +
            "scale(" + self.zoom.scale() + ")"
        );
    };
    App.prototype.interpolateZoom = function (translate, scale) {
        var self = this;
        return d3.transition().duration(350).tween("zoom", function () {
            var iTranslate = d3.interpolate(self.zoom.translate(), translate),
                iScale = d3.interpolate(self.zoom.scale(), scale);
            return function (t) {
                self.zoom
                    .scale(iScale(t))
                    .translate(iTranslate(t));
                self.zoomed();
            };
        });
    };
    App.prototype.zoomClick = function () {
        var clicked = d3.event.target,
            direction = 1,
            factor = 0.2,
            target_zoom = 1,
            center = [jQuery('.graph_container').width() / 2, jQuery('.graph_container').height() / 2],
            extent = self.zoom.scaleExtent(),
            translate = self.zoom.translate(),
            translate0 = [],
            l = [],
            view = {x: translate[0], y: translate[1], k: self.zoom.scale()};

        d3.event.preventDefault();
        direction = (this.id === 'zoom_in') ? 1 : -1;
        target_zoom = self.zoom.scale() * (1 + factor * direction);

        if (target_zoom < extent[0] || target_zoom > extent[1]) { return false; }

        translate0 = [(center[0] - view.x) / view.k, (center[1] - view.y) / view.k];
        view.k = target_zoom;
        l = [translate0[0] * view.k + view.x, translate0[1] * view.k + view.y];

        view.x += center[0] - l[0];
        view.y += center[1] - l[1];

        self.interpolateZoom([view.x, view.y], view.k);
    };

    //Plugin Creation Tool
    App.prototype._toolsConfig = function (name) {
        var toolsList = {
            'categories': {
                'data': [{ x: 0, y: 0, w: 300, h: 200, name: 'ADD SEATS' }],
                'createTool': function (toolEnter, name) {
                    self._createCategoriesTool(toolEnter, name);
                }
            },
            'ff': {
                'data': [{ x: 0, y: 0, w: 300, h: 200, name: 'FF' }],
                'createTool': function (toolEnter, name) {
                    self._createFfTool(toolEnter, name);
                }
            }
        };
        return toolsList[name];
    };
    App.prototype.getToolsQty = function () {
        return this.toolSvg.selectAll("g.tool").length;
    };
    App.prototype._createCommonTool = function (tool, toolName) {
        var i = 0;
        this.tool = this.toolSvg.selectAll("g.tool"+toolName).data(tool.data, function(d) {
            return d.id || (d.id = ++i);
        });
        return this.tool.enter()
            .append('g')
            .attr("class", "tool tool"+toolName);
    };
    App.prototype._createTool = function (toolName) {
        var toolConfig = self._toolsConfig(toolName);
        var toolEnter = this._createCommonTool(toolConfig, toolName);

        toolConfig.createTool(toolEnter, toolName);
        this._processTool(toolName);
    };
    App.prototype._processTool = function (toolName) {
        var containerHeight = 0;
        for (var i = 0; i < jQuery('.tool').length - 1; i++) {
            var classname = jQuery(jQuery('.tool')[i]).attr('class').split(' ').join('.');
            containerHeight += parseInt(d3.selectAll('.' + classname + '>rect').attr('height'), 10);
        }
        var toolsQty = this.getToolsQty();
        var newY = parseInt(containerHeight, 10) * toolsQty;
        this.tool.transition()
            .duration(this.duration)
            .attr("transform", function(d) {
                return d3.svg.transform()
                    .translate(d.x, newY)();
            });

        this.toolExit = this.tool.exit()
            .remove();
        this.toolExit.select("text")
            .remove();
    };
    App.prototype._createCategoriesTool = function (element, tollName) {
        this._createCategoriesToolContainer(element);
        this._createCategoriesToolContainerCategoriesList(tollName);
    };
    App.prototype.categoriesData = function (container) {
        return _.map(self.categories, function (category) {
            return { x: container.x, y: container.y, parentW: container.w,w: 15, h:15, color: category.color, type: 'rect', name: category.name, price: category.price};
        });
    };

    //Plugins Description Section
    App.prototype._createFfTool = function (element, toolName) {
        element
            .append("rect")
            .attr("x", function(d) {
                return d.x;
            })
            .attr("y", function (d) {
                return d.y;
            })
            .attr("width", function (d) {
                return d.w;
            })
            .attr("height", function (d) {
                return d.h + (d.h/10) * self.categories.length;
            })
            .attr("fill", 'white')
            .attr("stroke", "gray");

        element
            .append("text")
            .attr("x", function (d) {
                return d.x + d.w/2;
            })
            .attr("y", function (d) {
                return d.y + 30;
            })
            .attr("text-anchor", "middle")
            .text(function(d){
                return d.name;
            })
            .style("font-size", "22px")
            .style("fill-opacity", 1);

        element
            .append("text")
            .attr("x", function (d) {
                return d.x + d.w/2;
            })
            .attr("y", function (d) {
                return d.y + d.h-10 + (d.h/10) * self.categories.length;
            })
            .attr("text-anchor", "middle")
            .attr("cursor", "pointer")
            .text("ADD CATEGORY")
            .style("font-size", "18px")
            .style("fill-opacity", 1)
            .style('fill', 'blue')
            .on("click", function () {
                jQuery('.add-category-modal-sm').modal('show');
            });

        var smallRectWidth = 15;
        var i = 0;
        var containerData = this._toolsConfig(toolName).data[0];
        var data = this.categoriesData(containerData);

        this.category = this.tool.selectAll("g.category").data(data, function(d) {
            return d.id || (d.id = ++i);
        });

        this.categoryEnter = this.category.enter()
            .append('g')
            .attr("class", "category");

        this.categoryEnter
            .append("rect")
            .attr("x", function (d) {
                return d.x + d.parentW/2;
            })
            .attr("y", function (d) {
                return 75 - smallRectWidth*2 + d.y + 30 * d.id;
            })
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", function (d) {
                if(self._isHexColorFormat(d.color)){
                    return '#'+d.color;
                }
                return d.color;
            })
            .attr("stroke", "gray");

        this.categoryEnter.append("text")
            .attr("x", function (d) {
                return d.x + d.parentW/2 - 80;
            })
            .attr("y", function (d) {
                return 75 - smallRectWidth + d.y + 30 * d.id;
            })
            .attr("text-anchor", "middle")
            .text(function (d) {
                if( ! _.isUndefined(d.name) && d.name.length) {
                    return d.name;
                }
                return 'TIER ' + eval(d.id+1);
            })
            .style("font-size", "16px")
            .style("fill-opacity", 1)
            .style('fill', 'grey')
            .style('margin-top', '10px');

        this.categoryEnter.append("text")
            .attr("x", function (d) {
                return d.x + d.parentW/2 + 80;
            })
            .attr("y", function (d) {
                return 75 - smallRectWidth + d.y + 30 * d.id;
            })
            .attr("text-anchor", "middle")
            .text(function (d) {
                return d.price;
            })
            .style("font-size", "16px")
            .style("fill-opacity", 1)
            .style('fill', 'grey')
            .style('margin-top', '10px');
    };
    App.prototype._createCategoriesToolContainer = function (element) {
        element
            .append("rect")
            .attr("x", function(d) {
                return d.x;
            })
            .attr("y", function (d) {
                return d.y;
            })
            .attr("width", function (d) {
                return d.w;
            })
            .attr("height", function (d) {
                return d.h + (d.h/10) * self.categories.length;
            })
            .attr("fill", 'white')
            .attr("stroke", "gray");

        element
            .append("text")
            .attr("x", function (d) {
                return d.x + d.w/2;
            })
            .attr("y", function (d) {
                return d.y + 30;
            })
            .attr("text-anchor", "middle")
            .text(function(d){
                return d.name;
            })
            .style("font-size", "22px")
            .style("fill-opacity", 1);

        element
            .append("text")
            .attr("x", function (d) {
                return d.x + d.w/2;
            })
            .attr("y", function (d) {
                return d.y + d.h-10 + (d.h/10) * self.categories.length;
            })
            .attr("text-anchor", "middle")
            .attr("cursor", "pointer")
            .text("ADD CATEGORY")
            .style("font-size", "18px")
            .style("fill-opacity", 1)
            .style('fill', 'blue')
            .on("click", function () {
                jQuery('.add-category-modal-sm').modal('show');
            });
    };
    App.prototype._createCategoriesToolContainerCategoriesList = function (toolName) {
        var smallRectWidth = 15;
        var i = 0;
        var containerData = this._toolsConfig(toolName).data[0];
        var data = this.categoriesData(containerData);

        this.category = this.tool.selectAll("g.category").data(data, function(d) {
            return d.id || (d.id = ++i);
        });

        this.categoryEnter = this.category.enter()
            .append('g')
            .attr("class", "category");

        this.categoryEnter
            .append("rect")
            .attr("x", function (d) {
                return d.x + d.parentW/2;
            })
            .attr("y", function (d) {
                return 75 - smallRectWidth*2 + d.y + 30 * d.id;
            })
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", function (d) {
                if(self._isHexColorFormat(d.color)){
                    return '#'+d.color;
                }
                return d.color;
            })
            .attr("stroke", "gray");

        this.categoryEnter.append("text")
            .attr("x", function (d) {
                return d.x + d.parentW/2 - 80;
            })
            .attr("y", function (d) {
                return 75 - smallRectWidth + d.y + 30 * d.id;
            })
            .attr("text-anchor", "middle")
            .text(function (d) {
                if( ! _.isUndefined(d.name) && d.name.length) {
                    return d.name;
                }
                return 'TIER ' + eval(d.id+1);
            })
            .style("font-size", "16px")
            .style("fill-opacity", 1)
            .style('fill', 'grey')
            .style('margin-top', '10px');

        this.categoryEnter.append("text")
            .attr("x", function (d) {
                return d.x + d.parentW/2 + 80;
            })
            .attr("y", function (d) {
                return 75 - smallRectWidth + d.y + 30 * d.id;
            })
            .attr("text-anchor", "middle")
            .text(function (d) {
                return d.price;
            })
            .style("font-size", "16px")
            .style("fill-opacity", 1)
            .style('fill', 'grey')
            .style('margin-top', '10px');

        this.rotate(this.tool);

        this.toolExit = this.tool.exit()
            .remove();
        this.toolExit.select("text")
            .remove();
    };

    //Save/Load Data Manipulation
    App.prototype.resetGraph = function () {
        localStorage.setItem(this.graphId(), null);
        this._drawFloor();
    };
    App.prototype.saveGraph = function () {
        var graph = {
            'graphData': this.selectAllShapes(),
            'categories': self.categories
        };
        this._saveGraphToLocalStorage(graph);
        this._saveGraphDataToInput(graph);
    };
    App.prototype.exportGraph = function () {
        this._saveGraphToExternalStorage(this.selectAllShapes());
    };
    App.prototype._saveGraphToLocalStorage = function (data) {
        localStorage.setItem(this.graphId(), JSON.stringify(data));
    };
    App.prototype._loadGraphFromLocalStorage = function () {
        var data = localStorage.getItem(this.graphId());
        return JSON.parse(data);
    };
    App.prototype._saveGraphToExternalStorage = function (data) {
        var response = {
            'data': JSON.stringify(data),
            'categories': self.categories
        };
        console.log('Response Example: ', response);
        alert('You need to implement _saveGraphToExternalStorage method to be able to save')
    };
    App.prototype._saveGraphDataToInput = function (data) {
        var container = jQuery(this.config.dataContainer);
        container.val(JSON.stringify(data));
    };

    //Getting Application Data Section
    App.prototype.fakeData = function () {
        return jQuery.Deferred(function () {
            var that = this;
            setTimeout(function() {
                var data = {
                    'graphData':[
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
                    ],
                    'categories': [
                        {
                            name: 'TIER 1',
                            color: 'green',
                            price: '$10.00'
                        },
                        {
                            name: 'TIER 2',
                            color: 'red',
                            price: '$20.00'
                        }
                    ]
                };
                that.resolve(data);
            },0);
        })
    };
    App.prototype.serverData = function () {
        return jQuery.Deferred(function () {
            var data = jQuery(self.config.getDataContainer).val();
            if(data) {
                this.resolve(JSON.parse(data));
            }
            this.resolve({ graphData: [], categories: [] });
        });
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

    // Helpers
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
    App.prototype.getCategoriesList = function () {
        return this.getData().then(function (response) {
            return response.categories;
        });
    };
    App.prototype.addCategory = function (category, currency) {
        if(this._isUniqueCategory(category, self.categories)) {
            category = this._formatCategory(category, currency);
            this.categories.push(category);
            this.saveGraph();
            d3.selectAll('.tool').remove();
            this._drawFloor();
        }
    };
    App.prototype.createDummyShape = function (type, shapesLength) {
    return { x: 10 + 40 * shapesLength, y: 10, w: 40, h:40, color: 'red', number: Math.floor((Math.random() * 500) + 251), type: type };
};
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
    App.prototype._isUniqueCategory = function (category, list) {
        var result = _.find(list, function (categoryElement) {
            return categoryElement === category ||
                categoryElement.name.toLowerCase() === category.name.toLowerCase() ||
                categoryElement.color.toLowerCase() === category.color.toLowerCase()
        });
        return (result) ? false : true;
    };
    App.prototype._formatCategory = function (category, currency) {
        return this._formatPrice(category, currency);
    };
    App.prototype._formatPrice = function (category, currency) {
        category.price = currency + category.price+'.00';
        return category;
    };
    App.prototype._isHexColorFormat = function (color) {
        return /(^[0-9A-F]{6}$)|(^[0-9A-F]{3}$)/i.test(color)
    };
    App.prototype._getElementColor = function (color) {
        if(self._isHexColorFormat(color)){
            return '#' + color;
        }
        return color;
    };
    App.prototype._getUniqueColorsList = function (shapes) {
        return _(shapes)
            .chain()
            .flatten()
            .pluck('color')
            .unique()
            .value();
    };
