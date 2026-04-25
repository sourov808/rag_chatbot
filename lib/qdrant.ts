import { QdrantClient } from "@qdrant/js-client-rest";
import { OllamaEmbeddings } from "@langchain/ollama";
import { QdrantVectorStore } from "@langchain/qdrant";

const client = new QdrantClient({
  url: process.env.QDRANT_URL || "http://localhost:6333",
  apiKey: process.env.QDRANT_API_KEY,
});

const embeddings = new OllamaEmbeddings({
  model: "mxbai-embed-large",
  baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
});

export const getQdrantClient = () => client;
export const getEmbeddings = () => embeddings;

export async function listCollections() {
  const result = await client.getCollections();
  return result.collections.map((c) => c.name);
}

export async function ensureCollection(collectionName: string) {
  const collectionsSize = 1024; // mxbai-embed-large dimension
  
  const collections = await listCollections();
  if (!collections.includes(collectionName)) {
    await client.createCollection(collectionName, {
      vectors: {
        size: collectionsSize,
        distance: "Cosine",
      },
    });
    return true;
  }
  return false;
}

export async function getVectorStore(collectionName: string) {
  return QdrantVectorStore.fromExistingCollection(embeddings, {
    url: process.env.QDRANT_URL || "http://localhost:6333",
    collectionName: collectionName,
  });
}

export async function deleteCollection(collectionName: string) {
  return await client.deleteCollection(collectionName);
}
