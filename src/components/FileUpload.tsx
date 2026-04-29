import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, X, FileText, Image, Download, Camera, ZoomIn, ZoomOut, RotateCcw, Maximize2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";
import { compressUploadFile, shouldUseServerFallback } from "@/lib/uploadCompression";

interface Attachment {
  id: string;
  filename: string;
  content_type: string;
  file_url: string;
  created_at: string;
  file_size?: number; // File size in bytes
  /** Object name under `temp/{userId}/` or `{expenseId}/` in the receipts bucket */
  storage_path?: string;
}

interface FileUploadProps {
  expenseId: string;
  lineItemId?: string;
  onUploadComplete?: (attachment: Attachment) => void;
  onUploadError?: (error: string) => void;
  className?: string;
  required?: boolean;
}

export function FileUpload({ 
  expenseId, 
  lineItemId, 
  onUploadComplete, 
  onUploadError,
  className,
  required = false
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageZoom, setImageZoom] = useState(1);
  const totalSizeRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user, organizationId } = useAuth();
  const isMobile = useIsMobile();
  const MAX_TOTAL_SIZE = 2 * 1024 * 1024;

  const getTotalSize = (list: Attachment[]) =>
    list.reduce((sum, att) => sum + (att.file_size || 0), 0);

  // Load existing attachments when expenseId is provided (not "new")
  useEffect(() => {
    const loadAttachments = async () => {
      if (expenseId && expenseId !== "new" && organizationId) {
        try {
          const { data, error } = await supabase
            .from('attachments')
            .select('*')
            .eq('expense_id', expenseId)
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false });
          
          if (error) {
            console.error('Error loading attachments:', error);
            return;
          }
          
          if (data && data.length > 0) {
            // Map data to include file_size (default to 0 if not available)
            const attachmentsWithSize = data.map((att) => ({
              ...att,
              file_size: att.file_size || 0
            }));
            setAttachments(attachmentsWithSize);
            totalSizeRef.current = getTotalSize(attachmentsWithSize);
            console.log('✅ Loaded existing attachments:', attachmentsWithSize.length);
          } else {
            totalSizeRef.current = 0;
          }
        } catch (error) {
          console.error('Error fetching attachments:', error);
          totalSizeRef.current = 0;
        }
      }
    };
    
    loadAttachments();
  }, [expenseId, organizationId]);


  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      await uploadFile(file);
    }
    
    // Reset input value to allow selecting the same file again
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const bytesToBase64 = (bytes: Uint8Array) => {
    const chunkSize = 0x8000;
    let binary = "";
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    return btoa(binary);
  };

  // Image compression removed as requested

  // PDF compression removed as requested

  const uploadFile = async (file: File) => {
    try {
      setUploading(true);
      setUploadProgress(0);
      setUploadStatus("Preparing file...");
      
      // Calculate current total size of all attachments - 2MB combined limit
      const currentTotalSize = totalSizeRef.current;
      
      const remainingBudget = Math.max(0, MAX_TOTAL_SIZE - currentTotalSize);

      // Allow PNG, JPG, HEIC images and PDF files
      const allowedTypes = [
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/heic',
        'image/heif',
        'application/pdf'
      ];

      if (!allowedTypes.includes(file.type)) {
        throw new Error("Only PNG, JPG image files and PDF files are allowed for bill uploads");
      }

      // Additional validation for file extensions
      const allowedExtensions = ['.png', '.jpg', '.jpeg', '.heic', '.heif', '.pdf'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      if (!allowedExtensions.includes(fileExtension)) {
        throw new Error("Only PNG/JPG/HEIC image files and PDF files are allowed for bill uploads");
      }

      setUploadProgress(10);
      setUploadStatus("Compressing file...");
      const compressionResult = await compressUploadFile(file, {
        targetBytes: Math.max(remainingBudget, 200 * 1024),
        absoluteCapBytes: 2 * 1024 * 1024,
        timeoutMs: 15000,
      });
      let fileToUpload = compressionResult.outputFile;

      if (shouldUseServerFallback(compressionResult, remainingBudget)) {
        setUploadStatus("Trying server-side compression...");
        const base64 = bytesToBase64(new Uint8Array(await file.arrayBuffer()));
        const { data: fallbackData, error: fallbackError } = await supabase.functions.invoke("compress-upload", {
          body: {
            file_name: file.name,
            mime_type: file.type,
            file_base64: base64,
            target_bytes: remainingBudget,
            absolute_cap_bytes: 2 * 1024 * 1024,
          },
        });
        if (!fallbackError && fallbackData?.ok && fallbackData?.compressed_base64) {
          const compressedBytes = Uint8Array.from(atob(fallbackData.compressed_base64), (c) => c.charCodeAt(0));
          const blob = new Blob([compressedBytes], { type: fallbackData.mime_type || file.type });
          fileToUpload = new File([blob], fallbackData.file_name || file.name, { type: blob.type });
        }
      }

      // Final size gates after compression/fallback
      if (currentTotalSize + fileToUpload.size > MAX_TOTAL_SIZE) {
        const currentTotalMB = (currentTotalSize / (1024 * 1024)).toFixed(2);
        const fileSizeMB = (fileToUpload.size / (1024 * 1024)).toFixed(2);
        throw new Error(`File could not be compressed enough. Current total: ${currentTotalMB}MB, file: ${fileSizeMB}MB, max allowed total is 2MB.`);
      }

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      // Handle case where expenseId is "new" or undefined
      const uploadPath = expenseId === "new" || !expenseId ? `temp/${user?.id}/${fileName}` : `${expenseId}/${fileName}`;

      // Upload file to Supabase Storage (use receipts bucket as primary)
      const bucketName = 'receipts';
      
      // Validate user is authenticated
      if (!user?.id) {
        throw new Error("You must be logged in to upload files");
      }
      
      console.log('📤 Uploading file:', {
        fileName: file.name,
        originalSize: file.size,
        fileSize: fileToUpload.size,
        fileType: fileToUpload.type,
        uploadPath,
        expenseId,
        userId: user.id
      });
      
      setUploadProgress(30);
      setUploadStatus("Uploading compressed file...");
      
      const uploadResult = await supabase.storage
        .from('receipts')
        .upload(uploadPath, fileToUpload, {
          cacheControl: '3600',
          upsert: false,
          metadata: {
            originalFilename: file.name,
            uploadByteLength: String(fileToUpload.size),
            originalByteLength: String(file.size),
          },
        });

      if (uploadResult.error) {
        console.error('❌ Storage upload error:', uploadResult.error);
        console.error('Error details:', {
          message: uploadResult.error.message,
          statusCode: uploadResult.error.statusCode,
          error: uploadResult.error.error
        });
        throw new Error(`Failed to upload file: ${uploadResult.error.message}`);
      }
      
      console.log('✅ File uploaded successfully:', uploadResult.data);
      setUploadProgress(70);

      // Get public URL (use the same bucket that was used for upload)
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(uploadPath);
      
      console.log('📎 Public URL generated:', urlData.publicUrl);
      setUploadProgress(85);

      // Save attachment record to database (only if expenseId is not "new")
      let attachmentData = null;
      if (expenseId !== "new" && expenseId) {
        if (!organizationId) {
          throw new Error("Organization not found");
        }
        
        console.log('💾 Saving attachment to database:', {
          expense_id: expenseId,
          organization_id: organizationId,
          filename: file.name
        });
        
        const { data, error: attachmentError } = await supabase
          .from('attachments')
          .insert({
            expense_id: expenseId,
            organization_id: organizationId,
            line_item_id: lineItemId,
            file_url: urlData.publicUrl,
            filename: file.name,
            content_type: fileToUpload.type,
            uploaded_by: user?.id,
            file_size: fileToUpload.size,
          })
          .select()
          .single();
        
        if (attachmentError) {
          console.error('❌ Database insert error:', attachmentError);
          throw attachmentError;
        }
        attachmentData = data
          ? { ...data, storage_path: fileName }
          : data;
        console.log('✅ Attachment saved to database:', attachmentData);
      }
      
      setUploadProgress(100);

      // Create a temporary attachment object for new expenses
      const tempAttachment = {
        id: `temp-${Date.now()}-${fileName}`,
        filename: file.name,
        content_type: fileToUpload.type,
        file_url: urlData.publicUrl,
        created_at: new Date().toISOString(),
        file_size: fileToUpload.size,
        storage_path: fileName,
      };

      setAttachments(prev => [...prev, attachmentData || tempAttachment]);
      totalSizeRef.current += fileToUpload.size;
      
      toast({
        title: "Upload successful",
        description:
          fileToUpload.size < file.size
            ? `${file.name} compressed ${formatFileSize(file.size)} -> ${formatFileSize(fileToUpload.size)}`
            : `${file.name} uploaded (${formatFileSize(fileToUpload.size)})`,
      });

      if (onUploadComplete) {
        onUploadComplete(attachmentData || tempAttachment);
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      const errorMessage = error.message || "Failed to upload file";
      
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: errorMessage,
      });

      onUploadError?.(errorMessage);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setUploadStatus("");
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const deleteAttachment = async (attachmentId: string) => {
    try {
      const attachment = attachments.find(a => a.id === attachmentId);
      if (!attachment) return;

      console.log('🗑️ Deleting attachment:', {
        attachmentId,
        filename: attachment.filename,
        fileUrl: attachment.file_url
      });

      // Extract file path from URL
      // Handle both public URLs and paths
      let filePath = '';
      if (attachment.file_url.startsWith('http')) {
        const url = new URL(attachment.file_url);
        // Extract path after /storage/v1/object/public/receipts/
        const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/receipts\/(.+)$/);
        if (pathMatch) {
          filePath = pathMatch[1];
        } else {
          // Fallback: try to extract from pathname
          const parts = url.pathname.split('/');
          const receiptsIndex = parts.indexOf('receipts');
          if (receiptsIndex !== -1 && receiptsIndex < parts.length - 1) {
            filePath = parts.slice(receiptsIndex + 1).join('/');
          }
        }
      } else {
        // If it's already a path
        filePath = attachment.file_url;
      }

      console.log('📁 Extracted file path:', filePath);

      // Delete from storage if filePath is valid
      if (filePath) {
        const { error: storageError } = await supabase.storage
          .from('receipts')
          .remove([filePath]);
        
        if (storageError) {
          console.error('⚠️ Storage delete error (continuing with DB delete):', storageError);
        } else {
          console.log('✅ File deleted from storage');
        }
      }

      // Delete from database (only if it's not a temp attachment)
      if (attachmentId && !attachmentId.startsWith('temp-')) {
        const { error: dbError } = await supabase
          .from('attachments')
          .delete()
          .eq('id', attachmentId);
        
        if (dbError) {
          console.error('❌ Database delete error:', dbError);
          throw dbError;
        }
        console.log('✅ Attachment deleted from database');
      }

      // Remove from local state
      setAttachments(prev => prev.filter(a => a.id !== attachmentId));
      totalSizeRef.current = Math.max(0, totalSizeRef.current - (attachment.file_size || 0));
      
      toast({
        title: "File deleted",
        description: `${attachment.filename} has been deleted`,
      });
    } catch (error: any) {
      console.error("❌ Delete error:", error);
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: error.message || "Failed to delete file",
      });
    }
  };

  const getFileIcon = (contentType: string) => {
    if (contentType.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    }
    if (contentType === 'application/pdf') {
      return <FileText className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const zoomIn = () => setImageZoom((z) => Math.min(5, Number((z + 0.25).toFixed(2))));
  const zoomOut = () => setImageZoom((z) => Math.max(0.25, Number((z - 0.25).toFixed(2))));
  const resetZoom = () => setImageZoom(1);
  const fitToScreen = () => setImageZoom(0.9);

  return (
    <>
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Receipt Attachments
        </CardTitle>
        <CardDescription>
          Upload receipts and supporting documents for your expenses
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
          {/* Regular file input for desktop */}
                <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/png,image/jpeg,image/jpg,image/heic,image/heif,application/pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {/* Camera input for mobile */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div className="space-y-2">
            <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
            <div className="flex flex-col sm:flex-row gap-2 justify-center items-center">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full sm:w-auto"
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose Files
              </Button>
              {isMobile && (
                <Button
                  variant="outline"
                  onClick={handleCameraClick}
                  disabled={uploading}
                  className="w-full sm:w-auto bg-blue-50 hover:bg-blue-100 border-blue-300"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Take Photo
                </Button>
              )}
            </div>
              <p className="text-sm text-muted-foreground mt-2">
              {isMobile ? "Take a photo or choose from files" : "or drag and drop bill photos/PDFs here"}
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, HEIC, PDF (auto-compressed) • Total limit: 2MB for all files combined
                {required && (
                  <span className="text-red-500 font-medium"> * Required for submission</span>
                )}
            </p>
          </div>

          {uploading && (
            <div className="mt-4 space-y-2">
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-sm text-muted-foreground">{uploadStatus || "Uploading..."}</p>
            </div>
          )}
        </div>

        {/* Attachments List */}
        {attachments.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Uploaded Files</h4>
              <p className="text-xs text-muted-foreground">
                Total: {formatFileSize(attachments.reduce((sum, att) => sum + (att.file_size || 0), 0))} / {formatFileSize(2 * 1024 * 1024)}
              </p>
            </div>
            <div className="space-y-2">
              {attachments.filter(attachment => attachment).map((attachment) => (
                <div
                  key={attachment.id || attachment.file_url}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getFileIcon(attachment.content_type || 'image/jpeg')}
                    <div>
                      <p className="font-medium text-sm">{attachment.filename || 'Unknown file'}</p>
                      <p className="text-xs text-muted-foreground">
                        {attachment.content_type || 'Unknown type'} • {attachment.file_size ? formatFileSize(attachment.file_size) : 'Unknown size'} • {(() => {
                          try {
                            return attachment.created_at ? format(new Date(attachment.created_at), "MMM d, yyyy") : 'Unknown date';
                          } catch {
                            return 'Invalid date';
                          }
                        })()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setImagePreviewUrl(attachment.file_url);
                        setImageZoom(1);
                        setImagePreviewOpen(true);
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteAttachment(attachment.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>

    {/* Image Preview Dialog */}
    <Dialog open={imagePreviewOpen} onOpenChange={setImagePreviewOpen}>
      <DialogContent className="max-w-5xl">
        {imagePreviewUrl && (
          imagePreviewUrl.toLowerCase().endsWith('.pdf') ? (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                Some browsers block embedded PDF previews. Use the action below to open it directly.
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={() => window.open(imagePreviewUrl, "_blank", "noopener,noreferrer")}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open PDF in New Tab
                </Button>
                <Button type="button" variant="outline" asChild>
                  <a href={imagePreviewUrl} download target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </a>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm text-muted-foreground">
                  Zoom: {Math.round(imageZoom * 100)}%
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={zoomOut}>
                    <ZoomOut className="h-4 w-4 mr-1" />
                    Zoom Out
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={zoomIn}>
                    <ZoomIn className="h-4 w-4 mr-1" />
                    Zoom In
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={fitToScreen}>
                    <Maximize2 className="h-4 w-4 mr-1" />
                    Fit
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={resetZoom}>
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Reset
                  </Button>
                </div>
              </div>
              <div
                className="w-full h-[75vh] overflow-auto rounded border bg-muted/30"
                onWheel={(e) => {
                  if (!e.ctrlKey) return;
                  e.preventDefault();
                  if (e.deltaY < 0) {
                    zoomIn();
                  } else {
                    zoomOut();
                  }
                }}
              >
                <div className="min-h-full min-w-full flex items-center justify-center p-4">
                  <img
                    src={imagePreviewUrl}
                    alt="Attachment preview"
                    className="rounded shadow-sm select-none"
                    style={{
                      transform: `scale(${imageZoom})`,
                      transformOrigin: "center center",
                      transition: "transform 0.15s ease-out",
                      maxWidth: imageZoom <= 1 ? "100%" : "none",
                      height: "auto",
                    }}
                    draggable={false}
                  />
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Tip: Hold <kbd>Ctrl</kbd> and use mouse wheel to zoom quickly.
              </div>
            </div>
          )
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}

