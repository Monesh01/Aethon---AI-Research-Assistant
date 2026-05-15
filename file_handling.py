import asyncio
import json
import networkx as nx
import uuid
import os
import fitz
from rag_creation import summarizing_pdf, rag_system, build_graph_and_index
from langGraph_app import get_graphs
from graph import generate_cinematic_graph
import asyncio
asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from difflib import SequenceMatcher

def merge_similar_nodes(G, threshold=0.85):
    """Merge nodes that are semantically similar based on string similarity."""
    nodes = list(G.nodes())
    merge_map = {}
    
    for i, n1 in enumerate(nodes):
        if n1 in merge_map:
            continue
        for n2 in nodes[i+1:]:
            if n2 in merge_map:
                continue
            similarity = SequenceMatcher(None, n1, n2).ratio()
            if similarity >= threshold:
                merge_map[n2] = n1  # merge n2 into n1
    
    # Apply merges
    for old_node, new_node in merge_map.items():
        if G.has_node(old_node):
            for _, v, data in list(G.out_edges(old_node, data=True)):
                G.add_edge(new_node, v, **data)
            for u, _, data in list(G.in_edges(old_node, data=True)):
                G.add_edge(u, new_node, **data)
            G.remove_node(old_node)
    
    return G

async def session_creation(G, user_id, session_id, session, supabase, pool, files, emb_model, qdrant_client, collection_chunks, collection_nodes):
    results = []
    all_file_paths = []
    entity_nodes = {}
    combined_summary = ""
    
    for file in files:
        print(f"\n--- Processing file: {file.filename if file else 'No file'} ---\n")
        filename = file.filename
        content = await file.read()
        
        try:
            session_data = json.loads(session) if session else {}
        except Exception as json_err:
            print(f"Session JSON parse error: {json_err}")
            session_data = {}

        access_token = session_data.get("access_token")
        refresh_token = session_data.get("refresh_token")
        
        try:
            clean_user_id = uuid.UUID(user_id)
            supabase.auth.set_session(access_token, refresh_token)

            status, global_title, N_chunks, N_pages = await asyncio.to_thread(rag_system, content, filename, user_id, session_id, qdrant_client, collection_chunks)
            if not status:
                raise Exception("RAG indexing failed")
            
            summary = await asyncio.to_thread(summarizing_pdf, content, str(filename), str(global_title), N_chunks, N_pages)
            
            G = await build_graph_and_index(G, filename, summary, emb_model, qdrant_client, collection_nodes)
            
            
            if not summary:
                raise Exception("PDF summarization failed")

            file_path = f"{user_id}/{filename}"
            supabase.storage.from_("File_management").upload(
                file=content,
                path=file_path,
                file_options={"content-type": "application/pdf", "upsert": "true"}
            )
            all_file_paths.append(file_path)
            combined_summary += f"\n\n--- Summary of {filename} ---\n{summary}"

            pdf_words = 0
            try:
                with fitz.open(stream=content, filetype="pdf") as doc:
                    for page in doc:
                        pdf_words += len(page.get_text().split())
            except Exception as word_err:
                print(f"Word count error: {word_err}")

            results.append({
                "status": 200, 
                "status_text": "indexed",
                "filename": filename,
                "title": global_title,
                "summary": summary,
                "n_chunks": N_chunks,
                "n_pages": N_pages,
                "pdf_words": pdf_words,
                "summary_words": len(summary.split()) if summary else 0,
                "answer": f"File '{filename}' indexed successfully."
            })

        except Exception as e:
            print(f"Error processing {filename}: {str(e)}")
            results.append({
                "status": 500, "status_text": "Failed", "filename": filename,
                "summary": "Processing failed", "answer": f"Error during PDF processing: {str(e)}"
            })
            
    # Batch updates after loop
    if all_file_paths:
        try:
            supabase.table("file_table").upsert(
                {"id": user_id, "session_id": session_id, "files_path": all_file_paths},
                on_conflict="id" 
            ).execute()
        except Exception as db_err:
            print(f"Database update error: {db_err}")
    G = merge_similar_nodes(G, threshold=0.80)

    try:
        print(f"Graph built with {G.number_of_nodes()} nodes and {G.number_of_edges()} edges.")
        os.makedirs("graphml_files", exist_ok=True)
        graphml_path = f"graphml_files/graph_{session_id}.graphml"
        nx.write_graphml(G, graphml_path)
        try:
            import sys
            if "graphml_files" not in sys.path:
                sys.path.append("graphml_files")
            
            generate_cinematic_graph(graphml_path, "neuroprime_viz.html")
        except Exception as viz_err:
            print(f"Error generating visual graph: {viz_err}")
    except Exception as e:
        print(f"Error processing graph: {str(e)}")

    if combined_summary:
        try:
            compiled_graph = await get_graphs(pool, qdrant_client, emb_model)
            config = {"configurable": {"thread_id": session_id}}
            await compiled_graph.aupdate_state(config, {"summary": combined_summary, "entity": entity_nodes})
        except Exception as graph_err:
            print(f"Graph State Update Error: {graph_err}")
    
    return results
