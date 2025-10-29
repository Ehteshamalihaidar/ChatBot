import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

// ✅ Connect to MongoDB Atlas
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// 🧾 Chat Schema (supports multiple chat sessions)
const chatSchema = new mongoose.Schema({
  chatId: { type: String, required: true },
  title: { type: String }, // 🆕 First user question
  userMessage: String,
  botReply: String,
  timestamp: { type: Date, default: Date.now },
});


const Chat = mongoose.model("Chat", chatSchema);

// 🧠 Gemini setup
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("❌ Missing GEMINI_API_KEY in .env");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-pro" });

// 💬 Chat endpoint — handles prompt + saves per chatId
app.post("/api/chat", async (req, res) => {
  try {
    const { prompt, chatId } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt is required" });
    if (!chatId) return res.status(400).json({ error: "chatId is required" });

    const result = await model.generateContent(prompt);
    const reply = result.response.text();

   // Check if chat already exists
let existingChat = await Chat.findOne({ chatId });

// If first message in this chat, set title = first user prompt (shortened)
if (!existingChat) {
  await Chat.create({
    chatId,
    title: prompt.length > 40 ? prompt.slice(0, 40) + "..." : prompt, // title = first question
    userMessage: prompt,
    botReply: reply,
  });
} else {
  // Otherwise, just add new message
  await Chat.create({ chatId, userMessage: prompt, botReply: reply });
}


    res.json({ reply });
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: "Failed to fetch response from Gemini" });
  }
});

// 📜 Fetch all chats for a given chatId (chat session)
app.get("/api/chats/:chatId", async (req, res) => {
  try {
    const { chatId } = req.params;
    const chats = await Chat.find({ chatId }).sort({ timestamp: 1 });
    res.json(chats);
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.status(500).json({ error: "Failed to fetch chat history" });
  }
});

// 🗂️ (Optional) Fetch all distinct chat sessions
// 🗂️ Get all chat sessions with titles
app.get("/api/sessions", async (req, res) => {
  try {
    // Get latest message per chatId (to avoid duplicates)
    const sessions = await Chat.aggregate([
      {
        $group: {
          _id: "$chatId",
          title: { $first: "$title" },
          lastUpdated: { $max: "$timestamp" },
        },
      },
      { $sort: { lastUpdated: -1 } },
    ]);

    res.json(sessions);
  } catch (error) {
    console.error("Error fetching sessions:", error);
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
});


app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
