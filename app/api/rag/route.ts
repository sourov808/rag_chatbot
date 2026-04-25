import { NextResponse } from "next/server";
import { getVectorStore } from "@/lib/qdrant";
import z from "zod";

const ragSchema = z.object({
  query: z.string(),
  collectionName: z.string(),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "ai"]),
        content: z.string(),
      }),
    )
    .optional(),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { query, collectionName, history = [] } = ragSchema.parse(json);

    // Dynamic import to handle potential environment issues with @langchain/groq
    let ChatGroq;
    try {
      const groqModule = await import("@langchain/groq");
      ChatGroq = groqModule.ChatGroq;
    } catch (err) {
      console.error("Failed to load @langchain/groq:", err);
      return NextResponse.json(
        {
          error:
            "LLM module could not be loaded. Please ensure it is installed and the server is restarted.",
        },
        { status: 500 },
      );
    }

    const vectorStore = await getVectorStore(collectionName);

    // Search for relevant documents
    const docs = await vectorStore.similaritySearch(query, 4);
    const orderedDocs = docs.sort((a, b) => {
      return (a.metadata.page ?? 0) - (b.metadata.page ?? 0);
    });

    const context = orderedDocs.map((doc) => doc.pageContent).join("\n\n");

    const llm = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: "openai/gpt-oss-120b",
    });

    // Format history for the prompt
    const historyText = history
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n");

    const SYSTEM_PROMPT = `
You are a helpful and precise RAG Assistant. Your name is RAG AI. Your task is to answer the user's question using the provided context and the conversation history.
If user ask to explain or something similar, then explain it in a simple and easy to understand way.
If the user asks you to summarize the context, then summarize it in a simple and easy to understand way.
But first check the context and if the context doesn't contain the answer, say you don't know based on the documents.

OUTPUT INSTRUCTIONS:
Provide a highly detailed, well-structured answer directly. 
- Use Markdown formatting to make the response visually appealing for a UI.
- Use headings (###) to break down complex topics.
- Use **bold text** to highlight key terms or important concepts.
- Use bullet points or numbered lists to organize information clearly.
- Separate paragraphs with clear line breaks.
Do NOT wrap your response in a JSON object. Output the formatted text directly.

IMPORTANT:
The context may not be in order. Reconstruct the correct logical flow before answering.

---
CONTEXT:
${context}
---
CONVERSATION HISTORY:
${historyText}
---
USER QUESTION: ${query}
`;

    const response = await llm.invoke(SYSTEM_PROMPT);

    return NextResponse.json({
      data: response.content,
      sources: docs.map((d) => ({
        fileName: d.metadata.fileName || d.metadata.source,
        page: d.metadata.page,
      })),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    console.error("RAG error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
