import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { deleteUploadedFile } from "@/lib/uploads";

type Params = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_req: Request, { params }: Params) {
  const pool = getPool();
  const client = await pool.connect();
  let committed = false;

  try {
    const { id } = await params;
    const photoId = Number(id);

    if (Number.isNaN(photoId)) {
      return NextResponse.json(
        { error: "Invalid photo id." },
        { status: 400 }
      );
    }

    await client.query("BEGIN");

    const photoResult = await client.query(
      `
      SELECT file_path
      FROM photos
      WHERE id = $1
      `,
      [photoId]
    );

    if (photoResult.rowCount === 0) {
      await client.query("ROLLBACK");

      return NextResponse.json(
        { error: "Photo not found." },
        { status: 404 }
      );
    }

    await client.query(
      `
      DELETE FROM comments
      WHERE photo_id = $1
      `,
      [photoId]
    );

    await client.query(
      `
      DELETE FROM photos
      WHERE id = $1
      `,
      [photoId]
    );

    await client.query("COMMIT");
    committed = true;

    try {
      await deleteUploadedFile(photoResult.rows[0].file_path);
    } catch (fileError) {
      console.error("Delete file error:", fileError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (!committed) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Delete rollback error:", rollbackError);
      }
    }

    console.error("Delete photo error:", error);
    return NextResponse.json(
      { error: "Failed to delete photo." },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
