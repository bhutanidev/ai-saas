import { PineconeStore } from "@langchain/pinecone";
import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnablePassthrough, RunnableSequence } from "@langchain/core/runnables";
import { formatDocumentsAsString } from "langchain/util/document";
import { getPineconeClient, embeddings } from "utils/langchain";
import { addDateContextToQuery } from "./date.helper";

// Enhanced query processing for schedule-related questions
function enhanceScheduleQuery(originalQuery: string): string {
  const scheduleKeywords = [
    'schedule', 'meeting', 'class', 'session', 'appointment',
    'today', 'tomorrow', 'cancelled', 'canceled', 'postponed', 
    'moved', 'rescheduled', 'agenda', 'event', 'workshop',
    'lecture', 'seminar', 'conference', 'deadline', 'ppt',
    'placement', 'talk', 'interview'
  ];

  const lowerQuery = originalQuery.toLowerCase();
  
  // Check if query is schedule-related
  const isScheduleQuery = scheduleKeywords.some(keyword => 
    lowerQuery.includes(keyword)
  ) || lowerQuery.includes('what') && (
    lowerQuery.includes('today') || 
    lowerQuery.includes('tomorrow') ||
    lowerQuery.includes('schedule') ||
    lowerQuery.includes('happening')
  );

  if (isScheduleQuery) {
    // Enhance the query with relevant terms
    return `${originalQuery} schedule meeting class event session agenda placement talk interview`;
  }

  return originalQuery;
}

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
      "You are a helpful assistant that answers strictly based on the provided context. For schedule/calendar questions, look for information about meetings, classes, events, cancellations, or time-related information. Pay special attention to dates, times, and any changes to schedules. If the context doesn't contain schedule information, say you don't know. Cite with [1], [2], etc. Ignore irrelevant or noisy text such as comments, likes, or shares.",
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

  // Enhance query for better schedule search
  let enhancedQuery = enhanceScheduleQuery(query);
  
  // Add smart date range context
  enhancedQuery = addDateContextToQuery(enhancedQuery);
  
  console.log(`🔍 Original query: ${query}`);
  console.log(`🚀 Enhanced query: ${enhancedQuery}`);
  console.log(`📏 Enhanced query length: ${enhancedQuery.length}`);

  const answer = await chain.invoke(enhancedQuery);
  console.log(answer);
  
  const docs = await retriever.getRelevantDocuments(enhancedQuery);
  console.log(`📚 Retrieved ${docs.length} documents`);
  docs.forEach((doc, i) => {
    console.log(`Doc ${i + 1}: ${doc.pageContent.substring(0, 100)}...`);
    console.log(`Metadata:`, doc.metadata);
  });
  
  const sources = docs.map((d, i) => ({
    rank: i + 1,
    text: d.pageContent,
    metadata: d.metadata,
  }));

  return { answer, sources };
}