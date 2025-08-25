import { getRabbitChannel } from "utils/rabithelper";
import type { ConsumeMessage } from "amqplib";
import { 
  processTextDocument,
  processUrlDocument,
  processS3PdfDocument 
} from "./documentProcessors"

const QUEUE_NAME = "document_embedding";

// === Message Type Definition ===
interface DocumentMessage {
  id: string;
  type: "ORGANIZATION" | "PERSONAL"; // Document type
  ownerId: string;
  contentType: "TEXT" | "URL" | "FILE";
  fileKey?: string;
  createdAt: string; // ISO string from queue
}

// === Processing Functions ===
async function processUrlDocumentWrapper(doc: DocumentMessage) {
  console.log(`🌐 Processing URL document ${doc.id} for owner ${doc.ownerId}`);
  
  try {
    await processUrlDocument({
      id: doc.id,
      ownerId: doc.ownerId,
      contentType: doc.contentType,
      createdAt: new Date(doc.createdAt),
    });
    console.log(`✅ Successfully processed URL document ${doc.id}`);
  } catch (error) {
    console.error(`❌ Failed to process URL document ${doc.id}:`, error);
    throw error; // Re-throw to handle in consumer
  }
}

async function processTextDocumentWrapper(doc: DocumentMessage) {
  console.log(`📝 Processing TEXT document ${doc.id} for owner ${doc.ownerId}`);
  
  try {
    await processTextDocument({
      id: doc.id,
      ownerId: doc.ownerId,
      contentType: doc.contentType,
      createdAt: new Date(doc.createdAt),
    });
    console.log(`✅ Successfully processed TEXT document ${doc.id}`);
  } catch (error) {
    console.error(`❌ Failed to process TEXT document ${doc.id}:`, error);
    throw error; // Re-throw to handle in consumer
  }
}

async function processFileDocumentWrapper(doc: DocumentMessage) {
  console.log(`📂 Processing FILE document ${doc.id} for owner ${doc.ownerId}`);
  console.log(`🗝️ File Key: ${doc.fileKey}`);
  
  if (!doc.fileKey) {
    throw new Error(`No fileKey provided for FILE document ${doc.id}`);
  }
  
  try {
    await processS3PdfDocument({
      id: doc.id,
      ownerId: doc.ownerId,
      contentType: doc.contentType,
      createdAt: new Date(doc.createdAt),
    });
    console.log(`✅ Successfully processed FILE document ${doc.id}`);
  } catch (error) {
    console.error(`❌ Failed to process FILE document ${doc.id}:`, error);
    throw error; // Re-throw to handle in consumer
  }
}

// === Dispatcher ===
async function processDocument(doc: DocumentMessage) {
  console.log(`🚀 Starting to process document ${doc.id} of type ${doc.contentType}`);
  
  switch (doc.contentType) {
    case "URL":
      await processUrlDocumentWrapper(doc);
      break;
    case "TEXT":
      await processTextDocumentWrapper(doc);
      break;
    case "FILE":
      await processFileDocumentWrapper(doc);
      break;
    default:
      console.log(`⚠️ Unknown content type: ${doc.contentType} for document ${doc.id}`);
      throw new Error(`Unsupported content type: ${doc.contentType}`);
  }
}

// === Consumer ===
async function startConsumer() {
  try {
    const ch = await getRabbitChannel();

    await ch.assertQueue(QUEUE_NAME, { durable: true });
    ch.prefetch(1); // Process one message at a time

    console.log(`🐰 Connected to RabbitMQ queue: ${QUEUE_NAME}`);
    console.log("⚡ Consumer is ready to process document embeddings...");

    await ch.consume(
      QUEUE_NAME,
      async (msg: ConsumeMessage | null) => {
        if (!msg) return;

        let doc: DocumentMessage;
        
        try {
          // Parse message
          doc = JSON.parse(msg.content.toString()) as DocumentMessage;
          console.log(`📨 Received document: ${doc.id} (${doc.contentType})`);

          // Validate required fields
          if (!doc.id || !doc.ownerId || !doc.contentType || !doc.createdAt) {
            throw new Error(`Missing required fields in document message`);
          }

          // Process document
          await processDocument(doc);

          // Acknowledge successful processing
          ch.ack(msg);
          console.log(`🎉 Successfully processed and acknowledged document ${doc.id}`);

        } catch (error) {
          console.error(`❌ Error processing document:`, error);
          console.error(`📋 Message content:`, msg.content.toString());
          
          // Reject message and don't requeue to avoid infinite loops
          ch.nack(msg, false, false);
          console.log(`🚫 Message rejected and not requeued`);
        }
      },
      { noAck: false } // Manual acknowledgment
    );

    console.log(" [*] 👂 Waiting for messages... Press CTRL+C to exit.");

  } catch (error) {
    console.error("❌ Failed to setup consumer:", error);
    throw error;
  }
}

// === Graceful Shutdown ===
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM. Shutting down gracefully...');
  process.exit(0);
});

// === Start Consumer ===
startConsumer().catch((err) => {
  console.error("❌ Failed to start consumer:", err);
  process.exit(1);
});