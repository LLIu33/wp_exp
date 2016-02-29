<?php
?>

<div class="map_wrapper" style="clear: both;">
    <div class="container">
        <div class="row" style="margin-top:20px" >
            <button type="button" class="btn btn-success zoom_btn" id="zoom_in"> Zoom In </button>
            <button type="button" class="btn btn-success zoom_btn" id="zoom_out"> Zoom Out </button>
        </div>
    </div>
    <div id="graph">
        <div id="fon-size"><img alt="" src=""/></div>
        <div class="graph_container">
        </div>
        <div class="tool_container">
        </div>
    </div>
    <input type="hidden" id="graphData" name="graphData" />
    <input type="hidden" id="getData" name="getData" />

    <div class="modal fade add-category-modal-sm" tabindex="-1" role="dialog" aria-labelledby="mySmallModalLabel">
        <div class="modal-dialog modal-sm">
            <div class="modal-content">
                <h4 class="modal-header"> Create category </h4>
                <div class="modal-body">
                    <div class="form-inline text-center">
                        <div class="form-group">
                            <div class="input-group">
                                <div class="input-group-addon" id="name_type_app_btn">N</div>
                                <input class="form-control" type="text" id="category_name" placeholder="Name" />
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="input-group">
                                <div class="input-group-addon" id="color_type_app_btn">C</div>
                                <input class="form-control" type="text" id="category_color" placeholder="Color (hex)" />
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="input-group">
                                <div class="input-group-addon" id="price_type_app_btn">$</div>
                                <input class="form-control" type="number" id="category_price" placeholder="Price" step="any" min="0"/>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-success" id="create_category_app_btn">Create</button>
                </div>
            </div>
        </div>
    </div>
    <div class="hidden" id="popover-contents-section">
        <div class="form-inline">
            <div class="form-group">
                <input class="form-control" type="text" id="currency_value" placeholder="Input currency"/>
            </div>
            <button type="button" id="currency_change_triggered" class="btn btn-default">Ok</button>
        </div>
    </div>
    <div class="hidden" id="popover-color-picker">
        <div class="color_examples">
            <table>
                <tr class="color_row">
                </tr>
            </table>
        </div>
        <div class="form-group">
            <input class="form-control" type="text" id="hex_value" placeholder="Input color hex"/>
        </div>
        <button type="button" id="color_change_triggered" class="btn btn-primary">Ok</button>
        <button type="button" id="color_picker_cancel" class="btn btn-default">Cancel</button>
    </div>
</div>

<script type="text/html" id="color_picker_item">
    <td>
        <div class="form-group">
            <label>
                <input type="radio" name="color_picker" value="<%= color %>"/>
                <div class="color_box" style="background-color: <%= color %>">                    
                </div>
            </label>
        </div>
    </td>
</script>

<script>

    jQuery( document ).ready(function($) {
        var mapWrapper = $('.map_wrapper');
        $('.tribe-events-meta-group-gmap').after(mapWrapper);
    });

    var config = {
        dataProvider: 'serverData',
        margin: { top: 100, right: 120, bottom: 100, left: 120 },
        width: '100%',
        height: '960',
        duration: '1000',
        toolWidth: '300',
        toolHeight: '960',
        graphContainer: '.graph_container',
        toolContainer: '.tool_container',
        dataContainer: '#graphData',
        getDataContainer: "#getData",
        graphIdContainer: "post_ID"
    };
    var Graph = new App();
    Graph.draw(config);

    var popoverOptions = {
        'html': true,
        'title': 'Select currency',
        'content': function () {
            return jQuery('#popover-contents-section').html();
        },
        'trigger': 'click'
    };
    var colorPickerOptions = {
        'html': true,
        'title': 'Select color',
        'content': function () {
            return jQuery('#popover-color-picker').html();
        },
        'trigger': 'click'
    };
    jQuery('#price_type_app_btn').popover(popoverOptions);
    jQuery('#category_color').popover(colorPickerOptions);

    jQuery(document).on('click', '#currency_change_triggered', function () {
        var priceBtn = jQuery('#price_type_app_btn');
        priceBtn.text(jQuery('#currency_value').val());
        priceBtn.popover('hide');
    });

    jQuery(document).on('click', '#create_category_app_btn', function () {
        var category = {
            name: jQuery('#category_name').val(),
            color: jQuery('#category_color').val(),
            price: jQuery('#category_price').val()
        };
        var currency = jQuery('#price_type_app_btn').text();
        Graph.addCategory(category, currency);
        jQuery('.add-category-modal-sm').modal('hide');
        var el = jQuery('#categories_selection_app');
        createCategoriesList();
    });

    jQuery(document).on('click', '#categories_selection_app', function (e) {
        e.stopPropagation();
    });

    jQuery(document).on('click', 'input[name="color_picker"]', function (e) {
        var color = jQuery(this).val().replace('#', '');
        jQuery('#hex_value').val(color);
    });

    jQuery(document).on('click', '#color_change_triggered', function (e) {
        var color = jQuery('#hex_value').val();
        jQuery('#category_color').val(color);
        jQuery('#category_color').popover('hide');
    });

    jQuery(document).on('click', '#color_picker_cancel', function (e) {
        jQuery('#category_color').popover('hide');
    });

    jQuery(document).ready(function () {
        createCategoriesList();
        createColorsList();
    });

    function createColorsList () {
        var colors_list = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#C91BC0', '#F9D76F', '#A0E8BC', '#A50505'];
        _.each(colors_list, function (color) {
            var template = jQuery('#color_picker_item').html();
            jQuery('.color_row').append(_.template(template)({color: color}));
        });

    }
    function createCategoriesList () {
        var el = jQuery('#categories_selection_app');
        Graph.getCategoriesList().then(function(categoriesList){
            el.empty();
            _.each(categoriesList, function (category) {
                el.append('<option>'+category.name+'</option>')
            });
        });
    }

    function createElementsRow () {
        Graph.createSeatsLine(jQuery('#col-qty').val());
    }

    function createColoredElementsRow() {
        Graph.createSeatsLine(jQuery('#col-qty-clr').val(), 1, jQuery("#categories_selection_app option:selected").text());
    }

    function createElementsRowWithNumberStaringFrom() {
        Graph.createSeatsLine(jQuery('#col-qty-with-numbering').val(), jQuery('#col-qty-with-numbering-start-from').val());
    }

    function createElementsRowWithRadius() {
        Graph.natCreateSeatsLine(jQuery('#nat-col-qty-with-numbering').val(), jQuery('#col-qty-with-numbering-columns').val(), jQuery('#nat-col-qty-with-numbering-start-from').val(), jQuery('#col-qty-with-numbering-rotation').val(), jQuery('#col-qty-with-numbering-radius').val());
    }
</script>