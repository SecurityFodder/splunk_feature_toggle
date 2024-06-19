// feature_toggle.js

require([
  'splunkjs/mvc',
  'splunkjs/mvc/simplexml/ready!',
  'jquery',
  'splunkjs/mvc/searchmanager',
  'splunkjs/mvc/tableview',
  'splunkjs/mvc/tokenutils'
], function(mvc, ready, $, SearchManager, TableView, TokenUtils) {
  $(document).ready(function() {
      var appName = 'your_app'; // Update this variable with your app name

      console.log('Initializing feature toggle management for app:', appName);

      // Function to initialize the custom table view
      function initializeCustomTableView() {
          // Check if the searchManager component exists
          var searchManager = mvc.Components.getInstance("feature_toggle_search");
          if (!searchManager) {
              console.error('SearchManager with ID "feature_toggle_search" not found');
              return;
          }

          console.log('SearchManager found:', searchManager);

          // Extend TableView to add toggle buttons to each row
          var CustomTableView = TableView.extend({
              initialize: function() {
                  // Call the parent class's initialize method
                  TableView.prototype.initialize.apply(this, arguments);
                  console.log('CustomTableView initialized');

                  // Bind to the dataBound event to ensure the table body is fully rendered
                  this.on("rendered", this.addToggleButtons, this);
              },
              addToggleButtons: function() {
                  console.log('Adding toggle buttons to the table');

                  // Check if table body is present
                  var tableBody = this.$el.find('tbody');
                  if (!tableBody.length) {
                      console.error('Table body not found');
                      return;
                  }

                  // Iterate over each row in the table
                  tableBody.find('tr').each(function() {
                      var $row = $(this);
                      var searchName = $row.find('td:nth-child(1)').text();
                      var preprodEnabled = $row.find('td:nth-child(2)').text() === 'true';
                      var prodEnabled = $row.find('td:nth-child(3)').text() === 'true';

                      console.log('Adding toggle buttons for search:', searchName);

                      // Create and add toggle buttons for preprod and prod environments
                      var preprodToggle = createToggleButton(preprodEnabled, searchName, 'preprod_enabled');
                      var prodToggle = createToggleButton(prodEnabled, searchName, 'prod_enabled');

                      $row.find('td:nth-child(2)').html(preprodToggle);
                      $row.find('td:nth-child(3)').html(prodToggle);
                  });
              }
          });

          /**
           * Creates a toggle button with an initial state and attaches event listeners.
           * @param {boolean} enabled - The initial state of the toggle button.
           * @param {string} searchName - The name of the search associated with the toggle button.
           * @param {string} env - The environment (preprod or prod) associated with the toggle button.
           * @returns {jQuery} - The jQuery object representing the toggle button.
           */
          function createToggleButton(enabled, searchName, env) {
              var toggleButton = $('<div class="toggle-btn"></div>');
              var toggleCircle = $('<div class="toggle-circle"></div>');

              // Set the initial state of the toggle button
              if (enabled) {
                  toggleButton.addClass('active');
              }
              toggleButton.append(toggleCircle);

              // Add click event listener to toggle the state
              toggleButton.on('click', function() {
                  var newState = !toggleButton.hasClass('active');
                  toggleButton.toggleClass('active', newState);
                  console.log('Toggled', searchName, env, 'to', newState);
                  updateFeatureToggle(searchName, env, newState);
              });

              return toggleButton;
          }

          /**
           * Updates the feature toggle in the KV store.
           * @param {string} searchName - The name of the search to update.
           * @param {string} env - The environment (preprod or prod) to update.
           * @param {boolean} state - The new state of the toggle.
           */
          function updateFeatureToggle(searchName, env, state) {
              var data = {};
              data[env] = state;

              console.log('Updating feature toggle for', searchName, env, 'to', state);

              // Fetch the current feature toggles from the KV store
              $.ajax({
                  url: Splunk.util.make_url('/servicesNS/nobody/' + appName + '/storage/collections/data/feature_toggles'),
                  type: 'GET',
                  success: function(response) {
                      var toggles = JSON.parse(response);
                      var toggle = toggles.find(function(t) {
                          return t.savedsearch_name === searchName;
                      });

                      // If the toggle exists, update it. Otherwise, create a new toggle.
                      if (toggle) {
                          console.log('Found existing toggle for', searchName, env);
                          $.ajax({
                              url: Splunk.util.make_url('/servicesNS/nobody/' + appName + '/storage/collections/data/feature_toggles/' + toggle._key),
                              type: 'POST',
                              contentType: 'application/json',
                              data: JSON.stringify(data),
                              success: function() {
                                  console.log('Feature toggle updated successfully for', searchName, env);
                              },
                              error: function() {
                                  console.log('Error updating feature toggle for', searchName, env);
                              }
                          });
                      } else {
                          console.log('Creating new toggle for', searchName, env);
                          data.savedsearch_name = searchName;
                          $.ajax({
                              url: Splunk.util.make_url('/servicesNS/nobody/' + appName + '/storage/collections/data/feature_toggles'),
                              type: 'POST',
                              contentType: 'application/json',
                              data: JSON.stringify(data),
                              success: function() {
                                  console.log('Feature toggle added successfully for', searchName, env);
                              },
                              error: function() {
                                  console.log('Error adding feature toggle for', searchName, env);
                              }
                          });
                      }
                  },
                  error: function() {
                      console.log('Error fetching feature toggles');
                  }
              });
          }

          // Instantiate and render the custom table view
          var tableView = new CustomTableView({
              id: "custom-table-view",
              managerid: searchManager.id,
              el: $('#feature_toggle_table')
          }).render();

          console.log('CustomTableView rendered');
      }

      // Initialize the custom table view immediately after the document is ready
      initializeCustomTableView();
  });
});
