(function($){
	
	$(window).load(function(e) {
		
		//Global variables (use $.varilableName to target from anywhere in app)
		var FPSettings = panel_settings; //get floorplan settings from WordPress
		//console.log('FPSettings = ' + FPSettings);
		var panelData = panel_data != '' ? jQuery.parseJSON(panel_data) : []; //Retrieve existing saved Panels from WP - save each panel data into associative array (store marker data attributes also)
		//console.log('panelData = ' + panelData);
		
		var activeMarkers = []; //track all active markers
		var panelCounter = 1;//simple counter for each new panel
		var markerSize = 35;//use general settings slider to change this
		var markerFontSize = 12;//use general settings font slider to change this
		var markerType = 'square';//use general settings select list to change this
		var markerIcon = '';
		var markerYPosition = 0;
		var panelHeight = 230;
		
		var markerColor = null;
		var markerHoverColor = null;
		var markerActiveColor = null;
			
		//container for uploader class
		var uploader;
	
		$(document).ready(function(e) {
					
			//console.log('Premium Presentaionts ready');
			
			//Instatiate uploader class
			uploader = new PMImageUploader();
			uploader.init();
					
			//Initialize Accordion
			$("#accordion").accordion({ 
				header: "> div > h3", //required for sortable - wrap <div class="group"></div> around each accordion member
				disabled: false,
				collapsible: true,
				active: false,
				//icons: { "header": "panel-icon-plus", "activeHeader": "panel-icon-minus" }
			}).sortable({
				axis: "y",
				handle: "h3",
				stop: function( event, ui ) {
				// IE doesn't register the blur when sorting
				// so trigger focusout handlers to remove .ui-state-focus
				ui.item.children( "h3" ).triggerHandler( "focusout" );
				}
			});;
			
			/*
			
			sortable chain
			
			.sortable({
				axis: "y",
				handle: "h3",
				stop: function( event, ui ) {
				// IE doesn't register the blur when sorting
				// so trigger focusout handlers to remove .ui-state-focus
				ui.item.children( "h3" ).triggerHandler( "focusout" );
				}
			});
			
			<div class="group"></div>
			
			*/
			
			$('#add_new_panel_btn').click(function(e) {
							
				if(FPSettings['floorplanImage'] != 'No Image selected'){
					addNewPanel();
				} else {
					alert('No Presentation image was detected. Upload a presentation image under General Settings.');
				}
				
				return false;
			});
			
			$('#delete_all_btn').click(function(e) {
				deleteAllPanels();
				return false;
			});
			
			//Data testing purposes
			/*$('#save_btn').click(function(e) {
				
				var string = objectToString(getPanelData());
				//alert(string);
				
				// Pack all data here
				$('#pm-panels-data').val(string);
				console.log( $('#pm-panels-data').val() );
				
				return false;
			});*/
								
			// Prepare data for submitting
			$('#post').submit(function (e) {
										
				var string = objectToString(getPanelData());
				//alert(string);
				
				// Pack all data here
				$('#pm-panels-data').val(string);
				//console.log( $('#pm-panels-data').val() );
				
				// Prevent non-necessary input form being submitted
				//$('.mdt-text').attr('disabled', 'disabled');
				
				//return false;
				
			});
				
			//initialize script
			init();
			
		});
		
		function init(){
		
			//apply settings
			if(FPSettings){
				
				markerSize = FPSettings['markerSize'];
				markerFontSize = FPSettings['markerFontSize'];
				markerType = FPSettings['markerType'];
				markerColor = FPSettings['markerColor'];
				markerHoverColor = FPSettings['markerHoverColor'];
				markerActiveColor = FPSettings['markerActiveColor'];
				markerFontColor = FPSettings['markerFontColor'];
				markerIcon = FPSettings['markerIcon'];
				markerYPosition = FPSettings['markerYPosition'];
				panelHeight = FPSettings['panelHeight'];
				
				/*$.each(FPSettings,function(idx, obj){ 
					console.log(idx + ": " + obj);
				});*/
				
			}
		
			//check if there are existing panels already saved in WP and if so add them
			if(panelData != null){
				
				addNewPanel(panelData);
				
				var string = objectToString(getPanelData());
				//alert(string);
				
				// Store saved data here
				$('#pm-panels-data').val(string);
				//console.log( $('#pm-panels-data').val() );
				
				//for debug purposes
				/*$.each(panelData, function(ind, obj) {
					$.each(obj, function(key, value) {
						console.log(key + ':' + value);
					});
				});*/
			}
			
		};
		
		
		function deleteAllPanels() {
			
			var $accordionDiv = $('#accordion');
			if( $.trim( $accordionDiv.html() ).length ){
				if (!confirm("Are you sure you want to delete all panels?")) {
					return;
				}
				
				$accordionDiv.empty();
				$('.markers_container').empty();
				activeMarkers = [];
				panelCounter = 1;
				//console.log(activeMarkers);
				
			} else {
				alert('There are currently no panels to delete.');
				return;	
			}
			
		};
		
		function addNewPanel(data) {
			
			if( FPSettings['floorplanResponsiveness'] == 1 ){
				var sectionWidth = 1170;
				panelHeight = 500;
			} else {
				//calculate width for panel columns
				var FPWidth = FPSettings['floorplanWidth'];
				var widthDivided = FPWidth / 2;
				var sectionWidth = widthDivided + 100;
			}
					
			//if there are existing panels in the database add them
			if(data){
							
				var len = data.length;
				for(var i = 0; i < len; i++){
					
					//alert(data[i]['gmapTitle']);				
					/*var selectList = '<select name="panel-space" id="panel-space" style="margin-right:10px;"><option '+ (data[i]["panelSpace"] == 'NA' ? 'selected' : '') +' >NA</option><option '+ (data[i]["panelSpace"] == 'Yes' ? 'selected' : '') +' >Yes</option><option '+ (data[i]["panelSpace"] == 'No' ? 'selected' : '') +' >No</option></select>';*/
	
					//add panel
					var panelContent = '<div class="group"><h3 id="panel_selector_'+ panelCounter +'"><a href="#">'+ (data[i]['panelTitle'] != '' ? data[i]['panelTitle'] : 'Panel' ) +' : '+ (data[i]['markerNumber'] != '' ? data[i]['markerNumber'] : panelCounter ) +'</a></h3> <div class="panel_container" id="panel_container_'+ panelCounter +'" data-markerpositions=\'{"xPos":"'+data[i]['markerX']+'", "yPos":"'+data[i]['markerY']+'"}\' > '+' <div class="panel_title"><label for="panel-title" class="title">Panel Title</label><input type="text" value="'+data[i]['panelTitle']+'" name="" id="panel-title"/></div> '+' <div class="panel_desc"><label for="panel-desc" class="title">Panel Information</label><textarea name="" id="panel-desc" class="panel_desc_text" cols="" rows="" style="float:left;">'+data[i]['panelDesc']+'</textarea></div> '+' <div class="panel_image"><label for="panel-image" class="title">Panel Image <p style="margin-top:4px;">(Max size: '+sectionWidth+'px by '+panelHeight+'px)</p></label><input type="text" value="'+data[i]['panelImage']+'" name="" id="panel_image_'+ panelCounter +'" style="width:500px; margin-right:10px;" /><input id="upload_image_button_'+ panelCounter +'" class="upload_image_btn button-secondary" type="button" value="Media Library Image" /></div> '+' <div class="panel_video"><label for="panel-video" class="title">Youtube Video</label><input type="text" value="'+data[i]['panelVideo']+'" name="" id="panel-video"/>(Enter a Youtube video ID ex. szWhlFOakf8)  <b>Note:</b> This will override the Panel image.</div> '+' <div class="marker_number"><label for="marker-number" class="title">Marker Identifier</label><input type="text" value="'+data[i]['markerNumber']+'" name="" id="marker-number"/></div> '+' <div class="marker_tooltip"><label for="marker-tooltip" class="title">Marker Tooltip</label> <textarea name="" id="marker-tooltip" class="marker_tooltip_text" cols="" rows="" style="float:left;">'+data[i]['markerTooltip']+'</textarea> </div> '+' <div class="gmap_title"><label for="gmap-title" class="title">Google Map Title</label><input type="text" value="'+ (data[i]['gmapTitle'] !== 'undefined' ? data[i]['gmapTitle'] : '' ) +'" name="" id="gmap-title"/></div> '+' <div class="gmap_address"><label for="gmap-address" class="title">Google Map Address</label><input type="text" value="'+ (data[i]['gmapAddress'] !== 'undefined' ? data[i]['gmapAddress'] : '' ) +'" name="" id="gmap-address"/> <b>Note:</b> Address is required to activate Google Map.</div> '+' <div class="gmap_city"><label for="gmap-city" class="title">Google Map City</label><input type="text" value="'+ (data[i]['gmapCity'] !== 'undefined' ? data[i]['gmapCity'] : '' ) +'" name="" id="gmap-city"/></div> '+' <div class="gmap_state"><label for="gmap-state" class="title">Google Map State/Pro</label><input type="text" value="'+ (data[i]['gmapState'] !== 'undefined' ? data[i]['gmapState'] : '' ) +'" name="" id="gmap-state"/></div> '+' <div class="gmap_zip"><label for="gmap-zip" class="title">Google Map Zip/Postal</label><input type="text" value="'+ (data[i]['gmapZip'] !== 'undefined' ? data[i]['gmapZip'] : '' ) +'" name="" id="gmap-zip"/></div> '+' <div class="gmap_country"><label for="gmap-country" class="title">Google Map Country</label><input type="text" value="'+ (data[i]['gmapCountry'] !== 'undefined' ? data[i]['gmapCountry'] : '' ) +'" name="" id="gmap-country"/></div> '+' <div class="gmap_phone"><label for="gmap-phone" class="title">Google Map Phone</label><input type="text" value="'+ (data[i]['gmapPhone'] !== 'undefined' ? data[i]['gmapPhone'] : '' ) +'" name="" id="gmap-phone"/></div> '+' <div class="add_marker_container"><input type="button" class="add_marker_btn button button-primary button-large" value="Update Marker" /></div> '+' <div class="delete_panel_container"><input type="button" class="delete_panel_btn button button-primary button-large delete" id="delete_panel_btn_'+ panelCounter +'" value="Delete Entry" /></div></div></div>';
									
									
					//add to accordion
					addAccordionMember(panelContent);
					
					//add corresponding marker
					var markerId = 'panel_marker_' + (panelCounter - 1);
					addExistingMarker(markerId, data[i]['markerNumber'], data[i]['markerX'], data[i]['markerY']);
					
					
				};
				
			} else {
							
				//add modified pm-image-uploader.js class for this - needs to loop through each upload_image_button
				var panelContent = '<div class="group"><h3 id="panel_selector_'+ panelCounter +'"><a href="#">Panel '+ panelCounter +'</a></h3> <div class="panel_container" id="panel_container_'+ panelCounter +'" data-markerpositions=\'{"xPos":"0", "yPos":"0"}\'> '+' <div class="panel_title"><label for="panel-title" class="title">Panel Title</label><input type="text" value="" name="" id="panel-title"/></div> '+' <div class="panel_desc"><label for="panel-desc" class="title">Panel Information</label><textarea name="" id="panel-desc" class="panel_desc_text" cols="" rows="" style="float:left;"></textarea></div> '+' <div class="panel_image"><label for="panel-image" class="title">Panel Image <p style="margin-top:4px;">(Max size: '+sectionWidth+'px by '+panelHeight+'px)</p></label><input type="text" value="" name="" id="panel_image_'+ panelCounter +'" style="width:500px; margin-right:10px;" /><input id="upload_image_button_'+ panelCounter +'" class="upload_image_btn button-secondary" type="button" value="Media Library Image" /></div> '+' <div class="panel_video"><label for="panel-video" class="title">Youtube Video</label><input type="text" value="" name="" id="panel-video"/>(Enter a Youtube video ID ex. szWhlFOakf8)  <b>Note:</b> This will override the Panel image.</div> '+' <div class="marker_number"><label for="marker-number" class="title">Marker Identifier</label><input type="text" value="" name="" id="marker-number"/></div> '+' <div class="marker_tooltip"><label for="marker-tooltip" class="title">Marker Tooltip</label> <textarea name="" id="marker-tooltip" class="marker_tooltip_text" cols="" rows="" style="float:left;"></textarea> </div> '+' <div class="gmap_title"><label for="gmap-title" class="title">Google Map Title</label><input type="text" value="" name="" id="gmap-title"/></div> '+' <div class="gmap_address"><label for="gmap-address" class="title">Google Map Address</label><input type="text" value="" name="" id="gmap-address"/><b>Note:</b> Address is required to activate Google Map.</div> '+' <div class="gmap_city"><label for="gmap-city" class="title">Google Map City</label><input type="text" value="" name="" id="gmap-city"/></div> '+' <div class="gmap_state"><label for="gmap-state" class="title">Google Map State/Pro</label><input type="text" value="" name="" id="gmap-state"/></div> '+' <div class="gmap_zip"><label for="gmap-zip" class="title">Google Map Zip/Postal</label><input type="text" value="" name="" id="gmap-zip"/></div> '+' <div class="gmap_country"><label for="gmap-country" class="title">Google Map Country</label><input type="text" value="" name="" id="gmap-country"/></div> '+' <div class="gmap_phone"><label for="gmap-phone" class="title">Google Map Phone</label><input type="text" value="" name="" id="gmap-phone"/></div> '+' <div class="add_marker_container"><input type="button" class="add_marker_btn button button-primary button-large" value="Add Marker to Presentation" /></div> '+' <div class="delete_panel_container"><input type="button" class="delete_panel_btn button button-primary button-large delete" id="delete_panel_btn_'+ panelCounter +'" value="Delete Entry" /></div></div></div>';
				
				addAccordionMember(panelContent);
				
			}
										
		};//end of addNewPanel
		
		function addAccordionMember(panel){
		
			$('#accordion').append(panel);
			
			$("#accordion").accordion("refresh");
			
			//unbind previous delete click handlers first
			$('.panel_container').each(function(i, el) {
				var $deleteBtn = $(el).find('.delete_panel_btn');
				$deleteBtn.unbind('click');
			});
			
			//re-bind delete click handlers
			$('.panel_container').each(function(i, el) {
				
				//track id for marker deletion
				var panelId = $(el).attr('id');
				var panelIndex = panelId.substr(panelId.lastIndexOf("_") + 1);
				
				var $deleteBtn = $(el).find('.delete_panel_btn');
						
				$deleteBtn.bind('click', function() {
					
					if (!confirm("Are you sure you want to delete this panel? After accepting this panel will be removed completely.")) {
						return
					}
					
					var id = $(this).attr('id');
					//console.log('delete btn id = ' + id);
					
					var parent = $(this).closest('.panel_container');
					var head = parent.prev('h3');
					parent.add(head).fadeOut('slow',function(){$(this).remove();});
					//panelCounter--;
					
					removeMarker(panelIndex);
					
					return false;
					
				});
			});
			
			//unbind previous marker click handlers first
			$('.panel_container').each(function(i, el) {
				var $markerBtn = $(el).find('.add_marker_btn');
				$markerBtn.unbind('click');
			});
					
			//re-bind marker click handlers
			$('.panel_container').each(function(i, el) {
				
				var panelId = $(el).attr('id');
				var panelIndex = panelId.substr(panelId.lastIndexOf("_") + 1);
							
				var $markerBtn = $(el).find('.add_marker_btn');
				
				$markerBtn.bind('click', function() {
					
					var markerNumber = $(el).find('#marker-number').val();
					var markerId = 'panel_marker_' + panelIndex;
					
					var panelTitle = $(el).find('#panel-title').val();
					
					if(markerNumber.length < 1){
						alert('Please enter a marker identifier first.');
					} else {
						
						//check if marker already exists in activeMarkers array, if so update it otherwise add new marker
						if ($.inArray(markerId, activeMarkers) > -1){
							
							//update marker number
							$('#'+markerId).find('p:first').empty().append(markerNumber);
							
							//update marker number data attribute
							$('#'+markerId).data('markernumber', {number:markerNumber});//does not update in firebug :(
							//console.log('marker number = ' + $('#'+markerId).data('markernumber').number);
							
						} else {
							
							//add a new marker
							addNewMarker(markerId, markerNumber);
							$(this).attr('value', 'Update Marker');
							
						}
						
						//Get parent H3 and rename it to update new marker identifier
						var parent = $(this).closest('.panel_container');
						var head = parent.prev('h3').find('a');
						head.empty().append( (panelTitle != '' ? panelTitle + ' : ' :  'Panel : ') + markerNumber);	
						
						//console.log('markerNumber = ' + markerNumber);	
					}
					
					return false;
					
				});
				
			});
			
			//increment panel counter
			panelCounter++;
			
			//refresh click handlers
			uploader.refreshAll();
			
		};
		
		function addExistingMarker(markerId, markerNumber, xPos, yPos){
			
			var background = '';
			
			if( markerType == 'icon' ){
				background = 'background-image:url('+markerIcon+')';
			} else {
				background = 'background-color:'+markerColor;
			}
				
			//add assigned width and height values
			var existingMarker = '<div class="marker '+markerType+'" style="width:'+markerSize+'px; height:'+markerSize+'px; '+background+'; left:'+xPos+'px; top:'+yPos+'px; z-index:'+panelCounter+'" id="'+markerId+'" data-markerpositions=\'{"xPos":"'+xPos+'", "yPos":"'+yPos+'"}\' data-markersize=\'{"width":"'+markerSize+'", "height":"'+markerSize+'"}\'  data-markernumber=\'{"number":"'+markerNumber+'"}\'><p style="font-size:'+markerFontSize+'px; padding-top:'+markerYPosition+'px; color:'+markerFontColor+';">'+markerNumber+'</p></div>';
						
			//track each marker for deletion purposes
			activeMarkers.push(markerId);
			//console.log(activeMarkers);
			
			//add marker to visual editor
			addMarkerMember(existingMarker);
			
			
		};//end of addNewMarker
		
		
		function addNewMarker(markerId, markerNumber){
			
			var background = '';
			
			if( markerType == 'icon' ){
				background = 'background-image:url('+markerIcon+')';
			} else {
				background = 'background-color:'+markerColor;
			}
			
			//setup the marker
			var newMarker = '<div class="marker '+markerType+'" style="width:'+markerSize+'px; height:'+markerSize+'px; '+background+'; left:0px; top:0px; z-index:'+panelCounter+'" id="'+markerId+'" data-markerpositions=\'{"xPos":"0px", "yPos":"0px"}\' data-markersize=\'{"width":"'+markerSize+'", "height":"'+markerSize+'"}\'  data-markernumber=\'{"number":"'+markerNumber+'"}\'><p style="font-size:'+markerFontSize+'px; padding-top:'+markerYPosition+'px; color:'+markerFontColor+';">'+markerNumber+'</p></div>';
			
			//track each marker for deletion purposes
			activeMarkers.push(markerId);
			//console.log(activeMarkers);
			
			//add marker to visual editor
			addMarkerMember(newMarker);
			
			
		};//end of addNewMarker
		
		function addMarkerMember(marker){
			
			//append the new marker
			$('.markers_container').append(marker);
			
			//add hover styles to marker(s)			
			$('.markers_container .marker').hover(
			   function(){ 
				 if( markerType != 'icon' ){
					$(this).css({'background-color' : markerHoverColor}) 
				 }
				  
			   },
			   function(){
				 if( markerType != 'icon' ){
					$(this).css({'background-color' : markerColor})  
				 }
			   }
			);
			
			//Drag options
			var dragOpts = {
				containment: "parent",
				appendTo: '.markers_container',
				stop: function(e, ui) {
					var $el = $(this);
					var id = $(this).attr("id");
					var left = $el.css("left");
					var top = $el.css("top");	
					var rel = $("<p />", {
						  text: "The "+ id +" handle was moved " + ui.position.top + "px down, and " + ui.position.left + "px to the left of its original position."
						}),
						offset = $("<p />", {
						  text: "The "+ id +" handle was moved " + ui.offset.top + "px from the top, and " + ui.offset.left + "px to the left relative to the viewport."
						}),
						 position = $("<p />", {
						  text: ""+ id +" is currently positioned at x: " + Math.round(ui.position.left) + "  and y: " + Math.round(ui.position.top) + "."
						});
					
					var markerId = $el.attr('id');
					var markerIndex = markerId.substr(markerId.lastIndexOf("_") + 1);
					
					//apply marker positions to correct panel
					$(".panel_container").each(function (i, el) {
						var $panel = $(el);	
						var panelId = $panel.attr('id');
						var panelIndex = panelId.substr(panelId.lastIndexOf("_") + 1);
						
						//if indexes match, apply new data
						if(panelIndex == markerIndex){
							$panel.data('markerpositions', {xPos:Math.round(ui.position.left), yPos:Math.round(ui.position.top)});
							//console.log('marker X pos = ' + $panel.data('markerpositions').xPos + ' : marker Y pos = ' + $panel.data('markerpositions').yPos);
						}
							
					});
					
					//apply marker positions to marker
					$el.data('markerpositions', {xPos:Math.round(ui.position.left), yPos:Math.round(ui.position.top)}); //new values are being stored but doesnt update in firebug :(
					//console.log('marker X pos = ' + $el.data('marker').xPos + ' : marker Y pos = ' + $el.data('marker').yPos);
	
					//$("#results").empty().append(position);
				},
			};
					
			//Add drag
			$(".marker").draggable(dragOpts);
				
		};
		
		function removeMarker(panelIndex){
			
			var markerId = 'panel_marker_' + panelIndex;
			
			//check if marker is stored and remove it
			if ($.inArray(markerId, activeMarkers) > -1){
				var targetMarker = $('.markers_container').find('#'+markerId);
				targetMarker.remove();
				activeMarkers.splice($.inArray(markerId, activeMarkers), 1);
				//console.log(activeMarkers);
				
			}
			
		};
		
	});//end of window load
	
	
	//Loop through each panel_container
	getPanelData = function () {
				
		//collect Panel data
		var panelD = [];		
		$(".panel_container").each(function (i, el) {
			panelD.push(getPanelValues(el));			
		});
		
		//collect marker data
		var markerD = [];
		$(".markers_container .marker").each(function (i, el) {
			markerD.push(getMarkerValues(el));
		});
		
		//merge arrays
		var finalArray = [];
		for (var i = 0, l = panelD.length; i < l; i++) {
			finalArray.push($.extend(panelD[i], markerD[i]));
		}
		
		return finalArray
	};

	getPanelValues = function (el) {
		
		var $el = $(el);
		
		//verify all panels have a marker identifier
		var markerNumber = $el.find('#marker-number').val();
				
		var panelId = $el.closest('.panel_container').attr('id');
		var panelIndex = panelId.substr(panelId.lastIndexOf("_") + 1);
		
		var data = {
			panelTitle : $el.find('#panel-title').val(),
			panelDesc : $el.find('#panel-desc').val(),
			panelImage : $el.find('#panel_image_'+panelIndex).val(),
			panelVideo : $el.find('#panel-video').val(),
			panelSize : $el.find('#panel-size').val(),
			panelSpace : $el.find('#panel-space').val(),
			markerNumber : $el.find('#marker-number').val() != '' ? $el.find('#marker-number').val() : panelIndex,
			markerTooltip : $el.find('#marker-tooltip').val(),
			gmapTitle : $el.find('#gmap-title').val(),
			gmapAddress : $el.find('#gmap-address').val(),
			gmapCity : $el.find('#gmap-city').val(),
			gmapState : $el.find('#gmap-state').val(),
			gmapZip : $el.find('#gmap-zip').val(),
			gmapCountry : $el.find('#gmap-country').val(),
			gmapPhone : $el.find('#gmap-phone').val(),
			markerX : $el.data("markerpositions").xPos,
			markerY : $el.data("markerpositions").yPos,
		};
		
		return data;
			
	};//getPanelValues
	
	getMarkerValues = function (el) {
		
		var $el = $(el);
		
		var data = {
			//markerX : $el.data("markerpositions").xPos,
			//markerY : $el.data("markerpositions").yPos,
			markerWidth : $el.data("markersize").width,
			markerHeight : $el.data("markersize").height,
		};		
		
		return data;
			
	};//getMarkerValues
	
	//merge two arrays together
	function merge(one, two){
	  if (!one.data) return {data:two.data};
	  if (!two.data) return {data:one.data};
	  var final = {data:one.data};
	  // merge
	  for(var i = 0 ; i < two.data.length;i++){
		  var item = two.data[i];
		  insert(item, final);
	  }
	  return final;
	};
	
	//Library methods
	objectToString = function (e) {
		return JSON.stringify(e)
	};
	stringToObject = function (e) {
		return jQuery.parseJSON(e)
	};
	
	
})(jQuery);