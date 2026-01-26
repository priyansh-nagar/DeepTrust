import { motion } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle, HelpCircle, XCircle, Scan } from 'lucide-react';

interface Signal {
  name: string;
  detected: boolean;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

interface AnalysisResultProps {
  confidence: number;
  verdict: 'AI_GENERATED' | 'LIKELY_AI' | 'UNCERTAIN' | 'LIKELY_REAL' | 'REAL';
  signals: Signal[];
  summary: string;
}

export function AnalysisResult({ confidence, verdict, signals, summary }: AnalysisResultProps) {
  const getVerdictConfig = () => {
    switch (verdict) {
      case 'AI_GENERATED':
        return { 
          icon: XCircle, 
          color: 'text-destructive', 
          bg: 'bg-destructive/20', 
          border: 'border-destructive/50',
          label: 'AI Generated',
          glow: 'shadow-[0_0_30px_hsl(0_85%_60%/0.3)]'
        };
      case 'LIKELY_AI':
        return { 
          icon: AlertTriangle, 
          color: 'text-warning', 
          bg: 'bg-warning/20', 
          border: 'border-warning/50',
          label: 'Likely AI',
          glow: 'shadow-[0_0_30px_hsl(35_100%_55%/0.3)]'
        };
      case 'UNCERTAIN':
        return { 
          icon: HelpCircle, 
          color: 'text-muted-foreground', 
          bg: 'bg-muted', 
          border: 'border-border',
          label: 'Uncertain',
          glow: ''
        };
      case 'LIKELY_REAL':
        return { 
          icon: Shield, 
          color: 'text-primary', 
          bg: 'bg-primary/20', 
          border: 'border-primary/50',
          label: 'Likely Real',
          glow: 'shadow-[0_0_30px_hsl(180_100%_50%/0.3)]'
        };
      case 'REAL':
        return { 
          icon: CheckCircle, 
          color: 'text-success', 
          bg: 'bg-success/20', 
          border: 'border-success/50',
          label: 'Authentic',
          glow: 'shadow-[0_0_30px_hsl(145_80%_45%/0.3)]'
        };
    }
  };

  const config = getVerdictConfig();
  const Icon = config.icon;
  
  // Calculate color based on confidence (higher = more AI-like = red)
  const getConfidenceColor = () => {
    if (confidence >= 70) return 'from-destructive to-warning';
    if (confidence >= 40) return 'from-warning to-primary';
    return 'from-primary to-success';
  };

  const detectedSignals = signals.filter(s => s.detected);
  const clearSignals = signals.filter(s => !s.detected);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full space-y-6"
    >
      {/* Main Verdict Card */}
      <div className={`glass rounded-2xl p-6 ${config.border} border ${config.glow}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${config.bg}`}>
              <Icon className={`w-6 h-6 ${config.color}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Verdict</p>
              <p className={`text-xl font-bold ${config.color}`}>{config.label}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">AI Confidence</p>
            <p className="text-3xl font-mono font-bold text-foreground">{confidence}%</p>
          </div>
        </div>

        {/* Confidence Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Real</span>
            <span>AI Generated</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${confidence}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={`h-full bg-gradient-to-r ${getConfidenceColor()} rounded-full`}
            />
          </div>
        </div>

        {/* Summary */}
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{summary}</p>
      </div>

      {/* Detection Signals */}
      <div className="glass rounded-2xl p-6 border border-border">
        <div className="flex items-center gap-2 mb-4">
          <Scan className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Detection Signals</h3>
        </div>

        <div className="space-y-4">
          {/* Detected Issues */}
          {detectedSignals.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-warning uppercase tracking-wider">Issues Detected</p>
              {detectedSignals.map((signal, index) => (
                <motion.div
                  key={signal.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3 p-3 bg-warning/10 rounded-lg border border-warning/30"
                >
                  <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                    signal.severity === 'high' ? 'text-destructive' : 
                    signal.severity === 'medium' ? 'text-warning' : 'text-muted-foreground'
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-foreground">{signal.name}</p>
                    <p className="text-xs text-muted-foreground">{signal.description}</p>
                  </div>
                  <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${
                    signal.severity === 'high' ? 'bg-destructive/20 text-destructive' : 
                    signal.severity === 'medium' ? 'bg-warning/20 text-warning' : 'bg-muted text-muted-foreground'
                  }`}>
                    {signal.severity}
                  </span>
                </motion.div>
              ))}
            </div>
          )}

          {/* Clear Signals */}
          {clearSignals.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-success uppercase tracking-wider">Clear</p>
              <div className="grid grid-cols-2 gap-2">
                {clearSignals.map((signal, index) => (
                  <motion.div
                    key={signal.name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    className="flex items-center gap-2 p-2 bg-success/10 rounded-lg border border-success/20"
                  >
                    <CheckCircle className="w-3 h-3 text-success flex-shrink-0" />
                    <p className="text-xs text-muted-foreground truncate">{signal.name}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
