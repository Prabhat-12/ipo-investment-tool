import os
import requests
from dotenv import load_dotenv

load_dotenv()

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")

def send_alert(title, message):
    """
    Sends an investment alert. 
    If Telegram keys are provided, sends a mobile push notification via Telegram.
    Otherwise, falls back to native macOS system alerts.
    """
    # 1. Try Telegram Notification (Cloud/Shareable)
    if TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID:
        if "your_" not in TELEGRAM_BOT_TOKEN and "your_" not in TELEGRAM_CHAT_ID:
            try:
                full_message = f"🔔 *{title}*\n\n{message}"
                url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
                payload = {
                    "chat_id": TELEGRAM_CHAT_ID,
                    "text": full_message,
                    "parse_mode": "Markdown"
                }
                response = requests.post(url, json=payload, timeout=10)
                if response.status_code == 200:
                    print("Notification Status: SENT (Telegram Mobile Push Alert)")
                    return True
                else:
                    print(f"Telegram API failed with code {response.status_code}: {response.text}")
            except Exception as e:
                print(f"Telegram alert connection failed: {e}")
                
    # 2. Fallback: Native macOS Desktop Notification
    # Only runs if on macOS (darwin)
    import sys
    if sys.platform == "darwin":
        try:
            # Clean message text to prevent shell insertion bugs
            safe_title = title.replace('"', '\\"')
            safe_msg = message.replace('"', '\\"')
            os.system(f'osascript -e \'display notification "{safe_msg}" with title "{safe_title}"\'')
            print("Notification Status: SENT (Native macOS Desktop Notification)")
            return True
        except Exception as e:
            print(f"Native macOS desktop alert failed: {e}")
            
    print("Notification Status: PRINTED (No active system notification platform found)")
    print(f"[{title}] {message}")
    return False

if __name__ == "__main__":
    # Test alert
    send_alert("Antigravity IPO Test", "Checking system push notifications. If you are on Mac, you will see a banner!")
