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

        // $('g.point').click(function(){
        //     var el = $(this);
        //     var result = geSeatValue(el);
        //     updateSeatsResult(result, seatsInput);
        // });
    });

    // function geSeatValue(el) {
    //     var val = el.find('text').text();
    //     var color = el.find('rect.inner').attr('fill');
    //    return color + ' / ' + val;
    // }

    // function updateSeatsResult(val, seatsInput) {
    //     var values = seatsInput.val();
    //     valuesArr = (values.length > 0) ? values.split(';') : [];
    //     var indexVal = $.inArray(val, valuesArr);
    //     if (indexVal === -1) {
    //         valuesArr.push(val);
    //     } else {
    //         valuesArr.splice(indexVal, 1);
    //     }
    //     seatsInput.val(valuesArr.join(';'));
    // }

</script>