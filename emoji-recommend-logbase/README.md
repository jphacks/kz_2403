# 絵文字レコメンドAPI

ログデータから独自の分類モデルを作成する

## 環境構築

``` bash
git clone <repository-url>
cd emoji-recommend-logbase



uv venv
source .venv/bin/activate # Windows: .venv\Scripts\activate
uv sync
uv pip install -e .
```

### モデルの学習

``` bash
uv run scripts/train_model.py
```

### 開発用APIサーバー

``` bash
uvicorn src.main:app --reload
```

### Docker

``` bash
docker compose up --build
```
