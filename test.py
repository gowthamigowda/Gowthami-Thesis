import os
import json

def merge_json_files(file_paths):
    merged_data = {"name": "root", "children": []}
    for file_path in file_paths:
        with open(file_path, 'r') as file:
            data = json.load(file)
            for i, node in enumerate(data['children']):
                if len(merged_data['children']) <= i:
                    merged_data['children'].append(node)
                else:
                    merge_nodes(merged_data['children'][i], node)
    return merged_data

def merge_nodes(existing_node, new_node):
    if existing_node['name'] == new_node['name']:
        if 'children' in new_node:
            for i, child in enumerate(new_node['children']):
                if len(existing_node['children']) <= i:
                    existing_node['children'].append(child)
                else:
                    merge_nodes(existing_node['children'][i], child)
    else:
        print("Error: Attempted to merge nodes with different names.")

# Provide file paths
file_paths = [
    r'D:\Thesis\Gowthami Thesis 08-01-2024\FinalFromBatchProcessingFor1',
    r'D:\Thesis\Gowthami Thesis 08-01-2024\FinalFromBatchProcessingFor2'
]

json_files = []

# Collect all JSON files from the provided paths
for folder_path in file_paths:
    for root, _, files in os.walk(folder_path):
        for file in files:
            if file.endswith('.json'):
                json_files.append(os.path.join(root, file))

# Merge JSON files
merged_data = merge_json_files(json_files)

# Write merged data to a new file
with open('TEST_files.json', 'w') as merged_file:
    json.dump(merged_data, merged_file, indent=4)

print("Merge completed. Merged data saved to 'merged_files.json'")
