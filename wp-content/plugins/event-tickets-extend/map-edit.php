<style>
    #postdivrich {
        display: none;
    }
</style>
<div class="container-fluid">
    <div class="row" style="margin-top:20px" >
        <button type="button" class="btn btn-warning" onclick="Graph.resetGraph()"> Reset </button>
        <button type="button" class="btn btn-warning" onclick="editSelected()"> Edit Selected </button>
        <label class="upload btn btn-primary">
            <input type="file" onchange="Graph.uploadPic()" class="background_pic">
            Upload Picture
        </label>
        <button type="button" class="btn btn-primary zoom_plus" onclick="Graph.zoomBackground(5/4)">
            +
        </button>
        <button type="button" class="btn btn-primary zoom_minus" onclick="Graph.zoomBackground(4/5)">
            -
        </button>
    </div>
    <div class="row" style="margin-top:10px">
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
<input type="hidden" id="getData" name="getData" value='<?php echo $post->post_content ?>'/>

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
                <button type="button" class="btn btn-success create_category" id="create_category_app_btn">Create</button>
                <button type="button" class="btn btn-success edit_category" id="create_category_app_btn">Edit</button>
            </div>
        </div>
    </div>
</div>
<div class="modal fade edit-row-modal-sm" tabindex="-1" role="dialog" aria-labelledby="mySmallModalLabel">
    <div class="modal-dialog modal-sm">
        <div class="modal-content">
            <h4 class="modal-header"> Edit row </h4>
            <div class="modal-body">
                <div class="form-inline text-center edit-row-collect">
                    <div class="form-group">
                        <input class="form-control" type="text" id="edit-row-row-name" placeholder="Set row name" />
                    </div>
                    <div class="form-group">
                        <input class="form-control" type="text" id="edit-row-number-of-seats" placeholder="Set number of seats" />
                    </div>
                    <div class="form-group">
                        <input class="form-control" type="text" id="edit-row-start-from" placeholder="Number to start from" />
                    </div>
                    <div class="form-group">
                        <select class="form-control" id="categories_selection_app">
                        </select>
                    </div>
                    <div class="form-group">
                        <input class="form-control" type="number" id="edit-row-rotate" placeholder="Rotate" step="any" min="0"/>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-success" id="edit-row-finish">Ok</button>
            </div>
        </div>
    </div>
</div>
<div class="modal fade edit-seat-modal-sm" tabindex="-1" role="dialog" aria-labelledby="mySmallModalLabel">
    <div class="modal-dialog modal-sm">
        <div class="modal-content">
            <h4 class="modal-header"> Edit seat </h4>
            <div class="modal-body">
                <div class="form-inline text-center edit-seat-collect">
                    <div class="form-group">
                        <input class="form-control" type="text" id="edit-seat-number" placeholder="Set new number" />
                    </div>
                    <div class="form-group">
                        <select class="form-control" id="edit-seat-category">
                        </select>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-success" id="edit-seat-finish">Ok</button>
            </div>
        </div>
    </div>
</div>
<div class="modal fade edit-selected-elements" tabindex="-1" role="dialog" aria-labelledby="myModalLabel">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                <h4 class="modal-title" id="myModalLabel">Edit selected</h4>
            </div>
            <div class="modal-body">
                <div class="form-inline text-center edit-seat-collect">
                    <div class="form-group">
                        <input class="form-control" type="text" id="edit-group-start-from" placeholder="Number to start from" />
                    </div>
                    <div class="form-group">
                        <select class="form-control" id="edit-group-category">
                        </select>
                    </div>
                    <div class="form-group">
                        <input class="form-control" type="number" id="edit-group-rotate" placeholder="Rotate" step="any" min="0" />
                    </div>
                    <input type="hidden" id="edit-group-groups-list" />
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
                <button type="button" id="edit-group-finish" class="btn btn-primary">Ok</button>
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

    <script type="text/html" id="color_picker_item">
        <td>
            <div class="form-group">
                <label>
                    <input type="radio" name="color_picker" value="<%= color %>"/>
                    <div class="color_box" style="background-color: <%= color %>"></div>
                </label>
            </div>
        </td>
    </script>
<script>
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

    jQuery(document).on('click', '#edit-row-finish', function() {
        var name = jQuery('#edit-row-row-name'),
            numberOfSeats = jQuery('#edit-row-number-of-seats'),
            rotate = jQuery('#edit-row-rotate'),
            category = jQuery("#categories_selection_app option:selected"),
            startFrom = jQuery('#edit-row-start-from');
        Graph.editRow({
            name: name.val(),
            numberOfSeats: numberOfSeats.val(),
            rotate: rotate.val(),
            category: category.val(),
            startFrom: startFrom.val()
        });
        name.val('');
        numberOfSeats.val('');
        rotate.val('');
        startFrom.val('');
        jQuery('.edit-row-modal-sm').modal('hide');
    });

    jQuery(document).on('click', '#edit-group-finish', function() {
        var rotate = jQuery('#edit-group-rotate'),
            category = jQuery("#edit-group-category option:selected"),
            startFrom = jQuery('#edit-group-start-from');
        var groups = jQuery('#edit-group-groups-list');
        var groupIds = [];

        if( groups.val() != 'false') {
            groupIds = groups.val().split(",")
        }

        Graph.editSelectedItems({
            rotate: rotate.val(),
            category: category.val(),
            groupsId: groupIds,
            startFrom: startFrom.val()
        });
        rotate.val('');
        startFrom.val('');
        jQuery('.edit-row-modal-sm').modal('hide');
    });

    jQuery(document).on('click', '#edit-seat-finish', function() {
        var name = jQuery('#edit-seat-number'),
            rotate = jQuery('#edit-seat-rotate'),
            category = jQuery("#edit-seat-category option:selected");

        Graph.editSeat({
            name: name.val(),
            rotate: rotate.val(),
            category: category.val()
        });
        name.val('');
        rotate.val('');
        jQuery('.edit-seat-modal-sm').modal('hide');
    });
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
        updateCategoriesList();
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
        updateCategoriesList();
        createColorsList();
    });

    function updateCategoriesList() {
        createCategoriesList(jQuery('#categories_selection_app'));
        createCategoriesList(jQuery('#edit-seat-category'));
        createCategoriesList(jQuery('#edit-group-category'));
    }

    function editSelected() {
        if( ! Graph.hasAnySelectedNodes()) return alert('No editable items selected');

        jQuery('#edit-group-rotate').attr('disabled', ! Graph.isGroupEditAllowed());
        jQuery('#edit-group-start-from').attr('disabled', ! Graph.isGroupEditAllowed());

        jQuery('#edit-group-groups-list').val(Graph.isGroupEditAllowed());

        jQuery('.edit-selected-elements').modal('show');
    }

    function createColorsList () {
        var colors_list = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#C91BC0', '#F9D76F', '#A0E8BC', '#A50505'];
        _.each(colors_list, function (color) {
            var template = jQuery('#color_picker_item').html();
            jQuery('.color_row').append(_.template(template)({color: color}));
        });

    }
    function createCategoriesList (el) {
        Graph.getCategoriesList().then(function(categoriesList){
            el.empty();
            el.append('<option value=""> Select category </option>');
            _.each(categoriesList, function (category) {
                el.append('<option value="' + category.name + '">'+category.name+'</option>')
            });
        });
    }

    function createElementsRowWithRadius() {
        Graph.natCreateSeatsLine(jQuery('#nat-col-qty-with-numbering').val(), jQuery('#col-qty-with-numbering-columns').val(), jQuery('#nat-col-qty-with-numbering-start-from').val(), jQuery('#col-qty-with-numbering-rotation').val(), jQuery('#col-qty-with-numbering-radius').val());
    }
</script>