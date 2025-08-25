import { PineconeStore } from "@langchain/pinecone";
import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnablePassthrough, RunnableSequence } from "@langchain/core/runnables";
import { formatDocumentsAsString } from "langchain/util/document";
import { getPineconeClient ,  embeddings } from "utils/langchain"; 

export async function runRAGChain({
  namespace,
  query,
  topK = 5,
  filter,
}: {
  namespace: string;
  query: string;
  topK?: number;
  filter?: Record<string, any>;
}) {
  // --- Retriever ---
  const pinecone = getPineconeClient();
  const index = pinecone.Index("documents");
  const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex: index,
    namespace,
  });
  const retriever = vectorStore.asRetriever({ k: topK, filter });

  // --- Prompt + Model ---
  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      "You are a helpful assistant that answers strictly based on the provided context. If not in context, say you don't know. Cite with [1], [2], etc.",
    ],
    ["human", "Question: {question}\n\nContext:\n{context}"],
  ]);

  const model = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL || "Gemma2-9b-It",
    temperature: 0.2,
    maxTokens: 800,
  } as any);

  const chain = RunnableSequence.from([
    {
      context: retriever.pipe(formatDocumentsAsString),
      question: new RunnablePassthrough(),
    },
    prompt,
    model,
    new StringOutputParser(),
  ]);

  const answer = await chain.invoke(query);

  const docs = await retriever.getRelevantDocuments(query);
  const sources = docs.map((d, i) => ({
    rank: i + 1,
    text: d.pageContent,
    metadata: d.metadata,
  }));

  return { answer, sources };
}