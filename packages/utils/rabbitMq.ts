import amqplib from "amqplib";

let channel: amqplib.Channel | null = null;
console.log(process.env.RABBITMQ_URL!)


export async function getRabbitChannel() {
  if (!channel) {
    const connection = await amqplib.connect(process.env.RABBITMQ_URL!);
    channel = await connection.createChannel();
    await channel.assertQueue("document_embedding", { durable: true });
  }
  return channel;
}

export async function publishDocumentToQueue(doc: object) {
  const ch = await getRabbitChannel();
  ch.sendToQueue("document_embedding", Buffer.from(JSON.stringify(doc)), { persistent: true });
  console.log(`📤 Sent document ${JSON.stringify(doc)} to queue`);
}
