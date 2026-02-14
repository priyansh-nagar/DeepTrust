import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Zap, Eye, Brain, RotateCcw } from 'lucide-react';
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
  error?: string;
}

const Index = () => {
  const [selectedImage, setSelectedImage] = useState<{ url?: string; base64?: string; preview: string } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisData | null>(null);
  const { toast } = useToast();

  const handleImageSelected = async (imageData: { url?: string; base64?: string; preview: string }) => {
    setSelectedImage(imageData);
    setAnalysisResult(null);
    await analyzeImage(imageData);
  };

  const analyzeImage = async (imageData: { url?: string; base64?: string }) => {
    setIsAnalyzing(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: imageData.url,
          imageBase64: imageData.base64,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let err;
        try {
          err = JSON.parse(errorText);
        } catch {
          err = { error: errorText || 'Analysis failed' };
        }
        throw new Error(err.error || 'Analysis failed');
      }

      const result = await response.json();
      setAnalysisResult(result);
    } catch (error) {
      console.error('Analysis error:', error);
      const message = error instanceof Error ? error.message : 'Analysis failed';
      setAnalysisResult({ error: message, confidence: 0, verdict: 'UNCERTAIN', signals: [], summary: '' });
      toast({
        title: 'Analysis Failed',
        description: message,
        variant: 'destructive',
      });
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
      <div
        className="fixed inset-0 opacity-40 pointer-events-none"
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
          <div className="container max-w-6xl mx-auto px-4 md:px-4 py-4 flex items-center justify-start md:justify-between">
            <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
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

        {/* Hero Section */}
        <section className="container max-w-6xl mx-auto px-4 py-12 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-foreground">Detect </span>
              <span className="text-primary text-glow">AI-Generated</span>
              <span className="text-foreground"> Images</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Advanced forensic analysis powered by multimodal AI. Upload any image and get instant verification.
            </p>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-3 gap-4 max-w-xl mx-auto mb-12"
          >
            {[
              { icon: Zap, label: 'Instant Analysis' },
              { icon: Eye, label: 'Multi-Signal Detection' },
              { icon: Brain, label: 'AI-Powered' },
            ].map((feature) => (
              <div key={feature.label} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/50">
                <feature.icon className="w-5 h-5 text-primary" />
                <span className="text-xs text-muted-foreground text-center">{feature.label}</span>
              </div>
            ))}
          </motion.div>

          {/* Main Analysis Area */}
          <div className="max-w-4xl mx-auto">
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
                  {/* Image Preview */}
                  <div className="glass rounded-2xl p-4 border border-border">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-foreground">Analyzed Image</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={resetAnalysis}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        New Analysis
                      </Button>
                    </div>
                    <div className="relative aspect-video bg-muted rounded-xl overflow-hidden">
                      <img
                        src={selectedImage.preview}
                        alt="Analyzed image"
                        className="w-full h-full object-contain"
                      />
                      <ScanningOverlay isScanning={isAnalyzing} />
                    </div>
                  </div>

                  {/* Results */}
                  {analysisResult && (
                    analysisResult.error ? (
                      <div className="p-4 bg-red-100 text-red-700 rounded-lg text-center">
                        {analysisResult.error}
                      </div>
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
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/50 mt-20">
          <div className="container max-w-6xl mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                © 2026 DeepTrust. All rights reserved.
              </p>
              <div className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground">
                  Uses advanced pattern recognition to detect AI-generated imagery
                </span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;


