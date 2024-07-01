require([
    'jquery',  // jQuery for AJAX calls and DOM manipulation
    'splunkjs/mvc',  // Core Splunk MVC components for models and views
    'splunkjs/mvc/searchmanager',  // To manage search operations
    'splunkjs/mvc/simplexml/ready!'  // Ensures code executes after the dashboard is fully loaded
  ], function($, mvc, SearchManager) {
  
    // Function to get the current user's username securely from the Splunk API
    function getCurrentUser(callback) {
        $.get('/en-US/splunkd/__raw/services/authentication/current-context', function(data) {
            var username = $(data).find('username').text();
            callback(username);  // Use a callback to ensure username is set before proceeding
        }).fail(function() {
            callback('unknown');  // Fallback to 'unknown' if the API call fails
        });
    }
  
    var currentUser;  // Variable to store the current user's username
  
    getCurrentUser(function(username) {
        currentUser = username;
        console.log('Current user:', currentUser);
        // Initialize other functions here that depend on the current user
        fetchData();  // Now we can fetch data after ensuring the user is set
    });
  
    function logChange(hsbc_uc_id, enabled) {
        var searchQuery = `| makeresults 
                           | eval user="${currentUser}", action="update", hsbc_uc_id="${hsbc_uc_id}", enabled="${enabled}" 
                           | collect index="your_logging_index"`;  // Specify your index
  
        new SearchManager({
            search: searchQuery,
            preview: false,
            cache: false
        });
  
        console.log('Log change search dispatched:', searchQuery);
    }
  
    function fetchData() {
        var uri = `/servicesNS/nobody/TA-HSBC_secops/storage/collections/data/feature_toggle`;
  
        $.ajax({
            url: uri,
            type: 'GET',
            success: function(data) {
                renderToggles(data);
            },
            error: function(xhr, status, error) {
                console.error('Failed to fetch data from KV store:', status, error);
            }
        });
    }
  
    function renderToggles(data) {
        var $tableBody = $('#toggle-table tbody');
        $tableBody.empty();
  
        data.forEach(function(item) {
            $tableBody.append(createToggleRow(item.hsbc_uc_id, item.enabled));
        });
  
        $tableBody.find('input[type="checkbox"]').change(function() {
            var hsbc_uc_id = $(this).closest('tr').data('id');
            var newEnabled = $(this).is(':checked') ? 'true' : 'false';
            updateKVStore(hsbc_uc_id, newEnabled);
        });
    }
  
    function updateKVStore(hsbc_uc_id, enabled) {
        var uri = `/servicesNS/nobody/TA-HSBC_secops/storage/collections/data/feature_toggle/${hsbc_uc_id}`;
        var data = JSON.stringify({ hsbc_uc_id: hsbc_uc_id, enabled: enabled });
  
        $.ajax({
            url: uri,
            type: 'POST',
            contentType: 'application/json',
            data: data,
            success: function(response) {
                showFeedback('KV store updated successfully.', true);
                logChange(hsbc_uc_id, enabled);
            },
            error: function(xhr, status, error) {
                showFeedback('Failed to update KV store: ' + error, false);
            }
        });
    }
  
    function createToggleRow(hsbc_uc_id, enabled) {
        const checked = enabled === 'true' ? 'checked' : '';
        return `<tr data-id="${hsbc_uc_id}">
                    <td>${hsbc_uc_id}</td>
                    <td>
                        <label class="toggle-switch">
                            <input type="checkbox" ${checked}>
                            <span class="slider round"></span>
                        </label>
                    </td>
                </tr>`;
    }
  
    function showFeedback(message, success) {
        var $feedback = $('#feedback');
        $feedback.text(message).removeClass('success error').addClass(success ? 'success' : 'error').fadeIn().delay(3000).fadeOut();
    }
  });
  