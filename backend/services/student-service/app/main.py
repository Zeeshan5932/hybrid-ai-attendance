from fastapi import FastAPI
from .db import Base, engine
from .routes import router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Student Service")
app.include_router(router)


@app.get("/health")
def health():
    return {"status": "ok"}
