import os
from dotenv import load_dotenv
import openai

load_dotenv(dotenv_path=".env.local")
openai.api_key = os.getenv("OPENAI_API_KEY")

def gen_page12():
    response = openai.images.generate(
        model="dall-e-3",
        prompt=(
            "サーカステントの外で「そろそろ12じ…」とそわそわする動物たち（ゾウ、ライオン、うさぎ、ペンギン）と、"
            "くらやみでも見えるギズモ博士のメガネをかけたニャームズとミケコ。"
            "かわいい絵本イラスト、1024×1024px。"
        ),
        n=1,
        size="1024x1024"
    )
    print("12ページ画像URL:", response.data[0].url)

if __name__ == "__main__":
    gen_page12()
