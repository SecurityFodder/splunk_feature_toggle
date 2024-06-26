require(["splunkjs/mvc", "splunkjs/mvc/simplexml/ready!"], function (mvc) {
  $(document).ready(function () {
    // Function to fetch data from the KV store
    function fetchData() {
      $.ajax({
        url: "/servicesNS/nobody/TA-HSBC_secops/storage/collections/data/feature_toggle",
        type: "GET",
        headers: {
          Authorization: "Splunk " + Splunk.util.getConfigValue("SESSION_KEY"),
        },
        success: function (data) {
          renderTable(data);
        },
        error: function (error) {
          console.error("Error fetching data:", error);
        },
      });
    }

    // Function to render the table
    function renderTable(data) {
      var $tbody = $("#feature_toggle_table tbody");
      $tbody.empty();
      data.forEach(function (row) {
        var isEnabled = row.enabled === "true";
        var $row = $("<tr>");
        $row.append($("<td>").text(row.hsbc_uc_id));
        var $toggleButton = $("<button>")
          .addClass("btn btn-toggle")
          .addClass(isEnabled ? "btn-success" : "btn-danger")
          .text(isEnabled ? "Enabled" : "Disabled")
          .on("click", function () {
            toggleStatus(row._key, !isEnabled, $toggleButton);
          });
        $row.append($("<td>").append($toggleButton));
        $tbody.append($row);
      });
    }

    // Function to toggle the status and update the KV store
    function toggleStatus(id, newStatus, button) {
      $.ajax({
        url:
          "/servicesNS/nobody/TA-HSBC_secops/storage/collections/data/feature_toggle/" +
          id,
        type: "POST",
        headers: {
          Authorization: "Splunk " + Splunk.util.getConfigValue("SESSION_KEY"),
        },
        contentType: "application/json",
        data: JSON.stringify({ enabled: newStatus }),
        success: function () {
          button
            .toggleClass("btn-success", newStatus)
            .toggleClass("btn-danger", !newStatus)
            .text(newStatus ? "Enabled" : "Disabled");
          console.log("Successfully updated KV store for id:", id);
        },
        error: function (error) {
          console.error("Error updating KV store:", error);
        },
      });
    }

    // Fetch and render the data when the page loads
    fetchData();
  });
});
