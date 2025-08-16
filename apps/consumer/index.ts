import { getRabbitChannel } from "utils/rabithelper";
import type { ConsumeMessage } from "amqplib";

const QUEUE_NAME = "document_embedding"; // stays in consumer

// === Processing Functions ===
function processUrlDocument(doc: any) {
  console.log(`🌐 Processing URL document for owner ${doc.ownerId}`);
  console.log(`🔗 URL: ${doc.url}`);
  // TODO: scrape content, generate embeddings, store in DB/vector store
}

function processTextDocument(doc: any) {
  console.log(`📝 Processing TEXT document for owner ${doc.ownerId}`);
  console.log(`📄 Text Content: ${doc.textContent?.slice(0, 100)}...`);
  // TODO: generate embeddings directly from text
}

function processFileDocument(doc: any) {
  console.log(`📂 Processing FILE document for owner ${doc.ownerId}`);
  console.log(`🗝️ File Key: ${doc.fileKey}`);
  // TODO: download from S3, extract text, generate embeddings
}

// === Dispatcher ===
function processDocument(doc: any) {
  switch (doc.contentType) {
    case "URL":
      processUrlDocument(doc);
      break;
    case "TEXT":
      processTextDocument(doc);
      break;
    case "FILE":
      processFileDocument(doc);
      break;
    default:
      console.log(`⚠️ Unknown content type: ${doc.contentType}`);
  }
}

// === Consumer ===
async function startConsumer() {
  const ch = await getRabbitChannel();

  await ch.assertQueue(QUEUE_NAME, { durable: true });
  ch.prefetch(1);

  await ch.consume(
    QUEUE_NAME,
    async (msg: ConsumeMessage | null) => {
      if (!msg) return;
      try {
        const doc = JSON.parse(msg.content.toString());
        processDocument(doc);
        ch.ack(msg);
      } catch (err) {
        console.error(`❌ Error processing document:`, err);
        ch.nack(msg, false, false); // reject, don't requeue
      }
    },
    { noAck: false }
  );

  console.log(" [*] Waiting for messages... Press CTRL+C to exit.");
}

startConsumer().catch((err) => {
  console.error("❌ Failed to start consumer:", err);
  process.exit(1);
});
