import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Download, Trash2, Calendar, MapPin, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface SavedChart {
  id: string;
  name: string;
  birth_date: string;
  birth_time: string | null;
  location: string | null;
  house_system: string;
  storage_path: string;
  created_at: string;
}

const SavedCharts = () => {
  const { user } = useAuth();
  const [charts, setCharts] = useState<SavedChart[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchCharts();
    }
  }, [user]);

  const fetchCharts = async () => {
    try {
      const { data, error } = await supabase
        .from("natal_chart_pdfs")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCharts(data || []);
    } catch (error) {
      console.error("Error fetching charts:", error);
      toast.error("Failed to load saved charts");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (chart: SavedChart) => {
    setDownloadingId(chart.id);
    try {
      const { data, error } = await supabase.storage
        .from("natal-charts")
        .createSignedUrl(chart.storage_path, 60);

      if (error) throw error;
      
      // Open in new tab for download
      window.open(data.signedUrl, "_blank");
      toast.success("Download started");
    } catch (error) {
      console.error("Error downloading chart:", error);
      toast.error("Failed to download chart");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (chart: SavedChart) => {
    setDeletingId(chart.id);
    try {
      // Delete from storage
      await supabase.storage
        .from("natal-charts")
        .remove([chart.storage_path]);

      // Delete from database
      const { error } = await supabase
        .from("natal_chart_pdfs")
        .delete()
        .eq("id", chart.id);

      if (error) throw error;

      setCharts(charts.filter((c) => c.id !== chart.id));
      toast.success("Chart deleted");
    } catch (error) {
      console.error("Error deleting chart:", error);
      toast.error("Failed to delete chart");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (charts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No saved charts yet.</p>
        <p className="text-sm text-muted-foreground mt-2">
          Generate a chart to see it here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
      {charts.map((chart, index) => (
        <motion.div
          key={chart.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="glass-panel rounded-lg p-4 border border-border/50"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-foreground truncate">{chart.name}</h3>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(chart.birth_date)}
                </span>
                {chart.birth_time && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {chart.birth_time}
                  </span>
                )}
                {chart.location && (
                  <span className="flex items-center gap-1 truncate max-w-[150px]">
                    <MapPin className="w-3 h-3" />
                    {chart.location.split(",")[0]}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1 capitalize">
                {chart.house_system.replace("-", " ")} houses
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDownload(chart)}
                disabled={downloadingId === chart.id}
                className="h-8 w-8 p-0"
              >
                {downloadingId === chart.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(chart)}
                disabled={deletingId === chart.id}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                {deletingId === chart.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default SavedCharts;
