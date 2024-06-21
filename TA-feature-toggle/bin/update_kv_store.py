import splunk.rest as rest
import json

def update_kv_store(request):
    try:
        # Get savedsearch and new status from the request
        savedsearch = request['query']['savedsearch']
        newStatus = request['query']['newStatus']

        # Update the KV store (replace with your actual logic)
        collection_name = "savedsearches_lookup"
        query = {"name": savedsearch}
        updated_data = {"feature_toggle": newStatus}
        rest.simpleRequest(f"storage/collections/data/{collection_name}", method="POST", jsonargs=json.dumps(updated_data), getargs=query)

        return {"payload": "KV store updated successfully", "status": 200}
    except Exception as e:
        return {"payload": f"Error updating KV store: {e}", "status": 500}
