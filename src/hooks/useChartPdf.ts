import { useState, useCallback, useEffect, useRef } from "react";
import { jsPDF } from "jspdf";
import { BirthData } from "@/components/intake/BirthDataForm";
import { NatalChartData } from "@/data/natalChartData";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export type PdfState = "idle" | "generating-script" | "generating-pdf" | "uploading" | "ready" | "error";

interface UseChartPdfReturn {
  pdfState: PdfState;
  pdfUrl: string | null;
  script: string | null;
  progress: number;
  error: string | null;
  storagePath: string | null;
  generatePdf: (birthData: BirthData, houseSystem: string, chartData: NatalChartData) => Promise<void>;
  reset: () => void;
}

export function useChartPdf(): UseChartPdfReturn {
  const [pdfState, setPdfState] = useState<PdfState>("idle");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [script, setScript] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [storagePath, setStoragePath] = useState<string | null>(null);
  const { toast } = useToast();

  const generatePdf = useCallback(async (birthData: BirthData, houseSystem: string, chartData: NatalChartData) => {
    setPdfState("generating-script");
    setProgress(10);
    setError(null);

    const { planets, houses } = chartData;

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("You must be signed in to generate a chart");
      }

      // Step 1: Generate AI script for the reading
      const scriptResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-reading`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            birthData,
            planets,
            houseSystem,
          }),
        }
      );

      if (!scriptResponse.ok) {
        const errorData = await scriptResponse.json();
        throw new Error(errorData.error || `Script generation failed: ${scriptResponse.status}`);
      }

      const scriptData = await scriptResponse.json();
      if (!scriptData.script) {
        throw new Error("No script generated");
      }

      setScript(scriptData.script);
      setProgress(50);
      setPdfState("generating-pdf");

      // Step 2: Generate PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;
      let yPosition = margin;

      // Helper function for text wrapping
      const addWrappedText = (text: string, fontSize: number, isBold = false) => {
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        const lines = doc.splitTextToSize(text, contentWidth);
        
        for (const line of lines) {
          if (yPosition > 270) {
            doc.addPage();
            yPosition = margin;
          }
          doc.text(line, margin, yPosition);
          yPosition += fontSize * 0.5;
        }
        yPosition += 5;
      };

      // Title
      doc.setTextColor(75, 0, 130); // Purple
      addWrappedText(`${birthData.name}'s Natal Chart Reading`, 24, true);
      
      // Subtitle
      doc.setTextColor(100, 100, 100);
      const [year, month, day] = birthData.birthDate.split('-').map(Number);
      const birthDateFormatted = new Date(year, month - 1, day).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      addWrappedText(`Born ${birthDateFormatted}${!birthData.timeUnknown ? ` at ${birthData.birthTime}` : ''}`, 12);
      if (birthData.location) {
        addWrappedText(`Location: ${birthData.location}`, 12);
      }
      addWrappedText(`House System: ${houseSystem.charAt(0).toUpperCase() + houseSystem.slice(1)}`, 12);
      
      yPosition += 10;
      
      // Divider
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 15;

      // AI Reading
      doc.setTextColor(0, 0, 0);
      addWrappedText("Your Personalized Reading", 16, true);
      yPosition += 5;
      addWrappedText(scriptData.script, 11);
      
      yPosition += 15;

      // Planetary Positions
      doc.addPage();
      yPosition = margin;
      doc.setTextColor(75, 0, 130);
      addWrappedText("Planetary Positions", 18, true);
      yPosition += 5;
      
      doc.setTextColor(0, 0, 0);
      for (const planet of planets) {
        addWrappedText(`${planet.symbol} ${planet.name}: ${planet.degree.toFixed(2)}° ${planet.sign} (House ${planet.house})`, 11, true);
        addWrappedText(planet.description, 10);
        yPosition += 3;
      }

      // Houses
      doc.addPage();
      yPosition = margin;
      doc.setTextColor(75, 0, 130);
      addWrappedText("House Themes", 18, true);
      yPosition += 5;
      
      doc.setTextColor(0, 0, 0);
      for (const house of houses) {
        addWrappedText(`House ${house.number} (${house.sign}): ${house.theme}`, 11, true);
        addWrappedText(house.description, 10);
        yPosition += 3;
      }

      // Footer on last page
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text(
        "Generated by Cosmic Connections",
        margin,
        285
      );

      // Create blob
      const pdfBlob = doc.output("blob");
      
      setProgress(70);
      setPdfState("uploading");
      
      // Use consistent file path per user (overwrites existing)
      const filePath = `charts/${user.id}/natal_chart.pdf`;
      
      const { error: uploadError } = await supabase.storage
        .from("natal-charts")
        .upload(filePath, pdfBlob, {
          contentType: "application/pdf",
          upsert: true, // Overwrite existing file
        });
      
      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }
      
      setProgress(85);
      
      // Delete any existing records for this user, then insert new one
      await supabase
        .from("natal_chart_pdfs")
        .delete()
        .eq("user_id", user.id);
      
      const { error: dbError } = await supabase
        .from("natal_chart_pdfs")
        .insert({
          user_id: user.id,
          name: birthData.name,
          birth_date: birthData.birthDate,
          birth_time: birthData.timeUnknown ? null : birthData.birthTime,
          location: birthData.location || null,
          house_system: houseSystem,
          storage_path: filePath,
        });
      
      if (dbError) {
        console.error("DB record error:", dbError);
        throw new Error(`Database save failed: ${dbError.message}`);
      }
      
      // Get signed URL for download
      const { data: signedUrl } = await supabase.storage
        .from("natal-charts")
        .createSignedUrl(filePath, 3600); // 1 hour expiry
      
      const downloadUrl = signedUrl?.signedUrl || null;
      setPdfUrl(downloadUrl);
      setStoragePath(filePath);

      setProgress(100);
      setPdfState("ready");

      toast({
        title: "Chart Saved!",
        description: "Your natal chart reading has been saved to your account.",
      });
    } catch (err) {
      console.error("PDF generation error:", err);
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      setPdfState("error");
      
      toast({
        variant: "destructive",
        title: "Save failed",
        description: message,
      });
    }
  }, [toast]);

  const reset = useCallback(() => {
    setPdfState("idle");
    setPdfUrl(null);
    setScript(null);
    setProgress(0);
    setError(null);
    setStoragePath(null);
  }, []);

  return {
    pdfState,
    pdfUrl,
    script,
    progress,
    error,
    storagePath,
    generatePdf,
    reset,
  };
}

// Hook for auto-saving chart when it's generated
export function useAutoSaveChart(
  birthData: BirthData | null,
  houseSystem: string,
  chartData: NatalChartData | null,
  isAuthenticated: boolean
) {
  const { pdfState, generatePdf, reset, pdfUrl, script, progress, error } = useChartPdf();
  const hasTriggered = useRef(false);

  useEffect(() => {
    // Auto-generate PDF when chart data becomes available AND user is authenticated
    if (birthData && chartData && pdfState === "idle" && !hasTriggered.current && isAuthenticated) {
      hasTriggered.current = true;
      generatePdf(birthData, houseSystem, chartData);
    }
  }, [birthData, chartData, houseSystem, pdfState, generatePdf, isAuthenticated]);

  // Reset trigger flag when reset is called
  const handleReset = useCallback(() => {
    hasTriggered.current = false;
    reset();
  }, [reset]);

  return {
    pdfState,
    pdfUrl,
    script,
    progress,
    error,
    reset: handleReset,
  };
}
