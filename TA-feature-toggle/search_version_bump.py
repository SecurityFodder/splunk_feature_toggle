import json
import sys

def read_conf_file(filepath):
    """Reads lines from a given configuration file."""
    try:
        with open(filepath, 'r') as file:
            return file.readlines()
    except IOError as e:
        print(f"Error reading file {filepath}: {e}")
        sys.exit(1)

def write_conf_file(filepath, lines):
    """Writes lines back to a given configuration file."""
    try:
        with open(filepath, 'w') as file:
            file.writelines(lines)
        print(f"Configuration file {filepath} has been updated successfully.")
    except IOError as e:
        print(f"Error writing to file {filepath}: {e}")
        sys.exit(1)

def update_or_add_metadata(lines, stanza_name):
    """Updates or adds metadata to the given lines of the configuration file."""
    metadata_present = False
    metadata_key = "action.correlationsearch.metadata"
    metadata_entry = f"{metadata_key} = {{\"deprecated\": \"0\", \"detection_id\": \"{stanza_name}\", \"detection_version\": \"1\"}}\n"
    updated_lines = []
    
    for line in lines:
        if metadata_key in line:
            # Parse and update existing metadata
            key, value = line.split('=', 1)
            try:
                metadata = json.loads(value.strip())
                metadata['detection_version'] = str(int(metadata.get('detection_version', 0)) + 1)
                line = f"{key} = {json.dumps(metadata)}\n"
                metadata_present = True
            except json.JSONDecodeError as e:
                print(f"Error parsing metadata JSON: {e}")
                sys.exit(1)
        updated_lines.append(line)

    if not metadata_present:
        # Add metadata if not found
        updated_lines.append(metadata_entry)
        print(f"Metadata not found. Added new metadata entry for stanza '{stanza_name}'.")

    return updated_lines

def main():
    """Main function to update the Splunk configuration file."""
    filepath = 'path_to_savedsearches.conf'
    stanza_name = 'your_stanza_name_here'  # Update as needed or parse dynamically

    print("Reading configuration file...")
    lines = read_conf_file(filepath)
    
    print("Updating configuration metadata...")
    updated_lines = update_or_add_metadata(lines, stanza_name)
    
    print("Writing updated configuration back to file...")
    write_conf_file(filepath, updated_lines)

if __name__ == '__main__':
    main()
