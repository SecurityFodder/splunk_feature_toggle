require(['splunkjs/mvc', 'splunkjs/mvc/simplexml/ready!', 'jquery'], function(mvc, ready, $) {
    $(document).ready(function() {
        console.log('Document ready, initializing feature toggle script.');

        /**
         * Function to fetch data from the KV store
         * Makes an AJAX GET request to the Splunk KV store to retrieve feature toggle data
         */
        function fetchData() {
            console.log('Fetching data from KV store...');
            $.ajax({
                url: '/servicesNS/nobody/TA-HSBC_secops/storage/collections/data/feature_toggle',
                type: 'GET',
                headers: { 'Authorization': 'Splunk ' + Splunk.util.getConfigValue('SESSION_KEY') },
                success: function(data) {
                    console.log('Data fetched successfully:', data);
                    renderTable(data);
                },
                error: function(error) {
                    console.error('Error fetching data:', error);
                }
            });
        }

        /**
         * Function to render the table
         * @param {Array} data - Array of feature toggle objects from the KV store
         */
        function renderTable(data) {
            console.log('Rendering table with data:', data);
            var $tbody = $('#feature_toggle_table tbody');
            $tbody.empty(); // Clear existing table rows
            data.forEach(function(row) {
                var isEnabled = row.enabled === 'true';
                var $row = $('<tr>');
                $row.append($('<td>').text(row.hsbc_uc_id));
                var $toggleButton = $('<button>')
                    .addClass('btn btn-toggle')
                    .addClass(isEnabled ? 'btn-success' : 'btn-danger')
                    .text(isEnabled ? 'Enabled' : 'Disabled')
                    .on('click', function() {
                        toggleStatus(row._key, !isEnabled, $toggleButton);
                    });
                $row.append($('<td>').append($toggleButton));
                $tbody.append($row);
            });
        }

        /**
         * Function to toggle the status and update the KV store
         * @param {String} id - The ID of the feature toggle entry in the KV store
         * @param {Boolean} newStatus - The new status to set (true or false)
         * @param {jQuery} button - The jQuery button element to update the appearance
         */
        function toggleStatus(id, newStatus, button) {
            console.log(`Toggling status for ID ${id} to ${newStatus}`);
            $.ajax({
                url: `/servicesNS/nobody/TA-HSBC_secops/storage/collections/data/feature_toggle/${id}`,
                type: 'POST',
                headers: { 'Authorization': 'Splunk ' + Splunk.util.getConfigValue('SESSION_KEY') },
                contentType: 'application/json',
                data: JSON.stringify({ enabled: newStatus }),
                success: function() {
                    console.log(`Successfully updated KV store for ID ${id} to ${newStatus}`);
                    button
                        .toggleClass('btn-success', newStatus)
                        .toggleClass('btn-danger', !newStatus)
                        .text(newStatus ? 'Enabled' : 'Disabled');
                },
                error: function(error) {
                    console.error('Error updating KV store:', error);
                }
            });
        }

        // Fetch and render the data when the page loads
        fetchData();
    });
});
