from fastapi import APIRouter, Depends, HTTPException
from typing import Annotated
import torch
import numpy as np

from .schemas import MessageInput, PredictionResponse, ErrorResponse
from .deps import get_recommender, get_processor
from models.recommender import EmojiRecommender
from models.processor import DataProcessor

router = APIRouter()


@router.post(
    "/predict",
    response_model=PredictionResponse,
    responses={500: {"model": ErrorResponse}, 422: {"model": ErrorResponse}},
)
async def predict_emojis(
    message: MessageInput,
    recommender: Annotated[EmojiRecommender, Depends(get_recommender)],
    processor: Annotated[DataProcessor, Depends(get_processor)]
) -> PredictionResponse:
    """メッセージに対して適切な絵文字を予測する"""
    try:
        text = processor.preprocess_text(message.message_text)
        inputs = processor.bert_tokenizer(
            text,
            return_tensors="pt",
            padding=True,
            truncation=True,
            max_length=128
        )
        
        with torch.no_grad():
            outputs = processor.bert_model(**inputs)
            message_vector = outputs.last_hidden_state.mean(dim=1).numpy()[0]

        user_vector = recommender.get_user_features(message.user_id)

        channel_cols = [col for col in recommender.feature_columns if col.startswith("channel_")]
        channel_features = np.zeros(len(channel_cols))
        channel_col = f"channel_{message.channel_id}"
        if channel_col in recommender.feature_columns:
            channel_idx = channel_cols.index(channel_col)
            channel_features[channel_idx] = 1

        features = np.concatenate([
            message_vector,  
            user_vector,    
            channel_features,
            [message.ts]    
        ])

        predictions = recommender.predict(features)

        return PredictionResponse(
            message_id=message.message_id,
            predictions=predictions
        )

    except ValueError as e:
        raise HTTPException(
            status_code=422,
            detail={"error": str(e), "code": "VALIDATION_ERROR"}
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"error": str(e), "code": "PREDICTION_ERROR"}
        )