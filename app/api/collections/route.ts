import { NextResponse } from "next/server";
import { listCollections } from "@/lib/qdrant";

export async function GET() {
  try {
    const collections = await listCollections();
    return NextResponse.json({ collections });
  } catch (error) {
    console.error("Error listing collections:", error);
    return NextResponse.json({ error: "Failed to list collections" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const collectionName = searchParams.get("name");

    if (!collectionName) {
      return NextResponse.json({ error: "Collection name is required" }, { status: 400 });
    }

    const { deleteCollection } = await import("@/lib/qdrant");
    await deleteCollection(collectionName);

    return NextResponse.json({ message: `Collection '${collectionName}' deleted successfully` });
  } catch (error) {
    console.error("Error deleting collection:", error);
    return NextResponse.json({ error: "Failed to delete collection" }, { status: 500 });
  }
}
