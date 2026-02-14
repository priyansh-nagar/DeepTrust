import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Eye, Brain, RotateCcw } from 'lucide-react';
import { ImageUploader } from '@/components/ImageUploader';
import { AnalysisResult } from '@/components/AnalysisResult';
import { ScanningOverlay } from '@/components/ScanningOverlay';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface AnalysisData {
  confidence: number;
  verdict: 'AI_GENERATED' | 'LIKELY_AI' | 'UNCERTAIN' | 'LIKELY_REAL' | 'REAL';
  signals: Array<{
    name: string;
    detected: boolean;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }>;
  summary: string;
  error?: string; // <- optional for errors
}

const Index = () => {
  const [selectedImage, setSelectedImage] = useState<{ url?: string; base64?: string; preview: string } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisData | null>(null);
  const { toast } = useToast();

  // Called when user selects an image
  const handleImageSelected = async (imageData: { url?: string; base64?: string; preview: string }) => {
    setSelectedImage(imageData);
    setAnalysisResult(null);
    await analyzeImage(imageData);
  };

  // Analyze image safely
  const analyzeImage = async (imageData: { url?: string; base64?: string }) => {
    setIsAnalyzing(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-image`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            imageUrl: imageData.url,
            imageBase64: imageData.base64,
          }),
        }
      );

      let result: AnalysisData;

      if (!response.ok) {
        const text = await response.text();
        result = { confidence: 0, verdict: 'UNCERTAIN', signals: [], summary: '', error: `Analysis failed: ${text}` };
      } else {
        try {
          result = await response.json();
        } catch (err) {
          result = { confidence: 0, verdict: 'UNCERTAIN', signals: [], summary: '', error: 'Failed to parse analysis response' };
        }
      }

      setAnalysisResult(result);

      // Optional toast
      if (result.error) {
        toast({ title: 'Analysis Error', description: result.error, variant: 'destructive' });
      }
    } catch (err) {
      console.error(err);
      setAnalysisResult({ confidence: 0, verdict: 'UNCERTAIN', signals: [], summary: '', error: 'Network or server error' });
      toast({ title: 'Analysis Error', description: 'Network or server error', variant: 'destructive' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setSelectedImage(null);
    setAnalysisResult(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Background grid effect */}
      <div className="fixed inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 50%, hsl(250 90% 55% / 0.05) 0%, transparent 50%),
            linear-gradient(hsl(250 90% 55% / 0.03) 1px, transparent 1px),
            linear-gradient(90deg, hsl(250 90% 55% / 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 50px 50px, 50px 50px',
        }}
      />

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border/50">
          <div className="container max-w-6xl mx-auto px-4 py-4 flex items-center justify-start md:justify-between">
            <a href="https://deeptrust-nine.vercel.app/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="p-1 rounded-full bg-primary/20 glow-cyan">
                <img src="/logo.png" alt="DeepTrust Logo" className="w-8 h-8 object-contain" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-foreground">DeepTrust</h1>
                <p className="text-xs text-muted-foreground">AI Image Detector</p>
              </div>
            </a>
          </div>
        </header>

        {/* Main Analysis Area */}
        <section className="container max-w-4xl mx-auto px-4 py-12">
          <AnimatePresence mode="wait">
            {!selectedImage ? (
              <motion.div
                key="uploader"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass rounded-2xl p-8 border border-border"
              >
                <ImageUploader onImageSelected={handleImageSelected} isAnalyzing={isAnalyzing} />
              </motion.div>
            ) : (
              <motion.div
                key="analysis"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="glass rounded-2xl p-4 border border-border">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-foreground">Analyzed Image</h3>
                    <Button variant="outline" size="sm" onClick={resetAnalysis} className="text-muted-foreground hover:text-foreground">
                      <RotateCcw className="w-4 h-4 mr-2" />
                      New Analysis
                    </Button>
                  </div>
                  <div className="relative aspect-video bg-muted rounded-xl overflow-hidden">
                    <img src={selectedImage.preview} alt="Analyzed image" className="w-full h-full object-contain" />
                    <ScanningOverlay isScanning={isAnalyzing} />
                  </div>
                </div>

                {/* Results */}
                {analysisResult && (
                  analysisResult.error ? (
                    <p className="text-red-500">{analysisResult.error}</p>
                  ) : (
                    <AnalysisResult
                      confidence={analysisResult.confidence}
                      verdict={analysisResult.verdict}
                      signals={analysisResult.signals}
                      summary={analysisResult.summary}
                    />
                  )
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </div>
  );
};

export default Index;

