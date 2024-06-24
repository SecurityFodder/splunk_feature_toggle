require([
  "underscore",
  "splunkjs/mvc",
  "splunkjs/mvc/simplexml/ready!",
  "splunkjs/mvc/tableview",
], function (_, mvc, TableView) {
  console.log("Custom script loaded");

  // Check if TableView is correctly loaded
  if (!TableView || !TableView.BaseCellRenderer) {
    console.error("TableView or BaseCellRenderer not loaded correctly");
    return;
  }

  // Custom Table Cell Renderer for Toggle Button
  var ToggleCellRenderer = TableView.BaseCellRenderer.extend({
    canRender: function (cell) {
      return cell.field === "enabled";
    },
    render: function ($td, cell) {
      var hsbc_uc_id = cell.value;
      var isEnabled = cell.value === "true";

      // Create the toggle button
      var toggleButton = $("<button>")
        .addClass("btn btn-toggle")
        .addClass(isEnabled ? "btn-success" : "btn-danger")
        .text(isEnabled ? "Enabled" : "Disabled")
        .on("click", function () {
          // Toggle the enabled status
          var newStatus = !isEnabled;
          toggleButton
            .toggleClass("btn-success", newStatus)
            .toggleClass("btn-danger", !newStatus)
            .text(newStatus ? "Enabled" : "Disabled");

          // Update the KV store
          updateKVStore(hsbc_uc_id, newStatus);
        });

      $td.html(toggleButton);
    },
  });

  // Function to update the KV store
  function updateKVStore(hsbc_uc_id, newStatus) {
    console.log(`Updating KV store for ${hsbc_uc_id} to ${newStatus}`);
    var service = mvc.createService();
    var collectionName = "feature_toggle";
    var params = {
      output_mode: "json",
      body: JSON.stringify({ enabled: newStatus }),
    };

    service.request(
      `/servicesNS/nobody/TA-HSBC_secops/storage/collections/data/${collectionName}/${hsbc_uc_id}`,
      "POST",
      params,
      function (err, response) {
        if (err) {
          console.error("Error updating KV store:", err);
        } else {
          console.log("Successfully updated KV store:", response);
        }
      }
    );
  }

  // Wait for the DOM to be ready
  mvc.ready(function () {
    console.log("MVC ready");

    var table = mvc.Components.get("feature_toggle_table");

    if (!table) {
      console.error("Table component not found");
      return;
    }

    table.getVisualization(function (tableView) {
      tableView.table.addCellRenderer(new ToggleCellRenderer());
      tableView.table.render();
      console.log("Custom cell renderer attached");
    });
  });
});
