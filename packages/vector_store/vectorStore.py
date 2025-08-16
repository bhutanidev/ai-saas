import os
from pinecone import Pinecone, ServerlessSpec
from dotenv import load_dotenv

load_dotenv()

# Load keys
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_ENVIRONMENT = os.getenv("PINECONE_ENVIRONMENT")
INDEX_NAME = "documents"

if not PINECONE_API_KEY or not PINECONE_ENVIRONMENT:
    raise ValueError("❌ Missing Pinecone API credentials in .env")

pc = Pinecone(
    api_key=os.environ.get("PINECONE_API_KEY")
)
INDEX_NAME = "documents"
# Now do stuff
if INDEX_NAME not in pc.list_indexes().names():
    pc.create_index(
        name=INDEX_NAME,
        dimension=768,
        metric='cosine',
        spec=ServerlessSpec(
            cloud='aws',
            region='us-east-1'
        )
    )


index = pc.Index(INDEX_NAME)

def upsert_embedding(id: str, embedding: list[float], metadata: dict):
    index.upsert([(id, embedding, metadata)])

def query_embedding(embedding: list[float], top_k: int = 5):
    return index.query(vector=embedding, top_k=top_k, include_metadata=True)

def delete_embedding(id: str):
    index.delete(ids=[id])
