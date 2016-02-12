<?php
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

    // public $plugin_name;
    // public $plugin_dir;
    // public $plugin_path;
    // public $plugin_url;
    // public $legacy_provider_support;

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
        $this->plugin_name = 'Tickets';
        $this->plugin_slug = 'tickets';
        $this->plugin_path = trailingslashit( EVENT_TICKETS_EXTEND_DIR );
        $this->plugin_dir = trailingslashit( basename( $this->plugin_path ) );

        $dir_prefix = '';

        if ( false !== strstr( EVENT_TICKETS_EXTEND_DIR, '/vendor/' ) ) {
            $dir_prefix = basename( dirname( dirname( EVENT_TICKETS_EXTEND_DIR ) ) ) . '/vendor/';
        }

        $this->plugin_url = trailingslashit( plugins_url( $dir_prefix . $this->plugin_dir ) );

        // $this->maybe_set_common_lib_info();

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

        // $this->init_autoloading();

        // // initialize the common libraries
        // $this->common();

        // load_plugin_textdomain( 'event-tickets', false, $this->plugin_dir . 'lang/' );

        $this->hooks();
        /**
        * Move RSVP Tickets form in events template
        */
        // remove_action( 'tribe_events_single_event_after_the_meta', array( Tribe__Tickets__RSVP::get_instance(), 'front_end_tickets_form' ), 5 );
        // add_action( 'tribe_events_single_event_before_the_content', array( Tribe__Tickets__RSVP__Extend::get_instance123(), 'front_end_tickets_form' ), 5 );
        
        $this->has_initialized = true;
    }

    public function hooks() {
        add_action( 'wp_insert_post', array( $this, 'add_custom_field_to_attendees' ), 10, 3 );
        add_filter( 'manage_tribe_events_page_tickets-attendees_columns', array( $this, 'add_my_custom_attendee_column'), 20 );
        add_filter( 'tribe_events_tickets_attendees_table_column', array( $this,'populate_my_custom_attendee_column'), 10, 3 );
    }

    public function add_custom_field_to_attendees( $post_id, $post, $update ) {
        var_dump($_POST);die;
        if (isset($_POST["attendee"])) {
            $seats = empty( $_POST['attendee']['seats'] ) ? null : sanitize_text_field( $_POST['attendee']['seats'] );
            update_post_meta( $post_id, 'seats', $seats);
        }
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
}
?>