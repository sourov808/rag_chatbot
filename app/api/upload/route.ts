import { NextRequest, NextResponse } from "next/server";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { ensureCollection, getVectorStore } from "@/lib/qdrant";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import os from "os";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const collectionName = formData.get("collectionName") as string;
    const files = formData.getAll("files") as File[];

    if (!collectionName || files.length === 0) {
      return NextResponse.json(
        { error: "Collection name and files are required" },
        { status: 400 },
      );
    }

    // Ensure collection exists
    await ensureCollection(collectionName);
    const vectorStore = await getVectorStore(collectionName);
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 100,
    });

    const tempDir = path.join(os.tmpdir(), "rag-uploads");
    await mkdir(tempDir, { recursive: true });

    let totalChunks = 0;

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const tempFilePath = path.join(tempDir, file.name);

      await writeFile(tempFilePath, buffer);

      try {
        let docs = [];
        if (file.type === "application/pdf") {
          const loader = new PDFLoader(tempFilePath);
          docs = await loader.load();
        } else if (
          file.type === "text/plain" ||
          file.name.endsWith(".txt") ||
          file.name.endsWith(".md")
        ) {
          const content = buffer.toString("utf-8");
          docs = [
            {
              pageContent: content,
              metadata: { source: file.name },
            },
          ];
        } else {
          // Skip unsupported files for now or handle as generic
          console.log(`Skipping unsupported file type: ${file.type}`);
          continue;
        }

        if (docs.length > 0) {
          const splitDocs = await splitter.splitDocuments(docs);
          // Add metadata
          const docsWithMetadata = splitDocs.map((d) => ({
            ...d,
            metadata: {
              ...d.metadata,
              collection: collectionName,
              uploadDate: new Date().toISOString(),
              fileName: file.name,
            },
          }));

          await vectorStore.addDocuments(docsWithMetadata);
          totalChunks += docsWithMetadata.length;
        }
      } finally {
        // Clean up temp file
        await unlink(tempFilePath).catch(console.error);
      }
    }

    return NextResponse.json({
      message: `Successfully processed ${files.length} files into ${totalChunks} chunks in collection '${collectionName}'.`,
      status: "success",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to process upload";
    console.error("Upload error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
