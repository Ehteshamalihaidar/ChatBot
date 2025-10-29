
export async function getGeminiResponse(prompt, chatId) {
  try {
    const response = await fetch("http://localhost:5000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, chatId }),
    });

    const data = await response.json();

    if (data.reply) return data.reply;
    return "⚠️ No reply received from the server.";
  } catch (error) {
    console.error("Frontend Error:", error);
    return "⚠️ Sorry, I couldn't process that request.";
  }
}
