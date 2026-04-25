import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import path from "path";

const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "gemini-embedding-001",
});

async function prepare() {
  try {
    const pinecone = new PineconeClient({
        apiKey: process.env.PINECONE_API_KEY!
    });
    const pineconeIndex = pinecone.index(process.env.PINECONE_INDEX!);

    const file = path.join(process.cwd(), "documents", "nodejs.pdf");
    const loader = new PDFLoader(file);
    const docs = await loader.load();

    console.log("Docs length:", docs.length);

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 100,
    });

    const splitDocs = await splitter.splitDocuments(docs);
    console.log("Split docs length:", splitDocs.length);

    const batchSize = 100;

    for (let i = 0; i < splitDocs.length; i += batchSize) {
      const batch = splitDocs.slice(i, i + batchSize);
      console.log(`Processing batch ${i} → ${i + batch.length}`);
      
      const texts = batch.map(doc => doc.pageContent);
      console.log(`Embedding ${texts.length} texts...`);
      
      const embedded = await embeddings.embedDocuments(texts);
      console.log(`Generated ${embedded.length} embeddings.`);
      
      if (embedded.length === 0) {
        console.error("Embeddings returned empty array!");
        continue;
      }

      console.log("Upserting to Pinecone...");
      const records = batch.map((doc, index) => ({
        id: `doc-${i}-${index}`,
        values: embedded[index],
        metadata: {
          ...doc.metadata,
          text: doc.pageContent,
        },
      }));

      // In v2+ of Pinecone SDK, it's index.upsert(records) where records is the array,
      // but wait, some versions require { records: records }.
      // Let's try direct array first as it's common in newer ones, or check help.
      // Actually the lint error said: Property 'records' is missing in type ... but required in type 'UpsertOptions'.
      await pineconeIndex.upsert({
        records: records
      }); 
      console.log("Batch uploaded successfully.");
    }

    console.log("✅ Upsert complete");
  } catch (error) {
    console.error("Error:", error);
  }
}

prepare();
