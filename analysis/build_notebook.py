import nbformat
from nbformat.v4 import new_notebook, new_code_cell, new_markdown_cell

nb = new_notebook()

nb.cells.append(new_markdown_cell("# Known-Group Validity: Parkinson's Biomarker Analysis \n\nThis notebook tests whether our digital metrics cleanly distinguish Parkinson's patients from Healthy Controls using your pilot data."))

nb.cells.append(new_code_cell("import pandas as pd\nimport seaborn as sns\nimport matplotlib.pyplot as plt\nfrom scipy.stats import mannwhitneyu\nimport warnings\nwarnings.filterwarnings('ignore')\n\nimport data_loader\nimport clinical_metrics\n\n# Load the pilot CSV data from our local extraction\ntrials_df, sessions_df, participants_df = data_loader.load_from_csv('data')\n\n# Build the clinical master frame mapping metrics to diagnosis\nmaster_df = clinical_metrics.analyze_all(trials_df, participants_df)\nmaster_df.head()"))

nb.cells.append(new_code_cell("# Quick view of our Cohort Split\nprint(master_df['diagnosis'].value_counts())\n\nsns.set_theme(style=\"whitegrid\")"))

nb.cells.append(new_code_cell("# Bradykinesia Score Table (Per Participant)\nscores_df = master_df[['participant_id', 'diagnosis', 'dominant_arm', 'bradykinesia_composite']].copy()\nscores_df = scores_df.sort_values(by='bradykinesia_composite', ascending=False)\nprint(\"\\n=== BRADYKINESIA COMPOSITE SCORES ===\")\nprint(scores_df.to_string(index=False))"))

nb.cells.append(new_code_cell("# Bradykinesia Composite Score Profile Visualization\nplt.figure(figsize=(8, 5))\nsns.boxplot(data=master_df, x='diagnosis', y='bradykinesia_composite', palette='Set1')\nsns.swarmplot(data=master_df, x='diagnosis', y='bradykinesia_composite', color='black', alpha=0.6)\nplt.title('Bradykinesia Composite Score (Z-Scored to Baseline)')\nplt.ylabel('Composite Score (Higher = Severe)')\nplt.axhline(0, color='gray', linestyle='--')\nplt.show()"))

nb.cells.append(new_code_cell("# Exhaustive Feature Sweep (Differentiating PD vs HC)\nresults = []\nhc_df = master_df[master_df['diagnosis'] != 'parkinsons']\npd_df = master_df[master_df['diagnosis'] == 'parkinsons']\n\nfor col in master_df.columns:\n    if col in ['participant_id', 'diagnosis', 'dominant_arm', 'bradykinesia_composite']:\n        continue\n    \n    hc_vals = hc_df[col].dropna()\n    pd_vals = pd_df[col].dropna()\n    \n    if len(hc_vals) >= 2 and len(pd_vals) >= 2:\n        try:\n            stat, p_val = mannwhitneyu(hc_vals, pd_vals, alternative='two-sided')\n            n1 = len(hc_vals)\n            n2 = len(pd_vals)\n            r = 1 - (2 * stat) / (n1 * n2)\n            results.append({\n                'Feature': col,\n                'Mann_Whitney_U': stat,\n                'p_value': p_val,\n                'Effect_Size_r': abs(r),\n                'HC_Count': len(hc_vals),\n                'PD_Count': len(pd_vals)\n            })\n        except:\n            pass\n\nresults_df = pd.DataFrame(results)\nif not results_df.empty:\n    results_df = results_df.sort_values(by='Effect_Size_r', ascending=False).reset_index(drop=True)\n    print(\"\\n=== TOP DIFFERENTIATING KINEMATIC FEATURES ===\")\n    print(\"Ranked by Rank-Biserial Correlation (r)\")\n    print(results_df.head(25).to_string())\nelse:\n    print(\"Not enough data to calculate statistical sweep.\")"))

nb.cells.append(new_code_cell("# Sequence Effect Analysis (Block 1 vs Block 3)\n# Using drag path efficiency to track progression of fatigue over trials\nif 'drag_Block1_path_efficiency_mean' in master_df.columns and 'drag_Block3_path_efficiency_mean' in master_df.columns:\n    block_data = master_df.dropna(subset=['drag_Block1_path_efficiency_mean', 'drag_Block3_path_efficiency_mean'])\n    plt.figure(figsize=(8, 5))\n    sns.scatterplot(data=block_data, x='drag_Block1_path_efficiency_mean', y='drag_Block3_path_efficiency_mean', hue='diagnosis', palette='Set2')\n    plt.plot([0, 1], [0, 1], 'r--')  # Line of equality\n    plt.title('Sequence Effect: Drag Path Efficiency (Block 1 vs Block 3)')\n    plt.xlabel('Block 1 Efficiency')\n    plt.ylabel('Block 3 Efficiency')\n    plt.xlim([0, 1])\n    plt.ylim([0, 1])\n    plt.show()"))

with open('main_analysis.ipynb', 'w') as f:
    nbformat.write(nb, f)
