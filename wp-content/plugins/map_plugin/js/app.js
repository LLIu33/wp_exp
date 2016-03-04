function App() {}
    App.prototype.draw = function (config) {
        this.config = config;
        this._createItemExamples();
        this._init();
        this._setDataProvider(this.config.dataProvider);
        this._drawFloor();
    };

    //Application Something
    /*App.prototype.createSeatsLine = function (shapesQty, startFrom, categoryName) {
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
    };*/
    App.prototype.natCreateSeatsLine = function (shapesQty, numOfColumns, startFrom, rotation, radius, categoryName) {
        if(shapesQty < 1) {
            alert('Please enter number of seats');
            return;
        }
        var shapes = [];
        var res, extra_rotate;
        var numOfColumns = numOfColumns || 1;
        var rotation = rotation || 0;
        var startFrom = startFrom || 1;
        var type = $('input[name=itemType]:checked').val();
        var maxIdShape = _.max(self.shapes, function (shape) {
            return shape.id;
        });
        var maxId = maxIdShape.id + 1;

        for (var j = 0; j < numOfColumns; j++) {
            shapes[j] = [];
            var shape;
            for (var i = 0;  i <= shapesQty - 1; i++) {
                shape = self.createDummyShape(type, shapes[j].length);
                shape.number = +startFrom + i;
                shape.id = maxId++;
                if( !_.isUndefined(categoryName)) {
                    var cat =_.find(self.categories, {name: categoryName});
                    if( ! _.isUndefined(cat)) {
                        shape.color = cat.color;
                    } else {
                        shape.color = null;
                    }
                }
                shapes[j].push(shape);
            }
            if ( radius ) {
                shapes[j] = self.makeAnArc(shapes[j], radius);
                rotation = rotation - 5; //correction
            }

            var group = { 'grouped': [{
                'groupTag': {
                    'name': '?',
                    'coords':  this.calculateTagCoords(j, shape)
                },
                'groupCoords': this.calculateCoords(j, shape),
                'groupElements': shapes[j]
            }]};

            var groupData = group.grouped;
            self.shapes['grouped'].push(groupData[0]);
            self._createShapes(group, true, rotation);
            self.saveGraph();
        }
    };
    App.prototype.makeAnArc = function (shapes, r) {
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
    App.prototype.calculateCoords = function (rowNumber, currentShape) {
        return { x: 0, y: 0 + currentShape.h * rowNumber };
    };
    App.prototype.calculateTagCoords = function (rowNumber, currentShape) {
        return { x: - self.tagWidth - 1, y: 0 }
    };
    App.prototype.editRow = function (config) {
        if(config.name) {
            d3.select(self.currentGroupForEdit).select('text').text(config.name)
        }
        if(config.numberOfSeats) {
            var elements = d3.select(self.currentGroupForEdit).selectAll('g.point');
            var i = elements[0].length;
            var maxD = null;

            if(config.numberOfSeats == elements[0].length) return;

            elements[0].reverse();

            if(config.numberOfSeats < elements[0].length) {
                elements.each(function (d) {
                    if(i != config.numberOfSeats) {
                        d.id = null;
                        d3.select(this).remove();
                        i--;
                    }
                });
            } else {
                var shapes = [];
                var groupId = parseInt(d3.select(self.currentGroupForEdit).attr('grpId'), 10);

                elements.each(function (d) {
                    if(maxD === null) {
                        maxD = d;
                        while(i != config.numberOfSeats) {
                            var newShape = _.clone(d);
                            newShape.id = parseInt(newShape.id, 10) + 1;
                            newShape.number = parseInt(newShape.number, 10) + 1;
                            newShape.x = parseInt(newShape.x, 10) + parseInt(newShape.w, 10);
                            d = _.clone(newShape);
                            shapes.push(newShape);
                            i++;
                        }
                    }
                });

                _.each(self.shapes['grouped'], function(group) {
                    if(parseInt(group.groupId, 10) === groupId) {
                        _.each(shapes, function (shape) {
                            group.groupElements.push(shape);
                        });

                        d3.select(self.currentGroupForEdit).remove();
                        self._createShapes({ grouped: [group] }, true, 0);
                        self.saveGraph();

                        d3.selectAll('g.group').each(function (){
                            if(parseInt(d3.select(this).attr("grpId"), 10) == groupId) {
                                self.currentGroupForEdit = this;
                            }
                        });
                    }
                });
            }
        }
        if(config.category) {
            var category = this._getCategory({ name: config.category });
            d3.select(self.currentGroupForEdit).selectAll('g.point > .inner').each(function(d){
                d.color = self._isHexColorFormat(category.color) ? '#'+category.color : category.color;
                d3.select(this).attr('fill',  d.color);
                console.info(this);
            });
        }
        if(config.rotate || config.rotate === 0) {
            var coords = d3.transform(d3.select(self.currentGroupForEdit).attr("transform"));
            var grpX = coords.translate[0];
            var grpY = coords.translate[1];

            d3.select(self.currentGroupForEdit).attr("transform", function () {
                return d3.svg.transform()
                    .translate(grpX, grpY)
                    .rotate(config.rotate)();
            });
        }

        this.saveGraph();
    };
    App.prototype._createBlock = function (target) {
        var p = d3.mouse(target);
        self.isBlockCreated = false;
        d3.select('svg > g').append("rect")
            .attr({
                class   : "custom-block block-creation",
                x       : p[0],
                y       : p[1],
                width   : 0,
                height  : 0
            })
            .style('fill', 'white')
            .style('stroke', 'grey');
    };
    App.prototype._createCircle = function (target) {
        var p = d3.mouse(target);
        self.isCircleCreated = false;
        d3.select('svg > g').append("circle")
            .attr({
                class   : "custom-circle circle-creation",
                cx       : p[0],
                cy       : p[1],
                r       : 0
            })
            .style('fill', 'white')
            .style('stroke', 'grey');
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
                var x = parseInt(d.x, 10);
                var y =  parseInt(d.y, 10);
                return d3.svg.transform()
                    .rotate(degree)
                    .translate(x, y)();
            });
    };
    App.prototype.draggable = function () {
        return d3.behavior.drag()
            .on("drag", function(d,i) {
                var targetName = this.parentNode;
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
                    } else {
                        var coords = d3.transform(d3.select(this).attr("transform"));
                        var grpX = coords.translate[0] + d3.event.dx;
                        var grpY = coords.translate[1] + d3.event.dy;
                        return "translate(" + [ grpX, grpY ] + ")"
                    }
                });
            })
            .on("dragend", function(d){
                self.saveGraph();
            });
    };
    App.prototype.groupDrag = function () {
        return d3.behavior.drag()
            .on("drag", function(d,i) {
                var selection = d3.select(this.parentNode);
                var that = this;

                selection.attr("transform", function( p, i) {
                    var mouseCoords = d3.mouse(that);
                    var current_coordinates = d3.transform(selection.attr('transform')).translate;
                    var rotate = d3.transform(selection.attr('transform')).rotate;

                    current_coordinates[0] += mouseCoords[0];
                    current_coordinates[1] += mouseCoords[1];
                    return "translate(" + [ current_coordinates[0], current_coordinates[1] ] + ") rotate(" + rotate + ")"
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
        this.graphId = function () {
            var id = jQuery('input[name="post_ID"]').val();
            if(! id) return 'graph';
            return id;
        };

        this.tagHeight = 18;
        this.tagWidth = 12;

        this.isBlockCreationSelected = false;
        this.isRowsToolSelected = false;
        this.isCircleCreationSelected = false;

        this.customCreatedShapesCollection = [];

        self = this;

        this.zoom = d3.behavior.zoom().scaleExtent([0, 8]).on("zoom", this.zoomed);
        d3.selectAll('.zoom_btn').on('click', this.zoomClick);
        d3.select("body")
            .on("keydown", function() {
                if(d3.event.keyCode === 46) {
                    d3.selectAll('g.selected').each(function (d) {
                        d3.select(this).remove();
                        self.saveGraph();
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
                    d3.event.stopImmediatePropagation();
                    if(targetName === 'svg') {
                        if ( self.isBlockCreationSelected) {
                            return self._createBlock(target);
                        }
                        if (self.isCircleCreationSelected) {
                            return self._createCircle(target);
                        }
                        return self._createSelectionRectAt(target);
                    } else {
                        //d3.event.sourceEvent.stopPropagation();
                    }
                }
               
            })
            .on("mousemove", function() {
                if ( self.isBlockCreationSelected) {
                    if (self.isBlockCreated) {
                        return;
                    }
                    var s = self.svg.select("rect.block-creation");
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
                    }
                } else if(self.isCircleCreationSelected) {
                    if (self.isCircleCreated) {
                        return;
                    }
                    var s = self.svg.select("circle.circle-creation");
                    if(!s.empty()) {
                        var p = d3.mouse(this),
                            d = {
                                x       : parseInt( s.attr("cx"), 10),
                                y       : parseInt( s.attr("cy"), 10),
                                r       : parseInt(s.attr("r"), 10 )
                            },
                            move = {
                                x : p[0] - d.x,
                                y : p[1] - d.y
                            };

                        if( move.x < 1 || (move.x*2 < d.r)) {
                            d.x = p[0];
                            d.r -= move.x;
                        } else {
                            d.r = move.x;
                        }

                        s.attr(d);
                    }
                } else {
                    var s = self.svg.select("rect.selection");
                    if (!s.empty()) {
                        var p = d3.mouse(this),
                            d = {
                                x: parseInt(s.attr("x"), 10),
                                y: parseInt(s.attr("y"), 10),
                                width: parseInt(s.attr("width"), 10),
                                height: parseInt(s.attr("height"), 10)
                            },
                            move = {
                                x: p[0] - d.x,
                                y: p[1] - d.y
                            }
                            ;

                        if (move.x < 1 || (move.x * 2 < d.width)) {
                            d.x = p[0];
                            d.width -= move.x;
                        } else {
                            d.width = move.x;
                        }

                        if (move.y < 1 || (move.y * 2 < d.height)) {
                            d.y = p[1];
                            d.height -= move.y;
                        } else {
                            d.height = move.y;
                        }

                        s.attr(d);

                        d3.selectAll('g.point.selection.selected').classed("selected", false);
                        d3.selectAll('g.group > .selected').classed("selected", false);

                        d3.selectAll('g.point > .inner').each(function (state_data) {
                            var elementAbsoluteCoords = this.getBoundingClientRect();
                            var dAbsoluteCoords = s[0][0].getBoundingClientRect();
                            if (
                                !d3.select(this).classed("selected") &&
                                elementAbsoluteCoords.left >= dAbsoluteCoords.left && elementAbsoluteCoords.right <= dAbsoluteCoords.right &&
                                elementAbsoluteCoords.top >= dAbsoluteCoords.top && elementAbsoluteCoords.bottom <= dAbsoluteCoords.bottom
                            ) {
                                d3.select(this.parentNode)
                                    .classed("selection", true)
                                    .classed("selected", true);
                            }
                        });
                        d3.selectAll('g.group > g.tag').each(function (state_data) {
                            var elementAbsoluteCoords = this.getBoundingClientRect();
                            var dAbsoluteCoords = s[0][0].getBoundingClientRect();
                            if (
                                !d3.select(this).classed("selected") &&
                                elementAbsoluteCoords.left >= dAbsoluteCoords.left && elementAbsoluteCoords.right <= dAbsoluteCoords.right &&
                                elementAbsoluteCoords.top >= dAbsoluteCoords.top && elementAbsoluteCoords.bottom <= dAbsoluteCoords.bottom
                            ) {
                                d3.select(this)
                                    .classed("selected", true);
                            }
                        });
                    }
                }
            })
            .on("mouseup", function() {
                d3.select("svg > rect.selection").remove();
                d3.selectAll('g.point.selection').classed("selection", false);
                if (self.isBlockCreationSelected) {
                    self.isBlockCreated = true;
                    var maxIdShape = _.max(self.shapes['ungrouped'], function (shape) {
                        return shape.id;
                    });
                    var maxId = maxIdShape.id + 1 || 1;
                    d3.selectAll('.custom-block').each(function () {
                        var element = d3.select(this);
                        var x = parseInt(element.attr('x'), 10),
                            y = parseInt(element.attr('y'), 10),
                            w = parseInt(element.attr('width'), 10),
                            h = parseInt(element.attr('height'), 10);

                        var obj = {id: maxId++, x: x, y: y, w: w, h: h, color: 'white', number: '', type: 'rect' }
                        self.shapes['ungrouped'].push(obj);
                        self._createShapes({ 'ungrouped': self.shapes['ungrouped'] });
                        self.saveGraph();
                        this.remove();
                    })
                }
                if(self.isCircleCreationSelected) {
                    self.isCircleCreated = true;
                    var maxIdShape = _.max(self.shapes['ungrouped'], function (shape) {
                        return shape.id;
                    });
                    var maxId = maxIdShape.id + 1 || 1;
                    d3.selectAll('.custom-circle').each(function () {
                        var element = d3.select(this);
                        var x = parseInt(element.attr('cx'), 10),
                            y = parseInt(element.attr('cy'), 10),
                            r = parseInt(element.attr('r'), 10),
                            w = parseInt(element.attr('r'), 10);

                        var obj = { id: maxId++, x: x, y: y, r: r, w: w, color: 'white', number: '', type: 'circle' };

                        self.shapes['ungrouped'].push(obj);
                        self._createShapes({ 'ungrouped': self.shapes['ungrouped'] });
                        self.saveGraph();
                        this.remove();
                    });
                }
            })
            .on("mouseout", function() {
                if( d3.event.relatedTarget.tagName=='HTML') {
                    d3.select("svg > rect.selection").remove();
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
            .attr("transform", "translate(" + 20 + "," + 20 + ")");

        this.toolSvg = d3.select(this.toolContainer)
            .append("svg")
            .attr("transform", "translate(" + 0 + "," + 0 + ")")
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
    };
    /*App.prototype._selectionEventDispatcher = function (e) {
        if ( ! e.ctrlKey && e.metaKey) {
            /!*var g = e.target.parentNode,
                isSelected = d3.select(g).classed("selected");
            d3.selectAll('g.point').classed("selected", false);
            d3.select(g).classed("selected", !isSelected);
            g.parentNode.appendChild(g);*!/

            /!*var p = e.target,
                isSelected = d3.select(p).classed("selected");
            d3.selectAll('g.group > rect').classed("selected", false);
            d3.select(p).classed("selected", !isSelected);
            p.parentNode.appendChild(p);*!/
        }
    };*/
    App.prototype._drawFloor = function () {
        this.getData().then(function (response) {
            self.shapes = response.graphData;
            self.categories = response.categories;
            self._createShapes(self.shapes);
            self._createTool('tools');
        });
    };
    App.prototype._createTools = function () {
        self._createTool('categories');
        self._createTool('rowType');
        self._createTool('numberOfSeats');
        //self._createTool('ff');
    };
    App.prototype._createShapes = function (data, grouped, rotation) {
        if ( ! data ) return;
        var i = 0;
        var rotation = -1 * rotation || 0;
        if ( ! grouped || data.grouped.length != 0) {
            _.each(data['grouped'], function(group) {
                var grpX = group.groupCoords.x;
                var grpY = group.groupCoords.y;
                var rotate = group.groupCoords.rotate || 0;
                var grpId =  group.groupId;
                var tagX = group.groupTag.coords.x;
                var tagY = group.groupTag.coords.y;
                rotate = (rotation) ? rotation : rotate;

                self.groupContainer = self.graph.append('g')
                    .attr("class", "group")
                    .attr("grpId", grpId || Math.floor((Math.random() * 1000000) + 1))
                    .attr("transform", function () {
                        return d3.svg.transform()
                            .translate(grpX, grpY)
                            .rotate(rotate)();
                    });

                self.tag = self.groupContainer.append('g')
                    .attr("class", "tag")
                    .attr("transform", function () {
                        return d3.svg.transform()
                            .translate(tagX, tagY)
                            .rotate(rotate)();
                    })
                    .call(self.groupDrag());

                self.groupRect = self.tag
                    .append("rect")
                    .attr("x", 0)
                    .attr("y", 0)
                    .attr("height", self.tagHeight)
                    .attr("width", self.tagWidth)
                    .attr("fill", "black")
                    .attr("class", "inner");

                self.groupRect = self.tag
                    .append("rect")
                    .attr("x", -4)
                    .attr("y", -4)
                    .attr("height", 24)
                    .attr("width", 18)
                    .attr("fill", "black")
                    .attr("class", "outer");

                self.groupText = self.tag
                    .append("text")
                    .attr("x", 8)
                    .attr("y", 14)
                    .attr("text-anchor", "middle")
                    .text(function () {
                        return group.groupTag.name || '?';
                    })
                    .attr("fill", "white")
                    .style("cursor", "pointer")
                    .on("click", function(d) {
                        jQuery('.edit-row-modal-sm').modal('show');
                        self.currentGroupForEdit = this.parentNode.parentNode;
                    });

                self.node = self.groupContainer.selectAll("g.point").data(group.groupElements, function(d) {
                    return d.id || (d.id = ++i);
                });

                self.nodeEnter = self.node.enter().append("g")
                    .attr("class", "point")
                    .attr("cursor", "pointer")
                    .attr("y", -4)
                    .call(self.draggable());

                self.nodeEnter.append("rect")
                    .attr("x", -4)
                    .attr("y", -4)
                    .attr("width", function (d) {
                        return d.w + 10;
                    })
                    .attr("height", function (d) {
                        return d.h + 10;
                    })
                    .attr("class", "outer");

                self._shapeType(self.nodeEnter);

                self.nodeEnter.append("text")
                    .attr("x", function (d) {
                        return d.w/2;
                    })
                    .attr("y", function (d) {
                        return d.h/2 + 5;
                    })
                    .attr("text-anchor", "middle")
                    .text(function(d){
                        return d.number;
                    })
                    .style("fill-opacity", 1);

                self.rotate(self.node);

                self.nodeExit = self.node.exit()
                    .remove();
                self.nodeExit.select("text")
                    .remove();
                self.updateColorsAndCountsForTheElements();
            });
        }

        if(_.isUndefined(data['ungrouped'])) return;
        this.node = this.graph.selectAll("svg>g>g.point").data(data['ungrouped'], function(d) {
            return d.id || (d.id = ++i);
        });

        this.nodeEnter = this.node.enter().append("g")
            .attr("class", "point")
            .attr("cursor", "pointer")
            .call(this.draggable());

        this.nodeEnter.append("rect")
            .attr("x", -4)
            .attr("y", -4)
            .attr("width", function (d) {
                return parseInt(d.w, 10) + 10;
            })
            .attr("height", function (d) {
                return parseInt(d.h, 10) + 10;
            })
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
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", function (d) {
                return d.w;
            })
            .attr("height", function (d) {
                return d.h;
            })
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
            },
            'rowType': {
                'data': [{ x: 0, y: 0, w: 300, h: 200, name:'ROW TYPE' }],
                'createTool': function (toolEnter, name) {
                    self._createRowTypeTool(toolEnter, name);
                }
            },
            'numberOfSeats': {
                'data': [{ x: 0, y: 0, w: 300, h: 200, name:'NUMBER OF SEATS' }],
                'createTool': function (toolEnter, name) {
                    self._createNumberOfSeatsTool(toolEnter, name);
                }
            },
            'tools': {
                'data': [{ x: 0, y: 0, w: 300, h: 175, name: 'TOOLS' }],
                'createTool': function (toolEnter, name) {
                    self._createToolsTool(toolEnter, name);
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
        var toolConfig = this._toolsConfig(toolName);
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
    App.prototype.categoriesData = function (container) {
        return _.map(self.categories, function (category) {
            return { x: container.x, y: container.y, parentW: container.w, w: 15, h:15, color: category.color, type: 'rect', name: category.name, price: category.price};
        });
    };
    App.prototype._rowTypesData = function (container) {
        var rowTypes = ['straight', 'curve'];
        return _.map(rowTypes, function (row) {
            return { x: container.x, y: container.y, parentW: container.w, name: row.toUpperCase(), h:30, w: '100%' };
        })
    };
    App.prototype._numberOfSeatsData = function (container) {
        var inputsList = ['# of Seats', 'First Seat #'];
        return _.map(inputsList, function (input) {
            return { x: container.x, y: container.y, parentW: container.w, name: input, h:30, w: 70 };
        })
    };
    App.prototype._toolsToolData = function (container) {
        var data = [
            { icon: '\uf096', text: 'blocks' },
            { icon: '\uf10c', text: 'circles' },
            { icon: '\uf035', text: 'text' },
            { icon: '\uf037', text: 'rows' }
        ];

        return _.map(data, function (item){
            return {
                'icon': { x: container.x, y: container.y, parentH: container.h,  parentW: container.w, name: item.icon },
                'text': { x: container.x, y: container.y, parentH: container.h,  parentW: container.w, name: item.text },
                'rect': { x: container.x, y: container.y, parentH: container.h,  parentW: container.w, h: 55, w: 55 }
            }
        });
    };
    App.prototype._deleteExtraTools = function () {
      d3.selectAll('g.tool').each(function (tool) {
          if (tool.name.toLowerCase() != 'tools') {
              this.remove();
          }
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

    App.prototype._createCategoriesTool = function (element, toolName) {
        this._createCategoriesToolContainer(element);
        this._createCategoriesToolContainerCategoriesList(toolName);
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

        this.categoryEnter.append("rect")
            .attr("x", function (d) {
                return d.x;
            })
            .attr("y", function (d) {
                return 75 - smallRectWidth*2 + d.y + 30 * d.id
            })
            .attr("width", '100%')
            .attr("height", 15)
            .attr("class", 'highlight')
            .style("fill-opacity", 0.2)
            .style('fill', 'white')
            .style('cursor', 'pointer')
            .on('click', function (d) {
                var selectRects = d3.selectAll('g.category > .highlight')[0];
                _.each(selectRects, function (rect) {
                    d3.select(rect).style('fill', 'white');
                });
                d3.select(this).style('fill', 'blue');
                var category = d3.select(this.parentNode).select('.categorytype');
                self.selectedCategory = self._getCategory({color: category.attr('fill').replace('#', '')});
            });

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
            .attr("stroke", "gray")
            .attr('class', 'categorytype');

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

    App.prototype._createRowTypeTool = function (element, toolName) {
        this._createRowTypeToolContainer(element);
        this._createRowTypeToolContents(toolName);
    };
    App.prototype._createRowTypeToolContainer = function (element) {
        element
            .append("rect")
            .attr("x", function (d) {
                return d.x;
            })
            .attr("y", function (d) {
                return d.y;
            })
            .attr("width", function (d) {
                return d.w;
            })
            .attr("height", function (d) {
                return d.h;
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
    };
    App.prototype._createRowTypeToolContents = function (toolName) {
        var i = 0;
        var stepY = 40;
        var containerData = this._toolsConfig(toolName).data[0];
        var data = this._rowTypesData(containerData);

        this.category = this.tool.selectAll("g.rowtypes").data(data, function(d) {
            return d.id || (d.id = ++i);
        });

        this.categoryEnter = this.category.enter()
            .append('g')
            .attr("class", "rowtypes");

        this.categoryEnter.append("rect")
            .attr("x", function (d) {
                return d.x;
            })
            .attr("y", function (d) {
                return stepY * d.id;
            })
            .attr("width", function (d) {
                return d.w;
            })
            .attr("height", function (d) {
                return d.h;
            })
            .style("fill-opacity", 0.2)
            .style('fill', 'none');

        this.categoryEnter.append("text")
            .attr("x", function (d) {
                return d.x + d.parentW/2;
            })
            .attr("y", function (d) {
                return d.id * stepY + stepY/2;
            })
            .attr("text-anchor", "middle")
            .text(function (d) {
                return d.name;
            })
            .style("font-size", "16px")
            .style("fill-opacity", 1)
            .style('fill', 'grey')
            .style('cursor', 'pointer')
            .on('click', function (d) {
                var selectRects = d3.selectAll('g.rowtypes > rect')[0];
                _.each(selectRects, function (rect, key) {
                    if(key+1 == d.id) {
                        d3.select(rect).style('fill', 'blue');
                        self.selectedRowType = d.name;
                    } else {
                        d3.select(rect).style('fill', 'none');
                    }
                })
            });

        this.toolExit = this.tool.exit()
            .remove();
        this.toolExit.select("text")
            .remove();
    };

    App.prototype._createNumberOfSeatsTool = function (element, toolName) {
        this._createNumberOfSeatsToolContainer(element);
        this._createNumberOfSeatsToolContents(toolName);
    };
    App.prototype._createNumberOfSeatsToolContainer = function (element) {
        element
            .append("rect")
            .attr("x", function (d) {
                return d.x;
            })
            .attr("y", function (d) {
                return d.y;
            })
            .attr("width", function (d) {
                return d.w;
            })
            .attr("height", function (d) {
                return d.h;
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
            .append("foreignObject")
            .attr("x", function (d) {
                return d.x + 8;
            })
            .attr("y", function (d) {
                return d.h - 50;
            })
            .attr("width", function (d) {
                return d.w - 20;
            })
            .attr("height", 50)
            .html('<button type="button" class="btn btn-primary btn-lg btn-block">GENERATE</button>')
            .on('click', function (d) {
                var shapesQty = jQuery('#ctrl1').val();
                var firstSeat = jQuery('#ctrl2').val();
                if( ! self.selectedCategory) {
                    alert('Please select category');
                    return;
                }
                if( ! self.selectedRowType) {
                    alert('Please select row type');
                    return;
                }

                self._generateRow(shapesQty, firstSeat);
            })
    };
    App.prototype._createNumberOfSeatsToolContents = function (toolName) {
        var i = 0;
        var inputWidth = 120;
        var containerData = this._toolsConfig(toolName).data[0];
        var data = this._numberOfSeatsData(containerData);

        this.category = this.tool.selectAll("g.numberofseats").data(data, function(d) {
            return d.id || (d.id = ++i);
        });

        this.categoryEnter = this.category.enter()
            .append('g')
            .attr("class", "numberofseats");

        this.categoryEnter
            .append("foreignObject")
            .attr("x", function (d) {
                return (inputWidth * (d.id-1)) + d.x + 30;
            })
            .attr("y", function (d) {
                return d.h + 50;
            })
            .attr("width", inputWidth)
            .attr("height", 50)
            .html(function (d) {
                return '<input class="form-control" type="text" id="ctrl' + d.id + '" placeholder="' + d.name + '" />'
            })
    };

    App.prototype._createToolsTool = function (element, toolName) {
        this._createToolsToolContainer(element);
        this._createToolsToolContents(toolName)
    };
    App.prototype._createToolsToolContainer = function (element) {
        element
            .append("rect")
            .attr("x", function (d) {
                return d.x;
            })
            .attr("y", function (d) {
                return d.y;
            })
            .attr("width", function (d) {
                return d.w;
            })
            .attr("height", function (d) {
                return d.h;
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
    };
    App.prototype._createToolsToolContents = function (toolName) {
        var i = 0;
        var containerData = this._toolsConfig(toolName).data[0];
        var data = this._toolsToolData(containerData);

        this.toolsTool = this.tool.selectAll("g.instrument").data(data, function(d) {
            return d.id || (d.id = ++i);
        });

        this.toolsToolEnter = this.toolsTool.enter()
            .append('g')
            .attr("class", "instrument")
            .on('click', function (d) {
                var selectRects = d3.selectAll('g.instrument > .toolItem')[0];
                var current_color = d3.select(this).select('rect').style('fill');
                _.each(selectRects, function (rect) {
                    d3.select(rect).style('fill', 'white');
                });
                if ( current_color != 'rgb(0, 0, 255)' ) {
                    d3.select(this).select('rect').style('fill', 'blue');
                }
                if (d.text.name == 'rows') {
                    self.isRowsToolSelected = !self.isRowsToolSelected;
                    if(self.isRowsToolSelected) {
                        return self._createTools();
                    } else {
                        self._deleteExtraTools();
                    }
                }
                if (d.text.name == 'blocks') {
                    self.isBlockCreationSelected = !self.isBlockCreationSelected;
                }
                if (d.text.name == 'circles') {
                    self.isBlockCreationSelected = false;
                    self.isCircleCreationSelected = !self.isCircleCreationSelected;
                   // self._createCircle();
                }
                if (d.text.name == 'text') {
                   // self._createText();
                }
                self._deleteExtraTools();
            });

        this.toolsToolEnter.append("rect")
            .attr("x", function (d) {
                return d.rect.x + d.rect.w * (d.id-1) + 25 + 10*(d.id-1);
            })
            .attr("y", function (d) {
                return d.rect.y + 60
            })
            .attr("width", function (d) {
                return d.rect.w
            })
            .attr("height", function (d) {
                return d.rect.h
            })
            .attr('class', 'toolItem')
            .style('fill', 'white')
            .style("fill-opacity", 0.2)
            .style('cursor', 'pointer')
            .style('stroke', 'grey')
            .style('', 'center');

        this.toolsToolEnter.append("text")
            .attr("x", function (d) {
                return d.rect.x + d.rect.w * (d.id-1) + 25 + 10*(d.id-1) + d.rect.w/2;
            })
            .attr("y", function (d) {
                return d.icon.y + d.rect.h/2 + 70;
            })
            .attr("text-anchor", "middle")
            .attr('font-family', 'FontAwesome')
            .attr('font-size',  '2em')
            .style('cursor', 'pointer')
            .text(function(d) { return d.icon.name });

        this.toolsToolEnter.append("text")
            .attr("x", function (d) {
                return d.rect.x + d.rect.w * (d.id-1) + 25 + 10*(d.id-1) + d.rect.w/2;
            })
            .attr("y", function (d) {
                return d.icon.y + d.rect.h + 78;
            })
            .attr("text-anchor", "middle")
            .attr('font-family', 'FontAwesome')
            .attr('font-size',  '0.8em')
            .style('cursor', 'pointer')
            .text(function(d) { return d.text.name.toUpperCase() });
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

        this.getData().then(function (response) {
            self.shapes = response.graphData;
            self.categories = response.categories;
        });
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
                    'graphData': {
                        'ungrouped': [
                            /*{ x: 100, y: 10, w: 40, h:40, color: 'red', number: '200', type: 'rect' },
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
                            { x: 130, y: 0, w: 40, h:40, color: 'green', number: '115', type: 'rect' }*/
                        ],
                        'grouped': [
                            {
                                'groupTag': {
                                    'name': '?',
                                    'coords': {
                                        x:-23,
                                        y: -20
                                    }
                                },
                                'groupCoords' : { x: 30, y:200 },
                                'groupElements': [
                                    { x: 130, y: 0, w: 40, h:40, color: 'green', number: '456', type: 'rect' },
                                    { x: 130, y: 30, w: 40, h:40, color: 'green', number: '787', type: 'rect' },
                                    { x: 10, y: 0, w: 40, h:40, color: 'green', number: '565', type: 'rect' }
                                ]
                            }
                        ]
                    },
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
            self._createTools();
        }
    };
    App.prototype.createDummyShape = function (type, shapesLength) {
        var shape = {
            w: 40,
            h: 40,
            color: 'red',
            number: Math.floor((Math.random() * 500) + 251),
            type: type
        };
    return { x: shape.w * shapesLength, y: 0, w: shape.w, h: shape.h, color: shape.color, number: shape.number, type: shape.type };
};
    App.prototype.selectAllShapes = function () {
        var shapes = [];
        var groups = [];
        var result = {};
        d3.selectAll('svg>g>g.point').each(function (d) {
            shapes.push(d);
        });

        /*d3.selectAll('.custom-block').each(function () {
            var element = d3.select(this);
            var x = parseInt(element.attr('x'), 10),
                y = parseInt(element.attr('y'), 10),
                w = parseInt(element.attr('width'), 10),
                h = parseInt(element.attr('height'), 10);
            shapes.push({ x: x, y: y, w: w, h: h, color: 'white', number: '', type: 'rect' });
        });*/

        /*d3.selectAll('.custom-circle').each(function () {
            var element = d3.select(this);
            var x = parseInt(element.attr('cx'), 10),
                y = parseInt(element.attr('cy'), 10),
                r = parseInt(element.attr('r'), 10),
                w = parseInt(element.attr('r'), 10);
            shapes.push({ x: x, y: y, r: r, w: w, color: 'white', number: '', type: 'circle' });
        });*/

        d3.selectAll('svg>g>g.group').each(function (g) {
            var elements = [];
            var coords = d3.transform(d3.select(this).attr("transform"));
            var grpX = coords.translate[0];
            var grpY = coords.translate[1];
            var rotate = coords.rotate;
            var groupTagName = d3.select(this).select('text').text();
            var groupTagCoords = d3.transform(d3.select(this).select('g.tag').attr("transform"));
            var groupId = d3.select(this).attr('grpId');

            d3.select(this).selectAll('g.point').each(function(d) {
                elements.push(d);
            });

            groups.push({
                'groupTag': {
                    'name': groupTagName,
                    'coords': {
                        x: groupTagCoords.translate[0],
                        y: groupTagCoords.translate[1]
                    }
                },
                'groupCoords' : { x: grpX, y: grpY, rotate: rotate },
                'groupElements': elements,
                'groupId': groupId || Math.floor((Math.random() * 1000000) + 1)
            });
        });

        result.ungrouped = shapes;
        result.grouped = groups;
        return  result;
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
    App.prototype._getCategory = function (param) {
        return _.where(self.categories, param)[0];
    };

    App.prototype._generateRow = function (shapesQty, firstSeat) {
        var rowTypesLogic = {
            'straight': function (shapesQty, rowsQty, firstSeat, category) {
                self.natCreateSeatsLine(shapesQty, rowsQty, firstSeat, 0, 0, category);
            },
            'curve': function () {
                alert('Curve row types are currently off');
            }
        };
        rowTypesLogic[self.selectedRowType.toLowerCase()](shapesQty, 1, firstSeat, self.selectedCategory.name);
    };
