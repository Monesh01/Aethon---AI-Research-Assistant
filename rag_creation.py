import fitz 
import pymupdf4llm
from langchain_groq import ChatGroq
from groq import Groq
from uuid import uuid4
import os
from tqdm import tqdm
from google import genai
from google.genai import types
import json
from llama_index.core.node_parser import SentenceSplitter
from llama_index.core.ingestion import IngestionPipeline
import pymupdf
import time
from langchain_core.callbacks import StreamingStdOutCallbackHandler
from dotenv import load_dotenv
from langchain_ollama import ChatOllama
import re
#from langchain_core.documents import Document
from llama_index.core import Document
import chromadb
from FlagEmbedding import FlagReranker
from typing import Annotated, List, TypedDict, Dict
from langgraph.graph import StateGraph, START, END
from datetime import datetime
import asyncio
import pymupdf
from langchain_groq import ChatGroq
from chromadb.utils import embedding_functions
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate
import operator
import networkx as nx
import time
import sys
from datetime import datetime
from qdrant_client.http import models
import asyncio
asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

load_dotenv()
os.environ['GOOGLE_API_KEY'] = os.getenv('GOOGLE_API_KEY')
os.environ['GROP_API'] = os.getenv('GROQ_API')

llm = ChatGroq(
    model="meta-llama/llama-4-scout-17b-16e-instruct", #"llama-3.3-70b-versatile", # Using a strong model for extraction
    temperature=0,
    api_key= os.environ.get('GROQ_API')
)
'''
model = ChatOllama(
    model="llama3.2:3b",
    num_ctx=8192,      
    temperature=0
)
'''
model = ChatGroq(
    model= "llama-3.1-8b-instant", #llama-3.3-70b-versatile", # Using a strong model for extraction
    temperature=0.1,
    api_key= os.environ.get('GROQ_API')
)

summarizer_prompt = ChatPromptTemplate.from_messages([
    ("system", """You are a PDF summarizer. 
    Summarize the give new page text alone into a precise summary. 
    Use the previous context as a reference to maintain continuity but do not just repeat it. 
    Keep the name of the pdf, title, subtopics headings aligned for a better supervision.
    Always make sure the summary output should be always half the size of given text never exceed it.
    Be concise, smaller and keep the info as structured roadmap.
    Don't start with words like "Here the summary", "The summary", "Summary" Only needed the context."""),
    ("user", "Previous context: {previous_bridge}\n\nNew Page: {page_text}")
]) 

summarizer = summarizer_prompt | model #| JsonOutputParser()

os.environ['GOOGLE_API_KEY'] = os.getenv('GOOGLE_API_KEY')

#reranker = FlagReranker('BAAI/bge-reranker-base', use_fp16=True) 

def title_extraction(text):
    client = Groq(api_key= os.environ.get('GROQ_API'))
    sys_prompt = """You are a Title retriever assistant.
        Retrieve the Correct title from the given content.
        Return ONLY a JSON like:
        {"title": "..."} 
        If no appropriate title present,
        return {"title": "None"}.
        Don't return anything apart from the json output schema.
        """
    user_prompt = f"Content: {text}."
    
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        #model = "meta-llama/llama-4-scout-17b-16e-instruct",
        messages=[
            {"role": "system", "content": sys_prompt},
            {"role": "user", "content": user_prompt}
        ],
        #response_format={"type": "json_object"},
        temperature=0
    )
    print(response)
    return json.loads(response.choices[0].message.content)['title']

def remove_tables(text):
    pattern = r'(\|.*\|\n)+'
    return re.sub(pattern, '[table_1]', text)
#clean_text = remove_markdown_tables(markdown_output)

def captioning(path):
    with open(path, "rb") as f:
        image_bytes = f.read()
    client = genai.Client(api_key=os.environ['GOOGLE_API_KEY'])
    prompt = """
    Perform a detailed extraction of all text and names visible in this image. 
    List every individual name, label, and identifying text found within the image. 
    Provide the output in a structured, research-oriented descriptive format.
    """
    model_id = "gemini-3.1-flash-lite-preview"
    
    print("\n\nImage captioning   \n")
    print(f"--- Response from {model_id} ---")
    try:
        response = client.models.generate_content(
            model=model_id,
            contents=[
                prompt,
                types.Part.from_bytes(
                    data=image_bytes,
                    mime_type="image/png"
                )
            ]
        )
        return f"[Image_caption] {response.text} [/Image_caption]"
    except Exception as e:
        print(f"Error accessing {model_id}: {e}")
        return 'None'

def extraction_node(filename, content, global_title):
    doc = fitz.open(stream=content, filetype="pdf")
    N_pages = len(doc)
    chunk_count = 0

    image_dir = f"output_images_{filename}"
    processed_chunks = []
    
    # 1. Convert to Markdown with page-specific markers
    # Using page_chunks=True gives us a list of dicts with 'text' and 'metadata['page']'
    pages = pymupdf4llm.to_markdown(
        doc,
        page_chunks=True,
        write_images=True,
        filename=filename,
        image_path=image_dir
    )
    
    # 2. Combine into a single "Marked" stream
    full_text = ""
    for p in pages:
        p_num = p['metadata'].get('page', 1) # pymupdf4llm metadata 1-indexed
        md_text = p['text']
        
        # Image logic
        match = re.findall(r'!\[\]\((.*?)\)', md_text)
        images_captioning = []
        if match:
            for count, image_path in enumerate(match):
                # Ensure the path exists before attempting captioning
                if os.path.exists(image_path):
                    image_caption = captioning(image_path)
                    images_captioning.append((image_path, image_caption))
                    md_text = md_text.replace(image_path, f"[image_{count}]")
                else:
                    print(f"Warning: Image path {image_path} not found.")

        if images_captioning:
            for count, img in enumerate(images_captioning):
                processed_chunks.append({
                    'file_name': filename,
                    'Title': global_title,
                    'page': p_num - 1 if p_num > 0 else 0, # map to 0-indexed
                    'chunk_id': chunk_count,
                    'type': "image",
                    'image_path': img[0].replace('\\', '/'), # Ensure forward slashes for URLs
                    'content': img[1]
                })
                chunk_count += 1
                
        # Inject an HTML-style marker that Markdown parsers usually ignore
        full_text += f"\n<page_break n={p_num} />\n" + md_text

    # 3. Use SentenceSplitter for granular chunks
    parser = SentenceSplitter(chunk_size=1024, chunk_overlap=200)
    full_doc = Document(
        text=full_text,
        metadata={"file_name": filename, "title": global_title}
    )
    nodes = parser.get_nodes_from_documents([full_doc])

    # 4. Post-process nodes to extract the list of page numbers
    last_page = 0  # In case a chunk doesn't have a page marker
    for node in nodes:
        # Regex to find all page markers in this specific chunk of text
        found_pages = re.findall(r'<page_break n=(\d+) />', node.text)
        
        if found_pages:
            # Convert to integers and remove duplicates
            node.metadata["page_numbers"] = sorted(list(set(map(int, found_pages))))
            # Set the "primary" page as the first one for standard citations
            node.metadata["page_label"] = str(node.metadata["page_numbers"][0])
            last_page = node.metadata["page_numbers"][0] - 1  # Map to 0-indexed
            
        # Clean the markers out of the final text so they don't confuse the LLM
        node.text = re.sub(r'<page_break n=\d+ />', '', node.text).strip()
        
        if node.text:
            processed_chunks.append({
                'file_name': node.metadata.get('file_name', filename),
                'Title': node.metadata.get('title', global_title),
                'page': last_page,
                'chunk_id': chunk_count,
                'type': "text",
                'image_path': "None",
                'content': node.text
            })
            chunk_count += 1

    return processed_chunks, N_pages

def word_embedding(text, dimensions = 1536):
    max_retries = 3
    client = genai.Client(api_key=os.environ['GOOGLE_API_KEY'])
    for attempt in range(max_retries):
        try:
            result = client.models.embed_content(
                model="gemini-embedding-2-preview",
                contents=text,
                config={
                    "output_dimensionality": dimensions
                }
            )
            return result.embeddings[0].values
        except Exception as e:
            if attempt == max_retries - 1:
                print("Error : ", str(e))
                raise e
        time.sleep(1)
    

def img_embedding(file_path, description, dimensions = 1536):
    with open(file_path, "rb") as f:
        image_bytes = f.read()
    ext = file_path.split(".")[-1].lower()
    mime_type = f"image/{ext}"
    if ext == "jpg":
        mime_type = "image/jpeg"
    
    
    client = genai.Client(api_key=os.environ['GOOGLE_API_KEY'])
    try:
        # Pass parts as a single Content object to get ONE multimodal embedding
        result = client.models.embed_content(
            model="gemini-embedding-2-preview",
            contents=types.Content(
                parts=[
                    types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                    types.Part.from_text(text=description)
                ]
            ),
            config={
                "output_dimensionality": dimensions
            }
        )
        time.sleep(1)
        return result.embeddings[0].values

    except Exception as e:
        print("Error in img_embedding: ", str(e))
        # Fallback to text-only embedding if multimodal fails for some reason
        try:
             result = client.models.embed_content(
                model="gemini-embedding-2-preview",
                contents=description,
                config={"output_dimensionality": dimensions}
            )
             return result.embeddings[0].values
        except:
             return [0.0] * dimensions

def embed(chunks, qdrant_client, collection_chunks, session_id):
    embeddings = []
    meta_data = []
    documents = []

    for data in tqdm(chunks):
        item = data.copy()
        
        file_name = item['file_name']
        meta_content = item["content"]
        content = f'File_name: {file_name}, Content: {meta_content}'
        
        try:
            # Logic for embeddings
            if item['type'] in ['text', 'table']:
                embed = word_embedding(content)
            else:
                # FIX: Use 'image_path' instead of 'image_folder' to avoid KeyError
                embed = img_embedding(item['image_path'], content)
            
            # Append results
            embeddings.append(embed)
            documents.append(content)
            
            # Remove content from metadata and store
            item.pop('content', None) 
            meta_data.append(item)
        except Exception as api_err:
            print(f"Skipping chunk due to API error: {api_err}")
            continue


    print(f"Total Chunks Processed: {len(embeddings)}")
    if meta_data: 
        for meta, doc in zip(meta_data, documents):
            meta["content"] = doc

        # 2. Perform the Upsert
        qdrant_client.upsert(
            collection_name=collection_chunks,
            points=[
                models.PointStruct(
                    id=str(uuid4()),
                    vector=vector,
                    payload=payload
                )
                for vector, payload in zip(embeddings, meta_data)
            ]
        )

        print(f"Successfully upserted {len(embeddings)} points to {collection_chunks}")
        return True
    else:
        return False

def rag_system(content, filename, user_id, session_id, qdrant_client, collection_chunks):
    print(f"\n\n\nContent type : {type(content)}")
    global_title = ""
    
    with fitz.open(stream=content, filetype="pdf") as doc:
        tit_pages = [i for i in range(len(doc))] if len(doc) > 5 else [0, 1] if len(doc)>1 else []
        md_text = pymupdf4llm.to_markdown(
            doc=doc,
            pages= tit_pages
        )
        global_title = title_extraction(md_text)
        print(f"\n\n\nTitle :{global_title}")
    chunks, N_pages = extraction_node(filename, content, global_title)
    print("Page_content extracted\n")
    print("No of pages: ", N_pages, "\n")
    rag = embed(chunks, qdrant_client, collection_chunks, session_id)#, filename)
    print("Rag created\n")
    return rag, global_title, len(chunks), N_pages

def summarizing_pdf(content, filename, global_title, N_chunks, N_pages):
    
    doc = pymupdf.open(stream = content, filetype = "pdf")
    all_summaries = []
    previous_bridge = ""
    for page_num, page_text in enumerate(tqdm(doc)):
        '''
        prompt = f"""You are a PDF summarizer. 
        Keep the name of the pdf, title, subtopics headings aligned for a better supervision.
        Be concise and summarize it in a roadmap structure of the given new page.
        Don't start with words like "Here the summary", "The summary", "summary" Only needed the content.
        Previous context: {previous_bridge}\n\nNew Page: {page_text}"""
        '''

        # 2. Get summary from Groq with retry logic for rate limits
        max_retries = 3
        for attempt in range(max_retries):
            try:
                summary = summarizer.invoke({
                    "previous_bridge":previous_bridge,
                    "page_text": page_text.get_text(sort=True)
                })
                all_summaries.append(summary.content)
                print(f"\n\nSummary: {summary.content}\n\n")
                previous_bridge = summary.content[-250:]
                time.sleep(1) # Prevent spamming API when successful
                break
            except Exception as e:
                if "429" in str(e) and attempt < max_retries - 1:
                    wait_time = (attempt + 1) * 3
                    print(f"Rate limit hit during summarization on page {page_num}, retrying in {wait_time}s...")
                    time.sleep(wait_time)
                    continue
                print(f"Error during summarization on page {page_num}: {e}")
                break
    doc.close()
    intro = f"Name of the PDF: {filename}\nTitle: {global_title}\nNo of pages: {N_pages}\nNo of Chunks: {N_chunks}"
    final_summary = "\n\n".join(all_summaries)
    return intro + final_summary

current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

'''
    # --- PROMPTS ---
extraction_prompt = ChatPromptTemplate.from_messages([
    ("system", """You are a specialized Knowledge Graph Extraction Engine.
    Use the given Global summary and convert text into a semantic network of (Subject, Predicate, Object) triplets.
    For each Subject and Object, if they have common aliases (acronyms, synonyms, variations), list them.
        
    STRICT RULES:
    1. Predicates MUST be verbs or relationship descriptors.
    2. NO PREAMBLE. NO THOUGHT PROCESS. 
    3. If a subject has multiple relationships, create a separate triplet for each. Do not combine objects.
    4. "subject_aliases" and "object_aliases" MUST be a list of strings (e.g., ["AI", "Artificial Intelligence"]). If none, provide an empty list [].
    5. If the words are similar like "AI", "Artifical Intelligence" or "NLP model", "llm" use them with same subject and add the others into their respective aliases.
    6. OUTPUT ONLY VALID JSON.
    
    Summary: 
    {summary}
     
    FORMAT:
    {{
    "triplets": [
        {{
        "subject": "string",
        "predicate": "relationship",
        "object": "string",
        "subject_aliases": ["Alias1", "Alias2", ..],
        "object_aliases": ["Alias1", "Alias2", ..]
        }}
    ]
    }}"""),
    ("user", "Text to extract from:\n{text}")
])
'''
extraction_prompt = ChatPromptTemplate.from_messages([
    ("system", """You are a High-Precision Knowledge Graph Architect.

    Your goal is to extract an interconnected semantic network from the provided text.
    You MUST reuse entity names from the EXISTING TRIPLETS below to avoid creating disconnected islands.

    ### CRITICAL: ENTITY REUSE RULES
    1. **CHECK EXISTING TRIPLETS FIRST:** Before creating ANY new Subject or Object, scan the existing triplets.
       - If a concept already exists (even as a synonym/variation), REUSE the exact same entity name.
       - Example: If existing triplets have "RAG System", do NOT create "RAG" or "Retrieval System" — use "RAG System".
    2. **CONNECT TO EXISTING NODES:** Every new triplet MUST share at least one Subject or Object with the existing triplets.
       - If a page introduces a new concept, link it to an existing entity via a relationship.
    3. **ATOMIC ENTITIES:** Entities must be 1-3 words maximum.
       - Move descriptive details or numbers to the Predicate or Object.
    4. **PREDICATE STANDARDIZATION:** Use strong, functional verbs.
       - Prefer: [UTILIZES, IMPLEMENTS, EVALUATES, MEASURES, VALIDATES, CONTRADICTS, IMPROVES, DEFINES, COMPRISES, INCLUDES, ADDRESSES, REQUIRES].
    5. **ALIASED MAPPING:** Every Subject and Object must have an alias list.
       - If you normalize "LLM" to "Large Language Model", "LLM" must be in `subject_aliases`.
    6. **OUTPUT ONLY VALID JSON. NO PREAMBLE. NO EXPLANATIONS.**
    7. - If a triplet is seems to be disconnecting merge it with the most relevant existing node based on the previous_triplets.
    ### EXISTING TRIPLETS (Previously Extracted — REUSE these entity names):
    {previous_triplets}


    ### JSON STRUCTURE:
    {{
        "triplets": [
            {{
                "subject": "Primary Name",
                "predicate": "FUNCTIONAL_VERB",
                "object": "Primary Name",
                "subject_aliases": ["Acronym", "Synonym"],
                "object_aliases": ["Acronym", "Synonym"]
            }}
        ]
    }}"""),
    ("user", "Text to extract from:\n{text}")
])
#### GLOBAL SUMMARY (Reference for entity names):{summary}
extract_chain = extraction_prompt | llm | JsonOutputParser()

    # --- STATE ---
class KGState(TypedDict):
    triplets: Annotated[List[Dict], operator.add]
    page_text: str
    page_num: int
    pdf_name: str
    summary: str
    previous_triplets: str

    # --- NODES ---
def extract_node(state: KGState):
    max_retries = 3
    for attempt in range(max_retries):
        try:
            result = extract_chain.invoke({
                "text": state["page_text"],
                #"summary": state["summary"],
                "previous_triplets": state.get("previous_triplets", "None yet")
            })
            extracted = result.get("triplets", [])
            # Add metadata to each triplet
            for t in extracted:
                t["page_num"] = state["page_num"]
                t["pdf_name"] = state["pdf_name"]
            return {"triplets": extracted}
        except Exception as e:
            if "429" in str(e) and attempt < max_retries - 1:
                wait_time = (attempt + 1) * 2
                print(f"Rate limit hit on page {state['page_num']}, retrying in {wait_time}s...")
                time.sleep(wait_time)
                continue
            print(f"Error on page {state['page_num']}: {e}")
            return {"triplets": []}

workflow = StateGraph(KGState)
workflow.add_node("extract", extract_node)
workflow.add_edge(START, "extract")
workflow.add_edge("extract", END)
app_node = workflow.compile()

    # --- SEQUENTIAL PROCESSING WITH CUMULATIVE TRIPLETS ---
async def process_page_sequential(page_num, text, summary, pdf_name, previous_triplets_str):
    """Process a single page with context of all previously extracted triplets."""
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, lambda: app_node.invoke({
        "page_text": text,
        "page_num": page_num,
        "pdf_name": pdf_name,
        "summary": summary,
        "previous_triplets": previous_triplets_str,
        "triplets": []
    }))
    return result["triplets"]

async def build_graph_and_index(G, pdf_path: str, summary: str, emb_model, qdrant_client, collection_nodes):
    doc = fitz.open(pdf_path)
    pdf_name = os.path.basename(pdf_path)

    all_results = []
    print(f"Extracting triplets sequentially from {pdf_name}...")
    for i in tqdm(range(len(doc)), desc="Extracting triplets"):
        text = doc[i].get_text()
        # Build cumulative triplet context from all previous pages
        if all_results:
            existing_entities = set()
            for t in all_results:
                existing_entities.add(t['subject'].strip().lower())
                existing_entities.add(t['object'].strip().lower())
            prev_triplets_str = "Existing entities (REUSE these exact names): " + ", ".join(sorted(existing_entities))
        else:
            prev_triplets_str = "None yet - this is the first page."
        '''
        if all_results:
            prev_triplets_str = "\n".join([
                f"({t['subject']}, {t['predicate']}, {t['object']})"
                for t in all_results
            ])
        else:
            prev_triplets_str = "None yet - this is the first page."
        '''
        page_triplets = await process_page_sequential(i, text, summary, pdf_name, prev_triplets_str)
        all_results.extend(page_triplets)
        print(f"  Page {i}: extracted {len(page_triplets)} triplets (total: {len(all_results)})\n\n")
    
    print("\n\nAll results got\n\n")
        # 1. Update NetworkX Graph
    #G = nx.MultiDiGraph()
    triplet_docs = []
    triplet_metadata = []
    triplet_ids = []
    seen_triplets = []

    alias_to_canonical = {}

    #print("\n\nAll results: ",all_results)
    for t in all_results:
        s = t["subject"].strip().lower()
        p = t["predicate"].strip().lower()
        o = t["object"].strip().lower()
        s_aliases = t.get("subject_aliases", [])
        o_aliases = t.get("object_aliases", [])
        for alias in s_aliases:
            if alias not in alias_to_canonical:
                alias_to_canonical[alias] = s  # alias → canonical
        for alias in o_aliases:
            if alias not in alias_to_canonical:
                alias_to_canonical[alias] = o

    def resolve(name):
        name = name.strip().lower()
        return alias_to_canonical.get(name, name)
    
    for t in all_results:
        s = resolve(t["subject"])
        o = resolve(t["object"])
        p = t["predicate"].strip().lower()
        G.add_edge(s, o, label=p, page=str(t["page_num"]), pdf=str(t["pdf_name"]))

        # Add to NX
        #G.add_edge(s, o, label=p, page=str(t["page_num"]), pdf=str(t["pdf_name"]))

        if (s, o, p) in seen_triplets:
            continue
        else:
            seen_triplets.append((s, o, p))
            doc_str = f"Triplet: ({s}, {p}, {o}) | Aliases: {s}: {s_aliases}, {o}: {o_aliases}"    
            triplet_docs.append(doc_str)
            triplet_metadata.append({
                "sub_id": str(s),
                "obj_id": str(o)
            })
            triplet_ids.append(str(uuid4()))


        # 2. Store in Chroma
    output = emb_model.encode(triplet_docs, return_dense=True, return_sparse=False, return_colbert_vecs=False)

    dense_vectors = output['dense_vecs']
    triplet_embeddings = dense_vectors.tolist()

    if triplet_docs:
        qdrant_client.upsert(
            collection_name=collection_nodes,
            points=[
                models.PointStruct(
                    id=str(uuid4()),
                    vector=vector,
                    payload=payload
                )
                for vector, payload in zip(triplet_embeddings, triplet_metadata)
            ]
        )
        
    print(f"Graph built with {G.number_of_nodes()} nodes and {G.number_of_edges()} edges for PDF {pdf_path}")
    return G