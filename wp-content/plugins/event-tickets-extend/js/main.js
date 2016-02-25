//'event_data' from php part
jQuery( document ).ready(function($) {
    // var hintWithCategories = $('<p>Your map contain next categories:<br /> <b>red/vip/200$/10,</b><br /> <b>green/cheap/10$/200</b></p>');
    // $('#ticket_form_table tbody').before(hintWithCategories);

    var mapSelect = $('#saved_map');
    var venueSelect = $('#saved_venue')
    var mapRow = mapSelect.parents('tr');
    var venueRow = venueSelect.parents('tr');

    var mapList = [];
    var currentVenueId;
    var currentMapId;

    venueRow.after(mapRow);

    venueSelect.change(function(){
        //reset map_select value
        currentVenueId = $(this).val();
        mapList = _.where(event_data.maps, {venue_id: currentVenueId});
    });

    mapSelect.change(function(){
        //rerender hint for tickets
        currentMapId = $(this).val();
        
    });

    function generateHint(categories) {
        var el = $('<p></p>');
        el.append('Your map contain next categories:<br />');
        categories.forEach(function(category, i) {
          el.append('<b></b>');
        });
    }
});