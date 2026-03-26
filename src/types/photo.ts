export type CommentItem = {
  id: number;
  photoId: number;
  content: string;
  createdAt: string;
};

export type PhotoItem = {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  filePath: string;
  createdAt: string;
  comments: CommentItem[];
};