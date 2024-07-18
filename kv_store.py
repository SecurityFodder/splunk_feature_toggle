import pandas as pd
import requests
from requests.auth import HTTPBasicAuth

# Constants
CSV_FILE = 'whois_tracker_truncated.csv'
SPLUNK_HOST = 'https://your-splunk-host:8089'
KV_STORE_NAME = 'whois_tracker'
USERNAME = 'your_username'
PASSWORD = 'your_password'

def update_kv_store(data):
    url = f"{SPLUNK_HOST}/servicesNS/nobody/your_app_name/storage/collections/data/{KV_STORE_NAME}"
    headers = {'Content-Type': 'application/json'}
    auth = HTTPBasicAuth(USERNAME, PASSWORD)

    for index, row in data.iterrows():
        # Assuming _key is the unique identifier in your KV Store; adjust as necessary
        response = requests.post(url, json=row.to_dict(), headers=headers, auth=auth)
        if response.status_code not between [200, 299]:
            print(f"Error updating record {row['_key']}: {response.text}")
        else:
            print(f"Record updated: {row['_key']}")

def main():
    # Load CSV data
    data = pd.read_csv(CSV_FILE)
    
    # Update KV Store
    update_kv_store(data)

if __name__ == '__main__':
    main()
