import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(req: Request, { params }: Params) {
  try {
    const pool = getPool();
    const { id } = await params;
    const photoId = Number(id);

    if (Number.isNaN(photoId)) {
      return NextResponse.json(
        { error: "Invalid photo id." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const content = String(body.content ?? "").trim();

    if (!content) {
      return NextResponse.json(
        { error: "Comment cannot be empty." },
        { status: 400 }
      );
    }

    const photoCheck = await pool.query(
      `SELECT id FROM photos WHERE id = $1`,
      [photoId]
    );

    if (photoCheck.rowCount === 0) {
      return NextResponse.json(
        { error: "Photo not found." },
        { status: 404 }
      );
    }

    const result = await pool.query(
      `
      INSERT INTO comments (photo_id, content)
      VALUES ($1, $2)
      RETURNING id, photo_id, content, created_at
      `,
      [photoId, content]
    );

    const row = result.rows[0];

    return NextResponse.json({
      id: row.id,
      photoId: row.photo_id,
      content: row.content,
      createdAt: row.created_at,
    });
  } catch (error) {
    console.error("Create comment error:", error);
    return NextResponse.json(
      { error: "Failed to add comment." },
      { status: 500 }
    );
  }
}
