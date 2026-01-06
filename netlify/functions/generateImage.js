// netlify/functions/generateImage.js
export async function handler(event) {
  const { prompt } = JSON.parse(event.body);
  try {
    const res = await fetch("https://t2i.mcpcore.xyz/api/free/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, model: "turbo" })
    });
    return {
      statusCode: 200,
      body: await res.text() // stream as text
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}
