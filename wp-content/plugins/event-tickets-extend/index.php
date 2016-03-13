<?php
/*
Plugin Name: Event Extend
Plugin URI: http://
Description: Event Extend Description.
Version: 1.0
Author: Artem G.
Author URI: http://
*/

if ( ! defined( 'ABSPATH' ) ) {
    die( '-1' );
}

define( 'EVENT_TICKETS_EXTEND_DIR', dirname( __FILE__ ) );


Tribe__Tickets__Main__Extend::instance();
class Tribe__Tickets__Main__Extend {
    /**
     * Instance of this class for use as singleton
     */
    private static $instance;

    public $plugin_name;
    public $plugin_dir;
    public $plugin_path;
    public $plugin_url;
    public $plugin_slug;

    //TODO: refactor this
    public $my_venues;
    public $my_maps;
    public $selected_map_id;

    private $has_initialized = false;

    /**
     * Get (and instantiate, if necessary) the instance of the class
     *
     * @static
     * @return Tribe__Tickets__Woo__Main
     */
    public static function instance() {
        if ( ! self::$instance ) {
            self::$instance = new self;
        }

        return self::$instance;
    }

    /**
     * Class constructor
     */
    public function __construct() {
        /* Set up some parent's vars */
        $this->plugin_name = 'Tickets_extend';
        $this->plugin_slug = 'tickets_extend';
        $this->plugin_path = trailingslashit( EVENT_TICKETS_EXTEND_DIR );
        $this->plugin_dir = trailingslashit( basename( $this->plugin_path ) );

        $dir_prefix = '';

        if ( false !== strstr( EVENT_TICKETS_EXTEND_DIR, '/vendor/' ) ) {
            $dir_prefix = basename( dirname( dirname( EVENT_TICKETS_EXTEND_DIR ) ) ) . '/vendor/';
        }

        $this->plugin_url = trailingslashit( plugins_url( $dir_prefix . $this->plugin_dir ) );

        add_action( 'plugins_loaded', array( $this, 'plugins_loaded' ), 0 );
    }

    /**
     * Finalize the initialization of this plugin
     */
    public function plugins_loaded() {
        // It's possible we'll have initialized already (if the plugin has been embedded as a vendor lib
        // within another plugin, for example) in which case we need not repeat the process
        if ( $this->has_initialized ) {
            return;
        }

        add_action( 'init', array( $this, 'init' ) );

        $this->hooks();
        
        $this->has_initialized = true;
    }

    public function init() {
        $this->register_map_post_type();
        $this->getEventData();
        // $this->register_resources();
    }

    public function hooks() {
        add_filter( 'manage_tribe_events_page_tickets-attendees_columns', array( $this, 'add_my_custom_attendee_column'), 20 );
        add_filter( 'tribe_events_tickets_attendees_table_column', array( $this,'populate_my_custom_attendee_column'), 10, 3 );

        add_action( 'admin_enqueue_scripts', array( $this, 'prepeare_admin_pages') );
        add_action( 'wp_insert_post', array( $this, 'prepeare_insert_post' ), 10, 3 );
        add_action( 'added_post_meta', array( $this, 'wpse16835_after_post_meta' ), 10, 4 );

        add_action( 'tribe_after_location_details', array( $this, 'displayEventMapDropdown' ) );
        add_action( 'tribe_events_single_meta_venue_section_end', array( $this,'show_wp_map_chart'));
        add_action( 'wp_enqueue_scripts', array($this, 'event_enqueue_hook') );

        add_filter( 'wp_insert_post_data' , array($this, 'filter_post_data') , '99', 2 );
        add_action( 'save_post', array($this, 'map_post_save_meta'), 1, 2 );
    }

    public function register_map_post_type() {
        $labels = array(
            'name' => 'Chart Maps',
            'singular_name' => 'Chart Map',
            'add_new' => 'Add map',
            'all_items' => 'All maps',
            'add_new_item' => 'Add map',
            'edit_item' => 'Edit map',
            'new_item' => 'New map',
            'view_item' => 'View map',
            'search_items' => 'Search maps',
            'not_found' => 'No maps found',
            'not_found_in_trash' => 'No maps found in trash',
            'parent_item_colon' => 'Parent map'
        );
        $args = array(
            'labels' => $labels,
            'public' => true,
            'has_archive' => true,
            'publicly_queryable' => true,
            'query_var' => true,
            'rewrite' => true,
            'capability_type' => 'post',
            'hierarchical' => false,
            'supports' => array(
                'title',
                'editor',
                'revisions',
            ),
            'menu_position' => 5,
            'menu_icon' => 'dashicons-images-alt2',
            'exclude_from_search' => false,
            'register_meta_box_cb' => array($this, 'map_add_post_type_metabox')
        );
        register_post_type( 'map_seats', $args );
    }

    public function map_add_post_type_metabox() {
        add_meta_box( 'map_metabox', 'Map Editor', array($this, 'map_metabox'), 'map_seats', 'normal' );
    }

    public function map_metabox() {
        global $post;

        // Noncename needed to verify where the data originated
        echo '<input type="hidden" name="map_post_noncename" value="' . wp_create_nonce( plugin_basename(__FILE__) ) . '" />';

        $selected_venue_id = get_post_meta($post->ID, '_map_venue_id', true);

        $my_venue_ids     = array();
        $my_venues        = false;
        $my_venue_options = '';

        $my_venues = $this->get_post_info(
            'tribe_venue',
            null,
            array(
                'post_status' => array(
                    'publish',
                    'draft',
                    'private',
                    'pending',
                )
            )
        );

        if ( ! empty( $my_venues ) ) {
            foreach ( $my_venues as $my_venue ) {
                $my_venue_ids[] = $my_venue->ID;
                $venue_title    = wp_kses( get_the_title( $my_venue->ID ), array() );
                $my_venue_options .= '<option data-address="' . esc_attr( $this->fullAddressString( $my_venue->ID ) ) . '" value="' . esc_attr( $my_venue->ID ) . '"';
                $my_venue_options .= selected( $selected_venue_id, $my_venue->ID, false );
                $my_venue_options .= '>' . $venue_title . '</option>';
            }
        }

        if ( $my_venues ) {
            // $venue_pto = get_post_type_object('tribe_venue');
            echo '<label style="min-width:150px;" for="saved_venue"><b>Choose venue:</b></label>';
            echo '<select class="chosen venue-dropdown" style="min-width:150px;" name="' . esc_attr( 'venue_id' ) . '" id="saved_venue">';
            echo $my_venue_options;
            echo '</select><br />';
        } else {
            echo '<p class="nosaved">' . esc_html__( 'No saved %s exists.') . '</p>';
        }
        include self::instance()->plugin_path . 'map-edit.php';
    }

    public function event_enqueue_hook() {
        global $post_type;

        if ( 'tribe_events' != $post_type ) {
            return;
        }
        
        $this->frontend_map_enqueue();
    }

    public function show_wp_map_chart() {
        global $post;
        $event_id = $post->ID;

        $tickets = $this->get_tickets( $event_id );

        $attendees =  $this->get_post_info(
            'tribe_rsvp_attendees', 
            null, 
            array(
                  'meta_key' => '_tribe_rsvp_event',
                  'meta_value' => $event_id,
                )
        );

        function getSeatsInfo($val) {
            $seatsInfo = get_post_meta ( $val->ID, 'seats', true);
            return array($val->ID, $seatsInfo);
        }

        $seatsAttendeeMap = array_map("getSeatsInfo", $attendees);

        $map_id = get_post_meta($event_id, '_map_id', true);
        $map_info = get_post($map_id);

        include self::instance()->plugin_path . 'map-chart.php';
    }

    public function prepeare_admin_pages($hook) {
        global $post_type;
        switch ($post_type) {
            case 'tribe_events':
                $this->tribe_events_enqueue($hook);
                break;
            case 'map_seats':
                $this->map_seats_enqueue($hook);
                break;
        }
    }

    public function getEventData() {
        $this->my_maps = $this->get_post_info(
            'map_seats',
            null,
            array(
                'post_status' => array(
                    'publish',
                    'draft',
                    'private',
                    'pending',
                )
            )
        );

        $this->selected_map_id = get_post_meta($_GET['post'], '_map_id', true);

        if ($this->my_maps) {
            foreach ($this->my_maps as &$map_item) {
                $map_item->venue_id = get_post_meta($map_item->ID, '_map_venue_id', true);
                $map_item->selected = ($this->selected_map_id == $map_item->ID) ? true : false;
            }
            unset($map_item); 
        }

        $this->my_venues = $this->get_post_info(
            'tribe_venue',
            null,
            array(
                'post_status' => array(
                    'publish',
                    'draft',
                    'private',
                    'pending',
                )
            )
        );
    }

    public function tribe_events_enqueue($hook) {
        if ('post-new.php' != $hook && 'post.php' != $hook ) {
            return;
        }

        wp_enqueue_script( 'event_tickets_extend_js', plugin_dir_url( __FILE__ ) . '/js/main.js', array('jquery') );
        wp_localize_script( 
            'event_tickets_extend_js', 
            'event_data', 
            array( 
                'maps' => $this->my_maps,
                'venues' => $this->my_venues,
                'selected_map' => $this->selected_map_id
            ) 
        );
    }

    public function map_seats_hook($hook) {
        if ('post-new.php' != $hook && 'post.php' != $hook ) {
            return;
        }

        $this->map_seats_enqueue();
    }

    public function map_seats_enqueue() {
        // comment out the next two lines to load the local copy of jQuery
        wp_deregister_script('jquery');
        wp_register_script('jquery', 'https://cdnjs.cloudflare.com/ajax/libs/jquery/2.2.1/jquery.min.js', false, '2.2.1');
        wp_enqueue_script('jquery');

        // comment out the next two lines to load the local copy of Underscore
        wp_deregister_script('underscore');
        wp_register_script('underscore', 'https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.8.3/underscore-min.js', false, '1.8.3');
        wp_enqueue_script('underscore');

        wp_enqueue_script( 'bootstrap.min.js', plugin_dir_url( __FILE__ ) . '/vendor/bootstrap/dist/js/bootstrap.min.js' );
        wp_enqueue_script( 'd3.min.js', plugin_dir_url( __FILE__ ) . '/vendor/d3/d3.min.js');
        wp_enqueue_script( 'd3-transform.js', plugin_dir_url( __FILE__ ) . '/vendor/d3-transform/src/d3-transform.js' );
        wp_enqueue_script( 'jquery-ui.min.js', plugin_dir_url( __FILE__ ) . '/vendor/jquery-ui/jquery-ui.min.js' );
        wp_enqueue_script( 'map_seats_app', plugin_dir_url( __FILE__ ) . '/js/app.js', array('jquery') );

        wp_register_style( 'bootstrap_min_css', plugin_dir_url( __FILE__ ) . '/vendor/bootstrap/dist/css/bootstrap.min.css', false, '1.0.0' );
        wp_register_style( 'bootstrap_theme_min_css', plugin_dir_url( __FILE__ ) . '/vendor/bootstrap/dist/css/bootstrap-theme.min.css', false, '1.0.0' );
        wp_register_style( 'custom_wp_admin_css', plugin_dir_url( __FILE__ ) . '/css/main.css', false, '1.0.0' );
        wp_register_style( 'jquery_ui_min_css', plugin_dir_url( __FILE__ ) . '/vendor/jquery-ui/themes/ui-lightness/jquery-ui.css', false, '1.0.0' );
        wp_register_style( 'font_awesome_min_css', 'https://maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css', false, '4.5.0' );

        wp_enqueue_style( 'bootstrap_min_css' );
        wp_enqueue_style( 'bootstrap_theme_min_css' );
        wp_enqueue_style( 'jquery_ui_min_css' );
        wp_enqueue_style( 'colorpicker_min_css' );
        wp_enqueue_style( 'custom_wp_admin_css' );
        wp_enqueue_style( 'font_awesome_min_css' );
    }

    public function frontend_map_enqueue() {
        // comment out the next two lines to load the local copy of jQuery
        wp_deregister_script('jquery');
        wp_register_script('jquery', 'https://cdnjs.cloudflare.com/ajax/libs/jquery/2.2.1/jquery.min.js', false, '2.2.1');
        wp_enqueue_script('jquery');

        // comment out the next two lines to load the local copy of Underscore
        wp_deregister_script('underscore');
        wp_register_script('underscore', 'https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.8.3/underscore-min.js', false, '1.8.3');
        wp_enqueue_script('underscore');

        wp_enqueue_script( 'bootstrap.min.js', plugin_dir_url( __FILE__ ) . '/vendor/bootstrap/dist/js/bootstrap.min.js' );
        wp_enqueue_script( 'd3.min.js', plugin_dir_url( __FILE__ ) . '/vendor/d3/d3.min.js');
        wp_enqueue_script( 'd3-transform.js', plugin_dir_url( __FILE__ ) . '/vendor/d3-transform/src/d3-transform.js' );
        wp_enqueue_script( 'client_map_app', plugin_dir_url( __FILE__ ) . '/js/clientApp.js', array('jquery'));

        wp_register_style( 'bootstrap_min_css', plugin_dir_url( __FILE__ ) . '/vendor/bootstrap/dist/css/bootstrap.min.css', false, '1.0.0' );
        wp_register_style( 'bootstrap_theme_min_css', plugin_dir_url( __FILE__ ) . '/vendor/bootstrap/dist/css/bootstrap-theme.min.css', false, '1.0.0' );
        wp_register_style( 'custom_wp_admin_css', plugin_dir_url( __FILE__ ) . '/css/main.css', false, '1.0.0' );

        wp_enqueue_style( 'bootstrap_min_css' );
        wp_enqueue_style( 'bootstrap_theme_min_css' );
        wp_enqueue_style( 'custom_wp_admin_css' );
    }

    public function displayEventMapDropdown() {
        include self::instance()->plugin_path . 'choose-map-row.php';
    }

    public function get_post_info($post_type, $p = null, $args = array() ) {

        $defaults = array(
            'post_type'            => $post_type, //'map_seats','tribe_venue'
            'nopaging'             => 1,
            'post_status'          => 'publish',
            'ignore_sticky_posts ' => 1,
            'orderby'              => 'title',
            'order'                => 'ASC',
            'p'                    => $p,
        );

        $args = wp_parse_args( $args, $defaults );
        $response = new WP_Query( $args );
        if ( $response->have_posts() ) :
            return $response->posts;
        endif;

        return false;
    }

    function wpse16835_after_post_meta( $meta_id, $post_id, $meta_key, $meta_value ) {
        if ($meta_key == '_tribe_rsvp_product') {
            var_dump( $meta_id, $post_id, $meta_key, $meta_value );die;
        }
    }

    public function prepeare_insert_post($post_id, $post, $update) {
        // post_type
        switch ($post->post_type) {
            case 'tribe_rsvp_attendees':
                $this->add_custom_field_to_attendees($post_id, $post);
                break;
            case 'tribe_events':
                $this->add_custom_field_to_events($post_id, $post);
                break;
            // case 'map_seats':
            //     $this->add_custom_field_to_map($post_id, $post, $update);
            //     break;
        }
    }

    public function add_custom_field_to_attendees( $post_id, $post ) {
        $product_list = array_map('get_post', (array) $_POST['product_id']);
        $_POST['attendee']['seats'] = preg_replace('/\\\"/',"\"", $_POST['attendee']['seats']);
        $seatsArr = empty( $_POST['attendee']['seats'] ) ? null :  json_decode($_POST['attendee']['seats'], true);

        // var_dump($post);
        // var_dump($seatsArr[0]);die;
        if(!empty($seatsArr)) {
            $first_seat = $seatsArr[0];
            foreach ( $product_list as $product ) {
                if ($product->post_title == $first_seat['category']['name']) {
                    $seatStr = $first_seat['name'] . " / " . $first_seat['tag'];
                    update_post_meta( $post_id, 'seats', $seatStr);
                    $seatsArr = (array)array_slice($seatsArr, 1);
                    $_POST['attendee']['seats'] = json_encode($seatsArr);
                }
            }
        }

        // foreach ( (array) $_POST['product_id'] as $product_id ) {

        //     // Get the event this tickets is for
        //     $event_id = get_post_meta( $product_id, $this->event_key, true );

        //     if ( empty( $event_id ) ) {
        //         continue;
        //     }

        //     $ticket = $this->get_ticket( $event_id, $product_id );

        //     // if there were no RSVP tickets for the product added to the cart, continue
        //     if ( empty( $_POST[ "quantity_{$product_id}" ] ) ) {
        //         continue;
        //     }

        //     $qty = max( intval( $_POST[ "quantity_{$product_id}" ] ), 0 );

        //     // Throw an error if Qty is bigger then Remaining
        //     if ( $ticket->managing_stock() && $qty > $ticket->remaining() ) {
        //         $url = add_query_arg( 'rsvp_error', 2, get_permalink( $event_id ) );
        //         wp_redirect( esc_url_raw( $url ) );
        //         die;
        //     }

        //     $has_tickets = true;

        //     // Iterate over all the amount of tickets purchased (for this product)
        //     for ( $i = 0; $i < $qty; $i ++ ) {

        //         $attendee = array(
        //             'post_status' => 'publish',
        //             'post_title'  => $attendee_full_name . ' | ' . ( $i + 1 ),
        //             'post_type'   => self::ATTENDEE_OBJECT,
        //             'ping_status' => 'closed',
        //         );

        //         // Insert individual ticket purchased
        //         $attendee_id = wp_insert_post( $attendee );

        //         $sales = (int) get_post_meta( $product_id, 'total_sales', true );
        //         update_post_meta( $product_id, 'total_sales', ++ $sales );

        //         update_post_meta( $attendee_id, self::ATTENDEE_PRODUCT_KEY, $product_id );
        //         update_post_meta( $attendee_id, self::ATTENDEE_EVENT_KEY, $event_id );
        //         update_post_meta( $attendee_id, $this->security_code, $this->generate_security_code( $attendee_id ) );
        //         update_post_meta( $attendee_id, $this->order_key, $order_id );
        //         update_post_meta( $attendee_id, $this->full_name, $attendee_full_name );
        //         update_post_meta( $attendee_id, $this->email, $attendee_email );
        //     }
        // }
    }

    public function add_custom_field_to_events( $post_id, $post) {
        $map_id = empty( $_POST['map_id'] ) ? null : sanitize_text_field( $_POST['map_id'] );
        update_post_meta( $post_id, '_map_id', $map_id);
    }

    public function add_my_custom_attendee_column( $columns ) {
        $columns['seats'] = 'Seats';
        return $columns;
    }
     
    public function populate_my_custom_attendee_column( $existing, $item, $column ) {
        if ($column == 'seats') {
            $seats = get_post_meta( $item['attendee_id'], 'seats', true );
            return esc_html($seats);
        }
        return $existing;
    }

    /**
     * Returns all the tickets for an event
     *
     * @param int $event_id
     *
     * @return array
     */
    protected function get_tickets( $event_id ) {
        $ticket_ids = $this->get_tickets_ids( $event_id );
        if ( ! $ticket_ids ) {
            return array();
        }

        $tickets = array();

        foreach ( $ticket_ids as $post ) {
            $tickets[] = $this->get_ticket( $event_id, $post );
        }

        return $tickets;
    }

    /**
     * Gets an individual ticket
     *
     * @param $event_id
     * @param $ticket_id
     *
     * @return null|Tribe__Tickets__Ticket_Object
     */
    public function get_ticket( $event_id, $ticket_id ) {
        $product = get_post( $ticket_id );

        if ( ! $product ) {
            return null;
        }

        $return = new stdClass();
        $qty    = (int) get_post_meta( $ticket_id, 'total_sales', true );

        $return->description    = $product->post_excerpt;
        $return->ID             = $ticket_id;
        $return->name           = $product->post_title;
        $return->price          = get_post_meta( $ticket_id, '_price', true );
        $return->provider_class = get_class( $this );
        $return->admin_link     = '';
        $return->start_date     = get_post_meta( $ticket_id, '_ticket_start_date', true );
        $return->end_date       = get_post_meta( $ticket_id, '_ticket_end_date', true );

        // $return->manage_stock( 'yes' === get_post_meta( $ticket_id, '_manage_stock', true ) );
        // $return->stock( get_post_meta( $ticket_id, '_stock', true ) - $qty );
        // $return->qty_sold( $qty );

        return $return;
    }

    public function get_tickets_ids( $event_id ) {
        if ( is_object( $event_id ) ) {
            $event_id = $event_id->ID;
        }

        $query = new WP_Query( array(
            'post_type'      => 'tribe_rsvp_tickets',
            'meta_key'       => '_tribe_rsvp_for_event',
            'meta_value'     => $event_id,
            'meta_compare'   => '=',
            'posts_per_page' => - 1,
            'fields'         => 'ids',
            'post_status'    => 'publish',
        ) );

        return $query->posts;
    }

    public function filter_post_data( $data , $postarr ) {
        if (($postarr['post_type'] == 'map_seats') && ($postarr['post_status'] != 'auto-draft')) {
            $data['post_content'] = (string) $postarr['graphData'];
        }
        return $data;
    }

    public function map_post_save_meta( $post_id, $post ) {
 
        /*
         * We need to verify this came from our screen and with proper authorization,
         * because the save_post action can be triggered at other times.
         */
 
        if ( ! isset( $_POST['map_post_noncename'] ) ) { // Check if our nonce is set.
            return;
        }
 
        // verify this came from the our screen and with proper authorization,
        // because save_post can be triggered at other times
        if( !wp_verify_nonce( $_POST['map_post_noncename'], plugin_basename(__FILE__) ) ) {
            return $post->ID;
        }
 
        // is the user allowed to edit the post or page?
        if( ! current_user_can( 'edit_post', $post->ID )){
            return $post->ID;
        }
        // ok, we're authenticated: we need to find and save the data
        // we'll put it into an array to make it easier to loop though

        $map_post_meta['_map_venue_id'] = $_POST['venue_id'];
 
        // add values as custom fields
        foreach( $map_post_meta as $key => $value ) { // cycle through the $map_post_meta array
            // if( $post->post_type == 'revision' ) return; // don't store custom data twice
            $value = implode(',', (array)$value); // if $value is an array, make it a CSV (unlikely)
            if( get_post_meta( $post->ID, $key, FALSE ) ) { // if the custom field already has a value
                update_post_meta($post->ID, $key, $value);
            } else { // if the custom field doesn't have a value
                add_post_meta( $post->ID, $key, $value );
            }
            if( !$value ) { // delete if blank
                delete_post_meta( $post->ID, $key );
            }
        }
    }

    public function fullAddressString( $postId = null ) {
        $address = '';
        if ( tribe_get_address( $postId ) ) {
            $address .= tribe_get_address( $postId );
        }

        if ( tribe_get_city( $postId ) ) {
            if ( $address != '' ) {
                $address .= ', ';
            }
            $address .= tribe_get_city( $postId );
        }

        if ( tribe_get_region( $postId ) ) {
            if ( $address != '' ) {
                $address .= ', ';
            }
            $address .= tribe_get_region( $postId );
        }

        if ( tribe_get_zip( $postId ) ) {
            if ( $address != '' ) {
                $address .= ', ';
            }
            $address .= tribe_get_zip( $postId );
        }

        if ( tribe_get_country( $postId ) ) {
            if ( $address != '' ) {
                $address .= ', ';
            }
            $address .= tribe_get_country( $postId );
        }

        return $address;
    }
}