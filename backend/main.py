from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import auth, todos
import models

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title       = "Smart Todo API",
    description = "REST API for todo management with JWT authentication",
    version     = "2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(todos.router)

@app.get("/")
def root():
    return {"message": "Smart Todo API is running!"}