from fastapi import FastAPI

app = FastAPI(
    title="Inventory & Stock Management API",
    version="1.0.0"
)


@app.get("/")
def root():
    return {"message": "Inventory API is running"}