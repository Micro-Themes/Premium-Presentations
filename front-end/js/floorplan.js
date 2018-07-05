/*------------------------------------------------------------------------
# Premium Presentations - WordPress Plug-in (Published July 22, 2013)
# ------------------------------------------------------------------------
# Author: Leo Nanfara  Company: Pulsar Media
# ------------------------------------------------------------------------
# Websites:  http://www.pulsarmedia.ca - Email: info@pulsarmedia.ca
--------------------------------------------------------------------------*/
;(function ( $, window, document, undefined ) {
		
	'use strict';

	// global
	var Modernizr = window.Modernizr;
	
	$.PMFloorPlan = function( options, element ) {
		this.$el = $( element );
		this._init( options );
	};
	
	// the options
	$.PMFloorPlan.defaults = {
		//Floorplan data from WordPress
		data : '',
		//Floorplan settings from WordPress
		settings : '',
		//URL capture for shortcode support
		url : ''
	};

	//define internal variables here if needed
	var floorPlanData = [];
	//var floorPlanData = [ {"index" : 1, "markerX" : 150, "markerY" : 130, "roomDescription" : "This is the room desc.", "roomImage" : "img/room1.jpg", "roomSize" : "400sq ft", "roomTitle" : "Main Lobby", "spaceAvailable" : "NO", "title" : "Panel 1 - Main Lobby"}, {"index" : 2, "markerX" : 230, "markerY" : 160, "roomDescription" : "This is the room desc.", "roomImage" : "img/room2.jpg", "roomSize" : "400sq ft", "roomTitle" : "ACC Lobby", "spaceAvailable" : "NO", "title" : "Panel 2 - Rec Room"}];
	
	var floorPlanSettings = [];
	var floorPlanURL = "";
	
	var showAll = false;
	var sortByAlpha = false;
	var sortByMarker = false;
	
	//Store google maps
	var gMaps = [];
			
	//sorted data
	//var sortedDataA = []; //sort alphabetically

    $.PMFloorPlan.prototype = {
		
		// Place initialization logic here
		// You already have access to the DOM element and the options via the instance, e.g. this.element and this.options
		// you can add more functions like the one below and call them like so: this.yourOtherFunction(this.element, this.options).
		
		_init: function(options) {
			// options
			this.options = $.extend( true, {}, $.PMFloorPlan.defaults, options );
			//Configure initial settings
			this._config();
												
		},//end of init
		
		_config: function() {
						
			//Call for local testing or live development if required
			//_showPanels();
			
			var parent = this;	
			
			//apply settings
			if(this.options.settings != ''){
				floorPlanSettings = this.options.settings;
			};
			
			if(this.options.url != ''){
				floorPlanURL = this.options.url + '/wp-admin/admin-ajax.php';
			};
			
			//if panel data is available then add the panels via jQuery
			if(this.options.data != ''){
				
				floorPlanData = this.options.data;
				
				//insert index for sorting by index
				var len = floorPlanData.length;
				for(var i = 0; i < len; i++){
					floorPlanData[i]['index'] = i;
				}				
								
				parent._showPanels();	
				
			};		
			
			//window resize
			if(floorPlanSettings['floorplanResponsiveness']) {
				$(window).resize(function() {
					parent._resizeHandler();
				});	
			};			
			
			//hide show all btn and display hide all btn upon click
			$('#pm_show_all_btn').click(function(e) {
				
				showAll = true;
				
				$(this).hide();
				$('#pm_hide_all_btn').show();
				$('.pm_sort_btns').show();
				
				parent._showPanels();
				
				e.preventDefault();
				
			});
			
			//hide all btn displays only when Show All has been clicked
			$('#pm_hide_all_btn').click(function(e) {
				
				showAll = false;
				
				$(this).hide();
				$('#pm_show_all_btn').show();
				$('.pm_sort_btns').hide();
				
				//disable sorting
				sortByAlpha = false;
				sortByMarker = false;
				
				//ensure panels are sorted by Marker as default
				floorPlanData = floorPlanData.sort(parent._sortByMarker);
				
				//render the panels
				parent._showPanels();
				
				e.preventDefault();
								
			});
			
			$('#sort_alpha').click(function(e) {
				
				sortByAlpha = true;
				sortByMarker = false;
				
				parent._showPanels();
				
				e.preventDefault();
								
			});
			
			$('#sort_marker').click(function(e) {
				
				sortByAlpha = false;
				sortByMarker = true;
				
				parent._showPanels();
				
				e.preventDefault();
								
			});
			
			//add back to top support
			$('.pm_back_to_top').live('click', function(e) {
				$('html, body').animate({
				   scrollTop: $('.pm_floorplan').offset().top - 50
				}, 1000);
			});
			$('.pm_back_to_top_absolute').live('click', function(e) {
				$('html, body').animate({
				   scrollTop: $('.pm_floorplan').offset().top - 50
				}, 1000);
			});
			
			//startup call for resizeHandler
			parent._resizeHandler();
			
		},//end of config
		
		//Required for Responsive mode
		_setContainerWidth : function(opt) {
						
			if(floorPlanSettings['floorplanResponsiveness'] == 1){
				$('#pm_floorplan_container').css({
					'width' : '100%'	
				});	
				var img = $('.pm_floorplan img');
				img.css({
					'width' : '100%'	
				});
			};
			
		},
		
		_resizeHandler : function() {
			
			var parent = this;
			
			setTimeout(function() {
												
				if( $(window).width() < 480 ){
					
					//$('.pm_floorplan_marker').addClass(responsiveClass);
					parent._resizeMobileMarker(floorPlanSettings['markerResponsiveSize'], floorPlanSettings['markerResponsiveSize']);
					
					$('.pm_floorplan_marker').find('p').css({
						'padding' : '3px',	
						'font-size' : floorPlanSettings['markerResponsiveFontSize'] + 'px'
					});
										
					//resize links
					$('.pm_interface_controls a').css({
						'fontSize' : '12px'	
					});
					
					$('.pm_sort_btns').css({
						'marginTop' : '-2px'	
					});
					
				} else {
					
					//resize markers
					$('.pm_floorplan_marker').css({
						'width' : floorPlanSettings['markerSize'],
						'height' : floorPlanSettings['markerSize']
					});
					
					$('.pm_floorplan_marker').find('p').css({
						'font-size' : floorPlanSettings['markerFontSize'] + 'px',
						'padding-top' : floorPlanSettings['markerYPosition'] + 'px',
					});
					
					//resize links
					$('.pm_interface_controls a').css({
						'fontSize' : '14px'	
					});
					
					$('.pm_sort_btns').css({
						'marginTop' : '0px'	
					});
				};
				
			}, 20);
			
		},
		
		_resizeMobileMarker : function(w, h) {
			
			w = ( undefined !== w ? w : 50 );
		    h = ( undefined !== h ? h : 50 );
		
		    var cw = $('.pm_floorplan_marker').width();
		    var ch = $('.pm_floorplan_marker').height();
					
			$('.pm_floorplan_marker').css({
				//'top'    : '+=' + ( (ch - h) / 2 ) + 'px',
				//'left'   : '+=' + ( (cw - w) / 2 ) + 'px',
				'width'  : w + 'px',
				'height' : h + 'px'
			});
			
		},
		
		
		//sort panel list alphabetically
		_sortByTitle: function(a, b){
		  var aName = a.panelTitle.toLowerCase();
		  var bName = b.panelTitle.toLowerCase(); 
		  return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
		},
		
		//sort panel list numerically
		_sortByMarker: function(a, b){
		  var aIndex = parseInt(a.index);
		  var bIndex = parseInt(b.index); 
		  return ((aIndex < bIndex) ? -1 : ((aIndex > bIndex) ? 1 : 0));
		},
		
		_addPanelInfo: function(data, container){
				
			var $container = $(container);
			
			if(floorPlanSettings['panelShortcodeSupport'] == 0){
				
				$container.html(data);
				
			} else {
				
				console.log($container);
			
				//process shortcode
				$container.html('Loading info...');
				//console.log($container);
				
				$.ajax({
					url: floorPlanURL,
					type: "POST",
					//async: true,
					dataType: 'json',
					data: {
					   'action':'your_ajax', //http://codex.wordpress.org/Plugin_API/Action_Reference/wp_ajax_%28action%29
					   'fn':'run_shortcode_function',
					   'required_data': data
					},
					success: function(results){
						//do something with the results of the shortcode to the DOM
					},
					complete: function(results) {
						if(results.status==200 && results.readyState==4){
							$container.html(results.responseText);
						}
					},
					error: function(errorThrown){console.log(errorThrown);}
				});// end of ajax
				
			}
			
		},
		
		_showPanels: function() {
			
			var parent = this;	
								
			if(sortByAlpha){
				floorPlanData = floorPlanData.sort(parent._sortByTitle);
			}
			
			if(sortByMarker){
				floorPlanData = floorPlanData.sort(parent._sortByMarker);
			}
			
			
			var len = floorPlanData.length;
			var counter = 1;
			
			//clear out .pm_panels_container first then append divs
			$('.pm_panels_container').empty();
			
			//calculate width for panel columns
			var FPWidth = floorPlanSettings['floorplanWidth'];
			var widthDivided = FPWidth / 2;
			var sectionWidth = widthDivided + 100;
			var infoWidth = widthDivided - 100;
			
			var panelHeight = floorPlanSettings['panelHeight'];
			var panelBGColor = floorPlanSettings['panelBGColor'];
			var panelTitleColor = floorPlanSettings['panelTitleColor'];
			var panelTextColor = floorPlanSettings['panelTextColor'];
			var panelTitleFontSize = floorPlanSettings['panelTitleFontSize'];
			var panelTitleYPosition = floorPlanSettings['panelTitleYPosition'];
			
			//apply correct marker type
			var background = '';
			
			if( floorPlanSettings['markerType'] == 'icon' ){
				background = 'background-image:url('+floorPlanSettings['markerIcon']+');';
			} else {
				background = 'background-color:'+floorPlanSettings['markerColor'];
			}
			
			for(var i = 0; i < len; i++){
				
				var display = '';
				if( floorPlanData[i]['panelVideo'] != '' && !floorPlanSettings['floorplanResponsiveness']){
					display = '<iframe width="100%" height="'+ floorPlanSettings['panelHeight'] +'" src="//www.youtube.com/embed/'+ floorPlanData[i]['panelVideo'] +'?version=3&hl=en_US&autoplay=0&rel=0" frameborder="0" allowfullscreen></iframe>';
				} else if(floorPlanData[i]['panelVideo'] != '' && floorPlanSettings['floorplanResponsiveness'] == 1) {
					display = '<iframe width="100%" height="'+ floorPlanSettings['videoHeight'] +'" src="//www.youtube.com/embed/'+ floorPlanData[i]['panelVideo'] +'?version=3&hl=en_US&autoplay=0&rel=0" frameborder="0" allowfullscreen></iframe>';
				} else if(floorPlanData[i]['panelImage'] != '') {
					display = '<img src="'+floorPlanData[i]['panelImage']+'" />';
				} else {
					//do nothing	
				}
											
				if(showAll){
					
					//determine panel layout
					if(floorPlanSettings['panelLayout'] == 'pm-lo-1' && !floorPlanSettings['floorplanResponsiveness']){
						
						//Panel Layout 1
						
						//check for auto resize if display (img or video) is empty
						if(display == '' && floorPlanSettings['panelAutoResize'] == 1){
							
							$('.pm_panels_container').append('<div class="pm_panel full" style="border-radius:'+ floorPlanSettings['panelBorderRadius'] +'px;" id="panel_'+floorPlanData[i]['markerNumber']+'" data-marker=\'{"xPos":"'+floorPlanData[i]['markerX']+'", "yPos":"'+floorPlanData[i]['markerY']+'", "width":"'+floorPlanSettings['markerSize']+'", "height":"'+floorPlanSettings['markerSize']+'", "markerNumber":"'+floorPlanData[i]['markerNumber']+'", "markerTooltip":"'+floorPlanData[i]['markerTooltip']+'" }\'><div class="pm_section_info pm_full_width" style="height:'+panelHeight+'px; background-color:'+panelBGColor+';"><div class="pm_back_to_top">&uarr;</div><ul style="color:'+panelTextColor+';"><li><div class="marker '+floorPlanSettings['markerType']+'" style="width:'+floorPlanSettings['markerSize']+'px; height:'+floorPlanSettings['markerSize']+'px; '+background+'"><p style="font-size:'+floorPlanSettings['markerFontSize']+'px; padding-top:'+floorPlanSettings['markerYPosition']+'px; color:'+floorPlanSettings['markerFontColor']+';">'+floorPlanData[i]['markerNumber']+'</p></div><div class="section" style="color:'+panelTitleColor+'; font-size:'+panelTitleFontSize+'px; padding-top:'+panelTitleYPosition+'px;">'+floorPlanData[i]['panelTitle']+'</div></li><li id="panel_info_'+floorPlanData[i]['markerNumber']+'"></li></ul></div> '+ (floorPlanData[i]['gmapAddress'] != '' ? ''+ parent._buildGoogleMap(i) +'' : '' ) +' </div>');
							
						} else {
							
							$('.pm_panels_container').append('<div class="pm_panel full" style="border-radius:'+ floorPlanSettings['panelBorderRadius'] +'px;" id="panel_'+floorPlanData[i]['markerNumber']+'" data-marker=\'{"xPos":"'+floorPlanData[i]['markerX']+'", "yPos":"'+floorPlanData[i]['markerY']+'", "width":"'+floorPlanSettings['markerSize']+'", "height":"'+floorPlanSettings['markerSize']+'", "markerNumber":"'+floorPlanData[i]['markerNumber']+'", "markerTooltip":"'+floorPlanData[i]['markerTooltip']+'" }\'><div class="pm_section pm_left" style="width:'+sectionWidth+'px; height:'+panelHeight+'px;"> '+ display +' </div><div class="pm_section_info pm_left" style="width:'+infoWidth+'px; height:'+panelHeight+'px; background-color:'+panelBGColor+';"><div class="pm_back_to_top">&uarr;</div><ul style="color:'+panelTextColor+';"><li><div class="marker '+floorPlanSettings['markerType']+'" style="width:'+floorPlanSettings['markerSize']+'px; height:'+floorPlanSettings['markerSize']+'px; '+background+'"><p style="font-size:'+floorPlanSettings['markerFontSize']+'px; padding-top:'+floorPlanSettings['markerYPosition']+'px; color:'+floorPlanSettings['markerFontColor']+';">'+floorPlanData[i]['markerNumber']+'</p></div><div class="section" style="color:'+panelTitleColor+'; font-size:'+panelTitleFontSize+'px; padding-top:'+panelTitleYPosition+'px;">'+floorPlanData[i]['panelTitle']+'</div></li><li id="panel_info_'+floorPlanData[i]['markerNumber']+'"></li></ul></div> '+ (floorPlanData[i]['gmapAddress'] != '' ? ''+ parent._buildGoogleMap(i) +'' : '' ) +' </div>');
							
						}
						
						
					} else if(floorPlanSettings['panelLayout'] == 'pm-lo-2' && !floorPlanSettings['floorplanResponsiveness']){
						
						//Panel Layout 2
						
						//check for auto resize if display (img or video) is empty
						if(display == '' && floorPlanSettings['panelAutoResize'] == 1){
							
							$('.pm_panels_container').append('<div class="pm_panel full" style="border-radius:'+ floorPlanSettings['panelBorderRadius'] +'px;" id="panel_'+floorPlanData[i]['markerNumber']+'" data-marker=\'{"xPos":"'+floorPlanData[i]['markerX']+'", "yPos":"'+floorPlanData[i]['markerY']+'", "width":"'+floorPlanSettings['markerSize']+'", "height":"'+floorPlanSettings['markerSize']+'", "markerNumber":"'+floorPlanData[i]['markerNumber']+'", "markerTooltip":"'+floorPlanData[i]['markerTooltip']+'" }\'><div class="pm_section_info pm_full_width" style="height:'+panelHeight+'px; background-color:'+panelBGColor+';"><div class="pm_back_to_top">&uarr;</div><ul style="color:'+panelTextColor+';"><li><div class="marker '+floorPlanSettings['markerType']+'" style="width:'+floorPlanSettings['markerSize']+'px; height:'+floorPlanSettings['markerSize']+'px; '+background+'"><p style="font-size:'+floorPlanSettings['markerFontSize']+'px; padding-top:'+floorPlanSettings['markerYPosition']+'px; color:'+floorPlanSettings['markerFontColor']+';">'+floorPlanData[i]['markerNumber']+'</p></div><div class="section" style="color:'+panelTitleColor+'; font-size:'+panelTitleFontSize+'px; padding-top:'+panelTitleYPosition+'px;">'+floorPlanData[i]['panelTitle']+'</div></li><li id="panel_info_'+floorPlanData[i]['markerNumber']+'"></li></ul></div> '+ (floorPlanData[i]['gmapAddress'] != '' ? ''+ parent._buildGoogleMap(i) +'' : '' ) +' </div>');
							
						} else {
							
							$('.pm_panels_container').append('<div class="pm_panel full" style="border-radius:'+ floorPlanSettings['panelBorderRadius'] +'px;" id="panel_'+floorPlanData[i]['markerNumber']+'" data-marker=\'{"xPos":"'+floorPlanData[i]['markerX']+'", "yPos":"'+floorPlanData[i]['markerY']+'", "width":"'+floorPlanSettings['markerSize']+'", "height":"'+floorPlanSettings['markerSize']+'", "markerNumber":"'+floorPlanData[i]['markerNumber']+'", "markerTooltip":"'+floorPlanData[i]['markerTooltip']+'" }\'><div class="pm_section pm_right" style="width:'+sectionWidth+'px; height:'+panelHeight+'px;"> '+ display +' </div><div class="pm_section_info pm_left" style="width:'+infoWidth+'px; height:'+panelHeight+'px; background-color:'+panelBGColor+';"><div class="pm_back_to_top">&uarr;</div><ul style="color:'+panelTextColor+';"><li><div class="marker '+floorPlanSettings['markerType']+'" style="width:'+floorPlanSettings['markerSize']+'px; height:'+floorPlanSettings['markerSize']+'px; '+background+'"><p style="font-size:'+floorPlanSettings['markerFontSize']+'px; padding-top:'+floorPlanSettings['markerYPosition']+'px; color:'+floorPlanSettings['markerFontColor']+';">'+floorPlanData[i]['markerNumber']+'</p></div><div class="section" style="color:'+panelTitleColor+'; font-size:'+panelTitleFontSize+'px; padding-top:'+panelTitleYPosition+'px;">'+floorPlanData[i]['panelTitle']+'</div></li><li id="panel_info_'+floorPlanData[i]['markerNumber']+'"></li></ul></div> '+ (floorPlanData[i]['gmapAddress'] != '' ? ''+ parent._buildGoogleMap(i) +'' : '' ) +' </div>');
							
						}
						
					} else if(floorPlanSettings['panelLayout'] == 'pm-lo-3' && !floorPlanSettings['floorplanResponsiveness']){
						
						//Panel Layout 3 - info only
						$('.pm_panels_container').append('<div class="pm_panel full" style="border-radius:'+ floorPlanSettings['panelBorderRadius'] +'px;" id="panel_'+floorPlanData[i]['markerNumber']+'" data-marker=\'{"xPos":"'+floorPlanData[i]['markerX']+'", "yPos":"'+floorPlanData[i]['markerY']+'", "width":"'+floorPlanSettings['markerSize']+'", "height":"'+floorPlanSettings['markerSize']+'", "markerNumber":"'+floorPlanData[i]['markerNumber']+'", "markerTooltip":"'+floorPlanData[i]['markerTooltip']+'" }\'><div class="pm_section_info pm_full_width" style="height:'+panelHeight+'px; background-color:'+panelBGColor+';"><div class="pm_back_to_top_absolute">&uarr;</div><ul style="color:'+panelTextColor+';"><li><div class="marker '+floorPlanSettings['markerType']+'" style="width:'+floorPlanSettings['markerSize']+'px; height:'+floorPlanSettings['markerSize']+'px; '+background+'"><p style="font-size:'+floorPlanSettings['markerFontSize']+'px; padding-top:'+floorPlanSettings['markerYPosition']+'px; color:'+floorPlanSettings['markerFontColor']+';">'+floorPlanData[i]['markerNumber']+'</p></div><div class="section" style="color:'+panelTitleColor+'; font-size:'+panelTitleFontSize+'px; padding-top:'+panelTitleYPosition+'px;">'+floorPlanData[i]['panelTitle']+'</div></li><li id="panel_info_'+floorPlanData[i]['markerNumber']+'"></li></ul></div> '+ (floorPlanData[i]['gmapAddress'] != '' ? ''+ parent._buildGoogleMap(i) +'' : '' ) +' </div>');
						
					} else if(floorPlanSettings['panelLayout'] == 'pm-lo-4' && !floorPlanSettings['floorplanResponsiveness']){
						
						//Panel Layout 4 - image only
						$('.pm_panels_container').append('<div class="pm_panel full" style="border-radius:'+ floorPlanSettings['panelBorderRadius'] +'px;" id="panel_'+floorPlanData[i]['markerNumber']+'" data-marker=\'{"xPos":"'+floorPlanData[i]['markerX']+'", "yPos":"'+floorPlanData[i]['markerY']+'", "width":"'+floorPlanSettings['markerSize']+'", "height":"'+floorPlanSettings['markerSize']+'", "markerNumber":"'+floorPlanData[i]['markerNumber']+'", "markerTooltip":"'+floorPlanData[i]['markerTooltip']+'" }\'><div class="pm_section pm_full_width" style="height:'+panelHeight+'px;"> '+ display +' </div><div class="pm_back_to_top_absolute">&uarr;</div> '+ (floorPlanData[i]['gmapAddress'] != '' ? ''+ parent._buildGoogleMap(i) +'' : '' ) +' </div>');
						
					} else if(floorPlanSettings['panelLayout'] == 'pm-lo-5' && !floorPlanSettings['floorplanResponsiveness']){
						
						//Panel Layout 5 - no panels
						$('.pm_panels_container').append('<div class="pm_panel full" style="display:none;" id="panel_'+floorPlanData[i]['markerNumber']+'" data-marker=\'{"xPos":"'+floorPlanData[i]['markerX']+'", "yPos":"'+floorPlanData[i]['markerY']+'", "width":"'+floorPlanSettings['markerSize']+'", "height":"'+floorPlanSettings['markerSize']+'", "markerNumber":"'+floorPlanData[i]['markerNumber']+'", "markerTooltip":"'+floorPlanData[i]['markerTooltip']+'" }\'><div class="pm_section pm_full_width" style="height:'+panelHeight+'px;"></div><div class="pm_back_to_top">&uarr;</div> '+ (floorPlanData[i]['gmapAddress'] != '' ? ''+ parent._buildGoogleMap(i) +'' : '' ) +' </div>');
						
					} else {
						
						//Display responsive layout
						$('.pm_panels_container').append('<div class="pm_panel pm_panel_responsive" style="border-radius:'+ floorPlanSettings['panelBorderRadius'] +'px;" id="panel_'+floorPlanData[i]['markerNumber']+'" data-marker=\'{"xPos":"'+floorPlanData[i]['markerX']+'", "yPos":"'+floorPlanData[i]['markerY']+'", "width":"'+floorPlanSettings['markerSize']+'", "height":"'+floorPlanSettings['markerSize']+'", "markerNumber":"'+floorPlanData[i]['markerNumber']+'", "markerTooltip":"'+floorPlanData[i]['markerTooltip']+'" }\'><div class="pm_section_info" style="width:100%; height:auto !important; background-color:'+panelBGColor+';"><div class="pm_back_to_top">&uarr;</div><ul style="color:'+panelTextColor+'; margin-bottom:0px !important;"><li><div class="marker '+floorPlanSettings['markerType']+'" style="width:'+floorPlanSettings['markerSize']+'px; height:'+floorPlanSettings['markerSize']+'px; '+background+'"><p style="font-size:'+floorPlanSettings['markerFontSize']+'px; padding-top:'+floorPlanSettings['markerYPosition']+'px; color:'+floorPlanSettings['markerFontColor']+';">'+floorPlanData[i]['markerNumber']+'</p></div><div class="section" style="color:'+panelTitleColor+'; font-size:'+panelTitleFontSize+'px; padding-top:'+panelTitleYPosition+'px;">'+floorPlanData[i]['panelTitle']+'</div></li><li id="panel_info_'+floorPlanData[i]['markerNumber']+'"></li></ul></div><div class="pm_section" style="width:100%; height:auto !important;">'+ display +'</div> '+ (floorPlanData[i]['gmapAddress'] != '' ? ''+ parent._buildGoogleMap(i) +'' : '' ) +' </div>'); 
					}
					
					if(floorPlanSettings['panelLayout'] != 'pm-lo-4') {
						parent._addPanelInfo(floorPlanData[i]['panelDesc'], '#panel_info_'+floorPlanData[i]['markerNumber']);
					}
					
					
				} else { //show one panel at a time
					
					//determine panel layout
					if(floorPlanSettings['panelLayout'] == 'pm-lo-1' &&  !floorPlanSettings['floorplanResponsiveness']){
						
						//Panel Layout 1
						
						//check for auto resize if display (img or video) is empty
						if(display == '' && floorPlanSettings['panelAutoResize'] == 1){
														
							$('.pm_panels_container').append('<div class="pm_panel" style="border-radius:'+ floorPlanSettings['panelBorderRadius'] +'px;" id="panel_'+floorPlanData[i]['markerNumber']+'" data-marker=\'{"xPos":"'+floorPlanData[i]['markerX']+'", "yPos":"'+floorPlanData[i]['markerY']+'", "width":"'+floorPlanSettings['markerSize']+'", "height":"'+floorPlanSettings['markerSize']+'", "markerNumber":"'+floorPlanData[i]['markerNumber']+'", "markerTooltip":"'+floorPlanData[i]['markerTooltip']+'" }\'><div class="pm_section_info pm_full_width" style="height:'+panelHeight+'px; background-color:'+panelBGColor+';"><div class="pm_back_to_top">&uarr;</div><ul style="color:'+panelTextColor+';"><li><div class="marker '+floorPlanSettings['markerType']+'" style="width:'+floorPlanSettings['markerSize']+'px; height:'+floorPlanSettings['markerSize']+'px; '+background+'"><p style="font-size:'+floorPlanSettings['markerFontSize']+'px; padding-top:'+floorPlanSettings['markerYPosition']+'px; color:'+floorPlanSettings['markerFontColor']+';">'+floorPlanData[i]['markerNumber']+'</p></div><div class="section" style="color:'+panelTitleColor+'; font-size:'+panelTitleFontSize+'px; padding-top:'+panelTitleYPosition+'px;">'+floorPlanData[i]['panelTitle']+'</div></li><li id="panel_info_'+floorPlanData[i]['markerNumber']+'"></li></ul></div> '+ (floorPlanData[i]['gmapAddress'] != '' ? ''+ parent._buildGoogleMap(i) +'' : '' ) +' </div>');
							
						} else {
														
							$('.pm_panels_container').append('<div class="pm_panel" style="border-radius:'+ floorPlanSettings['panelBorderRadius'] +'px;" id="panel_'+floorPlanData[i]['markerNumber']+'" data-marker=\'{"xPos":"'+floorPlanData[i]['markerX']+'", "yPos":"'+floorPlanData[i]['markerY']+'", "width":"'+floorPlanSettings['markerSize']+'", "height":"'+floorPlanSettings['markerSize']+'", "markerNumber":"'+floorPlanData[i]['markerNumber']+'", "markerTooltip":"'+floorPlanData[i]['markerTooltip']+'" }\'><div class="pm_section pm_left" style="width:'+sectionWidth+'px; height:'+panelHeight+'px;">'+ display +'</div><div class="pm_section_info pm_left" style="width:'+infoWidth+'px; height:'+panelHeight+'px; background-color:'+panelBGColor+';"><div class="pm_back_to_top">&uarr;</div><ul style="color:'+panelTextColor+';"><li><div class="marker '+floorPlanSettings['markerType']+'" style="width:'+floorPlanSettings['markerSize']+'px; height:'+floorPlanSettings['markerSize']+'px; '+background+'"><p style="font-size:'+floorPlanSettings['markerFontSize']+'px; padding-top:'+floorPlanSettings['markerYPosition']+'px; color:'+floorPlanSettings['markerFontColor']+';">'+floorPlanData[i]['markerNumber']+'</p></div><div class="section" style="color:'+panelTitleColor+'; font-size:'+panelTitleFontSize+'px; padding-top:'+panelTitleYPosition+'px;">'+floorPlanData[i]['panelTitle']+'</div></li><li id="panel_info_'+floorPlanData[i]['markerNumber']+'"></li></ul></div> '+ (floorPlanData[i]['gmapAddress'] != '' ? ''+ parent._buildGoogleMap(i) +'' : '' ) +' </div>'); 
							
						}							
						
					} else if(floorPlanSettings['panelLayout'] == 'pm-lo-2' && !floorPlanSettings['floorplanResponsiveness']){
						
						//Panel Layout 2
						
						//check for auto resize if display (img or video) is empty
						if(display == '' && floorPlanSettings['panelAutoResize'] == 1){
							
							$('.pm_panels_container').append('<div class="pm_panel" style="border-radius:'+ floorPlanSettings['panelBorderRadius'] +'px;" id="panel_'+floorPlanData[i]['markerNumber']+'" data-marker=\'{"xPos":"'+floorPlanData[i]['markerX']+'", "yPos":"'+floorPlanData[i]['markerY']+'", "width":"'+floorPlanSettings['markerSize']+'", "height":"'+floorPlanSettings['markerSize']+'", "markerNumber":"'+floorPlanData[i]['markerNumber']+'", "markerTooltip":"'+floorPlanData[i]['markerTooltip']+'" }\'><div class="pm_section_info pm_full_width" style="height:'+panelHeight+'px; background-color:'+panelBGColor+';"><div class="pm_back_to_top">&uarr;</div><ul style="color:'+panelTextColor+';"><li><div class="marker '+floorPlanSettings['markerType']+'" style="width:'+floorPlanSettings['markerSize']+'px; height:'+floorPlanSettings['markerSize']+'px; '+background+'"><p style="font-size:'+floorPlanSettings['markerFontSize']+'px; padding-top:'+floorPlanSettings['markerYPosition']+'px; color:'+floorPlanSettings['markerFontColor']+';">'+floorPlanData[i]['markerNumber']+'</p></div><div class="section" style="color:'+panelTitleColor+'; font-size:'+panelTitleFontSize+'px; padding-top:'+panelTitleYPosition+'px;">'+floorPlanData[i]['panelTitle']+'</div></li><li id="panel_info_'+floorPlanData[i]['markerNumber']+'"></li></ul></div> '+ (floorPlanData[i]['gmapAddress'] != '' ? ''+ parent._buildGoogleMap(i) +'' : '' ) +' </div>');
							
						} else {
							
							$('.pm_panels_container').append('<div class="pm_panel" style="border-radius:'+ floorPlanSettings['panelBorderRadius'] +'px;" id="panel_'+floorPlanData[i]['markerNumber']+'" data-marker=\'{"xPos":"'+floorPlanData[i]['markerX']+'", "yPos":"'+floorPlanData[i]['markerY']+'", "width":"'+floorPlanSettings['markerSize']+'", "height":"'+floorPlanSettings['markerSize']+'", "markerNumber":"'+floorPlanData[i]['markerNumber']+'", "markerTooltip":"'+floorPlanData[i]['markerTooltip']+'" }\'><div class="pm_section pm_right" style="width:'+sectionWidth+'px; height:'+panelHeight+'px;">'+ display +'</div><div class="pm_section_info pm_left" style="width:'+infoWidth+'px; height:'+panelHeight+'px; background-color:'+panelBGColor+';"><div class="pm_back_to_top">&uarr;</div><ul style="color:'+panelTextColor+';"><li><div class="marker '+floorPlanSettings['markerType']+'" style="width:'+floorPlanSettings['markerSize']+'px; height:'+floorPlanSettings['markerSize']+'px; '+background+'"><p style="font-size:'+floorPlanSettings['markerFontSize']+'px; padding-top:'+floorPlanSettings['markerYPosition']+'px; color:'+floorPlanSettings['markerFontColor']+';">'+floorPlanData[i]['markerNumber']+'</p></div><div class="section" style="color:'+panelTitleColor+'; font-size:'+panelTitleFontSize+'px; padding-top:'+panelTitleYPosition+'px;">'+floorPlanData[i]['panelTitle']+'</div></li><li id="panel_info_'+floorPlanData[i]['markerNumber']+'"></li></ul></div> '+ (floorPlanData[i]['gmapAddress'] != '' ? ''+ parent._buildGoogleMap(i) +'' : '' ) +' </div>');
							
						}							
						
					} else if(floorPlanSettings['panelLayout'] == 'pm-lo-3' && !floorPlanSettings['floorplanResponsiveness']){
						
						//Panel Layout 3 - info only
						$('.pm_panels_container').append('<div class="pm_panel" style="border-radius:'+ floorPlanSettings['panelBorderRadius'] +'px;" id="panel_'+floorPlanData[i]['markerNumber']+'" data-marker=\'{"xPos":"'+floorPlanData[i]['markerX']+'", "yPos":"'+floorPlanData[i]['markerY']+'", "width":"'+floorPlanSettings['markerSize']+'", "height":"'+floorPlanSettings['markerSize']+'", "markerNumber":"'+floorPlanData[i]['markerNumber']+'", "markerTooltip":"'+floorPlanData[i]['markerTooltip']+'" }\'><div class="pm_section_info pm_full_width" style="height:'+panelHeight+'px; background-color:'+panelBGColor+';"><div class="pm_back_to_top_absolute">&uarr;</div><ul style="color:'+panelTextColor+';"><li><div class="marker '+floorPlanSettings['markerType']+'" style="width:'+floorPlanSettings['markerSize']+'px; height:'+floorPlanSettings['markerSize']+'px; '+background+'"><p style="font-size:'+floorPlanSettings['markerFontSize']+'px; padding-top:'+floorPlanSettings['markerYPosition']+'px; color:'+floorPlanSettings['markerFontColor']+';">'+floorPlanData[i]['markerNumber']+'</p></div><div class="section" style="color:'+panelTitleColor+'; font-size:'+panelTitleFontSize+'px; padding-top:'+panelTitleYPosition+'px;">'+floorPlanData[i]['panelTitle']+'</div></li><li id="panel_info_'+floorPlanData[i]['markerNumber']+'"></li></ul></div> '+ (floorPlanData[i]['gmapAddress'] != '' ? ''+ parent._buildGoogleMap(i) +'' : '' ) +' </div>');
						
					} else if(floorPlanSettings['panelLayout'] == 'pm-lo-4' && !floorPlanSettings['floorplanResponsiveness']){
						
						//Panel Layout 4 - image only
						$('.pm_panels_container').append('<div class="pm_panel" style="border-radius:'+ floorPlanSettings['panelBorderRadius'] +'px;" id="panel_'+floorPlanData[i]['markerNumber']+'" data-marker=\'{"xPos":"'+floorPlanData[i]['markerX']+'", "yPos":"'+floorPlanData[i]['markerY']+'", "width":"'+floorPlanSettings['markerSize']+'", "height":"'+floorPlanSettings['markerSize']+'", "markerNumber":"'+floorPlanData[i]['markerNumber']+'", "markerTooltip":"'+floorPlanData[i]['markerTooltip']+'" }\'><div class="pm_section pm_full_width" style="height:'+panelHeight+'px;">'+ display +'</div><div class="pm_back_to_top_absolute">&uarr;</div> '+ (floorPlanData[i]['gmapAddress'] != '' ? ''+ parent._buildGoogleMap(i) +'' : '' ) +' </div>');
						
					} else if(floorPlanSettings['panelLayout'] == 'pm-lo-5' && !floorPlanSettings['floorplanResponsiveness']){
						
						//Panel Layout 5 - no panels
						$('.pm_panels_container').append('<div class="pm_panel" style="display:none;" id="panel_'+floorPlanData[i]['markerNumber']+'" data-marker=\'{"xPos":"'+floorPlanData[i]['markerX']+'", "yPos":"'+floorPlanData[i]['markerY']+'", "width":"'+floorPlanSettings['markerSize']+'", "height":"'+floorPlanSettings['markerSize']+'", "markerNumber":"'+floorPlanData[i]['markerNumber']+'", "markerTooltip":"'+floorPlanData[i]['markerTooltip']+'" }\'><div class="pm_section pm_full_width" style="height:'+panelHeight+'px;"></div><div class="pm_back_to_top">&uarr;</div> '+ (floorPlanData[i]['gmapAddress'] != '' ? ''+ parent._buildGoogleMap(i) +'' : '' ) +' </div>');
							
					} else {
						
						//Display responsive layout
						$('.pm_panels_container').append('<div class="pm_panel" style="border-radius:'+ floorPlanSettings['panelBorderRadius'] +'px;" id="panel_'+floorPlanData[i]['markerNumber']+'" data-marker=\'{"xPos":"'+floorPlanData[i]['markerX']+'", "yPos":"'+floorPlanData[i]['markerY']+'", "width":"'+floorPlanSettings['markerSize']+'", "height":"'+floorPlanSettings['markerSize']+'", "markerNumber":"'+floorPlanData[i]['markerNumber']+'", "markerTooltip":"'+floorPlanData[i]['markerTooltip']+'" }\'><div class="pm_section_info" style="width:100%; height:auto !important; background-color:'+panelBGColor+';"><div class="pm_back_to_top">&uarr;</div><ul style="color:'+panelTextColor+'; margin-bottom:0px !important;"><li><div class="marker '+floorPlanSettings['markerType']+'" style="width:'+floorPlanSettings['markerSize']+'px; height:'+floorPlanSettings['markerSize']+'px; '+background+'"><p style="font-size:'+floorPlanSettings['markerFontSize']+'px; padding-top:'+floorPlanSettings['markerYPosition']+'px; color:'+floorPlanSettings['markerFontColor']+';">'+floorPlanData[i]['markerNumber']+'</p></div><div class="section" style="color:'+panelTitleColor+'; font-size:'+panelTitleFontSize+'px; padding-top:'+panelTitleYPosition+'px;">'+floorPlanData[i]['panelTitle']+'</div></li><li id="panel_info_'+floorPlanData[i]['markerNumber']+'"></li></ul></div><div class="pm_section" style="width:100%; height:auto !important;">'+ display +'</div> '+ (floorPlanData[i]['gmapAddress'] != '' ? ''+ parent._buildGoogleMap(i) +'' : '' ) +' </div>'); 
						
					}
					
					if(floorPlanSettings['panelLayout'] != 'pm-lo-4') {
						parent._addPanelInfo(floorPlanData[i]['panelDesc'], '#panel_info_'+floorPlanData[i]['markerNumber']);
					}
					
				}
				
				if(counter >= len){
					
					//we dont need to re-add the markers if we are sorting through the data array
					if(!sortByAlpha && !sortByMarker){
						parent._addMarkers();
					}
					
					parent._activateGoogleMaps();
					
				} else {
					counter++;	
				}
				
			}//end for loop
			
		},
		
		_addMarkers: function() {
								
			var parent = this;
			
			//clear out pm_markers_container first then add markers
			$('.pm_markers_container').empty();
			
			$(".pm_panel").each(function(index, obj) {
									
				var $obj = $(obj);
				
				var panelId = $obj.attr("id");
				var panelIndex = panelId.substr(panelId.indexOf("_") + 1);
				
				//display first object only if showAll is inactive
				if(index === 0 && !showAll) {
					if(floorPlanSettings['panelLayout'] != 'pm-lo-5'){
						$obj.addClass('active');
					}
				}
				
				if( floorPlanSettings['floorplanResponsiveness'] ){
										
					//add percentage based top and left values (convert the original pixel values by the stored floorplan width and height)
					var markerX = ($obj.data('marker').xPos / floorPlanSettings['floorplanWidth']) * 100 + '%';
					var markerY = ($obj.data('marker').yPos / floorPlanSettings['floorplanHeight']) * 100 + '%';
					
				} else {
					//add pixel based top and left values
					var markerX = $obj.data('marker').xPos + 'px';
					var markerY = $obj.data('marker').yPos + 'px';
				}					
				
				var markerWidth = $obj.data('marker').width;
				var markerHeight = $obj.data('marker').height;
				var markerNumber = $obj.data('marker').markerNumber;
				var markerTooltip = $obj.data('marker').markerTooltip;
				
				//apply correct marker type
				var background = '';
				
				if( floorPlanSettings['markerType'] == 'icon' ){
					background = 'background-image:url('+floorPlanSettings['markerIcon']+')';
				} else {
					
					if(index === 0 && !showAll && floorPlanSettings['panelLayout'] != 'pm-lo-5') {
						background = 'background-color:'+floorPlanSettings['markerActiveColor'];
					} else {
						background = 'background-color:'+floorPlanSettings['markerColor'];
					}
					
				}
				
				if(index === 0 && !showAll && floorPlanSettings['panelLayout'] != 'pm-lo-5') {
					//First Marker
					var marker = '<div class="pm_floorplan_marker '+floorPlanSettings['markerType']+' active '+ (floorPlanSettings['markerAnimation'] == 1 ? 'pm_animate' : '') +'" id="marker_'+markerNumber+'" style="top:'+markerY+'; left:'+markerX+'; width:'+markerWidth+'px; height:'+markerHeight+'px; '+background+'; " data-marker=\'{"markerTooltip":"'+markerTooltip+'"}\' ><p style="font-size:'+floorPlanSettings['markerFontSize']+'px; padding-top:'+floorPlanSettings['markerYPosition']+'px; color:'+floorPlanSettings['markerFontColor']+';">'+markerNumber+'</p></div>';
					
				} else {
					//Remaining markers
					var marker = '<div class="pm_floorplan_marker '+floorPlanSettings['markerType']+' '+ (floorPlanSettings['markerAnimation'] == 1 ? 'pm_animate' : '') +'" id="marker_'+markerNumber+'" style="'+background+'; top:'+markerY+'; left:'+markerX+'; width:'+markerWidth+'px; height:'+markerHeight+'px;" data-marker=\'{"markerTooltip":"'+markerTooltip+'"}\' ><p style="font-size:'+floorPlanSettings['markerFontSize']+'px; padding-top:'+floorPlanSettings['markerYPosition']+'px; color:'+floorPlanSettings['markerFontColor']+';">'+markerNumber+'</p></div>';
					
				}
				
				$('.pm_floorplan_container .pm_markers_container').append(marker);
				
			}).promise().done( function(){ parent._activateMarkers(); } ); //activate markers after all panel data has loaded and is displayed on screen
				
		},
		
		_activateMarkers: function() {
			
			var parent = this;
			
			parent._setContainerWidth();
			
			parent._resizeHandler();
								
			$('.pm_floorplan_container .pm_markers_container .pm_floorplan_marker').each(function(index, obj) {
									
				var $obj = $(obj);
				
				//add hover state
				if( floorPlanSettings['markerType'] != 'icon' ) {
					$obj.hover(
					   function(){
						   if( !$(this).hasClass('active') ){
							 $(this).css({'background-color' : floorPlanSettings['markerHoverColor']});
						   }
							 
					   },
					   function(){
							if( !$(this).hasClass('active') ){
							 $(this).css({'background-color' : floorPlanSettings['markerColor']});
						   } 
						}
					); 
				};
						
				if(floorPlanSettings['panelLayout'] != 'pm-lo-5'){
					
					//add click event to markers
					$obj.click(function() {
										
						var panelHeight = parseInt(floorPlanSettings['panelHeight']);
						console.log(panelHeight);
												
						var markerId = $obj.attr("id");	
						var markerIndex = markerId.substr(markerId.indexOf("_") + 1);
						var panelTarget = '#panel_'+markerIndex+'';
						
						//if showAll do a page slide else do a panel fade
						if(showAll){
							
							//slide code
							$('html, body').animate({
								scrollTop: $(panelTarget).offset().top - 30
							}, 1000);
							
							
						} else {
									
							if( floorPlanSettings['floorplanResponsiveness'] == 1 && $(window).width() < 480 ){
								$('html, body').animate({
									scrollTop: $('#pm_floorplan_container').offset().top + 40//add some extra spacing
								}, 1000);
							} else {
								$('html, body').animate({
									scrollTop: $('#pm_floorplan_container').offset().top + panelHeight + 40//add some extra spacing
								}, 1000);
							}
							
							
							if( floorPlanSettings['markerType'] != 'icon' ) {
								
								//remove active states
								$(".pm_floorplan_marker").each(function(index, obj) {
									$(this).removeClass('active');
									$(this).css({'background-color' : floorPlanSettings['markerColor']});
								});
								
								//add active state
								$(this).addClass('active');
								$(this).css({'background-color' : floorPlanSettings['markerActiveColor']});
								
							}
																					
							//fade code
							$(".pm_panel").each(function(index, obj) {
								var $obj = $(obj);
								$obj.fadeOut('slow', function() {
									$(this).removeClass('active');
								});
							});
							
							$(panelTarget).fadeIn('slow', function() {
								$('panelTarget').addClass('active');
							});
							
						}//end of if showAll
						
						
						parent._resizeGoogleMaps();
						
					});//end of click function
					
				}
				
				//add tooltip functionality
				
				if(floorPlanSettings['tooltipMobile'] == 1) {
					
					$obj.hover(function(e) {
					
						var $this = $(this);
						var toolTipData = $this.data("marker").markerTooltip;
						
						if(toolTipData != ''){
							parent._toolTip(toolTipData, $this);
						}
						
						
					}, function(e){
						
						var $this = $(this);
						var toolTipData = $this.data("marker").markerTooltip;
						
						if(toolTipData != ''){
							//remove tooltip
							$("#pm_marker_tooltip").remove();
						}
						
					});
					
				} else if( $(window).width() > 767 ) {
					
					$obj.hover(function(e) {
					
						var $this = $(this);
						var toolTipData = $this.data("marker").markerTooltip;
						
						if(toolTipData != ''){
							parent._toolTip(toolTipData, $this);
						}
						
						
					}, function(e){
						
						var $this = $(this);
						var toolTipData = $this.data("marker").markerTooltip;
						
						if(toolTipData != ''){
							//remove tooltip
							$("#pm_marker_tooltip").remove();
						}
						
					});
					
				} else {
					//nothing
				}
				
				
			});
			
		},//activateMarkers
		
		
		_toolTip: function(toolTipData, el){
			
			var parent = this;
				
			var $el = $(el);
			
			//store tooltip color values
			var red = parent.hexToRgb(floorPlanSettings['tipBGColor']).r;
			var green = parent.hexToRgb(floorPlanSettings['tipBGColor']).g;
			var blue = parent.hexToRgb(floorPlanSettings['tipBGColor']).b;
			//console.log('red = ' + red + ' green = ' + green + ' blue = ' + blue);
							
			// these 2 variable determine popup's distance from the cursor
			// you might want to adjust to get the right result
			//var xOffset = 120;
			//var yOffset = 0;
			
			//get the width of the container to keep the tooltip within the presentation
			var contentWidth = $('.pm_floorplan_container').width();
				
			/* END CONFIG */
			
			$("body").append("<div id='pm_marker_tooltip'>"+ toolTipData +"</div>");								 
			$("#pm_marker_tooltip").css({
				"top" : ($el.pageY - xOffset) + "px",
				"left" : ($el.pageX + yOffset) + "px",
				"borderRadius" : floorPlanSettings['tipBorderRadius'] + 'px',
				"backgroundColor" : 'rgba('+red+','+green+','+blue+',.9)',
				"border" : '1px solid ' + floorPlanSettings['tipBorderColor'] + '',
				"color" : floorPlanSettings['tipFontColor']
			}).fadeIn("fast");
				
			var yOffset = $("#pm_marker_tooltip").height() + 30;
			var xOffset = 0;
			
			$el.mousemove(function(e){
				
				var toolTipWidth = $('#pm_marker_tooltip').width();
				var toolTipHeight = $('#pm_marker_tooltip').height();
				//alert(toolTipWidth);
				
				var mouseX = e.pageX;
				var mouseY = e.pageY;
				
				var x = (mouseX - $('.pm_floorplan_container').offset().left) + toolTipWidth + 70;
				//console.log('x = ' + x);
				//var x2 = e.pageX - $(this).offset().left;//local to each thumb
				//var y = e.pageY - $(this).offset().top;
				
				if(x > contentWidth){
					//console.log('x > toolTipWidth');
					$('#pm_marker_tooltip').css("top",(mouseY - yOffset) + "px").css("left",(mouseX + -220) + "px"); //flip position
				} else {
					//console.log('x < toolTipWidth');
					$('#pm_marker_tooltip').css("top",(mouseY - yOffset) + "px").css("left",(mouseX + xOffset) + "px"); //start position
				}
								
			});		
				
		},//end of toolTip
		
		//useful function to capitalize words
		capitalize : function(str) {
			strVal = '';
			str = str.split(' ');
			for (var chr = 0; chr < str.length; chr++) {
				strVal += str[chr].substring(0, 1).toUpperCase() + str[chr].substring(1, str[chr].length) + ' '
			}
			return strVal
		},
		
		hexToRgb : function(hex) {
			var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
			return result ? {
				r: parseInt(result[1], 16),
				g: parseInt(result[2], 16),
				b: parseInt(result[3], 16)
			} : null;
		},
		
		_buildGoogleMap : function(indexNum){  
		
			var parent = this;
				
            var $map = '<div class="panel_google_map_title" style="background-color:'+ floorPlanSettings['googleMapBtnColor'] +'; color:'+ floorPlanSettings['googleMapBtnTextColor'] +';">Loading Map...</div><div class="panel_block maps"><div class="content"><div class="map_canvas" style="height:'+floorPlanSettings['googleMapHeight']+'px;"><div class="infotext"><div class="location">'+ floorPlanData[indexNum]['gmapTitle'] +'</div><div class="address">'+ floorPlanData[indexNum]['gmapAddress'] +'</div><div class="city">'+ floorPlanData[indexNum]['gmapCity'] +'</div><div class="state">'+ floorPlanData[indexNum]['gmapState'] +'</div><div class="zip">'+ floorPlanData[indexNum]['gmapZip'] +'</div><div class="country">'+ floorPlanData[indexNum]['gmapCountry'] +'</div><div class="phone">'+ floorPlanData[indexNum]['gmapPhone'] +'</div><div class="zoom">'+ floorPlanSettings['googleMapZoomLevel'] +'</div></div></div></div></div>';
			
			return $map;
            
        },
		
		_activateGoogleMaps : function() {
			
			var parent = this;
			
			//assign ID's to btns
			var $mapPanels = $('.panel_block.maps');
			$mapPanels.each(function(index, element) {
				
				var $btn = $(element).parent().find('.panel_google_map_title');
				$btn.attr('id', 'panel_google_map_title_'+ index +'');
				
			});
			
			//Generate Google Maps for each map panel			
			var $maps = $('.panel_block.maps .content .map_canvas');
			
			$maps.each(function(index, element) {
				
				var delay = index * 1500;
				
				setTimeout(function() {
					parent._createGoogleMap(index, element)
				}, delay);
				
				
			});
			
			//Add interactivity
			$(".panel_google_map_title").on('click', function(e) {
				
				if( $(this).text() !== 'Loading Map...' ){
										
					//Map has loaded, add interaction
					if( $(this).hasClass('active') ){
						$(this).removeClass('active');
						$(this).html('View Map');
					} else {
						$(this).addClass('active');
						$(this).html('Hide Map');
					}
					
					//grab the ID of the button (panel_google_map_title)
					var panelID = $(this).attr('id');
					var index = panelID.substr(panelID.lastIndexOf("_") + 1);
					//console.log(index);
					
					var mapPanel = $(this).parent().find('.panel_block');
					
						if( mapPanel.hasClass('active') ){
						
						mapPanel.removeClass('active');
						
						//hide the map
						mapPanel.stop().animate({
							height : 0,
						}, 300);
						
					} else {
						
						mapPanel.addClass('active');
						
						//expand the map
						mapPanel.stop().animate({
							height : floorPlanSettings['googleMapHeight'],
						}, 300);
						
						//center the map upon activation - this is now being done on marker click		
						//parent._resizeGoogleMaps();
						
					};
						
				} else {
					//Map is still loading, return
					return;	
				}				
								
			});
						
		},
		
		_createGoogleMap : function(index, element) {
			
			var $infotext = $(element).children('.infotext');
		
			var myOptions = {
				'zoom': parseInt($infotext.children('.zoom').text()),
				'mapTypeId': google.maps.MapTypeId.ROADMAP
			};
			var map;
			var geocoder;
			var marker;
			var infowindow;
			var address = $infotext.children('.address').text() + ', '
					+ $infotext.children('.city').text() + ', '
					+ $infotext.children('.state').text() + ' '
					+ $infotext.children('.zip').text() + ', '
					+ $infotext.children('.country').text()
			;
			var content = '<strong>' + $infotext.children('.location').text() + '</strong><br />'
					+ $infotext.children('.address').text() + '<br />'
					+ $infotext.children('.city').text() + ', '
					+ $infotext.children('.state').text() + ' '
					+ $infotext.children('.zip').text()
			;
			if (0 < $infotext.children('.phone').text().length) {
				content += '<br />' + $infotext.children('.phone').text();
			};
	
			geocoder = new google.maps.Geocoder();
			
			geocoder.geocode({'address': address}, function(results, status) {
				
				if (status == google.maps.GeocoderStatus.OK) {
					
					myOptions.center = results[0].geometry.location;
					map = new google.maps.Map(element, myOptions);
					//Store a reference to each map
					gMaps.push(map);
					
					marker = new google.maps.Marker({
						map: map,
						position: results[0].geometry.location,
						title: $infotext.children('.location').text()
					});
					
					infowindow = new google.maps.InfoWindow({'content': content});
					
					google.maps.event.addListener(map, 'tilesloaded', function(event) {
						infowindow.open(map, marker);
					});
					
					google.maps.event.addListener(marker, 'click', function() {
						infowindow.open(map, marker);
					});
					
					//Update button text to trigger interactivity
					//var panelID = $(element).attr('id');
					//var index = panelID.substr(panelID.lastIndexOf("_") + 1);
					var targetBtn = '#panel_google_map_title_' + index;
					$(targetBtn).html('View Map');
											
				} else if(status == "OVER_QUERY_LIMIT"){
					//alert('You have exceeded the Google Maps request limit');
				} else {
					alert('The address could not be found for the following reason: ' + status);
				};
				
			});
			
		},
		
		_resizeGoogleMaps : function() {
			
			// apply resize event to the correct 'map' object
            //google.maps.event.trigger(gMaps[index], 'resize');
			
			if(gMaps.length > 0){
				$.each(gMaps, function(index, element) {
					google.maps.event.trigger(element, 'resize');
				});
			};			
			 
		},
		        

    };//end of plugin.prototype

	var logError = function( message ) {
		if ( window.console ) {
			window.console.error( message );
		}
	};

    //prevent against multiple instantiations
	$.fn.PMFloorPlan = function( options ) {
		
		if ( typeof options === 'string' ) {
			
			var args = Array.prototype.slice.call( arguments, 1 );
			this.each(function() {
				var instance = $.data( this, 'PMFloorPlan' );
				if ( !instance ) {
					logError( "cannot call methods on PMFloorPlan prior to initialization; " +
					"attempted to call method '" + options + "'" );
					return;
				}
				if ( !$.isFunction( instance[options] ) || options.charAt(0) === "_" ) {
					logError( "no such method '" + options + "' for PMFloorPlan instance" );
					return;
				}
				instance[ options ].apply( instance, args );
			});
			
		} else {
			
			this.each(function() {	
				var instance = $.data( this, 'PMFloorPlan' );
				if ( instance ) {
					instance._init();
				}
				else {
					instance = $.data( this, 'PMFloorPlan', new $.PMFloorPlan( options, this ) );
				}
			});
		}
		
		return this;
		
	};

})( jQuery, window, document );