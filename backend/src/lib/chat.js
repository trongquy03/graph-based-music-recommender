import fetch from "node-fetch";

export async function askGemini(prompt, history = []) {
  const messages = [
    {
      role: "system",
      content: "Bạn là trợ lý âm nhạc thông minh. Hãy trả lời thân thiện, dễ hiểu, liên quan đến nhạc.",
    },
    ...history.map((m) => ({ role: m.from, content: m.text })),
    { role: "user", content: prompt },
  ];

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-pro",
      messages,
    }),
  });

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "Xin lỗi, tôi chưa hiểu ý bạn.";
}
