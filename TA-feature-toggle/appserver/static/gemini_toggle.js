require(['jquery', 'splunkjs/mvc', 'splunkjs/mvc/simplexml/ready!'], function($, mvc) {
    // Define the name of your Splunk app to be used in URLs.
    const appName = "your_app_name"; 

    // Wait for the Simple XML dashboard to be fully loaded before attaching event handlers.
    console.log("Dashboard ready, attaching event handlers...");

    // Attach a click event handler to all elements with the 'toggle-btn' class.
    $('.toggle-btn').on('click', function() {

        // Get the savedsearch name associated with the clicked button.
        var savedsearch = $(this).data('savedsearch');
        console.log("Toggle button clicked for savedsearch:", savedsearch);

        // Get the current status (Enabled or Disabled) displayed on the button.
        var currentStatus = $(this).text();
        console.log("Current status:", currentStatus);

        // Determine the new status by toggling the current status.
        var newStatus = (currentStatus === 'Enabled') ? 'Disabled' : 'Enabled';
        console.log("New status:", newStatus);

        // Initiate an AJAX request to update the KV store with the new status.
        $.ajax({
            // URL of the custom endpoint to update the KV store, constructed using the app name.
            url: Splunk.util.make_url('/custom/' + appName + '/update_kv_store'), 
            type: 'POST',
            // Data to send to the endpoint: the savedsearch name and the new status.
            data: { savedsearch: savedsearch, newStatus: newStatus }, 
            success: function(result) {
                console.log("KV store updated successfully:", result);

                // Update the button's text to reflect the new status.
                $(this).text(newStatus);
                console.log("Button text updated to:", newStatus);

                // Initiate another AJAX request to log the audit event.
                $.ajax({
                    // URL of the custom endpoint to log the audit event, using the app name.
                    url: Splunk.util.make_url('/custom/' + appName + '/log_audit_event'), 
                    type: 'POST',
                    // Data to send to the endpoint: savedsearch, user who initiated the change, and the new status (action).
                    data: { savedsearch: savedsearch, user: Splunk.util.getCurrentUser().name, action: newStatus },
                    success: function() {
                        console.log("Audit event logged successfully");
                    },
                    error: function() {
                        console.error("Error logging audit event"); 
                    }
                }); 
            },
            error: function() {
                console.error("Error updating KV store"); 
            }
        }); 
    });
});
