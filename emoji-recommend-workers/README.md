# Emoji Recommend Cloudflare Workers Vectorize

## 技術詳細

Cloudflare AI Gateway を通して、Hugging Face Inference API の[intfloat/multilingual-e5-large](https://huggingface.co/intfloat/multilingual-e5-large)を使用する。
絵文字に対して独自に用意した意味ラベルや投稿内容の Embedding を行う。
得られたベクトルを Cloudflare Vectorize にそれぞれ namespace を分けて保存する。

投稿内容を受け取り、上記と同様に Embedding を行い、Vectorize に対して query し、コサイン類似度を用いて似た絵文字を3つ得る

## Development

``` bash
cd emoji-recommend-workers
bun i
bun run dev --remote
```

``` bash
bun run deploy
```
