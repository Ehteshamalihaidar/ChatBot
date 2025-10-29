## ChatBot — AI Assistant (React + Express + MongoDB + Gemini)

A polished, session-based AI chat application that uses a React front-end and an Express backend to proxy requests to Google Gemini (via `@google/generative-ai`) and persist chat sessions in MongoDB Atlas. It supports multiple chat sessions, displays a chat history sidebar, renders markdown and syntax-highlighted code blocks, and stores each user/bot message in MongoDB.

Core files in this repo
- server.js — Express backend that calls Gemini, stores messages in MongoDB, and exposes REST endpoints.
- ChatbotUI.jsx — React chat UI (sidebar sessions, messages, input area).
- geminiService.js — Frontend service that POSTs to the backend.
- package.json, public, src — project wiring and assets.

## Features
- Multi-session chat (each session identified by a `chatId`)
- Persisted chat history in MongoDB Atlas
- Gemini model integration (via `@google/generative-ai`)
- Markdown + code block rendering with syntax highlighting
- Simple, responsive chat UI with typing indicator and session sidebar

## Tech stack
- Frontend: React (JSX), React Markdown, react-syntax-highlighter, Tailwind CSS
- Backend: Node.js, Express
- Database: MongoDB Atlas (Mongoose)
- AI: Google Gemini via `@google/generative-ai`
- Dev: dotenv for environment variables

## Quick contract (inputs/outputs)
- Inputs: user prompt text (string), chatId (string)
- Output: generated reply text from Gemini (string), stored in MongoDB
- Success criteria: POST /api/chat returns `{ reply }` and message stored; GET endpoints return history.

## Environment / prerequisites
- Node.js (>= 16 recommended)
- npm (or yarn)
- MongoDB Atlas connection string
- Gemini API key from Google (set as `GEMINI_API_KEY`)

Example .env (create in project root — do NOT commit):
```
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/chatdb?retryWrites=true&w=majority
GEMINI_API_KEY=ya29.your_gemini_api_key_here
PORT=5000
```

## Install (local development)
1. Clone the repo and change directory:
   ```
   git clone <repo-url>
   cd <repo-folder>
   ```
2. Install dependencies:
   ```
   npm install
   ```

## Run (local)
Open two terminals.

Terminal A — start the backend:
- If there is a server script in package.json (check `scripts`), run:
  ```
  npm run server
  ```
  Otherwise run directly:
  ```
  node server.js
  ```
This starts the Express server (default PORT 5000).

Terminal B — start the frontend:
- If the repo uses Create React App:
  ```
  npm start
  ```
- If it uses Vite:
  ```
  npm run dev
  ```
(If neither exists, inspect package.json for the correct script.)

Access the app in your browser (commonly `http://localhost:3000` or the port the frontend uses). The backend runs at `http://localhost:5000` by default.

## API Endpoints
- POST /api/chat
  - Body: `{ "prompt": "<user text>", "chatId": "<session-id>" }`
  - Response: `{ "reply": "<bot reply>" }`
  - Behavior: sends prompt to Gemini, saves an entry in MongoDB with chatId, userMessage, botReply, timestamp.

- GET /api/chats/:chatId
  - Returns all messages for a session (sorted by timestamp).

- GET /api/sessions
  - Returns distinct chat sessions with `chatId`, `title`, and `lastUpdated` (aggregation).

## Frontend notes
- geminiService.js sends user input to `/api/chat` and expects `{ reply }`.
- ChatbotUI.jsx:
  - Creates a unique `chatId` via `uuidv4()` for each session.
  - Loads session list (`/api/sessions`) and session messages (`/api/chats/:chatId`).
  - Renders markdown and code blocks with syntax highlighting.

## Database
- Mongoose schema (in server.js) stores:
  - chatId, title (first user prompt), userMessage, botReply, timestamp
- Use a properly scoped MongoDB Atlas user & URI. Set `MONGO_URI` in .env.

## Security & best practices
- Do not commit .env or secrets to source control.
- Restrict MongoDB Atlas IP access to your dev machines or use VPC peering.
- Rotate and secure your Gemini API key.
- Consider server-side input validation and rate limiting for production.
- Sanitize anything you render as raw HTML (the app uses rehype-raw; be careful with untrusted input).

## Troubleshooting
- "Missing GEMINI_API_KEY in .env" — add `GEMINI_API_KEY` to .env and restart.
- MongoDB connection errors — verify `MONGO_URI`, user credentials, and network access (Atlas IP whitelist).
- If backend fails with "must use import to load ES Module" — ensure package.json contains `"type": "module"` or run with a bundler that supports ESM. server.js uses ESM `import` syntax.
- CORS issues — backend enables `cors()` by default; if you changed origin config, allow your frontend origin.
- No reply from server — inspect backend logs (console) for Gemini API errors.

## Deployment suggestions
- Backend:
  - Deploy to a Node host (Heroku, Render, Fly, Azure App Service) using environment variables and ensure `type: module` and Node version are correct.
- Frontend:
  - Build static assets (`npm run build`) and host on Netlify, Vercel, or serve from same Node server as static files.
- Use secrets manager (e.g., GitHub Actions secrets, Render/Heroku env) for production keys.
- Monitor costs & quotas for Gemini usage.

## Tests
- No automated tests included in this snapshot. Add lightweight unit tests around the backend endpoints and React components (Jest + React Testing Library) as next steps.

## Contributing
- Fork the repo, create a branch, open a PR.
- Provide clear issue descriptions and reproducible steps.
- Run `npm install` and ensure linting/tests pass before submitting.

## License
- MIT (change if you prefer a different license). Add a `LICENSE` file if this code will be published.

---
