(function ($) {
	
	var uploader = function (data) {
		
		//Global class vars
		this.panelFile = null;
		
		this.init = function() {
			
			//console.log('uploader class loaded');
						
		};//end of init
		
		this.refreshAll = function(){
			this.removeClicks();
		};
		
		this.removeClicks = function() {
			
			$('.upload_image_btn').each(function(i, el) {
				
				var $this = $(el);
				$this.unbind('click');
				
			});
			
			this.bindClicks();
			
		};//removeClicks
		
		this.bindClicks = function() {
			
			$('.upload_image_btn').each(function(i, el) {
            
				var $this = $(el);
				var imageBtnId = $this.attr('id');
				var imageBtnIndex = imageBtnId.substr(imageBtnId.lastIndexOf("_") + 1);
								
				$this.bind('click', function(i, el) {
					
					var parent = $(this).closest('.panel_container');
					panelFile = parent.find('#panel_image_'+imageBtnIndex);
							
					//If the uploader object has already been created, reopen the dialog
					if (image_custom_uploader) {
						image_custom_uploader.open();
						return;
					}
										
					return false;
					
				});
				
			});
			
		};//bindClicks
		
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
			 panelFile.val(url);
			
		 });
		
	};//end of class
	
	window.PMImageUploader = uploader
	
})(jQuery);