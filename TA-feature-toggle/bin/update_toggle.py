import splunklib.client as client
import splunklib.results as results
import os
import sys
import json


def connect_to_splunk():
    """
    Establishes a connection to the Splunk server.
    Returns a Splunk service connection object.
    """
    # Environment variables for Splunk credentials
    host = os.getenv("SPLUNK_HOST", "localhost")
    port = os.getenv("SPLUNK_PORT", 8089)
    username = os.getenv("SPLUNK_USERNAME")
    password = os.getenv("SPLUNK_PASSWORD")

    # Connect to Splunk
    try:
        service = client.connect(
            host=host, port=port, username=username, password=password
        )
        return service
    except Exception as e:
        print(f"Failed to connect to Splunk: {str(e)}", file=sys.stderr)
        sys.exit(1)


def fetch_and_update_kv_store(service):
    """
    Fetches all saved searches from Splunk and updates the KV Store collection.
    Arguments:
    - service: Authenticated Splunk service connection object
    """
    kv_store_collection = (
        "your_kvstore_collection_name"  # Customize your KV Store collection name
    )
    saved_searches = service.saved_searches

    # Fetch existing KV Store data
    kvstore = service.kvstore[kv_store_collection]
    existing_records = {
        record["saved_search_name"]: record for record in kvstore.data.query()
    }

    # Process and update KV Store with new entries
    for search in saved_searches:
        if search.name not in existing_records:
            new_entry = {
                "saved_search_name": search.name,
                "enabled": True,  # Default state as enabled
            }
            try:
                kvstore.data.insert(json=new_entry)
                print(f"Added new entry for saved search: {search.name}")
            except Exception as e:
                print(
                    f"Failed to insert new entry in KV Store: {str(e)}", file=sys.stderr
                )


def main():
    """
    Main function to handle the workflow.
    """
    # Connect to Splunk
    service = connect_to_splunk()

    # Fetch saved searches and update KV Store
    fetch_and_update_kv_store(service)

    print("KV Store update completed successfully.")


if __name__ == "__main__":
    main()
