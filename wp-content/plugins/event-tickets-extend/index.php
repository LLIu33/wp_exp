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

        add_action('admin_menu', array( $this, 'create_menu_page' ));

        add_action( 'plugins_loaded', array( $this, 'plugins_loaded' ), 0 );
    }

    /**
     * Adds the page to the admin menu
     */
    public function create_menu_page() {
    // Add a new submenu under Settings:
    add_options_page(
        __('Test Settings','menu-test'), 
        __('Test Settings','menu-test'), 
        'manage_options', 
        'testsettings', 
        array($this, 'mt_settings_page')
    );

    // Add a new submenu under Tools:
    add_management_page(
        __('Test Tools','menu-test'), 
        __('Test Tools','menu-test'), 
        'manage_options', 'testtools', 
        array($this, 'mt_tools_page')
    );

    // Add a new top-level menu (ill-advised):
    add_menu_page(
        __('Test Toplevel','menu-test'),
        __('Test Toplevel','menu-test'),
        apply_filters( 'tribe_common_event_page_capability', 'manage_options' ),//'manage_options',
        'event_seats_chart',
        null,
        'dashicons-tickets'
        // 'mt-top-level-handle', 
        // array($this, 'mt_toplevel_page')
    );

    // Add a submenu to the custom top-level menu:
    add_submenu_page(
        'mt-top-level-handle',
        __('Test Sublevel','menu-test'),
        __('Test Sublevel','menu-test'),
       'manage_options', 'sub-page',
       array($this, 'mt_sublevel_page')
   );

    // Add a second submenu to the custom top-level menu:
    add_submenu_page(
        'mt-top-level-handle', 
        __('Test Sublevel 2','menu-test'), 
        __('Test Sublevel 2','menu-test'), 
        'manage_options', 
        'sub-page2', 
        array($this, 'mt_sublevel_page2')
    );
}

    // mt_tools_page() displays the page content for the Test Tools submenu
    function mt_tools_page() {
        echo "<h2>" . __( 'Test Tools', 'menu-test' ) . "</h2>";
    }

    // mt_toplevel_page() displays the page content for the custom Test Toplevel menu
    // function mt_toplevel_page() {
    //     echo "<h2>" . __( 'Test Toplevel', 'menu-test' ) . "</h2>";
    // }

    // mt_sublevel_page() displays the page content for the first submenu
    // of the custom Test Toplevel menu
    function mt_sublevel_page() {
        echo "<h2>" . __( 'Test Sublevel', 'menu-test' ) . "</h2>";
    }

    // mt_sublevel_page2() displays the page content for the second submenu
    // of the custom Test Toplevel menu
    function mt_sublevel_page2() {
        echo "<h2>" . __( 'Test Sublevel2', 'menu-test' ) . "</h2>";
    }


// mt_settings_page() displays the page content for the Test Settings submenu
    function mt_settings_page() {

        //must check that the user has the required capability 
        if (!current_user_can('manage_options'))
        {
          wp_die( __('You do not have sufficient permissions to access this page.') );
        }

        // variables for the field and option names 
        $opt_name = 'mt_favorite_color';
        $hidden_field_name = 'mt_submit_hidden';
        $data_field_name = 'mt_favorite_color';

        // Read in existing option value from database
        $opt_val = get_option( $opt_name );

        // See if the user has posted us some information
        // If they did, this hidden field will be set to 'Y'
        if( isset($_POST[ $hidden_field_name ]) && $_POST[ $hidden_field_name ] == 'Y' ) {
            // Read their posted value
            $opt_val = $_POST[ $data_field_name ];

            // Save the posted value in the database
            update_option( $opt_name, $opt_val );

            ?>
            <div class="updated"><p><strong><?php _e('settings saved.', 'menu-test' ); ?></strong></p></div>
            <?php
        }
        echo '<div class="wrap">';
        echo "<h2>" . __( 'Menu Test Plugin Settings', 'menu-test' ) . "</h2>";
        ?>

        <form name="form1" method="post" action="">
        <input type="hidden" name="<?php echo $hidden_field_name; ?>" value="Y">

        <p><?php _e("Favorite Color:", 'menu-test' ); ?> 
        <input type="text" name="<?php echo $data_field_name; ?>" value="<?php echo $opt_val; ?>" size="20">
        </p><hr />

        <p class="submit">
        <input type="submit" name="Submit" class="button-primary" value="<?php esc_attr_e('Save Changes') ?>" />
        </p>

        </form>
        </div>

        <?php
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

        $this->init();
        $this->hooks();
        
        $this->has_initialized = true;
    }

    public function init() {
        // $this->register_resources();
        // $this->register_post_types();
    }

    public function hooks() {
        add_action( 'wp_insert_post', array( $this, 'add_custom_field_to_attendees' ), 10, 3 );
        add_filter( 'manage_tribe_events_page_tickets-attendees_columns', array( $this, 'add_my_custom_attendee_column'), 20 );
        add_filter( 'tribe_events_tickets_attendees_table_column', array( $this,'populate_my_custom_attendee_column'), 10, 3 );

        add_filter( 'tribe_events_register_venue_type_args', array( $this,'tribe_venues_custom_field_support') );
        // add_action( 'tribe_events_single_venue_before_upcoming_events', array( $this,'show_wp_custom_fields') );
    }

    public function add_custom_field_to_attendees( $post_id, $post, $update ) {
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

    function tribe_venues_custom_field_support( $args ) {
        $args['supports'][] = 'custom-fields';
        return $args;
    }

    // function show_wp_custom_fields() {
    //     var_dump('expression');die;
    //     $eventData = get_post_meta( get_the_ID() );
    //     $venueId = $eventData['_EventVenueID'][0];
    //     foreach (  get_post_meta( $venueId ) as $field => $value ) {
    //         echo '<span>' . esc_html( $field ) . ': <strong> ' . esc_html( $value ) . '<strong></span><br/>';
    //     }
    // }

    function register_post_types(){
        $args = array(
            'label'           => 'Seats chart',
            'public'          => true,
            'labels' => array(
                'name' => __( 'Charts' ),
                'singular_name' => __( 'Chart' )
              ),
            // 'show_ui'         => false,
            // 'show_in_menu'    => false,
            // 'query_var'       => false,
            // 'rewrite'         => false,
            // 'capability_type' => 'post',
            'has_archive'     => true,
            'hierarchical'    => true,
        );

        register_post_type('event_seats_chart', $args );

    }

    // if ( post_type_exists( 'tribe_events' ) ) {
    //     self::$parent_page = 'edit.php?post_type=tribe_events';
    // } else {
    //     add_menu_page(
    //         esc_html__( 'Events', 'tribe-common' ),
    //         esc_html__( 'Events', 'tribe-common' ),
    //         apply_filters( 'tribe_common_event_page_capability', 'manage_options' ),
    //         'tribe-common',
    //         null,
    //         'dashicons-calendar'
    //     );
    // }
}