import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "@langchain/core/documents";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

// --- Pinecone ---
let pinecone: Pinecone | null = null;
export function getPineconeClient() {
  if (!pinecone) {
    pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
  }
  return pinecone;
}

// --- Embeddings ---
export const embeddings = new HuggingFaceInferenceEmbeddings({
  apiKey: process.env.HUGGINGFACE_API_KEY!,
  model: "sentence-transformers/all-MiniLM-L6-v2", // 384-dim
});

// --- Splitter ---
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

// --- S3 Client ---
const s3 = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.ACCESS_KEY!,
    secretAccessKey: process.env.SECRET_KEY!,
  },
});

// ------------------ Document Processing Helpers ------------------

export async function processTextDocumentHelper(text: string): Promise<Document[]> {
  const docs = [new Document({ pageContent: text })];
  return splitter.splitDocuments(docs);
}

/**
 * Single-page URL processing (no crawling).
 * Uses CheerioWebBaseLoader and extracts from common content containers.
 */
export async function processUrlDocumentHelper(url: string): Promise<Document[]> {
  console.log(`🔍 Single-page load for: ${url}`);

  // Safety caps to avoid runaway chunking
  const MAX_TOTAL_CHARS = 400_000; // adjust to your budget
  const MIN_USEFUL_CHARS = 400;    // skip boilerplate-only pages
  const MAX_CHUNKS = 2_000;        // refuse to upsert if chunk count goes wild

  try {
    const loader = new CheerioWebBaseLoader(url, {
      // Prefer main content; fall back to common containers and body
      selector: "main, article, #content, .content, .markdown-body, body",
      // Optional: headers / timeout if needed
      // headers: { "User-Agent": "Mozilla/5.0 ..." },
      // timeout: 30000,
    });

    console.log(`⏳ Loading content from URL (single page, no recursion)...`);
    const rawDocs = await loader.load(); // typically returns 1 document
    console.log(`✅ Loaded ${rawDocs.length} document(s) from URL`);

    if (rawDocs.length === 0) {
      console.warn(`⚠️ No content loaded from URL: ${url}`);
      return [];
    }

    // Basic content sanity checks
    const totalChars = rawDocs.reduce((sum, d) => sum + (d.pageContent?.length || 0), 0);
    if (totalChars < MIN_USEFUL_CHARS) {
      console.warn(`⚠️ Page too small (${totalChars} chars) — likely boilerplate. Skipping.`);
      return [];
    }
    if (totalChars > MAX_TOTAL_CHARS) {
      console.warn(`⚠️ Page too large (${totalChars} chars). Aborting to avoid runaway chunking.`);
      return [];
    }

    // Light normalization
    const normalizedDocs = rawDocs.map((d) => {
      const txt = (d.pageContent || "")
        .replace(/\u00a0/g, " ")      // non-breaking spaces
        .replace(/[ \t]+\n/g, "\n")   // trim line-end spaces
        .replace(/\n{3,}/g, "\n\n")   // collapse extra blank lines
        .trim();
      return new Document({ pageContent: txt, metadata: d.metadata });
    });

    normalizedDocs.forEach((doc, index) => {
      const preview = doc.pageContent.replace(/\s+/g, " ").slice(0, 200);
      console.log(`📝 Doc ${index + 1} preview: ${preview}...`);
    });

    console.log(`✂️ Splitting document into chunks...`);
    const splitDocs = await splitter.splitDocuments(normalizedDocs);
    console.log(`✅ Created ${splitDocs.length} chunks from single-page content`);

    if (splitDocs.length > MAX_CHUNKS) {
      console.warn(
        `⚠️ Too many chunks (${splitDocs.length} > ${MAX_CHUNKS}). Aborting to prevent costly upserts.`
      );
      return [];
    }

    return splitDocs;
  } catch (error) {
    console.error(`❌ Error processing URL ${url}:`, error);
    throw error;
  }
}

async function getPdfBuffer(bucket: string, key: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  const response = await s3.send(command);
  return Buffer.from(await response.Body?.transformToByteArray()!);
}

export async function processS3PdfDocumentHelper(key: string): Promise<Document[]> {
  const bucket = process.env.AWS_S3_BUCKET_NAME!;
  const buffer = await getPdfBuffer(bucket, key);
  const loader = new PDFLoader(new Blob([buffer]), { splitPages: true });
  const rawDocs = await loader.load();
  return splitter.splitDocuments(rawDocs);
}

// ------------------ Pinecone Helpers ------------------

/**
 * Upsert multiple document embeddings into Pinecone
 */
export async function upsertEmbeddings({
  namespace,
  documents,
  baseId,
  metadata = {},
}: {
  namespace: string;
  documents: Document[];
  baseId: string;
  metadata?: Record<string, any>;
}) {
  if (documents.length === 0) {
    console.warn("⚠️ No documents to upsert");
    return;
  }

  console.log(`🎯 Starting upsert for ${documents.length} documents to namespace: ${namespace}`);

  try {
    const clientPinecone = getPineconeClient();
    console.log(`✅ Pinecone client initialized`);

    const index = clientPinecone.Index("documents");
    console.log(`✅ Connected to Pinecone index: documents`);

    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex: index,
      namespace,
    });
    console.log(`✅ Vector store connected to namespace: ${namespace}`);

    // Add metadata to each document with unique IDs
    const docsWithMetadata = documents.map((doc, index) => {
      return new Document({
        pageContent: doc.pageContent,
        metadata: {
          id: `${baseId}_chunk_${index}`,
          chunkIndex: index,
          totalChunks: documents.length,
          ...doc.metadata,
          ...metadata,
        },
      });
    });

    console.log(`📦 Prepared ${docsWithMetadata.length} documents with metadata`);
    console.log(`⏳ Generating embeddings and upserting to Pinecone...`);

    await vectorStore.addDocuments(docsWithMetadata);

    console.log(`✅ Upserted ${documents.length} document chunks to namespace: ${namespace}`);
  } catch (error) {
    console.error(`❌ Error upserting embeddings:`, error);
    throw error;
  }
}

/**
 * Query similar embeddings from Pinecone
 */
export async function queryEmbedding({
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
  const clientPinecone = getPineconeClient();
  const index = clientPinecone.Index("documents");

  const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex: index,
    namespace,
  });

  return vectorStore.similaritySearch(query, topK, filter);
}
