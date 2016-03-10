<style>
    .tool_container {
        display: none;
    }

    .map_wrapper {
        clear: both;
    }

    #graph {
        height: 960px;
    }
</style>
<div class="map_wrapper">
    <div>
        <input type="hidden" name="attendee[seats]" id="tribe-tickets-seats">
        <div id="graph">
            <div id="font-size"><img alt="" src=""/></div>
            <div class="graph_container">
            </div>
        </div>
    </div>
</div>

<input type="hidden" id="graphData" name="graphData" />
<input type="hidden" id="getData" name="getData" value='<?php echo $map_info->post_content; ?>'/>

<script>
    var config = {
        dataProvider: 'serverData',
        margin: { top: 100, right: 120, bottom: 100, left: 120 },
        width: '100%',
        height: '960',
        duration: '1000',
        graphContainer: '.graph_container',
        dataContainer: '#graphData',
        getDataContainer: "#getData",
        graphIdContainer: "post_ID"
    };
    var Client = new ClientApp();

    Client.draw(config);

    jQuery( document ).ready(function($) {
        var mapWrapper = $('.map_wrapper');
        $('.tribe-events-meta-group-gmap').after(mapWrapper);

        var seatsInput = $('#tribe-tickets-seats');

        $('form.cart .tribe-events-tickets').before(seatsInput);

        $('g.point').click(function(){
            var result = Client.getSelectedSeats();
            seatsInput.val(JSON.stringify(result));
        });
    });

</script>