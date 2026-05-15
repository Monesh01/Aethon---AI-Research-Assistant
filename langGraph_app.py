import asyncio
import sys
import logging
import psycopg
import asyncio
asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

#if sys.platform == 'win32':
#    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
from typing import Annotated, List, TypedDict, Literal, Union
#from typing_extensions import TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
import os
import numpy as np
from fastapi import FastAPI
from pydantic import BaseModel, Field
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, RemoveMessage
import json
from groq import AsyncGroq  # Use AsyncGroq for FastAPI
from openai import InternalServerError, APIConnectionError, RateLimitError
import asyncio
#from gotrue.errors import AuthApiError
from pydantic import BaseModel, Field, ConfigDict
from langchain_tavily import TavilySearch
from langchain_groq import ChatGroq
from typing import TypedDict, List, Annotated
from contextlib import asynccontextmanager
from psycopg_pool import AsyncConnectionPool
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
import urllib.parse
from google import genai
import time
import chromadb
from FlagEmbedding import FlagReranker
from groq import Groq
import networkx as nx
import chromadb
from chromadb.utils import embedding_functions
from qdrant_client import QdrantClient, models

os.environ['GOOGLE_API_KEY'] = os.getenv('GOOGLE_API_KEY')
#reranker = FlagReranker('BAAI/bge-reranker-base', use_fp16=True) 
async def word_embedding(text: str):
    def _embed():
        client = genai.Client(api_key=os.environ['GOOGLE_API_KEY'])
        try:
            result = client.models.embed_content(
                model="gemini-embedding-2-preview",
                contents=text,
                config={
                    "output_dimensionality": 1536
                }
            )
            return result.embeddings[0].values
        except Exception as e:
            print("Error : ", str(e))
            return []
    return await asyncio.to_thread(_embed)

'''
async def compute_rank(chunks: List[tuple]):
    def _rank():
        
        scores = reranker.compute_score(chunks)
        return scores
    return await asyncio.to_thread(_rank)
'''
model = ChatGroq(
    model="meta-llama/llama-4-scout-17b-16e-instruct",
    api_key=os.environ.get('GROQ_API'),
    temperature=0,
)

#reranker = FlagReranker('BAAI/bge-reranker-base', use_fp16=True) 

class ModelResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    Rag: Literal['Yes', 'No'] = Field(Description = "Whether the query relates to the summary or not")
    Query: List[str] = Field(default_factory=list, description="Transcribed and formulated structured queries.")

router_model = model.with_structured_output(ModelResponse)

class Schema(BaseModel):
    model_config = ConfigDict(extra="forbid")
    Type: Literal["Mermaid", "3D"] = Field(description="Visual type")
    query: str = Field(description="Detailed description for visual generation")

class RouterSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")
    Answer: Union[str, None] = Field(
        description="Markdown answer. If 'tavily' is True, set this to null. Only provide full answer if info exists in RAG or Tavily results."
    )
    image: bool = Field(description="True if image/diagram is requested.")
    Flow: List[Schema] = Field(description="Visual flow details.")
    tavily: bool = Field(
        description="CRITICAL: Set to True ONLY if information is missing from RAG and User Input. If in doubt, set to False."
    )
    search_query: str = Field(
        description="Specific search query for Tavily. If tavily is False, set to 'No query'."
    )

class GraphState(TypedDict):
    messages: Annotated[List, add_messages]
    rag_output: List[str]
    kg_output: str
    queries: List[str]
    rag: str
    search: bool
    tavilyoutput: str
    file_name: str
    summary: str 
    chat_summary: str
    user_id: str
    session_id: str
    entity: dict
    
async def get_two_hop_nodes(G, node):
    try:
        print(f"\n\nGetting 2-hop neighbors for node: {node}\n\n")
        one_hop = set(G.successors(node)) | set(G.predecessors(node))
        
        two_hop = set()
        for n in one_hop:
            two_hop.update(G.successors(n))
            two_hop.update(G.predecessors(n))
        
        two_hop.discard(node)  # remove self if present
        return two_hop
    except Exception as e:
        print(f"Error in get_two_hop_nodes: {e}")
        return set()

async def get_triplets_text(G, node_ids):
    triplets = []
    is_multi = G.is_multigraph()
    print("\n\n\nMultiDiGraph: ", is_multi, "\n\n\n")
    try:
        for node in node_ids:
            # outgoing edges — k is int edge key in MultiDiGraph; predicate is in data["label"]
            if is_multi:
                for u, v, k, data in G.out_edges(node, keys=True, data=True):
                    predicate = data.get("label", str(k))
                    triplets.append(f"({u}, {predicate}, {v})")
            else:
                for u, v, k, data in G.out_edges(node, data=True):
                    predicate = data.get("label", str(k))
                    triplets.append(f"({u}, {predicate}, {v})")
            
            # incoming edges
            if is_multi:
                for u, v, k, data in G.in_edges(node, keys=True, data=True):
                    predicate = data.get("label", str(k))
                    triplets.append(f"({u}, {predicate}, {v})")
            else:
                for u, v, k, data in G.in_edges(node, data=True):
                    predicate = data.get("label", str(k))
                    triplets.append(f"({u}, {predicate}, {v})")
        
        seen = set()
        deduped = []
        for t in triplets:
            if t not in seen:
                seen.add(t)
                deduped.append(t)

        #print("\n\nExtracted Triplets: ", deduped, "\n\n")
        return ", ".join(deduped)
    except Exception as e: 
        print(f"Error in get_triplets_text: {e}")
        return ""

async def get_pdf_page_mapping(G, node_ids):
    pdf_dict = {}
    print("\n\nGetting PDF-page mapping for nodes: ", node_ids, "\n\n")
    try:
        for node in node_ids:
            for u, v, k, data in G.edges(node, keys=True, data=True):
                # rag_creation.py stores edges with keys 'pdf' and 'page'
                print("data: ", data)
                pdf = data.get("pdf") or data.get("pdf_name")
                page = data.get("page") or data.get("page_number")
                
                if pdf:
                    if pdf not in pdf_dict:
                        pdf_dict[pdf] = set()
                    if page is not None:
                        pdf_dict[pdf].add(int(page))
        
        # convert sets → sorted lists
        return {k: sorted(list(v)) for k, v in pdf_dict.items()}
    except Exception as e:
        print("Error in get_pdf_page_mapping: ", str(e))
        return {}
  
async def build_collection_chunks(query, G, node_ids, qdrant_client, session_id=None):
    chunks = []
    count = 0
    try:
        conditions = []
        seen_condition = set()
        all_relevant_nodes = set()
        for node in node_ids:
            if G.has_node(node):
                all_relevant_nodes.add(node)
                all_relevant_nodes.update(await get_two_hop_nodes(G, node))
            
            text = await get_triplets_text(G, all_relevant_nodes)
            pdf_map = await get_pdf_page_mapping(G, all_relevant_nodes)

            #print(pdf_map.items())
            for pdf_name, pages in pdf_map.items():
                for page in pages:
                    if (pdf_name, page) in seen_condition:
                        continue
                    seen_condition.add((pdf_name, page))
                    conditions.append(
                        models.Filter(
                            must=[
                                models.FieldCondition(
                                    key="file_name",
                                    match=models.MatchValue(value=pdf_name)
                                ),
                                models.FieldCondition(
                                    key="page",
                                    match=models.MatchValue(value=page)
                                )
                            ]
                        )
                    )

            if not conditions:
                print("No conditions generated returning KG text only.")
                return {
                    "text":text,
                    "retrieved_chunks": []
                }
                
            query_filter = models.Filter(
                should=conditions
            )


            results, _ = qdrant_client.scroll(
                collection_name=f"collection_chunks_{session_id}",
                scroll_filter=query_filter,
                limit = 20
            )

            print("\n\nQuery Filter for Qdrant: ", query_filter, "\n\n")
            print("\n\nlen of the Results from Qdrant query: ", len(results), "\n\n")
            #print(f"Results from qdrant query: {results[0]}\n\n")
            for res in results:
                content = res.payload if res.payload else res
                if str(content) not in chunks:
                    chunks.append(str(content))

        print(f"Total items in collection: {count}")
        print("Condition: ", conditions, "\n\n\n")
        #print(f"\n\nText:{text}\n\n")
        #print(f"\n\nchunks: {chunks}\n\n")
        return {
            'text':text,
            'retrieved_chunks': chunks
        }
        
    except Exception as e:
        print("Error in build_collection_chunks: ", str(e))
        return {
            'text':"",
            'retrieved_chunks': []
        }
    
async def kg_rag(state: GraphState):
    query = state.get("messages", "")[-1].content
    session_id = state.get('session_id', '')

    try:
        G = nx.read_graphml(f"graphml_files/graph_{state.get('session_id', '')}.graphml", force_multigraph=True)
    except Exception as e:
        print("No graphml file found for RAG retrieval: ", str(e))
        return {
            "rag_output": ["No data found"]
        }
    output = {"text": "", "retrieved_chunks": []}
    nodes_meta = None
    try:
         

        vec = emb_model.encode([query], return_dense=True, return_sparse=False, return_colbert_vecs=False)
        dense_vectors = vec['dense_vecs']
        query_embedding = dense_vectors[0].tolist()
        print("Type and len of the query_embedding: ", type(query_embedding), len(query_embedding) if query_embedding else "No embedding") 
        collection_nodes = f"collection_nodes_{session_id}"
        if qdrant_client and qdrant_client.collection_exists(collection_nodes):
            results = qdrant_client.query_points(
                collection_name=collection_nodes,
                query=query_embedding,
                limit=5
            )
        else:
            results = []
        points= results.points if results else []
        if points:
            #print(f"Results form the {collection_nodes}: {points}\n\n")
            #print("\n\nType of Result in kg: ", type(points[0].payload), "\n\n")
            nodes_meta = [res.payload for res in points]
        else:
            nodes_meta = None
        
        if not nodes_meta:
            print("No relevant nodes found in chromadb for KG RAG.")
            # Don't return early — fall through to semantic fallback below

    except Exception as e:
        print("Error retrieving vector collection for KG RAG: ", str(e))
    
    # KG-based retrieval path
    if nodes_meta:
        node_ids = list(set([j for i in nodes_meta for j in (i.get("sub_id"), i.get("obj_id"))]))
        node_ids = [n for n in node_ids if n]
        print(f"\n\nnode_ids from vector db: {node_ids}\n\n")
        if node_ids:
            try:
                output = await build_collection_chunks(query, G, node_ids, qdrant_client, state.get('session_id', ''))
                print(f"\n\nOutput: {str(output)[:300]}\n\n")
            except Exception as e:
                print("Error in build_collection_chunks: ", str(e))
                print(f"\n\nOutput: {str(output)[:300]}\n\n")

    # FALLBACK: If KG-based retrieval returned no chunks, do direct semantic search on chunks collection
    if not output.get("retrieved_chunks"):
        print("\n--- FALLBACK: Direct semantic search on chunks collection ---")
        try:
            collection_chunks_name = f"collection_chunks_{session_id}"
            if qdrant_client and qdrant_client.collection_exists(collection_chunks_name):
                query_emb = await word_embedding(query)
                if query_emb:
                    fallback_results = qdrant_client.query_points(
                        collection_name=collection_chunks_name,
                        query=query_emb,
                        limit=10
                    )
                    fallback_points = fallback_results.points if fallback_results else []
                    if fallback_points:
                        output["retrieved_chunks"] = [str(r.payload) for r in fallback_points]
                        print(f"Fallback retrieved {len(fallback_points)} chunks\n")
                    else:
                        print("Fallback: No results from semantic search either.")
        except Exception as fb_err:
            print(f"Fallback search error: {fb_err}")

    return {
        "kg_output": output.get("text", "") if output else "",
        "rag_output": output.get("retrieved_chunks", []) if output else []
    }

'''
async def rag_output(state: GraphState):
    print("\n--- Running RAG Node ---\n")
    docs = []
    m_datas = []
    queries = state.get('queries', [])
    print(queries, "\n\n")
    if not queries:
        print("No queries provided for RAG retrieval.")
        return {"rag_output": ["No data found"]}
    #collection = chromadb_client.get_or_create_collection(  
        #name=f"data_{state['session_id']}"
    #)
    try:
        collection_chunks = chromadb_client.get_collection(
            name=f"data_{state.get('session_id', '')}"
        )
    except Exception as e:
        print("Error in chromadb collection retrieval: ", str(e))
        return {"rag_output": ["No data found"]}
    for query in queries:
        
        emb = await word_embedding(query)
        if not emb:
            continue
        results = collection_chunks.query(
            query_embeddings = [emb],
            n_results = 10,
            include = ['documents', 'metadatas', 'distances']
        )

        for doc, meta in zip(results['documents'][0], results['metadatas'][0]):
            print(doc, meta, "\n\n")
            if doc not in docs:
                docs.append(doc)
                meta['content'] = doc
                m_datas.append(meta)

    if not m_datas:
        print("No relevant documents found in RAG retrieval.")
        return {"rag_output": ["No data found"]}

    query = state.get('messages')[-1].content

    print("Initial retrieved chunks: ", m_datas, "\n\n")
    if docs:
        print("docs: ", docs, "\n\n")
        scoring_chunks = [(query, str(i)) for i in m_datas]
        scores = await compute_rank(scoring_chunks)
        scores_array = np.array(scores)
        top_select = min(len(scores), 20)
        print("Total final chunks retrieved: ", top_select, "\n\n")
        top_indices = np.argsort(scores_array)[::-1][:top_select]
        top_docs = [m_datas[i] for i in top_indices]
        top_scores = [scores[i] for i in top_indices]
        print("top_scores", top_scores, "\n")
        return {"rag_output":top_docs}
    else:
        return {"rag_output":["No data found"]}
'''

client = AsyncGroq(api_key=os.environ.get('GROQ_API'))

async def routing(state: GraphState):
    print("\n--- Running Routing Node ---")
    pdf_summary = state.get('summary')
    print(f"\n\nSummary in the Routing Node: {pdf_summary[:100]}\n\n")
    query = state.get('messages')[-1].content
    print(f"\n\nQuery: {query}\n\n")
    system_prompt = f"""
    You are a Routing and Query Expansion Specialist.

    ## YOUR JOB:
    Decide if the user's query needs RAG (retrieval from document chunks) or can be answered from the summary alone.

    ### CONTEXT
    Document Summary: {pdf_summary}

    ### ROUTING RULES (FOLLOW STRICTLY):
    
    Route to "Rag": "yes" if ANY of these are true:
    - The query asks about specific content, details, data, findings, methods, declarations, definitions, or sections from the document.
    - The query asks "what", "how", "why", "explain", "describe", "list", "define" about document topics.
    - The query references specific terms, concepts, tables, figures, or results that need detailed chunk-level information.
    - The summary does NOT contain enough detail to fully answer the query.
    - When in doubt, ALWAYS route to RAG. It is better to retrieve and not need it than to miss information.
    - Generate EXACTLY 3 alternative search queries (rephrased versions, same meaning).

    Route to "Rag": "no" ONLY if ALL of these are true:
    - The user is making casual conversation ("Hello", "How are you?", "Thank you").
    - OR the user asks ONLY about document metadata ("title", "pdf name", "author", "number of pages").
    - Query field should have only the original query.

    ### DEFAULT BEHAVIOR: When uncertain, ALWAYS output "yes".
    
    No explanation. No extra text. Output ONLY JSON.
    ### OUTPUT JSON
    {{"Rag": "yes" or "no", "confidence": 0.0 to 1.0, "Query": [list of search queries]}}
    """

    try:
        response = await client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"User Query: {query}"}
            ],
            temperature=0,
            response_format={"type": "json_object"}
        )
        content = response.choices[0].message.content
        data = json.loads(content) 
        print(f"\n\nData output: {data}\n\n")
        rag_decision = data.get("Rag", "yes").lower()
        extracted_queries = data.get("Query", [query])
        if not extracted_queries:
            extracted_queries = [query]
        print(f"Routing Decision: {rag_decision}, Extracted Queries: {extracted_queries}\n")
        return {"rag": rag_decision, "queries": extracted_queries}

    except Exception as e:
        print(f"Router Error: {e}")
        # Default to YES on error — better to retrieve than miss
        return {"rag": "yes", "queries": [query]}

async def AI(state: GraphState):
    print("\n--- Running AI Node ---")
    # 1. Prepare RAG context
    rag_output = state.get("rag_output", [])
    summary = state.get("summary", "No summary availabe")
    rag_content =  "\n".join([str(d) for d in rag_output]) if rag_output else "No rag chunks retrieved."

    kg_content = state.get("kg_output", "")

    # 2. Extract and format history
    # We need to extract the string content from LangChain objects
    history = state["messages"][:-1]
    last_user_msg = state["messages"][-1].content  # Get the string content
    print("\n\nReport:")
    print("Summary length: ", len(summary.split()))
    print("Last user message: ", len(last_user_msg.split()))
    # 3. Create the System Prompt string
    system_text = (
        "You are a strict AI Research Assistant. Provide accurate responses based on the context provided.\n\n"

        f"###Document summary: {summary}"

        "### DATA SOURCE HIERARCHY:\n"
        "1. [USER INPUT]: Treat user info (e.g., name, preferences) as FACT. Do not search for them.\n"
        "2. If the answer is in Document summary then answer it elaborately."
        "3. [KG CONTENT]: Keyword and relation references for RAG CONTENT."
        "4. [RAG CONTENT]: Primary source for document info.\n"
        "5. [TAVILY RESULTS]: Use for real-world info NOT in RAG or User Input.\n"
        
        "### SEARCH PROTOCOL (FIXED):\n"
        "- Set 'tavily': True ONLY if [RAG CONTENT] is missing the answer, Summary is not availabe AND the user did NOT provide the answer.\n"
        "- If the user just introduced themselves (e.g., 'My name is X'), set 'tavily': False and 'Answer': 'Hello X!'.\n"
        "- **CRITICAL:** If you are unsure or the answer is obvious from context, set 'tavily': False.\n"
        
        "### OUTPUT RULES:\n"
        "- If 'tavily': True, set 'Answer': null and provide 'search_query'.\n"
        "- If 'tavily': False, provide the full answer in 'Answer' field (Markdown).\n"
        "- Use citations [Page X] for RAG content."
    )
    
    print("\n\nSystem Prompt length: ", len(system_text.split()), "\n\n")
    # 4. Format messages for Groq (MUST be a list of dicts with string content)
    formatted_messages = [{"role": "system", "content": system_text}]
    if state.get("chat_summary"):
        print("Chat summary length: ", len(state["chat_summary"].split()))
        formatted_messages.append({"role": "system", "content": f"Previous Chat Summary: {state['chat_summary']}"})
    his = []
    for msg in history:
        role = "assistant" if isinstance(msg, AIMessage) else "user"
        his.append(str(msg.content))
        formatted_messages.append({"role": role, "content": str(msg.content)})

    print("History length: ", len("\n".join(his).split()))

    was_searched = state.get("search", False)
    tavily_data = state.get("tavilyoutput", "")
    print("\n\nKG content: ", kg_content[:150], "\n\n")
    if was_searched and tavily_data != "None returned":
        formatted_messages.append({
            "role": "user", 
            "content": f"SEARCH RESULTS:\n{tavily_data}\n\nBased on these results, answer the query: {last_user_msg}"
        })
        # Force schema to ensure it answers now
        current_schema = RouterSchema
    
    else:
        # Initial pass where model decides if it needs search
        combined_query = f"[KG CONTENT]\n{kg_content}\n\n[Rag content]\n{rag_content}\n\n[User Query]\n{last_user_msg}"
        formatted_messages.append({"role": "user", "content": combined_query})
        current_schema = RouterSchema

    #models = ["openai/gpt-oss-120b", "meta-llama/llama-4-scout-17b-16e-instruct"]#["openai/gpt-oss-20b"]# #"openai/gpt-oss-20b"# "llama-3.3-70b-versatile"]
    models = ["meta-llama/llama-4-scout-17b-16e-instruct", "llama-3.3-70b-versatile"]

    for model_name in models:
        print(model_name)
        try:
            response = await client.chat.completions.create(
                model=model_name,
                messages=formatted_messages,
                temperature=0.1,
                response_format={
                    "type": "json_schema",
                    "json_schema": {
                        "name": "RouterResponse",
                        "strict": True,
                        "schema": current_schema.model_json_schema()
                    }
                }
            )
            usage = response.usage

            print(f"Total Prompt Tokens: {usage.prompt_tokens}")

            print(f"Usage: {usage}")
            content = response.choices[0].message.content
            print("Model reponse: ", content)
            return {
                "messages": [AIMessage(content=content)],
                "tavilyoutput": "No retrival",
                "search": False
                }

        except Exception as e:
            print(f"Error with {model_name}: {e}")
            continue

    return {
        "messages": [AIMessage(content="All AI providers unavailable.")]
        }

async def imagine(state: GraphState):
    print("\n--- Running Imagine Node ---")
    latest_content = state.get("messages", [])[-1].content if state.get("messages") else ""
    if not latest_content.strip().startswith("{"):
        return {
            "messages": [AIMessage(content=f"Skipping image generation: {latest_content}")]
            }
    
    try:
        message = json.loads(latest_content)
    except json.JSONDecodeError:
        return {
            "messages": [AIMessage(content="Error decoding AI response JSON.")]
            }

    if message.get("image", False) is True:
        flow_list = message.get("Flow", [])
        if not flow_list:
            print("Warning: image is True but Flow list is empty.")
            return {
                "messages": [AIMessage(content="No flow data provided for visual generation.")]
                }
        
        output = flow_list[0]
        if output.get("Type", "") == "Mermaid":
            prompt = f"""
                Generate ONLY valid Mermaid graph LR code.

                Rules:
                - Do NOT include ``` or markdown
                - Do NOT include explanation
                - Output must be pure Mermaid code string

                Query:
                {output.get('query', '')}

                Output:
                {{"code": "Mermaid code here"}}
                """
            try:
                response = await client.chat.completions.create(
                    model="llama-3.1-8b-instant",
                    response_format={
                        "type": "json_object"
                    },
                    messages=[{
                        "role": "user",
                        "content": prompt
                        }],                   
                        temperature=0
                )
                code = json.loads(response.choices[0].message.content).get("code", "")
                return {"messages": [AIMessage(content=f"Mermaid code: {code}")]}
            except Exception as e:
                print(f"Error: {e}")
                return {"messages": [AIMessage(content=f"Mermaid gen failed: {e}")]}
    return {"messages": [AIMessage(content="No image generation required.")]}

async def tavilysearch(state: GraphState):
    print("\n--- Running Tavily Search ---")
    # Extract search_query from the last message in state
    latest_message = state.get("messages", [])[-1].content if state.get("messages") else ""
    search_query = "No query provided"
    
    if latest_message.startswith("{"):
        try:
            message_json = json.loads(latest_message)
            search_query = message_json.get("search_query", "No query provided")
        except json.JSONDecodeError:
            pass

    if search_query == ["No query", "No query provided"]:
        return {
            "tavilyoutput": "No search query generated by AI.",
            "search": False
        }

    try:
        tavily = TavilySearch(
            max_results=3, 
            search_depth="advanced"
            )
        search_response = tavily.invoke(search_query)
        results = search_response.get("results", [])
        news = "\n".join([f"Source: {r.get('title')}\n{r.get('content')}\n" for r in results])
        return {"tavilyoutput": news, "search": True}

    except Exception as e:
        print(f"Tavily Error: {e}")
        return {
            "tavilyoutput": "None returned",
            "search": False
            }

async def summarize_conversation(state: GraphState):
    print("\n\n\nSummarizing the conversations\n\n\n")
    # Use chat_summary for conversation history, NOT 'summary' (which is for PDF)
    existing_chat_summary = state.get("chat_summary", "")
    all_messages = state["messages"]
    
    to_summarize = all_messages[:-5]
    
    summary_prompt = f"Current summary: {existing_chat_summary}\n\nNew messages to add to summary: {to_summarize}" if existing_chat_summary else f"Messages to be summarized: {to_summarize}"
    
    try:
        response = await client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "Summarize the conversation briefly."},
                {"role": "user", "content": summary_prompt}
            ]
        )
        new_chat_summary = response.choices[0].message.content
        delete_actions = [RemoveMessage(id=m.id) for m in to_summarize]

        return {
            "chat_summary": new_chat_summary, 
            "messages": delete_actions
        }
    except Exception as e:
        print(f"Summarization error: {e}")
        return {"messages": []}

async def summarize_condition(state: GraphState):
    if len(state["messages"]) > 7:
        return "summarize"
    return "END"

async def routing_condition(state: GraphState):
    return "yes" if str(state.get("rag") or "").lower() == "yes" else "no"

async def start_condition(state: GraphState):
    return "yes" if state.get("summary", "None") != "None" else "no"

async def image_condition(state: GraphState):
    latest_message = state.get("messages", [])[-1].content
    try:
        if latest_message.startswith("{"):
            json_message = json.loads(latest_message)
            tavily = json_message.get("tavily", False)
            image = json_message.get("image", False)

            if tavily and image: return "Both"
            if image: return "image"
            if tavily: return "tavily"
    except:
        pass
    return "No"

async def summarizer_cond(state: GraphState):
    return {}

async def both_routing(state: GraphState):
    return {}

graph = StateGraph (GraphState)
graph.add_node("routing", routing)
graph.add_node("AI", AI)
#graph.add_node("rag", rag_output)
graph.add_node("kg_rag", kg_rag)
graph.add_node("summarizer", summarize_conversation)
graph.add_node("summarizer_cond", summarizer_cond)
graph.add_node("image_generation", imagine)
graph.add_node("tavilysearch", tavilysearch)
graph.add_node("both_routing", both_routing) 

graph.add_conditional_edges(START, start_condition,{
    "yes":"routing",
    "no":"AI"
})
graph.add_conditional_edges("routing",routing_condition,{
    "yes":"kg_rag",
    "no":"AI"
})
graph.add_edge("kg_rag", "AI")

graph.add_conditional_edges("AI", image_condition, {
    "Both":"both_routing",
    "image":"image_generation",
    "tavily":"tavilysearch",
    "No":"summarizer_cond"
    }
)
graph.add_edge("both_routing", "image_generation")
graph.add_edge("both_routing", "tavilysearch")
graph.add_edge("tavilysearch", "AI")
graph.add_edge("image_generation", "summarizer_cond")
graph.add_conditional_edges("summarizer_cond", summarize_condition,{
    "summarize":"summarizer",
    "END":END
})
graph.add_edge("summarizer", END)
qdrant_client = None
emb_model = None

async def get_graphs(pool: AsyncConnectionPool, qdrant_client_object: QdrantClient = None, emb_model_object = None):
    retries = 3
    global qdrant_client, emb_model
    if not qdrant_client and qdrant_client_object:
        qdrant_client = qdrant_client_object
    if not emb_model:
        emb_model = emb_model_object
    '''
    for attempt in range(retries):
        try:
            checkpointer = AsyncPostgresSaver(pool)
            await checkpointer.setup() 
            return graph.compile(checkpointer=checkpointer)
            
        except Exception as e:
            if attempt < retries - 1:
                wait_time = 2 ** attempt  # Exponential backoff (1s, 2s, 4s)
                logging.warning(f"Connection failed, retrying in {wait_time}s... Error: {e}")
                await asyncio.sleep(wait_time)
            else:
                logging.error("Final attempt to connect to Postgres failed.")
                raise e
    '''
    for attempt in range(retries):
        try:
            if pool.closed:
                await pool.open()
                
            checkpointer = AsyncPostgresSaver(pool)
            await checkpointer.setup() 
            return graph.compile(checkpointer=checkpointer)

        except (psycopg.OperationalError, Exception) as e:
            print(f"Connection attempt {attempt + 1} failed: {e}")
            if attempt == retries - 1:
                raise
            await asyncio.sleep(1) # Wait a second before trying again