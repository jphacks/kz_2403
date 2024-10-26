from pydantic import BaseModel, Field
from typing import List


class MessageInput(BaseModel):
    """
    メッセージ入力のスキーマ
    """

    message_text: str = Field(..., description="メッセージのテキスト内容")
    user_id: str = Field(..., description="投稿者のユーザーID")
    channel_id: str = Field(..., description="投稿されたチャンネルID")
    ts: str = Field(..., description="メッセージのタイムスタンプ")
    message_id: str = Field(..., description="メッセージのID")

    class Config:
        json_schema_extra = {
            "example": {
                "message_text": "すばらしい成果ですね！",
                "user_id": "U123456",
                "channel_id": "C789012",
                "ts": "1234567890.123456",
            }
        }


class EmojiPrediction(BaseModel):
    emoji: str
    probability: float

class PredictionResponse(BaseModel):
    message_id: str
    predictions: List[EmojiPrediction]

class ErrorResponse(BaseModel):
    error: str
    code: str
