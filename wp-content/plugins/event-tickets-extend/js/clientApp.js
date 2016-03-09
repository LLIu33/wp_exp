function ClientApp () {}

ClientApp. prototype.draw = function () {
    this.config = config;
    this._init();
    this._setDataProvider(this.config.dataProvider);
    this._drawFloor();
};

ClientApp.prototype._init = function () {
    this.margin = this.config.margin;
    this.width = this.calculateGraphWidthConfig();
    this.height = this.config.height - this.margin.top - this.margin.bottom;
    this.duration = this.config.duration;
    this.graphContainer = this.config.graphContainer;
    this.graphId = function () {
        var id = jQuery('input[name="post_ID"]').val();
        if(! id) return 'graph';
        return id;
    };

    this.tagHeight = 18;
    this.tagWidth = 12;
    self = this;


    this.svg = d3.select(this.graphContainer)
        .append("svg")
        .attr("style", "border:2px solid black;");

    this.graph = this.svg
        .attr("width", this.calculateGraphWidthCorrection())
        .attr("height", this.height + this.margin.top + this.margin.bottom)
        .append('g')
        .attr("transform", "translate(" + 20 + "," + 20 + ")");

    jQuery(this.graphContainer)
        .css('width', this.calculateGraphWidthCorrection())
        .css('height', this.height + this.margin.top + this.margin.bottom);
};
ClientApp.prototype._setDataProvider = function (provider) {
    if(_.isUndefined(provider)) {
        this.provider = this.fakeData();
    }
    this.provider = eval('this.'+provider+'()');
};
ClientApp.prototype.getData = function () {
    return this.provider;
};
ClientApp.prototype.fakeData = function () {
    return jQuery.Deferred(function () {
        var that = this;
        setTimeout(function() {
            var data = {
                'graphData': {
                    'labels': [
                        { x: 823, y: 209, text: 'test', type: 'text' }
                    ],
                    'ungrouped': [
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
                ],
                'bougtTickets': [
                    { name: 565, tag: '?' },
                    { name: 456, tag: '?' }
                ]
            };
            that.resolve(data);
        },0);
    })
};
ClientApp.prototype.serverData = function () {
    return jQuery.Deferred(function () {
        var data = jQuery(self.config.getDataContainer).val();
        if(data) {
            this.resolve(JSON.parse(data));
        }
        this.resolve({ graphData: { 'labels': [], 'ungrouped': [], 'grouped': [] }, categories: [] });
    });
};
ClientApp.prototype._drawFloor  = function () {
    this.getData().then(function (response) {
        self.shapes = response.graphData;
        self.categories = response.categories;
        self.boughtTickets = response.bougtTickets;
        self._createShapes(self.shapes);
        self._createLabels(self.shapes);
    });
};
ClientApp.prototype._createLabels = function (data) {
    if( ! data['labels']) return;

    var i = 0;

    this.label = this.graph.selectAll("svg>g>g.label").data(data['labels'], function (d) {
        return d.id || (d.id = ++i);
    });

    this.labelEnter = this.label.enter().append("g")
        .attr("class", "label")
        .attr("cursor", "pointer");

    this._textElement(this.labelEnter);

    this.labelEnter = self.label
        .append("rect")
        .attr("x", function (d) {
            return -3;
        })
        .attr("y", function (d) {
            return -(this.parentNode.getBBox().height);
        })
        .attr("height", function (d) {
            return this.parentNode.getBBox().height + 6;
        })
        .attr("width", function (d) {
            return this.parentNode.getBBox().width + 6;
        })
        .attr("class", "outer");

    this.rotate(this.label);

    this.labelExit = this.label.exit()
        .remove();
    this.labelExit.select("text")
        .remove();

};
ClientApp.prototype._createShapes = function (data, grouped, rotation) {
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
                });

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
                .attr("x", 7)
                .attr("y", 14)
                .attr("text-anchor", "middle")
                .text(function () {
                    return group.groupTag.name || '?';
                })
                .attr("fill", "white")
                .attr("stroke", "none")
                .style("cursor", "pointer");

            self.node = self.groupContainer.selectAll("g.point").data(group.groupElements, function(d) {
                return d.id || (d.id = ++i);
            });

            self.nodeEnter = self.node.enter().append("g")
                .attr("class", "point")
                .attr("cursor", "pointer")
                .attr("y", -4)
                .on('click', function (d) {
                    console.log(self.isBoughtTicket(d));
                    if(self.isBoughtTicket(d)) {
                        return;
                    } else {
                        var rect = d3.select(this).select('.inner');
                        if(rect.classed("buy")) {
                            return rect.style("fill-opacity", 1.0).classed('buy', false);
                        }
                        return rect.style("fill-opacity", 0.4).classed('buy', true);
                    }
                });

            self.nodeEnter.append("rect")
                .attr("x", function (d) {
                    if (d.type == 'rect') {
                        return -4;
                    }
                    return -4 - d.r;
                })
                .attr("y", function (d) {
                    if (d.type == 'rect') {
                        return -4;
                    }
                    return -4 - d.r;
                })
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
                    if (d.type == 'rect') {
                        return d.w/2;
                    }
                    return 0;
                })
                .attr("y", function (d) {
                    if (d.type == 'rect') {
                        return d.h/2 + 5;
                    }
                    return 5;
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
        });
    }
    if( ! _.isUndefined(data['ungrouped'])) {
        this.node = this.graph.selectAll("svg>g>g.point").data(data['ungrouped'], function(d) {
            return d.id || (d.id = ++i);
        });

        this.nodeEnter = this.node.enter().append("g")
            .attr("class", "point")
            .attr("cursor", "pointer");

        this.nodeEnter.append("rect")
            .attr("x", function (d) {
                if(d.r) {
                    return -(parseInt(d.w, 10)*2 + 10) / 2
                }
                return -4;
            })
            .attr("y", function (d) {
                if(d.r) {
                    return -(parseInt(d.h, 10) * 2 + 10) / 2
                }
                return -4;
            })
            .attr("width", function (d) {
                if(d.r) {
                    return parseInt(d.r)*2 + 10
                }
                return parseInt(d.w, 10) + 10;
            })
            .attr("height", function (d) {
                if(d.r) {
                    return parseInt(d.r)*2 + 10
                }
                return parseInt(d.h, 10) + 10;
            })
            .attr("class", "outer");

        this._shapeType(this.nodeEnter);

        this.nodeEnter.append("text")
            .attr("x", function (d) {
                if (d.type == 'rect') {
                    return d.w/2;
                }
                return 0;
            })
            .attr("y", function (d) {
                if (d.type == 'rect') {
                    return d.h/2 + 5;
                }
                return 5;
            })
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
    }
};
ClientApp.prototype._shapeType = function (element) {
    element.append(function(d) {
        return document.createElementNS("http://www.w3.org/2000/svg", d.type);
    })
        .attr("x", 0)
        .attr("y", 0)
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("width", function (d) {
            return d.w;
        })
        .attr("height", function (d) {
            return d.h;
        })
        .attr("r", function (d) {
            return d.r || 0;
        })
        .attr("stroke", "black")
        .attr("stroke-width", "2")
        .attr("fill",function(d){
            if(self.isBoughtTicket(d)) {
                return '#524C4C';
            }
            return self._getElementColor(d.color);
        })
        .attr("class", "inner");
};
ClientApp.prototype._textElement = function (element) {
    element
        .append(function(d) {
            return document.createElementNS("http://www.w3.org/2000/svg", d.type);
        })
        .text(function (d) {
            return d.text;
        })
        .attr("x", 0)
        .attr("y", 0)
        .attr("class", "inner")
        .style("font-size","24px");
};
ClientApp.prototype.rotate = function (element) {
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
                .translate(x, y)
                .rotate(degree)();
        });
};
ClientApp.prototype.calculateGraphWidthConfig = function () {
    var width = this.config.width;
    if(width.indexOf('%') === -1) {
        return width - this.margin.right - this.margin.left;
    }
    return width;
};
ClientApp.prototype.calculateGraphWidthCorrection = function () {
    var width = this.config.width;
    if(width.indexOf('%') === -1) {
        return +width + this.margin.right + this.margin.left;
    }
    return width;
};

ClientApp.prototype._getElementColor = function (color) {
    if(self._isHexColorFormat(color)){
        return '#' + color;
    }
    return color;
};
ClientApp.prototype._isHexColorFormat = function (color) {
    return /(^[0-9A-F]{6}$)|(^[0-9A-F]{3}$)/i.test(color)
};
ClientApp.prototype.getSelectedSeats = function () {
    var selectedElms = d3.selectAll('.buy');
    var data = [];
    selectedElms.each(function (d) {
        data.push({ name: d.number, tag: d3.select(this.parentNode.parentNode).select('.tag > text').text(), category: self._getCategory({ color: d.color })});
    });
    return data;
};
ClientApp.prototype._getCategory = function (param) {
    return _.where(self.categories, param)[0];
};
ClientApp.prototype.isBoughtTicket = function (data) {
    var result;
     _.each(self.boughtTickets, function (ticket) {
        if (ticket.name == data.number) {
            result = _.find(self.shapes['grouped'], function (group) {
                return (group.groupTag.name == ticket.tag);
            })
        }
    });
    return result;
};