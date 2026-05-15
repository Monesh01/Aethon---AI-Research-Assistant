import asyncio
import sys
asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

if False:
    print("Initializing Phoenix...")
    import phoenix as px
    from openinference.instrumentation.langchain import LangChainInstrumentor
    try:
        # This starts the background trace server
        px.launch_app(port=6006)
        print("✅ Phoenix dashboard available at http://localhost:6006")
        
        # This hooks into LangGraph/LangChain
        LangChainInstrumentor().instrument()
        print("✅ LangChain Instrumentation active")
    except Exception as e:
        print(f"❌ Failed to start Phoenix: {e}")

#if sys.platform == 'win32':
#    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
import torch
from typing import Annotated, List, Optional, TypedDict, List, Union, Literal
#from typing_extensions import TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
import re
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from fastapi.staticfiles import StaticFiles
import fitz 
import pymupdf4llm
from groq import Groq
import chromadb
import uuid
from uuid import uuid4
import os
import numpy as np
from PIL import Image
import io
from sentence_transformers import SentenceTransformer
from google import genai
from pydantic import BaseModel, Field
from google.genai import types
from langchain_ollama import ChatOllama 
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, RemoveMessage
from langgraph.checkpoint.memory import MemorySaver
from langgraph.prebuilt import tools_condition
from datetime import datetime
import json
import gc
from dotenv import load_dotenv
from llama_index.core import Document, SimpleDirectoryReader
from llama_index.core.node_parser import SemanticSplitterNodeParser, MarkdownNodeParser, SentenceSplitter
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from groq import AsyncGroq  # Use AsyncGroq for FastAPI
from FlagEmbedding import FlagReranker
from langchain_core.callbacks import StreamingStdOutCallbackHandler
from openai import InternalServerError, APIConnectionError, RateLimitError
from llama_index.core.ingestion import IngestionPipeline
from langchain_text_splitters import RecursiveCharacterTextSplitter
import asyncio
from fastapi.responses import StreamingResponse
from pathlib import Path
from fastapi.middleware.cors import CORSMiddleware
import niquests as requests
from supabase import create_client
import pymupdf
#from gotrue.errors import AuthApiError
from supabase import AuthApiError
from pydantic import BaseModel, Field, ConfigDict
from langchain_tavily import TavilySearch
from langchain_groq import ChatGroq
from langchain_core.tools import tool
import chromadb
from chromadb.utils import embedding_functions
from langchain_core.output_parsers import JsonOutputParser, StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from pyvis.network import Network
import operator
from typing import TypedDict, List, Tuple, Annotated, Any, Dict
import networkx as nx
import time
from contextlib import asynccontextmanager
from psycopg_pool import AsyncConnectionPool
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
import urllib.parse

from auth_logins import login_credits
from file_handling import session_creation

from langGraph_app import get_graphs
import wave
from IPython.display import display
from kokoro_onnx import Kokoro
import soundfile as sf
from tqdm import tqdm
from qdrant_client import QdrantClient
from qdrant_client.http import models

# Windows-specific fix for Psycopg async connectivity
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

os.environ['TAVILY_API_KEY'] = "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"
for key in ['GOOGLE_API_KEY', 'GROQ_API', 'SUPABASE_URL', 'SUPABASE_ANON_KEY']:
    val = os.getenv(key)
    if val:
        os.environ[key] = val.strip()
        if key == 'GROQ_API':
            os.environ['groq_api'] = val.strip()

load_dotenv()

llm = ChatGroq(
    model="meta-llama/llama-4-scout-17b-16e-instruct", #"llama-3.3-70b-versatile", # Using a strong model for extraction
    temperature=0.1,
    api_key= os.environ.get('GROQ_API')
)

model = ChatOllama(
    model="llama3.2:3b",
    #model = "qwen3:1.7b",
    num_ctx=8192,      
    #num_predict=1024,
    temperature=0,
    streaming=True,
    callbacks=[StreamingStdOutCallbackHandler()],
    stop=["<|im_start|>", "<|im_end|>", "<|eot_id|>"]
)

current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

# Ensure keys are in os.environ safely
for key in ['GOOGLE_API_KEY', 'GROQ_API', 'SUPABASE_URL', 'SUPABASE_ANON_KEY']:
    val = os.getenv(key)
    if val:
        os.environ[key] = val.strip()
        if key == 'GROQ_API':
            os.environ['groq_api'] = val.strip()


#reranker = FlagReranker('BAAI/bge-reranker-base', use_fp16=True) 

model = ChatGroq(
    model="meta-llama/llama-4-scout-17b-16e-instruct",
    api_key=os.environ.get('GROQ_API'),
    temperature=0,
)

password = os.environ['database_pass']
print(f"password: {password}\n\n")

encoded_password = urllib.parse.quote_plus(password)

# Now build the URI
DB_URI = f"postgresql://postgres:{encoded_password}@db.kvkmwtjhxgjvjwcrcvdf.supabase.co:5432/postgres"

# 2. Configure Connection Pool for Production (Multi-user ready)
connection_kwargs = {
    "autocommit": True, 
    "prepare_threshold": 0,
    "keepalives": 1,
    "keepalives_idle": 30,
    "keepalives_interval": 10,
    "keepalives_count": 5,
}

pool = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global pool
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    pool = AsyncConnectionPool(
        conninfo=DB_URI,
        max_size=20,
        kwargs=connection_kwargs,
        open=False,
        check=AsyncConnectionPool.check_connection,
        max_idle=30,                        
        reconnect_timeout=5               
    )
    await pool.open()
    yield
    await pool.close()

def save_wav(filename, pcm_data, sample_rate=24000):
    with wave.open(filename, "wb") as wf:
        wf.setnchannels(1)        # mono
        wf.setsampwidth(2)        # 16-bit
        wf.setframerate(sample_rate)
        wf.writeframes(pcm_data)

async def generate_tts_file(text, session_id):
    """
    Modified version of your text_to_speech to be async friendly 
    and session-specific.
    """
    client = genai.Client(api_key=os.environ['GOOGLE_API_KEY'])
    model_id = "gemini-2.5-flash-preview-tts" 
    output_file = f"speech_{session_id}.wav"

    try:
        response = client.models.generate_content(
            model=model_id,
            contents=text,
            config=types.GenerateContentConfig(
                response_modalities=["audio"],
                speech_config={
                    "voice_config": {
                        "prebuilt_voice_config": {
                            "voice_name": "Kore" 
                        }
                    }
                }
            )
        )
        audio_data = response.candidates[0].content.parts[0].inline_data.data
        save_wav(output_file, audio_data, sample_rate=24000)
        return output_file
    except Exception as e:
        print(f"TTS Error: {e}")
        return None

URL = os.environ['SUPABASE_URL']
KEY = os.environ["SUPABASE_ANON_KEY"]
supabase = create_client(URL, KEY)
qdrant_client = QdrantClient(path="./my_local_db")

from FlagEmbedding import BGEM3FlagModel
emb_model = BGEM3FlagModel('BAAI/bge-m3', use_fp16=True)


app = FastAPI(title="High Performance RAG API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount current directory to serve local images securely to frontend
app.mount("/images_static", StaticFiles(directory=".", html=True), name="images_static")

@app.get("/")
async def root():
    # Just a health check or status message
    return {"status": "API is running", "message": "Connect via Streamlit"}

@app.post("/sign_up")
async def sign_up(
    email: str = Form(...),
    password: str = Form(...)
    ):
    output = await login_credits(email, password, sign_up, supabase)
    return output

@app.post("/sign_in")
async def sign_in(
    email: str = Form(...),
    password: str = Form(...)
    ):
    output = await login_credits(email, password, sign_in, supabase)
    return output

async def delete_user_folder(user_id: str, session: str):
    try:
        session_data = json.loads(session) if session else {}
    except Exception as json_err:
        print(f"Session JSON parse error: {json_err}")
        session_data = {}
    access_token = session_data.get("access_token")
    refresh_token = session_data.get("refresh_token")
    URL = os.environ['SUPABASE_URL']
    KEY = os.environ["SUPABASE_ANON_KEY"]
    #supabase = create_client(URL, KEY)
    #user_supabase.auth.set_session(access_token, refresh_token)
    supabase.auth.set_session(access_token, refresh_token)

    print(f"User id: {user_id}")
    files = supabase.storage.from_("File_management").list(path=str(user_id))
    print(files)
    if files:
        paths_to_remove = [f"{str(user_id)}/{f['name']}" for f in files]
        response = supabase.storage.from_("File_management").remove(paths_to_remove)
        print(f"Deleted folder contents for: {user_id}")
        return response

    else:
        print("Folder is already empty or does not exist.")
        return None

@app.delete("/new_session")
async def deletion(
    user_id: str,
    session_id: str,
    session: str,
    Delete: bool
    ):
    if Delete:
        print(f"\n--- Resetting session for {user_id} ---")
        
        
        target_collections = [f"collection_chunks_{session_id}", f"collection_nodes_{session_id}"]
        existing_collections = [
            col.name for col in qdrant_client.get_collections().collections
        ]
        print("Target_collections: ", target_collections)
        print("Existing_collections: ", existing_collections)
        for target in target_collections:
            if target in existing_collections:
                try:
                    qdrant_client.delete_collection(collection_name=target)
                    print("Deleted Collection: ", target)
                except Exception as e:
                    print(f"Delete failed for {target}: {e}")

        existing_collections = [
            col.name for col in qdrant_client.get_collections().collections
        ]
        print("\n\nExisting_collections after deletion: ", existing_collections)
        summary = "None"
        file_ = await delete_user_folder(user_id, session) # Clear Supabase storage
        print(file_)
        print("\n\n\nSummary of the pdf: ", summary, "\n\n\n")
        response = supabase.table("file_table").delete().eq("id", user_id).execute()
        print(f"File table: {response}")
        new_session_id = str(uuid4())

        info = supabase.table('User Info').upsert({
                    "id":user_id, 
                    "session_id":new_session_id
                    }
                ).execute() # Added .execute()
        print(f"User Info updated with new session ID\n\n\n:  {info}")
        print(response)

        deleted_id = response.data[0].get("session_id") if response.data else "none"
        output = {
            "session_id": new_session_id, 
            "status": "cleared", 
            "message": "RAG and summary reset.", 
            "response": deleted_id
        }
        return output
#chromadb_client = chromadb.PersistentClient(path="./my_local_db")

@app.post("/file")
async def file_handling(
    user_id: str = Form(...),
    session_id: Optional[str] = Form(None),
    session: str = Form(None),
    file: List[UploadFile] = File(...)
    ):
    collection_chunks = f"collection_chunks_{session_id}"
    collection_nodes = f"collection_nodes_{session_id}"
    

    if file:
        G = nx.MultiDiGraph()
        try:
            '''
            collection_chunks = chromadb_client.get_or_create_collection(    #or_create_collection
                name=f"data_{session_id}", 
                metadata={"hnsw:space": "cosine"}
            )
            '''
            if not qdrant_client.collection_exists(collection_chunks):
                dimensions = 1536
                qdrant_client.create_collection(
                    collection_name=collection_chunks,
                    vectors_config=models.VectorParams(
                        size=dimensions, 
                        distance=models.Distance.COSINE
                    ),
                )
                print(f"\nCollection '{collection_chunks}' created at path.")
            else:
                print(f"\nCollection '{collection_chunks}' loaded from path.")
            '''
            ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
            client = chromadb.PersistentClient(path="./chroma_db")
            collection_node = client.get_or_create_collection(name="kg_triplets", embedding_function=ef)
            '''
            if not qdrant_client.collection_exists(collection_nodes):
                dimensions = 1024
                qdrant_client.create_collection(
                    collection_name=collection_nodes,
                    vectors_config=models.VectorParams(
                        size=dimensions, 
                        distance=models.Distance.COSINE
                    ),
                )
                print(f"\nCollection '{collection_nodes}' created at path.")
            else:
                print(f"\nCollection '{collection_nodes}' loaded from path.")


            output = await session_creation(G, user_id, session_id, session, supabase, pool, file, emb_model, qdrant_client, collection_chunks, collection_nodes)
            return output 
        except Exception as e:
            print(f"Error in file handling: {e}")
            raise HTTPException(status_code=500, detail="File processing failed.")

kokoro = Kokoro(
    #"kokoro-quant-convinteger.onnx", <--- int8
    "kokoro-quant-gpu.onnx",
    "voices-v1.0.bin"
)
async def podcast(text: str, session_id: str, format: str = "wav"):
    voice = "af_sarah"
    text = text.replace("##", "").replace("###", "").replace("####", "").replace("***", "").replace("**", "").replace("\n\n\n", " ").replace("\n\n", " ").replace("\n", " ")
    samples, sample_rate = kokoro.create(text, voice=voice, speed=1.1)
    unique_id = uuid.uuid4().hex[:8]
    path = f"output_{session_id}_{unique_id}.{format}"

    sf.write(path, samples, sample_rate)
    return path

@app.post("/query")
async def query_handling(
    query: Optional[str] = Form(None),
    user_id: str = Form(...),
    session_id: Optional[str] = Form(None),
    session: str = Form(...),
    summary: Optional[List[str]] = Form(None),
    filename: Optional[List[str]] = Form(None)
    ):
    if query:
        async def event_generator():
            '''
            collection_chunks = chromadb_client.get_collection(    #or_create_collection
                name=f"data_{session_id}"
                #metadata={"hnsw:space": "cosine"}
            )
            '''
            config = {"configurable": {"thread_id": session_id}}
            current_filename = "\n".join(filename) if filename else ""
            compiled_graph = await get_graphs(pool)
            
            full_response_content = ""
            mermaid_content = ""

            # Only pass summary to graph if provided, to avoid overwriting persisted state
            initial_state = {
                "messages": [HumanMessage(content=query)], 
                "file_name": current_filename,
                "user_id":user_id,
                "session_id":session_id,
            }
            if summary:
                initial_state["summary"] = "\n\n".join(summary)

            async for message, metadata in compiled_graph.astream(
                initial_state,
                config,
                stream_mode="messages"
                ):
                if metadata.get("langgraph_node") == "AI" and isinstance(message.content, str):
                    content = message.content
                    if content.startswith("{"):
                        try:
                            data = json.loads(content)
                            content = data.get("Answer", content)
                        except Exception as e:
                            print(f"Error parsing AI JSON: {e}")
                    content = content if content else "No content"
                    full_response_content += content
                    print(content)
                    yield content
                elif metadata.get("langgraph_node") == "image_generation" and isinstance(message.content, str):
                    mermaid_content += message.content
                    raw_mermaid = message.content.replace("Mermaid code:", "").replace("Mermaid code: ", "").strip()
                    if raw_mermaid:
                        formatted_mermaid = f"\n```mermaid\n{raw_mermaid}\n```\n"
                        yield formatted_mermaid

            # --- AFTER STREAMING FINISHES, GENERATE AUDIO ---
            try:
                if full_response_content and not mermaid_content:
                    clean_text = re.sub(r'\[Image:.*?\]', '', full_response_content)
                    clean_text = re.sub(r'!\[.*?\]\(.*?\)', '', clean_text)
                    
                    audio_filename = await podcast(clean_text, session_id, format="wav") 
                    print("Audio output from kokoro")
                    yield f"||AUDIO_READY:{audio_filename}||"
            except Exception as e:
                print("Error while audio generation: ", str(e))

        return StreamingResponse(event_generator(), media_type="text/event-stream")

    raise HTTPException(status_code=400, detail="No input provided")

if __name__ == "__main__":
    import uvicorn
    

    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    print("🚀 API starting on http://0.0.0.0:5000")
    uvicorn.run(app, host="0.0.0.0", port=5000, loop="asyncio")

