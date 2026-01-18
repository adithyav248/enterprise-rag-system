import os
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.chains import RetrievalQA

# ENSURE YOU SET THIS ENV VAR BEFORE RUNNING
# os.environ["GOOGLE_API_KEY"] = "YOUR_GOOGLE_API_KEY"

DB_FAISS_PATH = "faiss_index"

def get_embeddings():
    # Uses a local model (free, no rate limits)
    return HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

def ingest_file(file_path: str):
    loader = PyPDFLoader(file_path)
    documents = loader.load()
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    texts = text_splitter.split_documents(documents)
    
    embeddings = get_embeddings()
    
    if os.path.exists(DB_FAISS_PATH):
        try:
            # FIXED LINE:
            vector_db = FAISS.load_local(DB_FAISS_PATH, embeddings)
            vector_db.add_documents(texts)
        except:
            vector_db = FAISS.from_documents(texts, embeddings)
    
    vector_db.save_local(DB_FAISS_PATH)

def get_qa_chain():
    if not os.path.exists(DB_FAISS_PATH):
        return None
    
    embeddings = get_embeddings()
    vector_db = FAISS.load_local(DB_FAISS_PATH, embeddings)
    retriever = vector_db.as_retriever(search_kwargs={"k": 3})
    
    llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash", 
    temperature=0.2, 
    convert_system_message_to_human=True
)
    qa_chain = RetrievalQA.from_chain_type(llm=llm, chain_type="stuff", retriever=retriever, return_source_documents=True)
    return qa_chain