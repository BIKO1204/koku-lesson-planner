import OpenAI from "openai";

async function runFineTune() {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const response = await openai.post("/fine-tunes", {
      training_file: "file-4xqmuUGQeCb6SfQPKZguFy",  // あなたのアップロード済ファイルIDに置き換えてください
      model: "gpt-3.5-turbo",
    });

    console.log("Fine-tune created:", response);
  } catch (error) {
    console.error("Error creating fine-tune:", error);
  }
}

runFineTune();
