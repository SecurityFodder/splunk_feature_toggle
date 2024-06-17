// Splunk SDK and dashboard readiness are required to manipulate dashboard components
require(["jquery", "splunkjs/mvc", "splunkjs/mvc/simplexml/ready!"], (
  $,
  mvc
) => {
  // Event listener for clicks on toggle buttons in the dashboard
  $(document).on("click", ".toggle-savedsearch", function (event) {
    const $toggle = $(this); // jQuery object for the button clicked
    const savedSearchName = $toggle.data("name"); // Retrieve the name of the saved search
    const currentState = $toggle.data("state"); // Current state: 'Enabled' or 'Disabled'
    const newState = currentState === "Enabled" ? "Disabled" : "Enabled"; // Determine the new state based on the current state

    // Update button to show loading state using a small gif or css animation
    $toggle.html(
      '<img src="/static/app/TA-feature-toggle/loading.gif" alt="Loading" style="height: 20px; width: 20px;" />'
    );

    // Create a service instance to interact with Splunk's REST API
    const service = mvc.createService();

    // Make an asynchronous POST request to update the saved search status
    service.request(
      "/services/saved/searches/" + encodeURIComponent(savedSearchName),
      "POST",
      {
        output_mode: "json",
        disabled: newState === "Disabled" ? "1" : "0",
      },
      (error, response) => {
        if (error) {
          console.error("Error toggling saved search:", error);
          $toggle.html(`${currentState} (Error)`); // Display an error message on the button
          return;
        }

        // Update the button to reflect the new state and modify styling accordingly
        $toggle.data("state", newState); // Update the state data attribute
        $toggle.html(newState); // Display the new state as button text
        $toggle.css({
          "background-color": newState === "Enabled" ? "#65A637" : "#D93F3C", // Green for enabled, red for disabled
          color: "#FFFFFF", // White text for visibility
        });

        // Display a browser alert to inform the user of the change -- consider replacing with a more subtle notification
        alert(`Saved search "${savedSearchName}" is now ${newState}.`);
      }
    );

    event.preventDefault(); // Prevent the default action of the click event
  });
});
