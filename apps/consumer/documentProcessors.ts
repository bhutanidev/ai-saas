import client from "db/client"; // Prisma client
import { 
  upsertEmbeddings, 
  processTextDocumentHelper,
  processUrlDocumentHelper,
  processS3PdfDocumentHelper
} from "utils/langchain"; // LangChain-based helpers

// ------------------ Text Document Processing ------------------

export async function processTextDocument(msg: {
  id: string;
  ownerId: string;
  contentType: string;
  createdAt: Date;
}) {
  const { id, ownerId, createdAt } = msg;

  try {
    // 1. Fetch the document from DB
    const document = await client.document.findUnique({
      where: { id },
      select: {
        title: true,
        textContent: true,
        organizationId: true,
        type: true,
      },
    });

    if (!document || !document.textContent) {
      console.warn(`⚠️ No text content found for document ${id}`);
      return;
    }

    const { textContent, organizationId, title, type } = document;

    // 2. Process text into document chunks
    const documents = await processTextDocumentHelper(textContent);

    // 3. Create namespace based on document type
    const namespace = type === "ORGANIZATION" && organizationId
      ? `ORG_${organizationId}`
      : `USER_${ownerId}`;

    // 4. Save all chunks to Pinecone
    await upsertEmbeddings({
      namespace,
      documents,
      baseId: id,
      metadata: {
        documentId: id,
        title,
        contentType: "TEXT",
        documentType: type,
        createdAt,
        ownerId,
        organizationId,
      },
    });

    console.log(
      `✅ Stored ${documents.length} text chunks for document "${title}" (${id}) - ${type} (user ${ownerId}, org ${organizationId || "none"})`
    );
  } catch (error) {
    console.error("❌ Error processing text document:", error);
    throw error;
  }
}

// ------------------ URL Document Processing ------------------

export async function processUrlDocument(msg: {
  id: string;
  ownerId: string;
  contentType: string;
  createdAt: Date;
}) {
  const { id, ownerId, createdAt } = msg;

  try {
    console.log(`🔍 Fetching URL document ${id} from database...`);
    
    // 1. Fetch the document from DB
    const document = await client.document.findUnique({
      where: { id },
      select: {
        title: true,
        url: true,
        organizationId: true,
        type: true,
      },
    });

    if (!document) {
      console.warn(`⚠️ Document ${id} not found in database`);
      return;
    }

    if (!document.url) {
      console.warn(`⚠️ No URL found for document ${id}`);
      return;
    }

    const { url, organizationId, title, type } = document;
    console.log(`✅ Document found: "${title}" - URL: ${url} - Type: ${type}`);

    // 2. Process URL into document chunks
    console.log(`🌐 Processing URL content...`);
    const documents = await processUrlDocumentHelper(url);
    
    if (documents.length === 0) {
      console.warn(`⚠️ No content extracted from URL: ${url}`);
      return;
    }

    console.log(`✅ Successfully processed URL into ${documents.length} chunks`);

    // 3. Create namespace based on document type
    const namespace = type === "ORGANIZATION" && organizationId
      ? `ORG_${organizationId}`
      : `USER_${ownerId}`;
    
    console.log(`🎯 Using namespace: ${namespace}`);

    // 4. Save all chunks to Pinecone
    console.log(`💾 Starting to save chunks to Pinecone...`);
    await upsertEmbeddings({
      namespace,
      documents,
      baseId: id,
      metadata: {
        documentId: id,
        title,
        contentType: "URL",
        documentType: type,
        sourceUrl: url,
        createdAt,
        ownerId,
        organizationId,
      },
    });

    console.log(
      `✅ Stored ${documents.length} URL chunks for document "${title}" (${id}) from ${url} - ${type} (user ${ownerId}, org ${organizationId || "none"})`
    );
  } catch (error) {
    console.error(`❌ Error processing URL document ${id}:`, error);
    throw error;
  }
}

// ------------------ S3 PDF Document Processing ------------------

export async function processS3PdfDocument(msg: {
  id: string;
  ownerId: string;
  contentType: string;
  createdAt: Date;
}) {
  const { id, ownerId, createdAt } = msg;

  try {
    // 1. Fetch the document from DB
    const document = await client.document.findUnique({
      where: { id },
      select: {
        title: true,
        fileKey: true,
        organizationId: true,
        type: true,
      },
    });

    if (!document || !document.fileKey) {
      console.warn(`⚠️ No fileKey found for document ${id}`);
      return;
    }

    const { fileKey, organizationId, title, type } = document;

    // 2. Process S3 PDF into document chunks
    const documents = await processS3PdfDocumentHelper(fileKey);

    // 3. Create namespace based on document type
    const namespace = type === "ORGANIZATION" && organizationId
      ? `ORG_${organizationId}`
      : `USER_${ownerId}`;

    // 4. Save all chunks to Pinecone
    await upsertEmbeddings({
      namespace,
      documents,
      baseId: id,
      metadata: {
        documentId: id,
        title,
        contentType: "FILE",
        documentType: type,
        fileKey,
        createdAt,
        ownerId,
        organizationId,
      },
    });

    console.log(
      `✅ Stored ${documents.length} PDF chunks for document "${title}" (${id}) from S3 key: ${fileKey} - ${type} (user ${ownerId}, org ${organizationId || "none"})`
    );
  } catch (error) {
    console.error("❌ Error processing S3 PDF document:", error);
    throw error;
  }
}