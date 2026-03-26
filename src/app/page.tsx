"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Empty,
  Input,
  List,
  Popconfirm,
  Space,
  Spin,
  Typography,
  message,
} from "antd";
import type { PhotoItem } from "@/types/photo";

const { Title, Text } = Typography;
const { TextArea } = Input;

async function readJsonResponse<T>(res: Response): Promise<T> {
  const text = await res.text();

  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      res.ok
        ? "Server returned an invalid response."
        : `Request failed with status ${res.status}.`
    );
  }
}

export default function HomePage() {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [submittingMap, setSubmittingMap] = useState<Record<number, boolean>>(
    {}
  );
  const [deletingMap, setDeletingMap] = useState<Record<number, boolean>>({});

  async function fetchPhotos() {
    try {
      setLoading(true);
      const res = await fetch("/api/photos");
      const data = await readJsonResponse<PhotoItem[] | { error?: string }>(res);

      if (!res.ok) {
        throw new Error(
          !Array.isArray(data) && data.error
            ? data.error
            : "Failed to fetch photos"
        );
      }

      if (!Array.isArray(data)) {
        throw new Error("Server returned an unexpected payload.");
      }

      setPhotos(data);
    } catch (error) {
      console.error(error);
      message.error("Failed to load photos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPhotos();
  }, []);

  async function handleUpload() {
    if (!selectedFile) {
      message.warning("Please choose an image.");
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await readJsonResponse<{ error?: string }>(res);

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      message.success("Photo uploaded successfully.");
      setSelectedFile(null);

      const fileInput = document.getElementById(
        "photo-upload-input"
      ) as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";

      await fetchPhotos();
    } catch (error) {
      console.error(error);
      message.error(
        error instanceof Error ? error.message : "Upload failed."
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleAddComment(photoId: number) {
    const content = (commentInputs[photoId] || "").trim();

    if (!content) {
      message.warning("Comment cannot be empty.");
      return;
    }

    try {
      setSubmittingMap((prev) => ({ ...prev, [photoId]: true }));

      const res = await fetch(`/api/photos/${photoId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });

      const data = await readJsonResponse<{ error?: string }>(res);

      if (!res.ok) {
        throw new Error(data.error || "Failed to add comment");
      }

      message.success("Comment added.");
      setCommentInputs((prev) => ({ ...prev, [photoId]: "" }));
      await fetchPhotos();
    } catch (error) {
      console.error(error);
      message.error(
        error instanceof Error ? error.message : "Failed to add comment."
      );
    } finally {
      setSubmittingMap((prev) => ({ ...prev, [photoId]: false }));
    }
  }

  async function handleDeletePhoto(photoId: number) {
    try {
      setDeletingMap((prev) => ({ ...prev, [photoId]: true }));

      const res = await fetch(`/api/photos/${photoId}`, {
        method: "DELETE",
      });

      const data = await readJsonResponse<{ error?: string }>(res);

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete photo");
      }

      message.success("Photo deleted.");
      setPhotos((prev) => prev.filter((photo) => photo.id !== photoId));
      setCommentInputs((prev) => {
        const next = { ...prev };
        delete next[photoId];
        return next;
      });
    } catch (error) {
      console.error(error);
      message.error(
        error instanceof Error ? error.message : "Failed to delete photo."
      );
    } finally {
      setDeletingMap((prev) => ({ ...prev, [photoId]: false }));
    }
  }

  return (
    <main className="page">
      <div className="container">
        <Title level={2}>Photo Upload and Comments</Title>
        <Text type="secondary">
          Upload a photo, then add comments below each photo.
        </Text>

        <Card className="upload-card">
          <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
            <input
              id="photo-upload-input"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setSelectedFile(file);
              }}
            />

            <Button type="primary" onClick={handleUpload} loading={uploading}>
              Upload Photo
            </Button>
          </Space>
        </Card>

        {loading ? (
          <div className="center-box">
            <Spin size="large" />
          </div>
        ) : photos.length === 0 ? (
          <Card>
            <Empty description="No photos uploaded yet" />
          </Card>
        ) : (
          <div className="photo-grid">
            {photos.map((photo) => (
              <Card
                key={photo.id}
                title={photo.originalName}
                className="photo-card"
                extra={
                  <Popconfirm
                    title="Delete this photo?"
                    description="This will also delete all comments."
                    okText="Delete"
                    cancelText="Cancel"
                    okButtonProps={{ danger: true, loading: deletingMap[photo.id] }}
                    onConfirm={() => handleDeletePhoto(photo.id)}
                  >
                    <Button danger loading={deletingMap[photo.id]}>
                      Delete
                    </Button>
                  </Popconfirm>
                }
                cover={
                  <img
                    src={photo.filePath}
                    alt={photo.originalName}
                    className="photo-image"
                  />
                }
              >
                <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
                  <Text type="secondary">
                    Uploaded: {new Date(photo.createdAt).toLocaleString()}
                  </Text>

                  <div>
                    <Title level={5}>Comments</Title>

                    {photo.comments.length === 0 ? (
                      <Text type="secondary">No comments yet.</Text>
                    ) : (
                      <List
                        size="small"
                        bordered
                        dataSource={photo.comments}
                        renderItem={(comment) => (
                          <List.Item>
                            <div style={{ width: "100%" }}>
                              <div>{comment.content}</div>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {new Date(comment.createdAt).toLocaleString()}
                              </Text>
                            </div>
                          </List.Item>
                        )}
                      />
                    )}
                  </div>

                  <Space orientation="vertical" size="small" style={{ width: "100%" }}>
                    <TextArea
                      rows={3}
                      placeholder="Write a comment..."
                      value={commentInputs[photo.id] || ""}
                      onChange={(e) =>
                        setCommentInputs((prev) => ({
                          ...prev,
                          [photo.id]: e.target.value,
                        }))
                      }
                    />
                    <Button
                      type="primary"
                      onClick={() => handleAddComment(photo.id)}
                      loading={submittingMap[photo.id]}
                    >
                      Add Comment
                    </Button>
                  </Space>
                </Space>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
