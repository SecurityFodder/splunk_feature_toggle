// feature_toggle.js

require([
  'splunkjs/mvc',
  'splunkjs/mvc/simplexml/ready!',
  'jquery',
  'splunkjs/mvc/searchmanager',
  'splunkjs/mvc/tableview',
  'splunkjs/mvc/tokenutils'
], function(mvc, ready, $, SearchManager, TableView, TokenUtils) {
  ready(function() {
      // Extend TableView to add toggle buttons
      var CustomTableView = TableView.extend({
          initialize: function() {
              TableView.prototype.initialize.apply(this, arguments);
          },
          render: function() {
              TableView.prototype.render.apply(this, arguments);
              this.$el.find('tbody tr').each(function() {
                  var $row = $(this);
                  var searchName = $row.find('td:nth-child(1)').text();
                  var preprodEnabled = $row.find('td:nth-child(2)').text() === 'true';
                  var prodEnabled = $row.find('td:nth-child(3)').text() === 'true';

                  // Add toggle buttons
                  var preprodToggle = createToggleButton(preprodEnabled, searchName, 'preprod_enabled');
                  var prodToggle = createToggleButton(prodEnabled, searchName, 'prod_enabled');

                  $row.find('td:nth-child(2)').html(preprodToggle);
                  $row.find('td:nth-child(3)').html(prodToggle);
              });
          }
      });

      // Function to create a toggle button
      function createToggleButton(enabled, searchName, env) {
          var toggleButton = $('<div class="toggle-btn"></div>');
          var toggleCircle = $('<div class="toggle-circle"></div>');
          if (enabled) {
              toggleButton.addClass('active');
          }
          toggleButton.append(toggleCircle);

          toggleButton.on('click', function() {
              var newState = !toggleButton.hasClass('active');
              toggleButton.toggleClass('active', newState);
              updateFeatureToggle(searchName, env, newState);
          });

          return toggleButton;
      }

      // Function to update the KV store
      function updateFeatureToggle(searchName, env, state) {
          var data = {};
          data[env] = state;

          // Fetch current feature toggles
          $.ajax({
              url: Splunk.util.make_url('/servicesNS/nobody/your_app/storage/collections/data/feature_toggles'),
              type: 'GET',
              success: function(response) {
                  var toggles = JSON.parse(response);
                  var toggle = toggles.find(function(t) {
                      return t.savedsearch_name === searchName;
                  });

                  if (toggle) {
                      // Update existing toggle
                      $.ajax({
                          url: Splunk.util.make_url('/servicesNS/nobody/your_app/storage/collections/data/feature_toggles/' + toggle._key),
                          type: 'POST',
                          contentType: 'application/json',
                          data: JSON.stringify(data),
                          success: function() {
                              console.log('Feature toggle updated successfully.');
                          },
                          error: function() {
                              console.log('Error updating feature toggle.');
                          }
                      });
                  } else {
                      // Create new toggle
                      data.savedsearch_name = searchName;
                      $.ajax({
                          url: Splunk.util.make_url('/servicesNS/nobody/your_app/storage/collections/data/feature_toggles'),
                          type: 'POST',
                          contentType: 'application/json',
                          data: JSON.stringify(data),
                          success: function() {
                              console.log('Feature toggle added successfully.');
                          },
                          error: function() {
                              console.log('Error adding feature toggle.');
                          }
                      });
                  }
              },
              error: function() {
                  console.log('Error fetching feature toggles.');
              }
          });
      }

      // Instantiate and render the custom table view
      var searchManager = mvc.Components.getInstance("feature_toggle_table");
      var tableView = new CustomTableView({
          id: "custom-table-view",
          managerid: searchManager.id,
          el: $('#feature_toggle_table')
      }).render();
  });
});
