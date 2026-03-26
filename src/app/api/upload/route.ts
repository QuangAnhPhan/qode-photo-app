import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { saveUploadedFile } from "@/lib/uploads";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const pool = getPool();
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file uploaded." },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed." },
        { status: 400 }
      );
    }

    const saved = await saveUploadedFile(file);

    const result = await pool.query(
      `
      INSERT INTO photos (filename, original_name, mime_type, file_path)
      VALUES ($1, $2, $3, $4)
      RETURNING id, filename, original_name, mime_type, file_path, created_at
      `,
      [saved.filename, saved.originalName, saved.mimeType, saved.filePath]
    );

    const row = result.rows[0];

    return NextResponse.json({
      id: row.id,
      filename: row.filename,
      originalName: row.original_name,
      mimeType: row.mime_type,
      filePath: row.file_path,
      createdAt: row.created_at,
      comments: [],
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image." },
      { status: 500 }
    );
  }
}
