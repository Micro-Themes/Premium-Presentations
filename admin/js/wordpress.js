(function($){

	$(document).ready(function(e) {
		
		//alert('pm-image-uploader loaded');
		
		var formfield = null;
		
		var clicked = '';
		
		var image_custom_uploader;
		
		$('#upload_image_button').click(function(e) {
					
			 clicked = 'floorplan';
						
			 e.preventDefault();

			 //If the uploader object has already been created, reopen the dialog
			 if (image_custom_uploader) {
				 image_custom_uploader.open();
				 return;
			 }
			
		});
		
		$('#icon_image_button').click(function(e) {
			
			clicked = 'marker';
						
			//If the uploader object has already been created, reopen the dialog
			 if (image_custom_uploader) {
				 image_custom_uploader.open();//opens the media library frame
				 return;
			 }
			
		});
		
		
		 //Extend the wp.media object
		 image_custom_uploader = wp.media.frames.file_frame = wp.media({
		 	title: 'Choose Image',
		 	button: {
		 	text: 'Choose Image'
		 	},
			 multiple: false
		 });
		 
		 //When a file is selected, grab the URL and set it as the text field's value
		 image_custom_uploader.on('select', function() {
			 
		 	attachment = image_custom_uploader.state().get('selection').first().toJSON();
		 	var url = attachment['url'];
		 	
			
		 	if( clicked == 'floorplan' ){
				$('#floorplan-image').val(url);
			} else if( clicked == 'marker' ){
				$('#marker-icon').val(url);
			} else {
				//do nothing	
			}
		 });
		
		
	});

})(jQuery);