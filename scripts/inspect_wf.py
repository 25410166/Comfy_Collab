import json

with open("data/workflows/qwen2.1_Text_to_Image.json", "r", encoding="utf-8") as f:
    wf = json.load(f)

subgraph = wf["definitions"]["subgraphs"][0]
print("Subgraph name:", subgraph.get("name"))
for n in subgraph["nodes"]:
    print("Node:", n["id"], n["type"], n.get("widgets_values_named"))

print("\n--- Outer nodes ---")
for n in wf["nodes"]:
    print("Node:", n["id"], n["type"], n.get("widgets_values_named"))

print("\n--- Subgraph links ---")
for link in subgraph["links"]:
    print("Link:", link)
