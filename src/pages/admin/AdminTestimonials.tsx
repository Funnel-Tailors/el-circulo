import { useState, useCallback, useEffect } from "react";
import { Upload, Trash2, Loader2, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const BUCKET = "testimonial-screenshots";

interface StorageFile {
  name: string;
  id: string;
  url: string;
}

export default function AdminTestimonials() {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });

  const fetchFiles = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list("", { limit: 200, sortBy: { column: "name", order: "asc" } });

    if (error) {
      toast({ variant: "destructive", title: "Error cargando imágenes", description: error.message });
      setIsLoading(false);
      return;
    }

    const imageFiles = (data || []).filter((f) => !f.name.startsWith(".") && f.id);

    const { data: { publicUrl: baseUrl } } = supabase.storage.from(BUCKET).getPublicUrl("");

    setFiles(
      imageFiles.map((f) => ({
        name: f.name,
        id: f.id!,
        url: `${baseUrl.replace(/\/$/, "")}/${f.name}`,
      }))
    );
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const handleBulkUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputFiles = e.target.files;
      if (!inputFiles || inputFiles.length === 0) return;

      setIsUploading(true);
      setUploadProgress({ done: 0, total: inputFiles.length });

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < inputFiles.length; i++) {
        const file = inputFiles[i];
        // Generate sequential name with timestamp prefix for ordering
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const safeName = `t-${Date.now()}-${String(i).padStart(3, "0")}.${ext}`;

        const { error } = await supabase.storage.from(BUCKET).upload(safeName, file, {
          cacheControl: "31536000",
          upsert: false,
        });

        if (error) {
          errorCount++;
          console.error(`Error uploading ${file.name}:`, error.message);
        } else {
          successCount++;
        }

        setUploadProgress({ done: i + 1, total: inputFiles.length });
      }

      setIsUploading(false);
      toast({
        title: "Subida completada",
        description: `${successCount} subidas correctamente${errorCount > 0 ? `, ${errorCount} errores` : ""}`,
      });

      fetchFiles();
      // Reset input
      e.target.value = "";
    },
    [fetchFiles]
  );

  const handleDelete = useCallback(
    async (name: string) => {
      const { error } = await supabase.storage.from(BUCKET).remove([name]);
      if (error) {
        toast({ variant: "destructive", title: "Error borrando", description: error.message });
        return;
      }
      toast({ title: "Eliminada", description: name });
      fetchFiles();
    },
    [fetchFiles]
  );

  const handleDeleteAll = useCallback(async () => {
    if (!confirm(`¿Eliminar TODAS las ${files.length} imágenes? Esta acción no se puede deshacer.`)) return;

    const names = files.map((f) => f.name);
    const { error } = await supabase.storage.from(BUCKET).remove(names);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      return;
    }
    toast({ title: "Todas eliminadas" });
    fetchFiles();
  }, [files, fetchFiles]);

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Testimonios — Screenshots</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {files.length} imágenes en el marquee · Sube hasta 83+
          </p>
        </div>

        <div className="flex items-center gap-3">
          {files.length > 0 && (
            <Button variant="destructive" size="sm" onClick={handleDeleteAll}>
              <Trash2 className="w-4 h-4 mr-1" />
              Borrar todas
            </Button>
          )}

          <label>
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleBulkUpload}
              disabled={isUploading}
            />
            <Button asChild disabled={isUploading}>
              <span>
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    {uploadProgress.done}/{uploadProgress.total}
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-1" />
                    Subir imágenes
                  </>
                )}
              </span>
            </Button>
          </label>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : files.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <ImageIcon className="w-12 h-12 mb-4 opacity-40" />
          <p>No hay imágenes aún</p>
          <p className="text-xs mt-1">Sube screenshots para poblar el marquee</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {files.map((f) => (
            <div
              key={f.id}
              className="relative group rounded-xl overflow-hidden border border-border/50 bg-card"
            >
              <img
                src={f.url}
                alt={f.name}
                className="w-full h-auto object-cover"
                loading="lazy"
              />
              <button
                onClick={() => handleDelete(f.name)}
                className="absolute top-2 right-2 p-1.5 bg-destructive/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3 h-3 text-destructive-foreground" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 text-[10px] text-white truncate opacity-0 group-hover:opacity-100 transition-opacity">
                {f.name}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
