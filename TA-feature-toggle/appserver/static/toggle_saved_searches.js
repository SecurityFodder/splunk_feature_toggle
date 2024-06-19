// feature_toggle.js

require([
  'splunkjs/mvc',
  'splunkjs/mvc/simplexml/ready!',
  'jquery',
  'splunkjs/mvc/tokenutils'
], function(mvc, ignored, $, TokenUtils) {
  var env = mvc.Components.getInstance('env');
  var search_name = mvc.Components.getInstance('search_name');
  var enabled = mvc.Components.getInstance('enabled');
  var updateButton = $('#update-toggle-button');

  updateButton.on('click', function() {
      // Add the clicked class for animation
      updateButton.addClass('clicked');

      // Remove the clicked class after the animation is done
      setTimeout(function() {
          updateButton.removeClass('clicked');
      }, 300);

      var envValue = env.val();
      var searchNameValue = search_name.val();
      var enabledValue = enabled.val() === 'true';

      if (envValue && searchNameValue) {
          $.ajax({
              url: Splunk.util.make_url('/servicesNS/nobody/your_app/storage/collections/data/feature_toggles'),
              type: 'GET',
              success: function(data) {
                  var toggles = JSON.parse(data);
                  var toggle = toggles.find(function(t) {
                      return t.environment === envValue && t.search_name === searchNameValue;
                  });

                  if (toggle) {
                      $.ajax({
                          url: Splunk.util.make_url('/servicesNS/nobody/your_app/storage/collections/data/feature_toggles/' + toggle._key),
                          type: 'POST',
                          contentType: 'application/json',
                          data: JSON.stringify({ enabled: enabledValue }),
                          success: function() {
                              alert('Feature toggle updated successfully.');
                              mvc.Components.get('table').render();
                          },
                          error: function() {
                              alert('Error updating feature toggle.');
                          }
                      });
                  } else {
                      $.ajax({
                          url: Splunk.util.make_url('/servicesNS/nobody/your_app/storage/collections/data/feature_toggles'),
                          type: 'POST',
                          contentType: 'application/json',
                          data: JSON.stringify({ environment: envValue, search_name: searchNameValue, enabled: enabledValue }),
                          success: function() {
                              alert('Feature toggle added successfully.');
                              mvc.Components.get('table').render();
                          },
                          error: function() {
                              alert('Error adding feature toggle.');
                          }
                      });
                  }
              },
              error: function() {
                  alert('Error fetching feature toggles.');
              }
          });
      } else {
          alert('Please select both environment and search name.');
      }
  });
});
