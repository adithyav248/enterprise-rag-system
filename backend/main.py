import os
import shutil
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from database import create_db_and_tables, get_session
from models import User, UserCreate, Token
from auth import get_password_hash, verify_password, create_access_token, get_current_user, get_admin_user
import rag
from dotenv import load_dotenv
load_dotenv()

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    os.makedirs("uploads", exist_ok=True)

# AUTH ROUTES
@app.post("/register", response_model=Token)
def register(user: UserCreate, session: Session = Depends(get_session)):
    statement = select(User).where(User.username == user.username)
    if session.exec(statement).first():
        raise HTTPException(status_code=400, detail="Username already registered")
    
    db_user = User(
        username=user.username, 
        hashed_password=get_password_hash(user.password),
        role=user.role
    )
    session.add(db_user)
    session.commit()
    
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer", "role": user.role}

@app.post("/token", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    statement = select(User).where(User.username == form_data.username)
    user = session.exec(statement).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer", "role": user.role}

# RAG ROUTES
@app.post("/upload")
async def upload_document(
    file: UploadFile = File(...), 
    current_user: User = Depends(get_admin_user) # Only Admin
):
    file_location = f"uploads/{file.filename}"
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Trigger Vector Ingestion
    rag.ingest_file(file_location)
    
    return {"filename": file.filename, "status": "Ingested into Vector DB"}

@app.post("/chat")
def chat(query: str, current_user: User = Depends(get_current_user)):
    qa = rag.get_qa_chain()
    if not qa:
        return {"answer": "No documents uploaded yet.", "sources": []}
    
    response = qa({"query": query})
    
    # Extract source file names
    sources = list(set([doc.metadata['source'] for doc in response['source_documents']]))
    
    return {"answer": response['result'], "sources": sources}