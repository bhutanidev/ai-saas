import json, os
import pika
from dotenv import load_dotenv
load_dotenv()

RABBIT_URL = os.getenv("RABBITMQ_URL")

if(RABBIT_URL == None):
    print("No url provided")

connection = pika.BlockingConnection(pika.URLParameters(RABBIT_URL))
channel = connection.channel()
channel.queue_declare(queue='document_embedding', durable=True)

def process_document(doc):
    print(f"📄 Processing {doc['type']} document for owner {doc['ownerId']}")
    # TODO: fetch from S3, generate embedding, store in DB/vector store

def callback(ch, method, properties, body):
    doc = json.loads(body)
    process_document(doc)
    ch.basic_ack(delivery_tag=method.delivery_tag)

channel.basic_qos(prefetch_count=1)
channel.basic_consume(queue='document_embedding', on_message_callback=callback)

print(" [*] Waiting for messages...")
channel.start_consuming()