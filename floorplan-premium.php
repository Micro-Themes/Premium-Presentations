<?php 
/*
Plugin Name: Premium Presentations
Plugin URI: http://www.microthemes.ca
Description: Create Interactive Presentations quick and easy.
Version: 1.7.3
Author: Micro Themes
Author URI: http://www.microthemes.ca
License: 
*/

//Define global constants
if ( ! defined( 'PM_URL' ) ) {
	define( 'PM_URL', plugin_dir_url(__FILE__) );	
}
if ( ! defined( 'PM_PATH' ) ) {
	define( 'PM_PATH', plugin_dir_path(__FILE__) );
}
if ( ! defined( 'PM_ADMIN_URL' ) ) {
  define( 'PM_ADMIN_URL', PM_URL . 'admin');
}
if ( ! defined( 'PM_FRONT_URL' ) ) {
  define( 'PM_FRONT_URL', PM_URL . 'front-end' );
}
if ( ! defined( 'PM_DOCS_URL' ) ) {
  define( 'PM_DOCS_URL', PM_URL . 'documentation');
}
if ( ! defined( 'PM_DEBUG' ) ) {
  define( 'PM_DEBUG', true );
}

// Implicitly prevent the plugin's installation from collision
if ( !class_exists( 'FloorPlanPremium' ) ) {
	
	class FloorPlanPremium{
		
		//Constructor
		public function __construct() {
			
			//add_actions
			add_action( 'init', array( $this, 'load_languages' ) ); //LOAD LANGUAGE FILES FOR LOCALIZATION SUPPORT
			
			add_action( 'init', array( $this, 'add_floorplan_type' ) ); //REGISTER THE POST TYPE
			
			add_action( 'add_meta_boxes', array( $this, 'add_pm_admin' ) ); //REMOVE DEFAULT WP PUBLISH BOX
			
			add_filter( 'screen_layout_columns', array( $this, 'set_columns' ) ); //SET ADMIN COLUMNS
		    add_filter( 'get_user_option_screen_layout_floorplan', array( $this, 'force_user_column' ) ); //FORCE LAYOUT TO 1 COLUMN
			
			//Enqueue scripts for Slider admin
			add_action( 'admin_enqueue_scripts', array( $this, 'load_admin_scripts' ) );//ADD STYLES & SCRIPTS FOR ADMIN
			add_action( 'edit_form_after_title', array( $this, 'publish_panel' ) );//DISPLAY PUBLISH MESSAGE
		    add_action( 'edit_form_after_title', array( $this, 'floorplan_editor' ) );//PREVIEW FLOORPLAN LAYOUT WITH EDITABLE MARKERS AND PANEL(S) INFO IN TABS
		    add_action( 'edit_form_after_title', array( $this, 'settings_panel' ) );//DISPLAYS ALL THE SETTINGS FOR THE PLUGIN
			
			//Plugin settings
			add_action( 'admin_menu', array( $this, 'pm_premium_presentations_settings' ) );
			
			//Save data action
			add_action( 'save_post', array( $this, 'save_data' ), 10, 2 );
			
			//Enqueue scripts for Slider front-end
			add_action( 'wp_enqueue_scripts', array( $this, 'load_front_scripts' ) );
			
			//this is wordpress ajax that can work in front-end and admin areas
			add_action('wp_ajax_nopriv_your_ajax', array( $this, 'shortcode_ajax_function' ) );//_your_ajax is the action required for jQuery Ajax setting
			add_action('wp_ajax_your_ajax', array( $this, 'shortcode_ajax_function' ));//_your_ajax is the action required for jQuery Ajax setting
			
			//add widget text shortcode support - NOT REQUIRED BUT ADD SETTING FOR THIS
			//add_filter( 'widget_text', 'do_shortcode' );
			//add_filter( 'the_content', 'do_shortcode' );
			
			//call to shortcode
			add_filter( 'the_content', array( $this, 'default_floorplan_content' ) );
			
			//add_filters
			add_filter( 'post_updated_messages', array( $this, 'floorplan_messages' ) );
			
			//Presentation id shortcode Column
			add_filter('manage_floorplan_posts_columns', array( $this, 'posts_floorplan_columns_id' ), 5);
			add_action('manage_floorplan_posts_custom_column', array( $this, 'posts_floorplan_custom_id_columns' ), 10, 2);
			
			//add duplicate post feature
			add_action('admin_action_pm_ln_duplicate_post_as_draft', array( $this, 'pm_ln_duplicate_post_as_draft' ) );
			add_filter('post_row_actions', array( $this, 'pm_ln_duplicate_post_link' ), 10, 2); //post_row_actions for non-hierarchical post types, page_row_actions for hierarchical post types

		}//end of construct
		
				
		//Load language file(s) (.mo)
		public function load_languages() { 
			load_plugin_textdomain( 'premiumPresentations', false, dirname( plugin_basename( __FILE__ ) ) . '/languages' ); 
		} 
		
		//Remove default WP Publish box
		public function add_pm_admin() {
			remove_meta_box( 'submitdiv', 'floorplan', 'side' );
		}
		
		//Set post admin screen to full column width
		public function set_columns( $columns ) {
		  $columns['floorplan'] = 1;
		  return $columns;
		}
	
		public function force_user_column( $columns ) {
		  return 1;
		}
		
		//DISPLAY PUBLISH MESSAGE
		public function publish_panel() {
		  global $post;
		  $screen = get_current_screen();
		  if ( $screen->post_type !== 'floorplan' ) 
			return;
		  
		  if (!get_post_meta( $post->ID, 'pm-floorplan-settings', true ))
			return;
	
		  printf( '<div class="floorplan-publish"><p>' . __( 'You can use the following shortcode for displaying the newly created presentation', 'premiumPresentations' ) . ':<p>' );
		  printf( '<div>[presentation id="%s"/]</div>', $post->ID );
		  printf( '<p>' . __( 'Copy and paste it where you wish the presentation will display', 'premiumPresentations' ) . ', ');
		  printf( __( 'e.g. Post, Page editor, Text widget or even directly in your PHP code by using ', 'premiumPresentations' ) );
		  printf( '<a href="http://codex.wordpress.org/Function_Reference/do_shortcode" target="_blank">do_shortcode</a> ' . __( 'function', 'premiumPresentations' ) . '.</p></div>');  
		}
		
		//Display floor plan in the_content via shortcode
		public function default_floorplan_content( $content ) {
		  global $post;
		  if ( $post->post_type === 'floorplan' )
			return sprintf( '[presentation id="%s"/]', $post->ID );
		  return $content;
		}
		
		
		//Load admin scripts
		public function load_admin_scripts( $hook ) {
			
			$screen = get_current_screen();
      		$dot = ( PM_DEBUG ) ? '.' : '.min.';
			
			if ( is_admin() && $screen->post_type === "floorplan" && $screen->base === "post" ) { 
			
				//Add media library support
				wp_enqueue_media();
			
				//jQuery ui scripts
				wp_enqueue_script( 'jquery-ui-core' );
				wp_enqueue_script( 'jquery-ui-mouse' );
				wp_enqueue_script( 'jquery-ui-slider' );
				wp_enqueue_script( 'jquery-ui-draggable' );
				wp_enqueue_script( 'jquery-ui-dialog' );
				wp_enqueue_script( 'jquery-ui-widget' );
				wp_enqueue_script( 'jquery-ui-sortable' );
				wp_enqueue_script( 'jquery-ui-accordion' );
			
				//load styles and scripts
				wp_enqueue_style( 'floorplan-settings', PM_ADMIN_URL . '/css/floorplan_settings' . $dot . 'css' );
				wp_enqueue_style( 'floorplan-editor', PM_ADMIN_URL . '/css/floorplan_editor' . $dot . 'css' );
				wp_enqueue_style( 'floorplan-marker-editor', PM_ADMIN_URL . '/css/marker-editor' . $dot . 'css' );
				wp_enqueue_style( 'floorplan-panel-accordion', PM_ADMIN_URL . '/css/panel-accordion' . $dot . 'css' );
				wp_enqueue_style( 'floorplan-resizeHelper', PM_ADMIN_URL . '/css/resizeHelper' . $dot . 'css' );
				wp_enqueue_style( 'floorplan-smoothness', PM_ADMIN_URL . '/css/smoothness/jquery-ui-1.8.9.custom' . $dot . 'css' );
				wp_enqueue_style( 'jquery-ui', PM_ADMIN_URL . '/css/smoothness/jquery-ui' . $dot . 'css' );
				
				//load the WP 3.5 Media uploader scripts and environment
				wp_enqueue_script('thickbox');  
        		wp_enqueue_style('thickbox');
				wp_enqueue_script( 'media-upload' );				
				
				//Load floorplan admin settings js file
				wp_enqueue_script( 'floorplan-image-uploader', PM_ADMIN_URL . '/js/pm-image-uploader' . $dot . 'js', array('jquery'), '1.0.0', true );
				wp_enqueue_script( 'floorplan-adming-settings', PM_ADMIN_URL . '/js/admin-settings' . $dot . 'js', array('jquery'), '1.0.0', true );
								
				wp_enqueue_style( 'spectrum-styles', PM_ADMIN_URL . '/js/spectrum/spectrum' . $dot . 'css' );
				wp_enqueue_script( 'spectrum-picker', PM_ADMIN_URL . '/js/spectrum/spectrum' . $dot . 'js', array('jquery'), '1.0.0', true );
			
			}//end of if
			
		}//end of load_scripts
		
		
		//Load front-end scripts
		public function load_front_scripts() {
			
			$dot = ( PM_DEBUG ) ? '.' : '.min.';
			
			//load styles and scripts
			//wp_enqueue_script( 'jquery' );
			wp_enqueue_script( 'jquery-effects-core' );
			wp_enqueue_style( 'floorplan-styles', PM_FRONT_URL . '/css/floorplan' . $dot . 'css' );
			wp_enqueue_script( 'floorplan-app', PM_FRONT_URL . '/js/floorplan' . $dot . 'js', array('jquery'), '1.0.0', true );
			
		}//end of load_front_scripts
		
		
		//Screen Alerts
		public function floorplan_messages( $messages ) {
			
		  global $post, $post_ID;
		  $messages['floorplan'][6] = __( 'Presentation Published', 'premiumPresentations' ) . sprintf( ' <a href="%s">' . __( 'View Presentation', 'premiumPresentations' ) . '</a>', esc_url( get_permalink($post_ID) ) ); 
		  
		  /*$messages['floorplan'] = array(
                0 => '', // Unused. Messages start at index 1.
                1 => sprintf( __( '%s updated. <a href="%s" target="_blank">View %s</a>' ), esc_attr( $singular ), esc_url( get_permalink( $post_ID ) ), strtolower( $singular ) ),
                2 => __( 'Custom field updated.', 'maxson' ),
                3 => __( 'Custom field deleted.', 'maxson' ),
                6 => sprintf( __( 'Presentation published. <a href="%s">View %s</a>'), $singular, esc_url( get_permalink( $post_ID ) ), strtolower( $singular ) ),
                7 => sprintf( __( '%s saved.', 'maxson' ), esc_attr( $singular ) ),
                8 => sprintf( __( '%s submitted. <a href="%s" target="_blank">Preview %s</a>'), $singular, esc_url( add_query_arg( 'preview', 'true', get_permalink( $post_ID ) ) ), strtolower( $singular ) ),
                9 => sprintf( __( '%s scheduled for: <strong>%s</strong>. <a href="%s" target="_blank">Preview %s</a>' ), $singular, date_i18n( __( 'M j, Y @ G:i' ), strtotime( $post->post_date ) ), esc_url( get_permalink( $post_ID ) ), strtolower( $singular ) ),
                10 => sprintf( __( '%s draft updated. <a href="%s" target="_blank">Preview %s</a>'), $singular, esc_url( add_query_arg( 'preview', 'true', get_permalink( $post_ID ) ) ), strtolower( $singular ) )
          );*/
		      
		  return $messages;
		  
		}//end of floorplan_messages


		//REGISTER THE POST TYPE
		public function add_floorplan_type() {
		
			$labels = array(
				'name' => __( 'Premium Presentations', 'premiumPresentations' ),
				'singular_name' =>  __( 'Premium Presentation', 'premiumPresentations' ),
				'add_new' => __( 'Add New Presentation', 'premiumPresentations' ),
				'add_new_item' => __( 'Add New Presentation', 'premiumPresentations' ),
				'edit_item' => __( 'Edit Presentation', 'premiumPresentations' ),
				'new_item' => __( 'New Presentation', 'premiumPresentations' ),
				'all_items' => __( 'All Presentations', 'premiumPresentations' ),
				'view_item' => __( 'View Presentation', 'premiumPresentations' ),
				'search_items' => __( 'Search Presentations', 'premiumPresentations' ),
				'not_found' =>  __( 'No Presentations found', 'premiumPresentations' ),
				'not_found_in_trash' => __( 'No Presentations found in Trash', 'premiumPresentations' ), 
				'parent_item_colon' => '',
				'menu_name' => __( 'Premium Presentations', 'premiumPresentations' ),
			  );
		
			  $args = array(
				'labels' => $labels,
				'public' => true,
				'publicly_queryable' => true,
				'show_ui' => true, 
				'show_in_menu' => true, 
				'query_var' => true,
				'rewrite' => array( 'slug' => 'presentation' ),
				'capability_type' => 'post',
				'has_archive' => false, 
				'hierarchical' => false,
				'menu_position' => 8,
				'supports' => array( 'title' ),
				'menu_icon' => PM_ADMIN_URL . '/img/icon.png'
			  ); 
		
			  register_post_type( 'floorplan', $args );
		  
		}//end of add_floorplan_type
		
		
		//SETTINGS PANEL
  		public function settings_panel() {
			
			global $post;
      		$screen = get_current_screen();
			
			if ( $screen->post_type !== 'floorplan' )
        		return;
				
			$step_one = false;//use this to flag initial settings panel
      		$settings = get_post_meta( $post->ID, 'pm-floorplan-settings', true );
			
			$defaults = array(
				'floorplanWidth' => 0, //width of the floorplan image - this will apply to the container
				'floorplanHeight' => 0, //height of the floorplan image - this will apply to the container
				'floorplanImage' => 'No Image selected',
				'markerColor' => 'blue',
				'markerHoverColor' => 'green',
				'markerActiveColor' => 'red',
				'markerFontColor' => 'white',
				'markerType' => 'square',
				'markerSize' => 35,
				'markerFontSize' => 15,
				'markerYPosition' => 10,
				'markerIcon' => 'No icon selected',
				'markerAnimation' => 0,
				'panelBGColor' => 'grey',
				'panelTitleColor' => 'black',
				'panelTextColor' => 'black',
				'panelBorderRadius' => 0,
				'panelTitleFontSize' => 20,
				'panelTitleYPosition' => 10,
				'floorplanResponsiveness' => 0,
				'panelHeight' => 230,
				'panelLayout' => 'pm-lo-1',
				'panelAutoResize' => 0,
				'panelShortcodeSupport' => 0,
				'videoHeight' => 200,
				'markerResponsiveSize' => 10,
				'markerResponsiveFontSize' => 5,
				'tipBorderRadius' => 10,
				'tipBGColor' => '#000000',
				'tipBorderColor' => '#000000',
				'tipFontColor' => '#ffffff',
				'tooltipMobile' => 0,
				'googleMapHeight' => 300,
				'googleMapZoomLevel' => 14,
				'googleMapBtnColor' => '#A6A6A6',
				'googleMapBtnTextColor' => '#ffffff',
			);
			
			if ( !$settings ) {
				$step_one = true;
				$settings = $defaults;
			} else {
				$settings = array_merge( $defaults, $settings );
			}
			
			//Display the settings panel
			?>
            
            <h2><?php _e( 'General Settings', 'premiumPresentations' ); ?></h2>

            <div id="floorplan_settings" class="postbox">
            
                <div class="floorplan_settings">
                    
                    <h4><?php _e( 'Presentation Settings', 'premiumPresentations' ); ?></h4>
                    
                    <div class="floorplan_width">
                        <label for="floorplan-width" class="title"><?php _e( 'Presentation Width:', 'premiumPresentations' ); ?></label>
                        <input type="text" value="<?php echo esc_attr( $settings['floorplanWidth'] ); ?>" name="floorplan-settings[floorplanWidth]" id="floorplan-width"/> px
                    </div>
                    
                    <div class="floorplan_height">
                        <label for="floorplan-height" class="title"><?php _e( 'Presentation Height:', 'premiumPresentations' ); ?></label>
                        <input type="text" value="<?php echo esc_attr( $settings['floorplanHeight'] ); ?>" name="floorplan-settings[floorplanHeight]" id="floorplan-height"/> px
                    </div>
                    
                    <div class="floorplan_image">
                        <label for="floorplan-image" class="title"><?php _e( 'Presentation Image:', 'premiumPresentations' ); ?></label>
                        <input type="text" value="<?php echo esc_attr( $settings['floorplanImage'] ); ?>" name="floorplan-settings[floorplanImage]" id="floorplan-image" style="width:400px;"/>
                        <input id="upload_image_button" type="button" value="Media Library Image" class="button-secondary" />
                    </div>
                    
                    
                    
                    <h4><?php _e( 'Marker Settings', 'premiumPresentations' ); ?></h4>
                    
                    <div class="marker_color">
                        <label for="marker-color" class="title"><?php _e( 'Default Color:', 'premiumPresentations' ); ?></label>                        
                        <input type="text" value='<?php echo esc_attr( $settings['markerColor'] ); ?>' name="floorplan-settings[markerColor]" id="marker-color" style="margin-right:10px;" />
                    </div>
                    
                    <div class="marker_hover_color">
                        <label for="marker-hover-color" class="title"><?php _e( 'Rollover Color:', 'premiumPresentations' ); ?></label>
                        <input type="text" value='<?php echo esc_attr( $settings['markerHoverColor'] ); ?>' name="floorplan-settings[markerHoverColor]" id="marker-hover-color" style="margin-right:10px;" />
                    </div>
                    
                    <div class="marker_active_color">
                        <label for="marker-active-color" class="title"><?php _e( 'Active Color:', 'premiumPresentations' ); ?></label>                        
                        <input type="text" value='<?php echo esc_attr( $settings['markerActiveColor'] ); ?>' name="floorplan-settings[markerActiveColor]" id="marker-active-color" style="margin-right:10px;" />
                    </div>
                    
                    <div class="marker_font_color">
                        <label for="marker-font-color" class="title"><?php _e( 'Font Color:', 'premiumPresentations' ); ?></label>                        
                        <input type="text" value='<?php echo esc_attr( $settings['markerFontColor'] ); ?>' name="floorplan-settings[markerFontColor]" id="marker-font-color" style="margin-right:10px;" />
                    </div>
                    
                    <div class="marker_type">                        
                        <label for="marker-type" class="title"><?php _e( 'Marker Type:', 'premiumPresentations' ); ?></label>
                        <select id="marker-type" name="floorplan-settings[markerType]">
                          <option value="square" <?php selected( $settings['markerType'], 'square' ); ?>>Square</option>
                          <option value="circle" <?php selected( $settings['markerType'], 'circle' ); ?>>Circle</option>
                          <option value="icon" <?php selected( $settings['markerType'], 'icon' ); ?>>Icon</option>
                        </select>
                    </div>
                    
                    <div class="marker_icon">                        
                        <label for="marker-icon" class="title"><?php _e( 'Marker Icon:', 'premiumPresentations' ); ?></label>
						<input type="text" value="<?php echo esc_attr( $settings['markerIcon'] ); ?>" name="floorplan-settings[markerIcon]" id="marker-icon" style="width:400px;"/>
                        <input id="icon_image_button" type="button" value="Media Library Image" class="button-secondary" />
                        <strong style="margin-left:10px;">Max Size:</strong> 80x80px
                    </div>
                    
                    <div class="marker_animation" id="pm-marker_animation">
                        <label for="marker-animation" class="title" style="width:250px;"><?php _e( 'Enable marker rollover animation?', 'premiumPresentations' ); ?></label>
                        <input name="floorplan-settings[markerAnimation]" type="checkbox" value="1" <?php checked( $settings['markerAnimation'], 1 ); ?> />
                    </div>
                                        
                    <div class="resizable_marker">                        
                        <label for="resizable-marker" class="title"><?php _e( 'Marker Size:', 'premiumPresentations' ); ?></label><div id="markerSlider"></div>
						<input type="text" id="resizable-marker"  value="<?php echo $settings['markerSize']; ?>" name="floorplan-settings[markerSize]" >
                    </div>
                    
                    <div class="marker_font_size">                        
                        <label for="marker-font-size" class="title"><?php _e( 'Marker Font Size:', 'premiumPresentations' ); ?></label><div id="markerFontSlider"></div>
						<input type="text" id="marker-font-size"  value="<?php echo $settings['markerFontSize']; ?>" name="floorplan-settings[markerFontSize]" >
                    </div>
                    
                    <div class="marker_y_position">                        
                        <label for="marker-y-position" class="title"><?php _e( 'Marker Font Y Position:', 'premiumPresentations' ); ?></label><div id="markerYPosition"></div>
						<input type="text" id="marker-y-position"  value="<?php echo $settings['markerYPosition']; ?>" name="floorplan-settings[markerYPosition]" >
                    </div>
                    
                    <h4><?php _e( 'Panel Settings', 'premiumPresentations' ); ?></h4>
                    
                    <div class="panel_bg_color">
                        <label for="panel-bg-color" class="title"><?php _e( 'Panel Background Color:', 'premiumPresentations' ); ?></label>                        
                        <input type="text" value='<?php echo esc_attr( $settings['panelBGColor'] ); ?>' name="floorplan-settings[panelBGColor]" id="panel-bg-color" style="margin-right:10px;" />
                    </div>
                    
                    <div class="panel_title_color">
                        <label for="panel-title-color" class="title"><?php _e( 'Panel Title Color:', 'premiumPresentations' ); ?></label>                        
                        <input type="text" value='<?php echo esc_attr( $settings['panelTitleColor'] ); ?>' name="floorplan-settings[panelTitleColor]" id="panel-title-color" style="margin-right:10px;" />
                    </div>
                    
                    <div class="panel_text_color">
                        <label for="panel-text-color" class="title"><?php _e( 'Panel Text Color:', 'premiumPresentations' ); ?></label>                        
                        <input type="text" value='<?php echo esc_attr( $settings['panelTextColor'] ); ?>' name="floorplan-settings[panelTextColor]" id="panel-text-color" style="margin-right:10px;" />
                    </div>
                    
                    <div class="panel_border_radius">                        
                        <label for="panel-border-radius" class="title"><?php _e( 'Panel Border Radius:', 'premiumPresentations' ); ?></label><div id="panelBorderRadius"></div>
						<input type="text" id="panel-border-radius"  value="<?php echo $settings['panelBorderRadius']; ?>" name="floorplan-settings[panelBorderRadius]" >
                    </div>
                    
                    <div class="panel_title_fontsize">                        
                        <label for="panel-title-fontsize" class="title"><?php _e( 'Panel Title Font Size:', 'premiumPresentations' ); ?></label><div id="panelFontSize"></div>
						<input type="text" id="panel-title-fontsize"  value="<?php echo $settings['panelTitleFontSize']; ?>" name="floorplan-settings[panelTitleFontSize]" >
                    </div>
                    
                    <div class="panel_title_yPosition">                        
                        <label for="panel-title-yPosition" class="title"><?php _e( 'Panel Title Y Position:', 'premiumPresentations' ); ?></label><div id="panelTitleYPos"></div>
						<input type="text" id="panel-title-yPosition"  value="<?php echo $settings['panelTitleYPosition']; ?>" name="floorplan-settings[panelTitleYPosition]" >
                    </div>
                    
                    <div class="floorplan_responsiveness">
                    	<label for="floorplan-responsiveness" class="title" style="width:250px;"><?php _e( 'Enable Responsiveness?', 'premiumPresentations' ); ?></label>
                        <input name="floorplan-settings[floorplanResponsiveness]" type="checkbox" value="1" <?php checked( $settings['floorplanResponsiveness'], 1 ); ?> />
                    </div>
                    
                    <div class="panel_height">                        
                        <label for="panel-height" class="title"><?php _e( 'Panel Height:', 'premiumPresentations' ); ?></label><div id="panelHeight"></div>
						<input type="text" id="panel-height"  value="<?php echo $settings['panelHeight']; ?>" name="floorplan-settings[panelHeight]" >
                    </div>
                                                                               
                    <div class="panel_layout" id="pm-panel-layout">
                    
                    	<p><?php _e( 'Panel Layout Options:', 'premiumPresentations' ); ?></p>
                    
                        <input type="radio" class="pm-input-hidden" name="floorplan-settings[panelLayout]" id="pm-lo-1" value="pm-lo-1" <?php checked( $settings['panelLayout'], 'pm-lo-1' ); ?> />
                        <label for="pm-lo-1" id="pm-lo-1-label" <?php $settings['panelLayout'] == 'pm-lo-1' ? print 'class="pm-input-selected"' : ''; ?> ><img src="<?php echo plugins_url('admin/img/pm-lo-1.jpg' , __FILE__); ?>" alt="Panel Layout 1" /></label>
                        <input type="radio" class="pm-input-hidden" name="floorplan-settings[panelLayout]" id="pm-lo-2" value="pm-lo-2" <?php checked( $settings['panelLayout'], 'pm-lo-2' ); ?> />
                        <label for="pm-lo-2" id="pm-lo-2-label" <?php $settings['panelLayout'] == 'pm-lo-2' ? print 'class="pm-input-selected"' : ''; ?> ><img src="<?php echo plugins_url('admin/img/pm-lo-2.jpg' , __FILE__); ?>" alt="Panel Layout 2" /></label>
                        <input type="radio" class="pm-input-hidden" name="floorplan-settings[panelLayout]" id="pm-lo-3" value="pm-lo-3" <?php checked( $settings['panelLayout'], 'pm-lo-3' ); ?> />
                        <label for="pm-lo-3" id="pm-lo-3-label" <?php $settings['panelLayout'] == 'pm-lo-3' ? print 'class="pm-input-selected"' : ''; ?> ><img src="<?php echo plugins_url('admin/img/pm-lo-3.jpg' , __FILE__); ?>" alt="Panel Layout 3" /></label> 
                        <input type="radio" class="pm-input-hidden" name="floorplan-settings[panelLayout]" id="pm-lo-4" value="pm-lo-4" <?php checked( $settings['panelLayout'], 'pm-lo-4' ); ?> />
                        <label for="pm-lo-4" id="pm-lo-4-label" <?php $settings['panelLayout'] == 'pm-lo-4' ? print 'class="pm-input-selected"' : ''; ?> ><img src="<?php echo plugins_url('admin/img/pm-lo-4.jpg' , __FILE__); ?>" alt="Panel Layout 4" /></label>     
                        <input type="radio" class="pm-input-hidden" name="floorplan-settings[panelLayout]" id="pm-lo-6" value="pm-lo-6" <?php checked( $settings['panelLayout'], 'pm-lo-6' ); ?> />
                        <label for="pm-lo-6" id="pm-lo-6-label" style="display:none;" <?php $settings['panelLayout'] == 'pm-lo-6' ? print 'class="pm-input-selected"' : ''; ?> ><img src="<?php echo plugins_url('admin/img/pm-lo-6.jpg' , __FILE__); ?>" alt="Responsive Layout" /></label>
                        <input type="radio" class="pm-input-hidden" name="floorplan-settings[panelLayout]" id="pm-lo-5" value="pm-lo-5" <?php checked( $settings['panelLayout'], 'pm-lo-5' ); ?> />
                        <label for="pm-lo-5" id="pm-lo-5-label" <?php $settings['panelLayout'] == 'pm-lo-5' ? print 'class="pm-input-selected"' : ''; ?> ><img src="<?php echo plugins_url('admin/img/pm-lo-5.jpg' , __FILE__); ?>" alt="No Panels" /></label>     
                             
                                     
                    </div>
                    
                    <div class="panel_auto_resize" id="pm-panel-auto-resize">
                    	
                        <label for="panel-auto-resize" class="title" style="width:270px;"><?php _e( 'Auto resize info panel if image is not present?', 'premiumPresentations' ); ?></label>
                        <input name="floorplan-settings[panelAutoResize]" type="checkbox" value="1" <?php checked( $settings['panelAutoResize'], 1 ); ?> />
                        
                    </div>
                    
                    <div class="panel_shortcode_support">
                    	
                        <label for="panel-shortcode-support" class="title" style="width:160px;"><?php _e( 'Enable shortcode support?', 'premiumPresentations' ); ?></label>
                        <input name="floorplan-settings[panelShortcodeSupport]" type="checkbox" value="1" <?php checked( $settings['panelShortcodeSupport'], 1 ); ?> />
                        
                    </div>
                    
                    <div id="responsive_settings" style="margin-top:20px;">
                    	<h4><?php _e( 'Responsive Settings', 'premiumPresentations' ); ?></h4>
                    
                        <div class="video_height">  
                        	<label for="video-height" class="title"><?php _e( 'Video Height:', 'premiumPresentations' ); ?></label><div id="videoHeight"></div>
							<input type="text" id="video-height"  value="<?php echo $settings['videoHeight']; ?>" name="floorplan-settings[videoHeight]" >
                        </div>
                        
                        <div class="marker_responsive_size">  
                        	<label for="marker-responsive-size" class="title"><?php _e( 'Smartphone Marker Size:', 'premiumPresentations' ); ?></label><div id="markerResponsiveSize"></div>
							<input type="text" id="marker-responsive-size"  value="<?php echo $settings['markerResponsiveSize']; ?>" name="floorplan-settings[markerResponsiveSize]" >
                        </div>
                        
                        <div class="marker_responsive_font_size">  
                        	<label for="marker-responsive-font-size" class="title"><?php _e( 'Smartphone Font Size:', 'premiumPresentations' ); ?></label><div id="markerResponsiveFontSize"></div>
							<input type="text" id="marker-responsive-font-size"  value="<?php echo $settings['markerResponsiveFontSize']; ?>" name="floorplan-settings[markerResponsiveFontSize]" >
                        </div>
                        
                    </div>
                    
                    <h4 style="margin-top:20px;"><?php _e( 'ToolTip Settings', 'premiumPresentations' ); ?></h4>
                    
                    <div class="tooltip_border_radius">                        
                        <label for="tooltip-border-radius" class="title"><?php _e( 'Border Radius:', 'premiumPresentations' ); ?></label><div id="tipBorderRadius"></div>
						<input type="text" id="tooltip-border-radius"  value="<?php echo $settings['tipBorderRadius']; ?>" name="floorplan-settings[tipBorderRadius]" >
                    </div>
                    
                    <div class="tooltip_bg">
                        <label for="tooltip-bg" class="title"><?php _e( 'Background Color:', 'premiumPresentations' ); ?></label>                        
                        <input type="text" value='<?php echo esc_attr( $settings['tipBGColor'] ); ?>' name="floorplan-settings[tipBGColor]" id="tooltip-bg" style="margin-right:10px;" />
                    </div>
                    
                    <div class="tooltip_border_color">
                        <label for="tooltip-border-color" class="title"><?php _e( 'Border Color:', 'premiumPresentations' ); ?></label>                        
                        <input type="text" value='<?php echo esc_attr( $settings['tipBorderColor'] ); ?>' name="floorplan-settings[tipBorderColor]" id="tooltip-border-color" style="margin-right:10px;" />
                    </div>
                    
                    <div class="tooltip_font_color">
                        <label for="tooltip-font-color" class="title"><?php _e( 'Font Color:', 'premiumPresentations' ); ?></label>                        
                        <input type="text" value='<?php echo esc_attr( $settings['tipFontColor'] ); ?>' name="floorplan-settings[tipFontColor]" id="tooltip-font-color" style="margin-right:10px;" />
                    </div>
                    
                    <div class="tooltip_mobile">
                        <label for="tooltip-mobile" class="title" style="width:250px;"><?php _e( 'Enable Tooltips on mobile devices?', 'premiumPresentations' ); ?></label>
                        <input name="floorplan-settings[tooltipMobile]" type="checkbox" value="1" <?php checked( $settings['tooltipMobile'], 1 ); ?> />
                    </div>
                    
                    <div class="google_maps_settings" style="margin-top:20px;">
                    
                    	<h4><?php _e( 'Google Map Settings', 'premiumPresentations' ); ?></h4>
                    
                    	<div class="google_map_height">                        
                            <label for="google-map-height" class="title"><?php _e( 'Map Height:', 'premiumPresentations' ); ?></label><div id="googleMapHeight"></div>
                            <input type="text" id="google-map-height"  value="<?php echo $settings['googleMapHeight']; ?>" name="floorplan-settings[googleMapHeight]" >
                        </div>
                        
                        <div class="google_map_zoom_level">                        
                            <label for="google-map-zoom-level" class="title"><?php _e( 'Zoom Level:', 'premiumPresentations' ); ?></label><div id="googleMapZoomLevel"></div>
                            <input type="text" id="google-map-zoom-level"  value="<?php echo $settings['googleMapZoomLevel']; ?>" name="floorplan-settings[googleMapZoomLevel]" >
                        </div>
                        
                        <div class="google_map_btn_color">
                            <label for="google-map-btn-color" class="title"><?php _e( 'Button Color:', 'premiumPresentations' ); ?></label>                        
                            <input type="text" value='<?php echo esc_attr( $settings['googleMapBtnColor'] ); ?>' name="floorplan-settings[googleMapBtnColor]" id="google-map-btn-color" style="margin-right:10px;" />
                        </div>
                        
                        <div class="google_map_btn_text_color">
                            <label for="google-map-btn-text-color" class="title"><?php _e( 'Button Text Color:', 'premiumPresentations' ); ?></label>                        
                            <input type="text" value='<?php echo esc_attr( $settings['googleMapBtnTextColor'] ); ?>' name="floorplan-settings[googleMapBtnTextColor]" id="google-map-btn-text-color" style="margin-right:10px;" />
                        </div>
                    
                    </div>
                    
                    
                    <?php //echo $settings['panelAutoResize']; ?>
                    <?php //$settings['panelLayout'] == 'pm-lo-3' ? print 'true' : ''; ?>
                    
                    <div class="submitbox" id="submitpost">
                      <div id="delete-action">
                        <a class="button button-primary button-large delete" href="<?php echo get_delete_post_link( $post->ID ); ?>"><?php _e( 'Move to Trash', 'premiumPresentations' ) ?></a>
                      </div>
                      <div id="publishing-action">
                        <span class="spinner" style="display: none;"></span>
                        <input name="original_publish" type="hidden" id="original_publish" value="Publish">
                        <input type="submit" name="publish" id="publish" class="button button-primary button-large" value="<?php echo ( $step_one ) ? __( 'Initialize Presentation', 'premiumPresentations' ) : __( 'Update Presentation', 'premiumPresentations' ); ?>" accesskey="p">
                      </div>
                    </div>
                    
                    <?php wp_nonce_field( "floorplan-save-settings", "floorplan" ); //required to save the settings through save_data method ?>
                    
                </div><!--floorplan_settings-->
            
            </div><!-- floorplan_settings container -->
            
            <?php
			
		}//end of settings_panel
		
		
		//SAVE DATA
		public function save_data( $post_id ) {
			
			//$panels = sanitize_text_field( $_POST['pm-panels-data'] );
			//print_r($panels);
			//return;
			
			//Safety checks first before saving anything
			if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) 
        		return $post_id;
								
			if ( get_post_type( $post_id ) !== 'floorplan' || !isset( $_POST['publish'] ) )
        		return;				
				
			if ( !isset( $_POST['floorplan'] ) || !wp_verify_nonce( $_POST['floorplan'], 'floorplan-save-settings' ) ) //Verfiy hidden nonce field in general settings form
        		wp_die( "A system error occurred, could not save data!" );			
			
			if ( !isset( $_POST['post_type'] ) || 'floorplan' !== $_POST['post_type'] )
        		return;
				
			//All good, continue to process data
			
			// Saving panels data.
			//$panels = sanitize_text_field( $_POST['pm-panels-data'] ); //retrieved from floorplan_editor method
			$panels = $_POST['pm-panels-data'] ; //retrieved from floorplan_editor method
			update_post_meta( $post_id, 'pm-panels-data', $panels );
			
			//Saving floorplan's general settings.
			$defaults = array(
				'floorplanWidth' => 0, //width of the floorplan image - this will apply to the container
				'floorplanHeight' => 0, //height of the floorplan image - this will apply to the container
				'markerColor' => 'blue',
				'markerHoverColor' => 'green',
				'markerActiveColor' => 'red',
				'markerFontColor' => 'white',
				'markerType' => 'square',
				'markerSize' => 35,
				'markerFontSize' => 15,
				'markerYPosition' => 10,
				'markerIcon' => 'No icon selected',
				'markerAnimation' => 0,
				'panelBGColor' => 'grey',
				'panelTitleColor' => 'black',
				'panelTextColor' => 'black',
				'panelBorderRadius' => 0,
				'panelTitleFontSize' => 20,
				'panelTitleYPosition' => 10,
				'floorplanResponsiveness' => 0,
				'panelHeight' => 230,
				'panelLayout' => 'pm-lo-1',
				'panelAutoResize' => 0,
				'panelShortcodeSupport' => 0,
				'videoHeight' => 200,
				'markerResponsiveSize' => 10,
				'markerResponsiveFontSize' => 5,
				'tipBorderRadius' => 10,
				'tipBGColor' => '#000000',
				'tipBorderColor' => '#000000',
				'tipFontColor' => '#ffffff',
				'tooltipMobile' => 0,
				'googleMapHeight' => 300,
				'googleMapZoomLevel' => 14,
				'googleMapBtnColor' => '#A6A6A6',
				'googleMapBtnTextColor' => '#ffffff',
			);
			
			$settings = $_POST['floorplan-settings'];
			$noncheckbox = array_diff_key( $defaults, $settings );
			foreach ( $noncheckbox as $i => $v ) {
				$noncheckbox[$i] = 0;
			}
			$settings = array_merge( $settings, $noncheckbox ); 
			
			update_post_meta( $post_id, 'pm-floorplan-settings', $settings );
			
			//Check for old data and remove it if neccessary
			/*if ( isset( $_POST['floorplan-old'] ) ) {
				
				//do actions
				
			}*/
			
		}//end of save_data
		
		
		//PREVIEW FLOORPLAN LAYOUT WITH EDITABLE MARKERS
		public function floorplan_editor() {
			
			global $post;
			 
			if ( $post->post_type !== 'floorplan' )
        		return;
			
			//Grab settings info first - if there are no plugin settings then the floorplan has not been initialized yet
			$settings = get_post_meta( $post->ID, 'pm-floorplan-settings', true );
			
			if ( !$settings )
        		return;
				
			//Grab panel info second
			$panels = get_post_meta( $post->ID, 'pm-panels-data', true );
						
			?>
            
            <div class="pm-wrap postbox" data-url="<?php echo PM_ADMIN_URL; ?>" >
            	
                <!-- MARKER editor -->
                
                <div id="floorplan_container" style="background-image:url(<?php echo $settings['floorplanImage'] != 'No Image selected' ? $settings['floorplanImage'] : ''; ?>); width:<?php echo $settings['floorplanWidth'] != '0' ? $settings['floorplanWidth'] : '700'; ?>px; height:<?php echo $settings['floorplanHeight'] != '0' ? $settings['floorplanHeight'] : '200'; ?>px;">
                <?php 		
					if($settings['floorplanImage'] == 'No Image selected'){
						echo '<p style="margin-left:10px;">'. __( 'No Presentation image uploaded. You can add a presentation image below under <b>General Settings</b>', 'premiumPresentations' ) .'.</p>';
					}
				?>
                
                    <div class="markers_container" style="width:<?php echo $settings['floorplanWidth'] != '0' ? $settings['floorplanWidth'] : '700'; ?>px; height:<?php echo $settings['floorplanHeight'] != '0' ? $settings['floorplanHeight'] : '200'; ?>px;"></div>
                        <!--<div class="marker circleBase type2" id="panel_marker_1" data-markerPositions='{"xPos":"0px", "yPos":"0px"}' data-markerSize='{"width":"0px", "height":"0px"}' data-markerNumber='{"number":"0"}' ><p>1</p></div>-->
                </div>
                
                <div id="results"></div>
                
                <!-- PANEL editor -->
                <div class="accordion_container">
                
                    <!--<form name="post" action="#" id="post"></form>-->
                
                    <input type="button" class="button button-primary button-large" value="ADD NEW PANEL" id="add_new_panel_btn" style="margin:0 0 10px 0;" />
                    <input type="button" class="button button-primary button-large delete" value="DELETE ALL PANELS" id="delete_all_btn" style="margin:0 0 10px 0;" />
                    <input type="submit" style="float:right;" name="publish" id="publish" class="button button-primary button-large" value="<?php echo __( 'Update Presentation', 'premiumPresentations' ); ?>" accesskey="p">
                    <!--DEBUG TESTING-->
                    <!--<input name="Submit" class="button button-primary button-large" type="submit" id="save_btn" style="margin:0 0 10px 0;" value="TEST DATA" />-->
                    
                    <input type="hidden" id="pm-panels-data" name="pm-panels-data" />
                                    
                    <div id="accordion"></div><!-- /accordion -->
                
                </div><!-- /accordion_container -->
                
            </div>
            
            <?php
			
			$dot = ( PM_DEBUG ) ? '.' : '.min.';
			
			//Load floorplan admin js files
			wp_enqueue_script( 'floorplan-admin', PM_ADMIN_URL . '/js/admin' . $dot . 'js', array('jquery'), '1.0.0', true );
			wp_enqueue_script( 'floorplan-image-multiple-uploader', PM_ADMIN_URL . '/js/pm-image-multiple-uploader-class' . $dot . 'js', array('jquery'), '1.0.0', true );
						
			//Send settings and panels to JS
			wp_enqueue_script( 'js_handler', plugins_url() ); //pass in second parameter to prevent error
			//wp_enqueue_script( 'js_handler', PM_ADMIN_URL . '/js/wordpress.js' ); //pass in second parameter to prevent error
			wp_localize_script( 'js_handler', 'panel_settings', $settings );
			wp_localize_script( 'js_handler', 'panel_data', $panels );
			
			
		}//end of floorplan_editor
		
		
		public function shortcode_ajax_function(){
			
			 //global $wpdb; // this is how you get access to the database
						
			 //the first part is a SWTICHBOARD that fires specific functions according to the value of Query Variable 'fn'
			 		
			 switch($_REQUEST['fn']){
				case 'run_shortcode_function':
				   WPBMap::addAllMappedShortcodes();//required for Visual Composer output as of version 4.9
				   $output = do_shortcode(stripslashes($_REQUEST['required_data'])); //use stripslashes to preseve quotes in shortcode
				   break;
				  $output = 'No function specified.';
				break;
			 }		
			
			echo $output;
						
			die();// this is required to return a proper result
		
	   }//shortcode_ajax_function
				
	   
	   public function pm_ln_duplicate_post_as_draft(){
		   
			global $wpdb;
			if (! ( isset( $_GET['post']) || isset( $_POST['post'])  || ( isset($_REQUEST['action']) && 'pm_ln_duplicate_post_as_draft' == $_REQUEST['action'] ) ) ) {
				wp_die('No post to duplicate has been supplied!');
			}
		 
			//get the original post id
			$post_id = (isset($_GET['post']) ? $_GET['post'] : $_POST['post']);
			
			//and all the original post data then
			$post = get_post( $post_id );
		 
			/*
			 * if you don't want current user to be the new post author,
			 * then change next couple of lines to this: $new_post_author = $post->post_author;
			 */
			$current_user = wp_get_current_user();
			$new_post_author = $current_user->ID;
		 
			//if post data exists, create the post duplicate
			if (isset( $post ) && $post != null) {
		 
				//new post data array
				$args = array(
					'comment_status' => $post->comment_status,
					'ping_status'    => $post->ping_status,
					'post_author'    => $new_post_author,
					'post_content'   => $post->post_content,
					'post_excerpt'   => $post->post_excerpt,
					'post_name'      => $post->post_name,
					'post_parent'    => $post->post_parent,
					'post_password'  => $post->post_password,
					'post_status'    => 'draft',
					'post_title'     => $post->post_title,
					'post_type'      => $post->post_type,
					'to_ping'        => $post->to_ping,
					'menu_order'     => $post->menu_order
				);
		 
				//insert the post by wp_insert_post() function
				$new_post_id = wp_insert_post( $args );
		 
				//get all current post terms ad set them to the new post draft
				$taxonomies = get_object_taxonomies($post->post_type); // returns array of taxonomy names for post type, ex array("category", "post_tag");
				foreach ($taxonomies as $taxonomy) {
					$post_terms = wp_get_object_terms($post_id, $taxonomy, array('fields' => 'slugs'));
					wp_set_object_terms($new_post_id, $post_terms, $taxonomy, false);
				}
		 
				//duplicate all post meta
				$post_meta_infos = $wpdb->get_results("SELECT meta_key, meta_value FROM $wpdb->postmeta WHERE post_id=$post_id");
				if (count($post_meta_infos)!=0) {
					$sql_query = "INSERT INTO $wpdb->postmeta (post_id, meta_key, meta_value) ";
					foreach ($post_meta_infos as $meta_info) {
						$meta_key = $meta_info->meta_key;
						$meta_value = addslashes($meta_info->meta_value);
						$sql_query_sel[]= "SELECT $new_post_id, '$meta_key', '$meta_value'";
					}
					$sql_query.= implode(" UNION ALL ", $sql_query_sel);
					$wpdb->query($sql_query);
				}
		 
		 
				// finally, redirect to the edit post screen for the new draft
				wp_redirect( admin_url( 'post.php?action=edit&post=' . $new_post_id ) );
				exit;
				
			} else {
				wp_die('Post creation failed, could not find original post: ' . $post_id);
			}
			
		}
		 
		//Add the duplicate link to action list for post_row_actions
		public function pm_ln_duplicate_post_link( $actions, $post ) {
			
			if ($post->post_type == "floorplan"){
				if (current_user_can('edit_posts')) {
					$actions['duplicate'] = '<a href="admin.php?action=pm_ln_duplicate_post_as_draft&amp;post=' . $post->ID . '" title="Duplicate this item" rel="permalink">Duplicate</a>';
				}
				return $actions;
			} else {
				return $actions;	
			}
			
		}	
		
		//Presentation id shortcode Column
		public function posts_floorplan_columns_id($defaults){
			$defaults['wps_post_id'] = __('Shortcode', 'premiumPresentations');
			return $defaults;
		}
		public function posts_floorplan_custom_id_columns($column_name, $id){
			if($column_name === 'wps_post_id'){
				echo '[presentation id="'.$id.'"/]';
			}
		}
		
		
		//Add sub menus
		public function pm_premium_presentations_settings() {
			
			//create sub-menu items
			add_submenu_page( 'edit.php?post_type=floorplan', __('Settings'),  __('Settings'), 'manage_options', 'premium_presentations_settings',  array( $this, 'pm_premium_presentations_settings_page' ) );
			
		}
		
		//Paypal Settings page
		public function pm_premium_presentations_settings_page() {
						
			//Save data first
			if (isset($_POST['pm_premium_presentations_settings_update'])) {
				
				update_option('pm_google_api_key', (string)$_POST["pm_google_api_key"]);
				
				echo '<div id="message" class="updated fade"><h4>'. esc_attr__('Your settings have been saved.', 'premiumPresentations') .'</h4></div>';
				
			}
			
			$pm_google_api_key = get_option('pm_google_api_key');
			
			
			?>
			
			<div class="wrap">
            
				<?php screen_icon(); ?>
                
				<h2><?php _e('Premium Presentations', 'premiumPresentations') ?> <?php _e('Settings', 'premiumPresentations') ?></h2>
                
                <h4><?php _e('Configure the settings for Premium Presentations below:', 'premiumPresentations') ?></h4>
                
                <form method="post" action="<?php echo $_SERVER["REQUEST_URI"]; ?>">
                    
                    <label for="pm_google_api_key" class="pm-paypal-label"><?php _e('Google API browser key:', 'premiumPresentations') ?> 
                    
                    	<input type="text" class="regular-text" id="pm_google_api_key" name="pm_google_api_key" value="<?php echo esc_attr($pm_google_api_key); ?>">   
                    
                    </label>
                    
                    <br /><br />             
                    
                    <input type="hidden" name="pm_premium_presentations_settings_update" id="pm_premium_presentations_settings_update" value="true" />
                    
                    <div class="pm-payel-submit">
                        <input type="submit" name="pm_settings_update" class="button button-primary button-large" value="<?php _e('Update Settings', 'premiumPresentations'); ?> &raquo;" />
                    </div>
                
                </form>
				
			</div>
			
			<?php
			
		}
		
		
	}//end of FloorPlanPremium class
	
}//end of class collision if

// Instantiate the class
$floorplan = new FloorPlanPremium; 

//Add shortcode include here
include("shortcode.php"); // Load shortcode

?>