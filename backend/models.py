from sqlmodel import SQLModel, Field
from typing import Optional

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    hashed_password: str
    role: str = Field(default="user") # 'admin' or 'user'

class UserCreate(SQLModel):
    username: str
    password: str
    role: str = "user"

class Token(SQLModel):
    access_token: str
    token_type: str
    role: str