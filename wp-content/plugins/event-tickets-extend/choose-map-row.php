<table>
    <tbody>
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
    </tbody>
</table>