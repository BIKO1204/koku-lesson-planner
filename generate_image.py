import os
from dotenv import load_dotenv
import openai

load_dotenv(dotenv_path=".env.local")
openai.api_key = os.getenv("OPENAI_API_KEY")

def gen_page12():
    response = openai.images.generate(
        model="dall-e-3",
        prompt=(
            "A cute children's book illustration of a night scene with a big red and white circus tent under a starry sky and full moon. "
            "Animals such as an elephant, lion, rabbit, and penguin are anxiously waiting outside and inside the tent. "
            "Detective cat characters Nyarms and Mikeko wear glowing goggles that help them see in the dark, watching carefully. "
            "The animals look worried but hopeful, in soft warm colors and gentle rounded lines, cute and friendly style."
        ),
        n=1,
        size="1024x1024"
    )
    print("12ページ画像URL:", response.data[0].url)

if __name__ == "__main__":
    gen_page12()
