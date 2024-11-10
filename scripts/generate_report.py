import os
from supabase import create_client
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError
from datetime import datetime, timedelta
import pandas as pd


# local 実行時のみ
# from dotenv import load_dotenv
# load_dotenv('.env')

# Supabase設定
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_KEY")
supabase = create_client(supabase_url, supabase_key)

# Slack設定
slack_token = os.environ.get("SLACK_BOT_TOKEN")
slack_channel = os.environ.get("SLACK_CHANNEL_ID")
client = WebClient(token=slack_token)

def get_date_info():
    """日付関連の情報を取得"""
    today = datetime.now()
    current_ym = today.strftime('%Y%m')
    
    # 先月の年月を取得
    last_month = (today.replace(day=1) - timedelta(days=1))
    last_month_ym = last_month.strftime('%Y%m')
    
    return current_ym, last_month_ym, last_month

def check_current_month_data(current_ym):
    """今月分のデータが既に存在するかチェック"""
    response = supabase.table('MonthLogNew') \
        .select('*') \
        .eq('year_month', current_ym) \
        .execute()
    
    return len(response.data) > 0

def calculate_monthly_points():
    """月次ポイント計算とランキング作成"""
    current_ym, last_month_ym, last_month = get_date_info()
    print(supabase)
    
    try:
        # 今月分のデータが既に存在するかチェック
        data_exists = check_current_month_data(current_ym)

        # UserNewテーブルから全ユーザーデータを取得（ユーザー名を含む）
        user_response = supabase.table('UserNew') \
            .select('*') \
            .execute()
        
        # 先月のMonthLogNewデータを取得
        last_month_response = supabase.table('MonthLogNew') \
            .select('*') \
            .eq('year_month', last_month_ym) \
            .execute()
        
        # データフレームに変換
        users_df = pd.DataFrame(user_response.data)
        last_month_df = pd.DataFrame(last_month_response.data)

        # 新規ログ用のデータを準備
        new_logs = []
        ranking_data = []
        
        # ユーザーごとの処理
        for _, user in users_df.iterrows():
            workspace_id = user['workspace_id']
            user_id = user['user_id']
            current_total = user['add_point']
            user_name = user['user_name']
            
            # 先月のログを検索
            last_month_log = last_month_df[last_month_df['user_id'] == user_id]
            last_month_point = last_month_log['month_add_point'].iloc[0] if not last_month_log.empty else 0

            # 差分を計算
            point_difference = current_total - last_month_point
            
            # ランキング用データを追加
            ranking_data.append({
                'user_id': user_id,
                'user_name': user_name,
                'points': point_difference
            })
            
            # 新規ログデータを作成
            new_log = {
                'user_id': user_id,
                'workspace_id': workspace_id,
                'year_month': current_ym,
                'month_add_point': int(point_difference)
            }
            new_logs.append(new_log)

        # 今月分のデータが存在しない場合のみ、新規ログを登録
        if new_logs and not data_exists:
            insert_response = supabase.table('MonthLogNew').upsert(new_logs).execute()
            print(f"{len(new_logs)}件のログを登録しました")
        else:
            print("今月分のデータは既に存在するため、登録をスキップします")
        
        # ランキングの作成（上位3名）
        ranking_df = pd.DataFrame(ranking_data)
        top_3 = ranking_df.nlargest(3, 'points')
        
        return top_3.to_dict('records')
        
    except Exception as e:
        print(f"エラーが発生しました: {str(e)}")
        raise e

def create_ranking_blocks(ranking_data, last_month):
    """Slack Block Kitを使用したランキングメッセージの作成"""
    medal_emojis = {0: ":first_place_medal:", 1: ":second_place_medal:", 2: ":third_place_medal:"}
    
    blocks = [
        {
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": f"🏆 {last_month.strftime('%Y年%m月')}の月間ポイントランキング 🏆",
                "emoji": True
            }
        },
        {
            "type": "divider"
        }
    ]
    
    for i, user in enumerate(ranking_data):
        blocks.extend([
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"{medal_emojis[i]} *{i+1}位* - {user['user_name']}"
                }
            },
            {
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": f"獲得ポイント: *{user['points']:,}* pts"
                    }
                ]
            },
            {
                "type": "divider"
            }
        ])
    
    blocks.append({
        "type": "context",
        "elements": [
            {
                "type": "mrkdwn",
                "text": "※ 先月との差分によるランキングです"
            }
        ]
    })
    
    return blocks

def main():
    try:
        # ポイント計算とランキング作成
        ranking_data = calculate_monthly_points()
        
        # Block Kitメッセージの作成
        _, _, last_month = get_date_info()
        blocks = create_ranking_blocks(ranking_data, last_month)
        
        # Slackへの送信
        response = client.chat_postMessage(
            channel=slack_channel,
            blocks=blocks,
            text="月間ポイントランキング" # フォールバック用テキスト
        )
        print("メッセージを送信しました")
        
    except Exception as e:
        print(f"エラーが発生しました: {str(e)}")
        raise e

if __name__ == "__main__":
    main()