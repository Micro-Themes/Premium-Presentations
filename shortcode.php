<?php
add_shortcode( "presentation", "add_pm_floorplan_shortcode" );

function add_pm_floorplan_shortcode( $atts ) {
	
	extract( shortcode_atts( array(
		'id' => ''
	), $atts ) );
	
	
	$settings = get_post_meta( $id, 'pm-floorplan-settings', true );
	//$panels  = json_decode( get_post_meta( $id, 'pm-panels-data', true ), true );
	$panels  = get_post_meta( $id, 'pm-panels-data', true );
	
	$pm_google_api_key = get_option('pm_google_api_key');
	
	if ( ! $settings || ! $panels ) 
    	return "";
		
	//pass floorplan data and settings to Floorplan plugin
	wp_enqueue_script( 'js_handler', plugins_url() ); //pass in second parameter to prevent error
	wp_localize_script( 'js_handler', 'floorplan_data', json_decode($panels, true) ); 
	wp_localize_script( 'js_handler', 'floorplan_settings', $settings, true );
	$bloginfo = site_url();
	wp_localize_script( 'js_handler', 'floorplan_url', $bloginfo, true ); 
	
		
	$html = '';
	
	// 1. img width = 800px / 100 = 8 - 2. 8 x 10 = 80%
		
	if($settings['floorplanResponsiveness'] == 1){
		$html .= '<div id="pm_floorplan_container">';//If responsive mode is true, set percentage width in javascript
	} else {
		$html .= '<div id="pm_floorplan_container" style="width:'. $settings['floorplanWidth'].'px;">';//Make 100% width if responsive is set to 1	
	}	
	
		$html .= '<div class="pm_floorplan_container">'; 
		
			$html .= '<div class="pm_markers_container"></div>';
			
			$html .= '<div class="pm_floorplan"><img src="'.$settings['floorplanImage'].'"></div>';			
		
		$html .= '</div>';//close pm_floorplan_container
		
		//$html .= '<div style="clear:both;"></div>';
	
	$html .= '</div>';//close pm_floorplan_container
	
	if($settings['panelLayout'] == 'pm-lo-4'){//remove sort buttons
				
		if($settings['floorplanResponsiveness'] == 1){
			$html .= '<div class="pm_interface_controls"><a href="#" id="pm_show_all_btn">Show all</a><a href="#" id="pm_hide_all_btn">Collapse all</a></div>';
		} else {
			$html .= '<div class="pm_interface_controls" style="width:'. $settings['floorplanWidth'].'px;"><a href="#" id="pm_show_all_btn">Show all</a><a href="#" id="pm_hide_all_btn">Collapse all</a></div>';
		}
		
	} elseif($settings['panelLayout'] == 'pm-lo-5') {
		//dont display presentation controls
	} else {
		
		if($settings['floorplanResponsiveness'] == 1){
			$html .= '<div class="pm_interface_controls"><a href="#" id="pm_show_all_btn">Show all</a><a href="#" id="pm_hide_all_btn">Collapse all</a><div class="pm_sort_btns"><a href="#" id="sort_alpha">Sort Alphabetically</a> | <a href="#" id="sort_marker">Sort by Marker</a></div></div>';
		} else {
			$html .= '<div class="pm_interface_controls" style="width:'. $settings['floorplanWidth'].'px;"><a href="#" id="pm_show_all_btn">Show all</a><a href="#" id="pm_hide_all_btn">Collapse all</a><div class="pm_sort_btns"><a href="#" id="sort_alpha">Sort Alphabetically</a> | <a href="#" id="sort_marker">Sort by Marker</a></div></div>';
		}
		
		
	}
			
	if($settings['panelLayout'] == 'pm-lo-5') {
		$html .= '<div class="pm_panels_container" style="display:none;"></div>';
	} else {
		
		if($settings['floorplanResponsiveness'] == 1){
			$html .= '<div class="pm_panels_container" style="width:100%; min-height:auto !important;"></div>';	 //Remove width if responsive is set to ON
		} else {
			$html .= '<div class="pm_panels_container" style="width:'.$settings['floorplanWidth'].'px; min-height:'.$settings['panelHeight'].'px;"></div>';	 //Remove width if responsive is set to ON
		}
		
	}
	
	
	$html .= '<script src="//maps.google.com/maps/api/js?key='.esc_attr($pm_google_api_key).'"></script>';
	$html .= "<script type=\"text/javascript\">jQuery(document).ready(function(e) {jQuery('.pm_floorplan_container').PMFloorPlan({data : floorplan_data, settings : floorplan_settings, url: floorplan_url});});</script>";
				
	return $html;
	
}//end of shortcode

?>