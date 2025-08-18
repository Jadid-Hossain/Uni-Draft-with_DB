import { useState } from "react";
import { supabase } from "@/lib/supabase";

export interface FileUploadResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

export const useClubApplicationFiles = () => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (
    file: File,
    userId: string,
    fileType: "portfolio" | "resume"
  ): Promise<FileUploadResult> => {
    setUploading(true);
    setError(null);

    try {
      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error("File size must be less than 5MB");
      }

      // Validate file type
      const allowedTypes = {
        portfolio: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/zip",
          "application/x-zip-compressed",
        ],
        resume: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
      };

      if (!allowedTypes[fileType].includes(file.type)) {
        const typeText =
          fileType === "portfolio"
            ? "PDF, DOC, DOCX, or ZIP files"
            : "PDF, DOC, or DOCX files";
        throw new Error(`Only ${typeText} are allowed for ${fileType}`);
      }

      // Create unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}_${fileType}_${Date.now()}.${fileExt}`;
      const filePath = `club-applications/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("club-applications")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      return {
        success: true,
        filePath: uploadData.path,
      };
    } catch (err: any) {
      const errorMessage = err.message || `Failed to upload ${fileType}`;
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setUploading(false);
    }
  };

  const getFileUrl = async (filePath: string): Promise<string | null> => {
    try {
      const { data } = await supabase.storage
        .from("club-applications")
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      return data?.signedUrl || null;
    } catch (err) {
      console.error("Error getting signed URL:", err);
      return null;
    }
  };

  const deleteFile = async (filePath: string): Promise<boolean> => {
    try {
      const { error } = await supabase.storage
        .from("club-applications")
        .remove([filePath]);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error("Error deleting file:", err);
      return false;
    }
  };

  return {
    uploadFile,
    getFileUrl,
    deleteFile,
    uploading,
    error,
  };
};
