import networkx as nx
from pyvis.network import Network

def generate_cinematic_graph(input_file, output_file):
    # 1. Load the GraphML data
    G = nx.read_graphml(input_file)
    
    # 2. Initialize Pyvis with a dark, cinematic background
    net = Network(
        height="100vh", 
        width="100%", 
        bgcolor="#0a0a0a", # Deep black matching your UI style
        font_color="#ffffff", 
        directed=True
    )

    # 3. Process Nodes with scaling logic
    for node_id, data in G.nodes(data=True):
        # Identify "Anchor" nodes (People) to make them bigger
        is_anchor = " s" in node_id.lower() 
        size = 50 if is_anchor else 30
        color = "#00d4ff" if is_anchor else "#7b2ff7" # Cyan for anchors, Purple for tech
        
        net.add_node(
            node_id,
            label=node_id.title(),
            size=size,
            color={
                "background": color,
                "border": "#ffffff",
                "highlight": {"background": "#ffffff", "border": color}
            },
            font={
                "size": 22 if is_anchor else 16, 
                "face": "Orbitron, sans-serif", # Sci-fi font style
                "strokeWidth": 2,
                "strokeColor": "#000000"
            },
            borderWidth=2,
            shadow={"enabled": True, "size": 15} # Glowing effect
        )

    # 4. Process Edges using your metadata keys
    for source, target, data in G.edges(data=True):
        # Pull relationship label (d0) and source PDF (d2)
        label_text = data.get('label', '')
        source_info = data.get('pdf', 'Unknown Source')
        
        net.add_edge(
            source,
            target,
            label=label_text,
            title=f"Source: {source_info}", # Tooltip on hover
            width=3,
            color={"color": "rgba(255, 255, 255, 0.3)", "highlight": "#00d4ff"},
            smooth={"type": "curvedCW", "roundness": 0.15}, # Elegant curves
            arrows={"to": {"enabled": True, "scaleFactor": 0.5}}
        )

    # 5. Advanced Physics to fix the "Broken/Huge" layout issues
    net.set_options("""
    var options = {
      "physics": {
        "barnesHut": {
          "gravitationalConstant": -60000,
          "centralGravity": 0.2,
          "springLength": 300,
          "springConstant": 0.04,
          "damping": 0.08,
          "avoidOverlap": 1
        },
        "minVelocity": 0.75
      },
      "interaction": {
        "hover": true,
        "navigationButtons": true,
        "tooltipDelay": 100
      }
    }
    """)

    # 6. Save the final optimized HTML
    net.save_graph(output_file)
    print(f"Graph generated: {output_file}")

if __name__ == "__main__":
    generate_cinematic_graph("sample.graphml", "neuroprime_viz.html")