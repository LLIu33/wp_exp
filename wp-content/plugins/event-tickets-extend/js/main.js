//'event_data' from php part
jQuery( document ).ready(function($) {

    // var mapSelect = $('#saved_map');
    var venueSelect = $('#saved_venue')
    var mapRow = $('.map_select_row');
    var venueRow = venueSelect.parents('tr');
    venueRow.after(mapRow);

    var mapSelect = $('<select id="saved_map" name="map_id" style="width: 220px;">');
    var mapEditButton = $('.map_select_cell .edit-map-link a');
    var defaultMapUrl = mapEditButton.attr('href');
    mapEditButton.parent().before(mapSelect);

    
    var currentVenueId = venueSelect.val();
    var mapList =  _.where(event_data.maps, {venue_id: currentVenueId});

    var currentMapId = event_data['selected_map'];
    var currentMapObj;

    if (!currentMapId) {
        mapEditButton.hide();
    } else {
        currentMapObj = getMapData(currentMapId, mapList);
        if (currentMapObj.data && currentMapObj.data.categories && currentMapObj.data.categories.length > 0) {
            generateHint(currentMapObj.data.categories);
        }
    }


    populateMapSelect(mapList);

    venueSelect.change(function(){
        //reset map_select value
        currentVenueId = $(this).val();
        mapList = _.where(event_data.maps, {venue_id: currentVenueId});
        populateMapSelect(mapList);
        mapEditButton.attr('href', defaultMapUrl).hide();
    });

    mapSelect.change(function(){
        //rerender hint for tickets
        currentMapId = $(this).val();
        mapEditButton.attr('href', defaultMapUrl + currentMapId ).show();
        $('#hintForTickets').remove();

        currentMapObj = getMapData(currentMapId, mapList);
        if (currentMapObj.data && currentMapObj.data.categories && currentMapObj.data.categories.length > 0) {
            generateHint(currentMapObj.data.categories);
        }
    });

    function getMapData(id, list) {
        filtredMapList = _.filter(list, function(item) {
            return  (item.ID == id);
        });
        var result;
        if (filtredMapList.length > 0) {
            result = filtredMapList[0];
            result.data = JSON.parse(result.post_content);
        }
        return result;
    }

    function generateHint(categories) {
        var el = $('<p id="hintForTickets">Your map contain next categories:<br /></p>')
        el.append('<b>#. Name / Color / <i> Price </i></b><br />');
        categories.forEach(function(category, i) {
            el.append((i+1) + '. '+ category.name + ' / #' + category.color + ' / <i>' + category.price + '</i><br />');
        });
        $('#ticket_form').before(el);
    }

    function populateMapSelect(mapList) {
        mapSelect.empty();
        mapSelect.append('<option value="">Select avaivable map</option>')
        mapList.forEach(function(mapItem) {
            var selected = (mapItem.selected) ? 'selected' : '';
            mapSelect.append('<option value="'+ mapItem.ID + '" ' + selected + '>'+ mapItem.post_title + '</option>');
        });
    }
});