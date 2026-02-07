import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, Loader2, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BirthData } from "./BirthDataForm";

interface PdfUploadProps {
  onExtracted: (data: BirthData) => void;
}

const PdfUpload = ({ onExtracted }: PdfUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("PDF must be less than 10MB");
      return;
    }

    setFileName(file.name);
    setIsProcessing(true);

    try {
      // Convert PDF to base64
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ""
        )
      );

      // Call edge function to extract data
      const { data, error } = await supabase.functions.invoke(
        "extract-chart-from-pdf",
        {
          body: { pdfBase64: base64 },
        }
      );

      if (error) {
        throw new Error(error.message || "Failed to process PDF");
      }

      if (!data.success) {
        throw new Error(data.error || "Could not extract birth data from PDF");
      }

      // Validate extracted data
      const extractedData = data.data;
      if (!extractedData.birthDate) {
        throw new Error("Could not find birth date in the chart");
      }

      const birthData: BirthData = {
        name: extractedData.name || "Chart Subject",
        birthDate: extractedData.birthDate,
        birthTime: extractedData.birthTime || "12:00",
        timeUnknown: extractedData.timeUnknown || !extractedData.birthTime,
        location: extractedData.location || "",
        latitude: extractedData.latitude || null,
        longitude: extractedData.longitude || null,
        timezone: extractedData.timezone || "UTC",
      };

      toast.success("Birth data extracted successfully!");
      onExtracted(birthData);
    } catch (error) {
      console.error("PDF extraction error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to extract data from PDF"
      );
      setFileName(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleClear = () => {
    setFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleInputChange}
        className="hidden"
      />

      <AnimatePresence mode="wait">
        {isProcessing ? (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-panel rounded-xl p-8 text-center space-y-4"
          >
            <div className="relative mx-auto w-16 h-16">
              <Loader2 className="w-16 h-16 animate-spin text-accent" />
              <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-yellow-400 animate-pulse" />
            </div>
            <div>
              <p className="text-lg font-medium">Analyzing your chart...</p>
              <p className="text-sm text-muted-foreground mt-1">
                AI is extracting birth data from {fileName}
              </p>
            </div>
          </motion.div>
        ) : fileName ? (
          <motion.div
            key="file"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-panel rounded-xl p-6 flex items-center gap-4"
          >
            <FileText className="w-10 h-10 text-accent flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{fileName}</p>
              <p className="text-sm text-muted-foreground">Ready to process</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClear}
              className="flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={handleClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`
              glass-panel rounded-xl p-8 text-center cursor-pointer
              border-2 border-dashed transition-all duration-300
              ${
                isDragging
                  ? "border-accent bg-accent/10 scale-[1.02]"
                  : "border-border/50 hover:border-accent/50 hover:bg-accent/5"
              }
            `}
          >
            <Upload
              className={`w-12 h-12 mx-auto mb-4 transition-colors ${
                isDragging ? "text-accent" : "text-muted-foreground"
              }`}
            />
            <p className="text-lg font-medium mb-1">
              {isDragging ? "Drop your chart here" : "Upload a natal chart PDF"}
            </p>
            <p className="text-sm text-muted-foreground">
              AI will extract birth data automatically
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              PDF up to 10MB
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PdfUpload;
