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
        $this->has_initialized = true;
    }

        public function hooks() {
        add_action( 'render_attendees_table', array( $this, 'some_action' ) );
        add_filter('the_title', array( $this, 'my_own_function_for_title' ));
        // add_filter( 'the_title', function( $title ) { return $title . ' <- ModifiedTitle'; } );
        // add_action( 'tribe_events_page_tickets-attendees', 'my_own_function_for_title' );
        // add_action( 'add_meta_boxes', array( 'Tribe__Tickets__Metabox', 'maybe_add_meta_box' ) );
        // add_action( 'admin_enqueue_scripts', array( 'Tribe__Tickets__Metabox', 'add_admin_scripts' ) );
        // add_filter( 'tribe_post_types', array( $this, 'inject_post_types' ) );

        // // Setup Help Tab texting
        // add_action( 'tribe_help_pre_get_sections', array( $this, 'add_help_section_support_content' ) );
        // add_action( 'tribe_help_pre_get_sections', array( $this, 'add_help_section_featured_content' ) );
        // add_action( 'tribe_help_pre_get_sections', array( $this, 'add_help_section_extra_content' ) );
        // add_action( 'plugins_loaded', array( 'Tribe__Support', 'getInstance' ) );
    }

    public function my_own_function_for_title( $title ){
        // $attendees_page->
        $title = strtolower($title . " <--This is Title!!!");
        return $title;
    }

    /**
     * Hooked to the init action
     */
    public function some_action($arg) {
        var_dump($arg);die();
        return $arg;
    }
}
?>