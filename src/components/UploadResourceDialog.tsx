import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Upload, FileText, Video, Image, Archive } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useResources } from "@/hooks/useDatabase2";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "image/jpeg",
  "image/png",
  "image/gif",
  "video/mp4",
  "video/avi",
  "video/quicktime",
  "application/zip",
  "application/x-rar-compressed",
];

const categories = [
  "Academic",
  "Research", 
  "Laboratory",
  "Software",
  "Career",
  "Creative",
  "Reference",
  "Past Papers",
  "Project"
];

const subjects = [
  "Computer Science",
  "Programming",
  "Data Structures", 
  "Algorithms",
  "Database Systems",
  "Software Engineering",
  "Computer Networks",
  "Artificial Intelligence",
  "Machine Learning",
  "Web Development",
  "Mobile Development",
  "Mathematics",
  "Statistics", 
  "Physics",
  "Chemistry",
  "Economics",
  "Finance",
  "Marketing",
  "Management",
  "English",
  "General Studies"
];

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title too long"),
  description: z.string().max(500, "Description too long").optional(),
  category: z.string().min(1, "Please select a category"),
  subject: z.string().optional(),
  course_code: z.string().max(20, "Course code too long").optional(),
  tags: z.array(z.string()).max(10, "Maximum 10 tags allowed"),
  file: z
    .any()
    .refine((file) => file?.size <= MAX_FILE_SIZE, "File size must be less than 50MB")
    .refine(
      (file) => ACCEPTED_FILE_TYPES.includes(file?.type),
      "Invalid file type. Please upload PDF, DOC, PPT, XLS, TXT, images, videos, or archives"
    ),
});

type FormData = z.infer<typeof formSchema>;

interface UploadResourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadSuccess?: () => void;
}

export default function UploadResourceDialog({ open, onOpenChange, onUploadSuccess }: UploadResourceDialogProps) {
  const [currentTag, setCurrentTag] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { createResource } = useResources();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      subject: "",
      course_code: "",
      tags: [],
    },
  });

  const selectedFile = form.watch("file");
  const tags = form.watch("tags") || [];

  const getFileIcon = (fileType: string) => {
    if (fileType?.includes("pdf")) return <FileText className="h-8 w-8 text-red-500" />;
    if (fileType?.includes("video")) return <Video className="h-8 w-8 text-purple-500" />;
    if (fileType?.includes("image")) return <Image className="h-8 w-8 text-green-500" />;
    if (fileType?.includes("zip") || fileType?.includes("rar")) return <Archive className="h-8 w-8 text-orange-500" />;
    return <FileText className="h-8 w-8 text-blue-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim()) && tags.length < 10) {
      form.setValue("tags", [...tags, currentTag.trim()]);
      setCurrentTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    form.setValue("tags", tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setIsUploading(true);
      
      await createResource({
        title: data.title,
        description: data.description,
        category: data.category,
        subject: data.subject,
        course_code: data.course_code,
        tags: data.tags,
        file: data.file,
      });

      toast({
        title: "Success!",
        description: "Resource uploaded successfully",
      });

      // Call the success callback to refresh the parent component
      if (onUploadSuccess) {
        onUploadSuccess();
      }

      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload resource",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Resource
          </DialogTitle>
          <DialogDescription>
            Share educational materials with your fellow students. All uploads are subject to community guidelines.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* File Upload */}
            <FormField
              control={form.control}
              name="file"
              render={({ field: { onChange, value, ...field } }) => (
                <FormItem>
                  <FormLabel>File *</FormLabel>
                  <FormControl>
                    <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-6">
                      {selectedFile ? (
                        <div className="flex items-center gap-4">
                          {getFileIcon(selectedFile.type)}
                          <div className="flex-1">
                            <p className="font-medium truncate">{selectedFile.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatFileSize(selectedFile.size)}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onChange(null)}
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-lg font-medium mb-2">Choose a file to upload</p>
                          <p className="text-sm text-muted-foreground mb-4">
                            PDF, DOC, PPT, XLS, TXT, images, videos, or archives (max 50MB)
                          </p>
                          <input
                            type="file"
                            accept={ACCEPTED_FILE_TYPES.join(",")}
                            onChange={(e) => onChange(e.target.files?.[0] || null)}
                            className="hidden"
                            id="file-upload"
                            {...field}
                          />
                          <label htmlFor="file-upload">
                            <Button type="button" variant="outline" asChild>
                              <span>Select File</span>
                            </Button>
                          </label>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter resource title..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what this resource contains and how it can help other students..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional but recommended to help others understand the content
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category and Subject */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject} value={subject}>
                            {subject}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Course Code */}
            <FormField
              control={form.control}
              name="course_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Code</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., CSE110, MAT110, ENG101..." {...field} />
                  </FormControl>
                  <FormDescription>
                    Optional - helps students find resources for specific courses
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tags */}
            <FormField
              control={form.control}
              name="tags"
              render={() => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add a tag..."
                          value={currentTag}
                          onChange={(e) => setCurrentTag(e.target.value)}
                          onKeyPress={handleKeyPress}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={addTag}
                          disabled={!currentTag.trim() || tags.length >= 10}
                        >
                          Add
                        </Button>
                      </div>
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                              {tag}
                              <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => removeTag(tag)}
                              />
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Add relevant keywords to help others discover your resource (max 10)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isUploading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUploading} className="flex-1">
                {isUploading ? "Uploading..." : "Upload Resource"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
