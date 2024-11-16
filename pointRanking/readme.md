# 概要

Slackに関するあらゆるデータ（メッセージデータ、絵文字データ、ユーザーデータなど）を保存し、各種スラッシュコマンドを実装。

---

## ポイントランキング

### 概要

ユーザーがプロジェクトのコミュニケーション活性化にコミットする動機として、リアクションを行うたびにポイントを付与する。その合計を定期実行で月初に表示したり、任意で現在のポイント状況を確認できるようにする。

### 流れ

1. **データ保存**
   - Slack APIがユーザーのリアクション（メッセージや絵文字）を受け取り、Slackbotがそれに応じてSupabaseに各種データを保存するイベントを送信。

     > 💡 **エラー防止:** 各種操作の前にテーブル内の依存関係に問題がないか確認を行う。

   - その後、以下の条件でポイントを`userNew`テーブルに保存。
     - 絵文字を押した順番が1番の人に3ポイント、2番目の人に2ポイント、3番目以降の人に1ポイントを付与
     - 送信後、5分以内に絵文字を押した人に1ポイントを付与
     - メンション（`@〇〇`）を使用した人に1ポイントを付与
     - 特定のキーワードを使用した人に1ポイントを付与

     > 💡 **注意:** メッセージ毎に付与するポイントは一度だけにしたいため、`ensureHasUserReactedBefore`で確認して重複を防ぐ。

   - Supabaseを採用しているため、リアルタイムでデータが更新される。

2. **データ表示**
   - 以下の方法で、現在のポイント取得状況を確認。
     - `ranking`コマンドを入力

       <img src="https://github.com/user-attachments/assets/100270d3-0572-42cd-8490-64af751169e5" width="400">

       - **全体ランキング**

         <img src="https://github.com/user-attachments/assets/a7f9b3ea-994a-4297-b781-a4d1e02f2b3a" width="400">
       - **月別ランキング**

         <img src="https://github.com/user-attachments/assets/2285f3cc-68f6-46d0-b0b2-55e02cee0b96" width="400">
       - **個人ポイント**

         <img src="https://github.com/user-attachments/assets/32506f09-0607-40d2-b101-1e3980d8af70" width="200">

     - **月末実行**
       - Cloudflare Workersで月別ランキングを月末に実行

   - これにより、任意のチャンネルでランキングを表示することができる。

---

## ランダム質問

### 概要

- **ランダム質問の送信**: 定期的にワークスペース内のアクティブなユーザーに対してランダムな質問をDMで送信。
- **回答の収集と表示**: ユーザーが回答すると、その回答を指定されたチャンネルに投稿。
- **スケジューリング**: 質問の送信は、指定された営業時間内（10:00〜20:00）の2〜4時間の間隔で行われる。

### 流れ

1. `randomQuestionScheduler.ts`が定期的に`sendRandomQuestion`を呼び出し、ユーザーに対して`question.json`からランダムな質問を送信。
2. ユーザーがDMで質問に回答すると、`modalHandler.ts`が回答を処理し、回答内容が指定されたチャンネルに送信される。回答後、ユーザーにはDMで感謝のメッセージが届く。

---

## 質問投稿機能

### 概要

`/question`コマンドを使用すると、質問モーダルが開き、ユーザーは任意のチャンネルに質問を投稿できる。投稿された質問は`@channel`で全ユーザーに通知され、他のユーザーは「回答する」ボタンを押すことで質問に返答できる。返答は指定されたチャンネルにスレッドとして投稿され、回答者のプロフィール画像も表示される。

### 流れ

1. ユーザーが`/question`コマンドを入力すると、ハンドラーがコマンドを受け取り質問モーダルを開く。

   <img src="https://github.com/user-attachments/assets/9deb9600-1123-4be8-80c8-ce29994f1e18" width="500">

2. ユーザーが質問内容と必要に応じて画像を入力・アップロードし、投稿ボタンを押す。

   <img src="https://github.com/user-attachments/assets/3c791b05-dce8-4fc8-bcbf-0a3a1cd5277f" width="500">

3. `handleQuestionAnswerSubmission`ハンドラーがモーダルの送信イベントを受け取り、入力された質問と画像URLを取得し、指定されたチャンネルにメンション付きで投稿される。

   <img src="https://github.com/user-attachments/assets/00431d60-6de2-4e0d-9e9d-1200325a9aa6" width="600">

4. 「回答する」ボタンを押すと、回答モーダルが開き、送信ボタンを押すことで質問と同様の流れで返信が投稿される。

   <img src="https://github.com/user-attachments/assets/d2ae4b19-8682-4a62-a0e2-96da024275e9" width="500">

   <img src="https://github.com/user-attachments/assets/aec700ee-9fc4-45ac-9b1b-bfc8ed7dacfb" width="300">

---

## 投票機能

### 概要

アンケートやミーティングの調整を行いたい際に使用できる機能。投票を希望するユーザーが質問内容、選択肢、および制限時間を設定することで、任意のチャンネルに投票メッセージが表示される。他のユーザーはボタンを押して投票に参加でき、制限時間が終了すると自動的に結果が集計・表示される。リアルタイムで現在の投票状況も確認可能。

### 流れ

1. ユーザーが`/vote`コマンドを入力すると、ハンドラーがコマンドを受け取り投票設定モーダルを開く。

2. モーダルには投票の質問、選択肢、画像をアップロードするフィールド、終了日時を選択するフィールドが含まれており、入力後に送信ボタンを押す。

   <img src="https://github.com/user-attachments/assets/82b81f54-82c1-4420-8c7d-5f7a70833d7d" width="500">

3. `handleVoteModalSubmission`関数がモーダルの送信イベントを処理し、投票メッセージのブロックを作成後、任意のチャンネルに投票の質問が投稿される。また、投票終了時刻に合わせてタイマーがセットされる。

   <img src="https://github.com/user-attachments/assets/2fb400e9-0e04-40a5-960c-fcb28d5755fa" width="500">

4. ユーザーが投票すると、`handleVote`関数が呼び出され、投票データが更新される。投票が更新されると、メッセージがリアルタイムで更新され、現在の投票結果が反映される。

   <img src="https://github.com/user-attachments/assets/21e76746-7c58-480c-a267-7ae401a3ff76" width="500">

5. 指定された時間になると、タイマーが終了し、最終結果が表示される。

   <img src="https://github.com/user-attachments/assets/e774bffc-9bc9-405c-986e-3f7aa24d3bca" width="500">

---

## 文字装飾機能

### 概要

主張を強調したいときにおすすめの機能。複数の種類の装飾を施した大きめの文字を任意のチャンネル上に送信できる。ユーザーは異なるスタイルを選択して、テキストを視覚的に強調することが可能。

### 流れ

1. ユーザーがSlackで`/decorate`コマンドを入力する。
2. `decorateCommand.ts`のハンドラーがこのコマンドを受け取り、装飾設定モーダルを開く。
3. モーダルには装飾するテキストを入力するフィールドと、装飾スタイルを選択するセクションが含まれており、テキストを入力し、スタイルを選択する。

   <img src="https://github.com/user-attachments/assets/1291ccec-a4e9-4385-8267-9147ca1e7ce9" width="500">

4. `handleDecorateModalSubmission`関数によって送信イベントが処理され、装飾されたテキストが任意のチャンネルに生成される。

   <img src="https://github.com/user-attachments/assets/55c364d4-0fd4-4f54-9d6d-70efba1fc784" width="300">

---
