import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

export async function saveUploadedFile(file: File) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });

  const safeOriginalName = file.name.replace(/\s+/g, "-");
  const uniqueName = `${Date.now()}-${safeOriginalName}`;
  const fullPath = path.join(uploadsDir, uniqueName);

  await writeFile(fullPath, buffer);

  return {
    filename: uniqueName,
    originalName: file.name,
    mimeType: file.type,
    filePath: `/uploads/${uniqueName}`,
  };
}

export async function deleteUploadedFile(filePath: string) {
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  const filename = path.basename(filePath);
  const fullPath = path.join(uploadsDir, filename);

  try {
    await unlink(fullPath);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;

    if (err.code !== "ENOENT") {
      throw error;
    }
  }
}
