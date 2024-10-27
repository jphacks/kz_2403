FROM python:3.12-slim as builder

WORKDIR /app

# ビルドに必要なツールのインストール
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# uvのインストール
RUN pip install uv

# 依存関係ファイルのコピー
COPY pyproject.toml .
COPY uv.lock .
COPY README.md .

# 依存関係のインストール
RUN uv venv && \
    . .venv/bin/activate && \
    uv sync

COPY ./src ./src
COPY ./scripts ./scripts
COPY ./data ./data

# パッケージのインストール
RUN . .venv/bin/activate && \
    uv pip install -e .

# 実行ステージ
FROM python:3.12-slim

WORKDIR /app

# 必要なファイルのみをbuilderステージからコピー
COPY --from=builder /app/.venv ./.venv
COPY --from=builder /app/src ./src
COPY --from=builder /app/data ./data
COPY --from=builder /app/scripts ./scripts
COPY .env .

# 環境変数の設定
ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONPATH="/app:$PYTHONPATH"

EXPOSE 30808

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:30808/health || exit 1

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "30808"]