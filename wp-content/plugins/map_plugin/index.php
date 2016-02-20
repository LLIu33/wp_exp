<?php

/*
Plugin Name: Map Example
Plugin URI: http://
Description: Map Example Description.
Version: 1.0
Author: Artem G.
Author URI: http://
*/

function my_enqueue($hook) {
    global $post_type;

    if ( 'map_seats' != $post_type || ('post-new.php' != $hook && 'post.php' != $hook ) ) {
        return;
    }

    wp_enqueue_script( 'underscore-min.js', plugin_dir_url( __FILE__ ) . '/vendor/underscore/underscore-min.js' );
    wp_enqueue_script( 'bootstrap.min.js', plugin_dir_url( __FILE__ ) . '/vendor/bootstrap/dist/js/bootstrap.min.js' );
    wp_enqueue_script( 'd3.min.js', plugin_dir_url( __FILE__ ) . '/vendor/d3/d3.min.js');
    wp_enqueue_script( 'd3-transform.js', plugin_dir_url( __FILE__ ) . '/vendor/d3-transform/src/d3-transform.js' );
    wp_enqueue_script( 'map_seats_app', plugin_dir_url( __FILE__ ) . '/js/app.js', array('jquery') );

    wp_register_style( 'bootstrap_min_css', plugin_dir_url( __FILE__ ) . '/vendor/bootstrap/dist/css/bootstrap.min.css', false, '1.0.0' );
    wp_register_style( 'bootstrap_theme_min_css', plugin_dir_url( __FILE__ ) . '/vendor/bootstrap/dist/css/bootstrap-theme.min.css', false, '1.0.0' );
    wp_register_style( 'custom_wp_admin_css', plugin_dir_url( __FILE__ ) . '/css/main.css', false, '1.0.0' );

    wp_enqueue_style( 'bootstrap_min_css' );
    wp_enqueue_style( 'bootstrap_theme_min_css' );
    wp_enqueue_style( 'custom_wp_admin_css' );
}
add_action( 'admin_enqueue_scripts', 'my_enqueue' );
add_filter( 'wp_insert_post_data' , 'filter_post_data' , '99', 2 );
// add_action( 'init', 'post_listing_page' );

function post_listing_page($data) {
    global $post_type;
    global $pagenow;
    var_dump($pagenow);die;
}

function filter_post_data( $data , $postarr ) {
    // Change post title
    $data['post_content'] = $postarr['graphData'];
    return $data;
}

if( ! function_exists( 'map_create_post_type' ) ) :
    function map_create_post_type() {
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
            'register_meta_box_cb' => 'map_add_post_type_metabox'
        );
        register_post_type( 'map_seats', $args );
    }
    add_action( 'init', 'map_create_post_type' );
 
 
    function map_add_post_type_metabox() { // add the meta box
        add_meta_box( 'map_metabox', 'Map Editor', 'map_metabox', 'map_seats', 'normal' );
    }
 
 
    function map_metabox() {
        global $post;
        // Noncename needed to verify where the data originated
        echo '<input type="hidden" name="map_post_noncename" value="' . wp_create_nonce( plugin_basename(__FILE__) ) . '" />';

        $selected_venue_id = get_post_meta($post->ID, '_map_venue_id', true);

        $my_venue_ids     = array();
        $current_user     = wp_get_current_user();
        $my_venues        = false;
        $my_venue_options = '';

        $my_venues = get_venue_info(
            null,
            array(
                'post_status' => array(
                    'publish',
                    'draft',
                    'private',
                    'pending',
                ),
                'author' => $current_user->ID,
            )
        );

        if ( ! empty( $my_venues ) ) {
            foreach ( $my_venues as $my_venue ) {
                $my_venue_ids[] = $my_venue->ID;
                $venue_title    = wp_kses( get_the_title( $my_venue->ID ), array() );
                $my_venue_options .= '<option data-address="' . esc_attr( fullAddressString( $my_venue->ID ) ) . '" value="' . esc_attr( $my_venue->ID ) . '"';
                $my_venue_options .= selected( $selected_venue_id, $my_venue->ID, false );
                $my_venue_options .= '>' . $venue_title . '</option>';
            }
        }

        if ( $my_venues ) {
            // $venue_pto = get_post_type_object('tribe_venue');
            echo '<label for="saved_venue"><b>Choose venue:</b></label> <br />';
            echo '<select class="chosen venue-dropdown" name="' . esc_attr( 'venue_id' ) . '" id="saved_venue">';
            echo $my_venue_options;
            echo '</select>';
        } else {
            echo '<p class="nosaved">' . esc_html__( 'No saved %s exists.') . '</p>';
        }
        ?>
        <div class="container">
            <button style="margin-top:20px" type="button" class="btn btn-success" onclick="alert('Not implemented')"> New </button>
            <button style="margin-top:20px" type="button" class="btn btn-warning" onclick="Graph.resetGraph()"> Reset </button>
            <div class="dropdown" style="margin-top:10px">
                <button class="btn btn-primary dropdown-toggle" type="button" id="dropdownMenu2" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    Settings
                    <span class="caret"></span>
                </button>
                <ul class="dropdown-menu" aria-labelledby="dropdownMenu2">
                    <li>
                        <div style="margin-left: 15px; margin-right: 15px">
                            <div class="row">
                                <div class="col-lg-1">
                                    <button type="button" class="btn btn-warning" onclick="Graph.createSeatsLine(10)">Create Set of 10 Seats (Vertical)</button>
                                </div>
                            </div>
                            <div class="form-inline" style="margin-top:10px">
                                <div class="form-group">
                                    <input class="form-control" type="number" id="col-qty" placeholder="Input row qty" />
                                </div>
                                <button type="button" class="btn btn-success" onclick="createElementsRow()">Create</button>
                            </div>
                            <div class="form-inline" style="margin-top:10px">
                                <div class="form-group">
                                    <input class="form-control" type="number" id="col-qty-with-numbering" placeholder="Input row qty" />
                                </div>
                                <div class="form-group">
                                    <input class="form-control" type="number" id="col-qty-with-numbering-start-from" placeholder="Start numering from" />
                                </div>
                                <button type="button" class="btn btn-success" onclick="createElementsRowWithNumberStaringFrom()">Create</button>
                            </div>
                        </div>

                    </li>
                </ul>
            </div>
        </div>
        <div id="graph"></div>
        <input type="hidden" id="graphData" name="graphData" />
        <input type="hidden" id="getData" name="getData" value='<?php echo $post->post_content ?>'/>
        <script>
            var config = {
                dataProvider: 'serverData',
                margin: { top: 100, right: 120, bottom: 100, left: 120 },
                width: '100%',
                height: '960',
                duration: '1000',
                dataContainer: '#graphData',
                getDataContainer: "#getData",
                graphIdContainer: "post_ID"
            };
            var Graph = new App();

            Graph.draw(config);

            function createElementsRow () {
                Graph.createSeatsLine(jQuery('#col-qty').val());
            }

            function createElementsRowWithNumberStaringFrom() {
                Graph.createSeatsLine(jQuery('#col-qty-with-numbering').val(), jQuery('#col-qty-with-numbering-start-from').val());
            }
        </script>
        <?php
    }

    function fullAddressString( $postId = null ) {
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

    function get_venue_info( $p = null, $args = array() ) {
        $defaults = array(
            'post_type'            => 'tribe_venue',
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
 
 
    function map_post_save_meta( $post_id, $post ) { // save the data
 
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
    add_action( 'save_post', 'map_post_save_meta', 1, 2 ); // save the custom fields
endif; // end of function_exists()
 
 
if( ! function_exists( 'view_maps_posts' ) ) : // output
    function view_maps_posts($do_shortcode = 1, $strip_shortcodes = 0 ) {
 
        $args = array(
            'posts_per_page'     => 100,
            'offset'          => 0,
            //'category'        => ,
            'orderby'         => 'menu_order, post_title', // post_date, rand
            'order'           => 'DESC',
            'post_type'       => 'map_seats',
            'post_status'     => 'publish',
            'suppress_filters' => true
        );
 
        $posts = get_posts( $args );
 
        $html = '';
        foreach ( $posts as $post ) {
            // $meta_name = get_post_meta( $post->ID, '_map_post_name', true );
            // $meta_desc = get_post_meta( $post->ID, '_map_post_desc', true );
            $meta_venue = get_post_meta( $post->ID, '_map_venue_id', true );
            // $img = get_the_post_thumbnail( $post->ID, 'medium' );
            // if( empty( $img ) ) {
            //     $img = '<img src="'.plugins_url( '/img/default.png', __FILE__ ).'">';
            // }
 
 
            // if( has_post_thumbnail( $post->ID ) ) {
            //     $img = wp_get_attachment_image_src( get_post_thumbnail_id( $post->ID ), 'thumbnail' );
            //     $img_url = $img[0];
 
            //     //the_post_thumbnail( 'thumbnail' ); /* thumbnail, medium, large, full, thumb-100, thumb-200, thumb-400, array(100,100) */
            // }
 
            $content = $post->post_content;
            if( $do_shortcode == 1 ) {
                $content = do_shortcode( $content );
            }
            if( $strip_shortcodes == 1 ) {
                $content = strip_shortcodes( $content );
            }
            $content = wp_trim_words( $content, 30, '...');
            $content = wpautop( $content );
 
            $html .= '
            <div>
                <h3>'.$post->post_title.'</h3>
                <div>
                    <p>Venue_id: '.$meta_venue.'</p>
                </div>
                <div>'.$content.'</div>
            </div>
            ';
        }
        $html = '<div class="wrapper">'.$html.'</div>';
        return $html;
    }
endif; // end of function_exists()
?>