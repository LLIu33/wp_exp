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

        // add_action('admin_menu', array( $this, 'create_menu_page' ));

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

        $this->init();
        $this->hooks();
        
        $this->has_initialized = true;
    }

    public function init() {
        $this->getEventData();
        // $this->register_resources();
        // $this->register_post_types();
    }

    public function hooks() {
        add_action( 'admin_enqueue_scripts', array( $this, 'events_my_enqueue') );
        add_action( 'wp_insert_post', array( $this, 'prepeare_insert_post' ), 10, 3 );
        add_filter( 'manage_tribe_events_page_tickets-attendees_columns', array( $this, 'add_my_custom_attendee_column'), 20 );
        add_filter( 'tribe_events_tickets_attendees_table_column', array( $this,'populate_my_custom_attendee_column'), 10, 3 );

        // add_filter( 'tribe_events_register_venue_type_args', array( $this,'tribe_venues_custom_field_support') );
        // add_action( 'tribe_events_single_venue_before_upcoming_events', array( $this,'show_wp_custom_fields') );
        add_action( 'tribe_after_location_details', array( $this, 'displayEventMapDropdown' ) );

        // add_filter('tribe_events_meta_box_template', array($this, 'change_event_mb_tpl'));
        // add_filter('tribe_events_tickets_modules', array($this, 'change_event_mb_tpl'));
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

        $this->selected_map_id = get_post_meta($post->ID, '_map_id', true);

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

    function events_my_enqueue($hook) {
        global $post_type;
        if ( 'tribe_events' != $post_type || ('post-new.php' != $hook && 'post.php' != $hook ) ) {
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

    // public function change_event_mb_tpl($tpl) {
    //     var_dump($tpl);die;
    //     return $this->plugin_path . '/events-meta-box.php';
    // }

    public function displayEventMapDropdown() {
        ?>
        <table><tbody>
        <tr class="map_select_row">
            <td style="width:200px">Choose map:</td>
            <td class="map_select_cell">
                <?php
                // $this->saved_map_dropdown( $map_id );
                ?>
                 <div class="edit-map-link" style="display:inline-block; margin-left: 10px;">
                    <a 
                        data-admin-url="<?php echo esc_url( admin_url( 'post.php?action=edit&post=' ) ); ?>" 
                        href="<?php echo esc_url( admin_url( 'post.php?action=edit&post=' ) ); ?>" 
                        target="_blank"
                    ><?php echo esc_html( sprintf( __( 'Edit map%s', 'the-events-calendar' ), $this->singular_map_label ) ); ?>
                    </a>
                </div>
            </td>
        </tr>
        </tbody></table>
        <?php
    }

    // public function saved_map_dropdown( $current = null, $name = 'map[MapID]' ) {
    //     global $post;
    //     $my_map_ids     = array();
    //     $my_maps        = false;
    //     $my_map_options = '';

    //     $selected_map_id = get_post_meta($post->ID, '_map_id', true);

    //     $my_maps = $this->my_maps;

    //     if ( ! empty( $my_maps ) ) {
    //         foreach ( $my_maps as $my_map ) {
    //             $my_map_ids[] = $my_map->ID;
    //             $map_title    = wp_kses( get_the_title( $my_map->ID ), array() );
    //             $my_map_options .= '<option value="' . esc_attr( $my_map->ID ) . '"';
    //             $my_map_options .= selected( $selected_map_id, $my_map->ID, false );
    //             $my_map_options .= '>' . $map_title . '</option>';
    //         }
    //     }

    //     // if ( $my_maps ) {
    //     //     echo '<select class="chosen map-dropdown" style="width: 220px;" name="' . esc_attr( 'map_id' ) . '" id="saved_map">';
    //     //     echo $my_map_options;
    //     //     echo '</select>';
    //     // } else {
    //     //     echo '<p class="nosaved">' . esc_html__( 'No saved Map%s exists.') . '</p>';
    //     // }
    // }

    function get_post_info($post_type, $p = null, $args = array() ) {
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
        $r    = new WP_Query( $args );
        if ( $r->have_posts() ) :
            return $r->posts;
        endif;

        return false;
    }

    public function prepeare_insert_post($post_id, $post, $update) {
        // post_type
        switch ($post->post_type) {
            case 'tribe_rsvp_attendees':
                $this->add_custom_field_to_attendees($post_id, $post, $update);
                break;
            case 'tribe_events':
                $this->add_custom_field_to_events($post_id, $post, $update);
                break;
            // case 'map_seats':
            //     $this->add_custom_field_to_map($post_id, $post, $update);
            //     break;
        }
    }

    public function add_custom_field_to_attendees( $post_id, $post, $update ) {
        $seats = empty( $_POST['attendee']['seats'] ) ? null : sanitize_text_field( $_POST['attendee']['seats'] );
        update_post_meta( $post_id, 'seats', $seats);
    }

    public function add_custom_field_to_events( $post_id, $post, $update ) {
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

    // function tribe_venues_custom_field_support( $args ) {
    //     $args['supports'][] = 'custom-fields';
    //     return $args;
    // }

    // function show_wp_custom_fields() {
    //     var_dump('expression');die;
    //     $eventData = get_post_meta( get_the_ID() );
    //     $venueId = $eventData['_EventVenueID'][0];
    //     foreach (  get_post_meta( $venueId ) as $field => $value ) {
    //         echo '<span>' . esc_html( $field ) . ': <strong> ' . esc_html( $value ) . '<strong></span><br/>';
    //     }
    // }

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