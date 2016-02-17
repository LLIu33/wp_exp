<?php

/*
Plugin Name: Map Example
Plugin URI: http://
Description: Map Example Description.
Version: 1.0
Author: Artem G.
Author URI: http://
*/

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
            //'menu_name' => default to 'name'
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
                // 'excerpt',
                // 'thumbnail',
                //'author',
                //'trackbacks',
                //'custom-fields',
                //'comments',
                'revisions',
                //'page-attributes', // (menu order, hierarchical must be true to show Parent option)
                //'post-formats',
            ),
            // 'taxonomies' => array( 'category', 'post_tag' ), // add default post categories and tags
            'menu_position' => 5,
            'menu_icon' => 'dashicons-images-alt2',
            'exclude_from_search' => false,
            'register_meta_box_cb' => 'map_add_post_type_metabox'
        );
        register_post_type( 'map_seats', $args );
        //flush_rewrite_rules();

        // register_taxonomy( 'map_category', // register custom taxonomy - category
        //     'map',
        //     array(
        //         'hierarchical' => true,
        //         'labels' => array(
        //             'name' => 'map category',
        //             'singular_name' => 'map category',
        //         )
        //     )
        // );
        // register_taxonomy( 'map_tag', // register custom taxonomy - tag
        //     'map',
        //     array(
        //         'hierarchical' => false,
        //         'labels' => array(
        //             'name' => 'map tag',
        //             'singular_name' => 'map tag',
        //         )
        //     )
        // );
    }
    add_action( 'init', 'map_create_post_type' );
 
 
    function map_add_post_type_metabox() { // add the meta box
        add_meta_box( 'map_metabox', 'Meta', 'map_metabox', 'map_seats', 'normal' );
    }
 
 
    function map_metabox() {
        global $post;
        // Noncename needed to verify where the data originated
        echo '<input type="hidden" name="map_post_noncename" value="' . wp_create_nonce( plugin_basename(__FILE__) ) . '" />';
 
        // Get the data if its already been entered
        $map_post_name = get_post_meta($post->ID, '_map_post_name', true);
        $map_post_desc = get_post_meta($post->ID, '_map_post_desc', true);
        
        ?>
           <label for="myplugin_field"> Description for this field </label>
            <select name="myplugin_field" id="myplugin_field" class="postbox">
                <option value="">Select something…</option>
                <option value="something">Something</option>
                <option value="else">Else</option>
            </select>
        <?php
 
        // Echo out the field
        ?>
 
        <table class="form-table">
            <tr>
                <th>
                    <label>Name</label>
                </th>
                <td>
                    <input type="text" name="map_post_name" class="regular-text" value="<?php echo $map_post_name; ?>"> 
                    <!-- classes: .small-text .regular-text .large-text -->
                </td>
            </tr>
            <tr>
                <th>
                    <label>Description</label>
                </th>
                <td>
                    <textarea name="map_post_desc" class="large-text"><?php echo $map_post_desc; ?></textarea>
                </td>
            </tr>
        </table>
    <?php
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
 
        $map_post_meta['_map_post_name'] = $_POST['map_post_name'];
        $map_post_meta['_map_post_desc'] = $_POST['map_post_desc'];
 
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
            //'include'         => ,
            //'exclude'         => ,
            //'meta_key'        => ,
            //'meta_value'      => ,
            'post_type'       => 'map_seats',
            //'post_mime_type'  => ,
            //'post_parent'     => ,
            'post_status'     => 'publish',
            'suppress_filters' => true
        );
 
        $posts = get_posts( $args );
 
        $html = '';
        foreach ( $posts as $post ) {
            $meta_name = get_post_meta( $post->ID, '_map_post_name', true );
            $meta_desc = get_post_meta( $post->ID, '_map_post_desc', true );
            $img = get_the_post_thumbnail( $post->ID, 'medium' );
            if( empty( $img ) ) {
                $img = '<img src="'.plugins_url( '/img/default.png', __FILE__ ).'">';
            }
 
 
            if( has_post_thumbnail( $post->ID ) ) {
                $img = wp_get_attachment_image_src( get_post_thumbnail_id( $post->ID ), 'thumbnail' );
                $img_url = $img[0];
 
                //the_post_thumbnail( 'thumbnail' ); /* thumbnail, medium, large, full, thumb-100, thumb-200, thumb-400, array(100,100) */
            }
 
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
                    <p>Name: '.$meta_name.'</p>
                    <p>Description: '.$meta_desc.'</p>
                </div>
                <div>'.$img.'</div>
                <div>'.$content.'</div>
            </div>
            ';
        }
        $html = '<div class="wrapper">'.$html.'</div>';
        return $html;
    }
endif; // end of function_exists()
?>