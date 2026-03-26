import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function GET() {
  try {
    const pool = getPool();

    const photosResult = await pool.query(`
      SELECT id, filename, original_name, mime_type, file_path, created_at
      FROM photos
      ORDER BY created_at DESC
    `);

    const photos = photosResult.rows.map((row) => ({
      id: row.id,
      filename: row.filename,
      originalName: row.original_name,
      mimeType: row.mime_type,
      filePath: row.file_path,
      createdAt: row.created_at,
      comments: [],
    }));

    if (photos.length === 0) {
      return NextResponse.json([]);
    }

    const photoIds = photos.map((photo) => photo.id);

    const commentsResult = await pool.query(
      `
      SELECT id, photo_id, content, created_at
      FROM comments
      WHERE photo_id = ANY($1::int[])
      ORDER BY created_at ASC
      `,
      [photoIds]
    );

    const commentsByPhotoId = new Map<number, Array<{
      id: number;
      photoId: number;
      content: string;
      createdAt: string;
    }>>();

    for (const row of commentsResult.rows) {
      const item = {
        id: row.id,
        photoId: row.photo_id,
        content: row.content,
        createdAt: row.created_at,
      };

      if (!commentsByPhotoId.has(row.photo_id)) {
        commentsByPhotoId.set(row.photo_id, []);
      }

      commentsByPhotoId.get(row.photo_id)!.push(item);
    }

    const data = photos.map((photo) => ({
      ...photo,
      comments: commentsByPhotoId.get(photo.id) ?? [],
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("Fetch photos error:", error);
    return NextResponse.json(
      { error: "Failed to fetch photos." },
      { status: 500 }
    );
  }
}
