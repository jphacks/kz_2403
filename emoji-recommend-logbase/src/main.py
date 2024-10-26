from fastapi import FastAPI, HTTPException
from api.routes import router

app = FastAPI(
    title="Emoji Recommender API",
    description="Slack メッセージに対する絵文字推薦API",
    version="1.0.0"
)

app.include_router(router, prefix="/api/v1")

@app.post("/ping")
async def ping():
    try:
        return {"message": "pong"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
