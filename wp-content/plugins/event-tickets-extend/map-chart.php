<style>
    .tool_container {
        display: none;
    }

    .map_wrapper {
        clear: both;
    }

    #graph {
        height: 460px;
    }

    .cart .tribe-tickets-meta-row {
        display: table-row;
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
        height: '460',
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
        var seatsInput = $('#tribe-tickets-seats');
        var mainForm = $("form.cart");
        var metaEl = $('.tribe-events-event-meta');

        var ticketsEl = mainForm.find('.tribe-events-tickets');

        metaEl.append(mapWrapper);
        ticketsEl.before(seatsInput);

        var ticketRows =  $('.tribe-events-tickets tr').has('.tickets_name').hide();
        var ticketsElLIst = ticketRows.find('.tickets_name');

        mainForm.submit(function(e){
            // e.preventDefault();
            var result = Client.getSelectedSeats();
            seatsInput.val(JSON.stringify(result));

            //add quantity
            var resultFormatted = _.map(result, function(item) {
                return {
                    seat: item.name,
                    row: item.tag,
                    price: item.category.name,
                    category: item.category.name,
                    color: item.category.color
                };
            });

            _.each(ticketRows, function(ticketRow) {
                var categoryEl = $(ticketRow).find('.tickets_name');
                var categoryName = categoryEl.text().trim();
                var itemByCategory = _.where(resultFormatted, {category: categoryName});
                //set quantity for every selected and available tickets
                categoryEl.parent().find('.tribe-ticket-quantity').val(itemByCategory.length);
            });
            
            // mainForm.submit();
        });
    });
</script>