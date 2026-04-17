import json

with open('main_analysis.ipynb', 'r') as f:
    nb = json.load(f)
    
for cell in nb['cells']:
    if cell['cell_type'] == 'code' and "Apply physical dimensions" in "".join(cell['source']):
        src_str = "".join(cell['source'])
        start_idx = src_str.find("            # Apply physical dimensions based on feature type")
        end_idx = src_str.find("            plt.ylabel(unit)\n")
        
        if start_idx != -1 and end_idx != -1:
            end_idx += len("            plt.ylabel(unit)\n")
            
            replacement_str = """            # Apply physical dimensions based on feature type
            unit_str = 'units'
            f_lower = feature.lower()
            if 'frequency' in f_lower or 'count' in f_lower:
                unit_str = 'count'
            elif 'delay' in f_lower or 'duration' in f_lower or 'time' in f_lower:
                unit_str = 'ms'
            elif 'speed' in f_lower or 'velocity' in f_lower:
                unit_str = 'px/s'
            elif 'error' in f_lower or 'deviation' in f_lower or 'distance' in f_lower:
                unit_str = 'px'
            elif 'jerk' in f_lower:
                unit_str = '1/s³'
            elif 'spectral' in f_lower:
                unit_str = 'SPARC'
            plt.ylabel(f"{feature} (in {unit_str})")\n"""
            
            new_src = src_str[:start_idx] + replacement_str + src_str[end_idx:]
            
            s_list = new_src.split('\n')
            cell['source'] = [s + '\n' for s in s_list[:-1]] + [s_list[-1]]
            
            with open('main_analysis.ipynb', 'w') as f2:
                json.dump(nb, f2, indent=1)
            print("Successfully patched Y axis labels!!")
            break
