
# InfoPix: Autonomous Agentic Infographic Engine

**InfoPix** is a high-performance orchestration system that leverages **Mastra v1.0** and **Groq** to automate the complex process of data extraction and brand alignment. It doesn't just summarize text; it reasons through data to select the best visual representation and validates its own output for hallucinations.

## 🚀 Key Features

* **Multi-Agent Orchestration:** Utilizes a four-agent system (Content Architect, Brand Visionary, QA Critic, and Data Formatter) to ensure separation of concerns.
* **Autonomous Tool Usage:** Equipped with a custom `scrape-website` tool that allows the system to digest live URLs when raw text is not provided.
* **Parallel DAG Execution:** Content and Style extraction run in parallel to minimize latency, coordinated via a Mastra Workflow.
* **Self-Correcting QA Loop:** A dedicated Critic agent compares the final JSON against source material to prevent AI hallucinations.
* **Full Observability:** Integrated with **DuckDB** and **Pino** for real-time trace logging and performance monitoring via Mastra Studio.

## 🏗️ The Architecture

The system is designed as a **Directed Acyclic Graph (DAG)** to ensure predictable data flow and type safety.

### Agent Specialization

To bypass provider-level limitations where JSON mode cannot be combined with tool calling, we implemented an **Agent Specialization** pattern:

1. **Researcher (Content Agent):** Uses the `scrape-website` tool to gather raw data.
2. **Formatter Agent:** A "tool-less" agent that strictly maps research into our **Zod-validated** `InfographicContentSchema`.

## 🛠️ Tech Stack

* **Framework:** Mastra v1.0 (Core Orchestration)
* **AI Models:** Llama 3.3 70B & Llama 3.2 11B Vision (via Groq)
* **Backend:** Next.js 15 (App Router)
* **Storage/Logs:** LibSQL (SQLite) for state & DuckDB for observability
* **Validation:** Zod (Discriminated Unions for UI components)

## 🚦 Getting Started

1. **Clone the repo and install dependencies:**
```bash
npm install

```


2. **Configure your environment:**
Create a `.env` file and add your Groq key:

```env
   GROQ_API_KEY=your_key_here

```

3. **Launch the engine:**
```bash
npx mastra dev

```


4. **Trigger the workflow:**
Send a POST request to `/api/generate` with a URL or raw text:

```json
   {
     "rawText": "https://raw.githubusercontent.com/mastra-ai/mastra/main/README.md",
     "density": "deep-dive"
   }

```

## 📈 Observability

By navigating to `localhost:3000` (Mastra Studio), you can inspect the traces for every run. This includes token usage, tool execution latency, and the internal reasoning logs of each agent.

---
