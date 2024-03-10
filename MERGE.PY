import json

def merge_json(file1, file2, output_file):
    # Read contents of the first JSON file
    with open(file1, 'r') as f1:
        data1 = json.load(f1)
    
    # Read contents of the second JSON file
    with open(file2, 'r') as f2:
        data2 = json.load(f2)
    
    # Merge the data recursively
    merged_data = merge(data1, data2)
    
    # Write the merged dictionary to a new JSON file
    with open(output_file, 'w') as f:
        json.dump(merged_data, f, indent=4)

def merge(dict1, dict2):
    # Merge dictionaries recursively
    merged_dict = dict1.copy()
    for key, value in dict2.items():
        if key in merged_dict:
            if isinstance(value, dict):
                merged_dict[key] = merge(merged_dict[key], value)
            elif isinstance(value, list):
                merged_dict[key].extend(value)
            else:
                merged_dict[key] = value
        else:
            merged_dict[key] = value
    return merged_dict


# Paths to input JSON files
file1_path = r'D:\Thesis\Gowthami Thesis 08-01-2024\FinalFromBatchProcessingFor1\Verona_FinalValues.json'
file2_path = r'D:\Thesis\Gowthami Thesis 08-01-2024\FinalFromBatchProcessingFor2\Verona_FinalValues.json'

# Output file path
output_file_path = r'D:\Thesis\Gowthami Thesis 08-01-2024\Merged_Verona_FinalValues.json'

# Merge the JSON files
merge_json(file1_path, file2_path, output_file_path)
