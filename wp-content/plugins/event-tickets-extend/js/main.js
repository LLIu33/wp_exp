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
    var currentMapId = event_data['selected_map'];
    var currentMapObj;

    if (!currentMapId) {
        mapEditButton.hide();
    }

    var mapList =  _.where(event_data.maps, {venue_id: currentVenueId});

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

        currentMapObj = _.filter(mapList, function(item) {
            return  (item.ID == currentMapId);
        })[0];
        currentMapObj.post_content = JSON.parse(currentMapObj.post_content);
        if (currentMapObj.post_content.categoies && currentMapObj.post_content.categoies.length > 0) {
            generateHint(currentMapObj.post_content.categoies);
        }
    });

    function generateHint(categories) {
        var el = $('<p>Your map contain next categories:<br /></p>');
        categories.forEach(function(category) {
            el.append('<b>'+ category.name + '/' + category.color + '/' + category.price + '</b>');
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