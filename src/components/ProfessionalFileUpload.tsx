import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Upload, FileText, Image, AlertCircle, CheckCircle2, X, 
  Eye, Download, Trash2, RefreshCw, Zap, BarChart3,
  TrendingUp, TrendingDown, Activity, PieChart, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReports } from '@/hooks/useReports';
import { useDocumentUpload, MAX_FILE_SIZE } from '@/hooks/useDocumentUpload';
import { DocumentValidationResult } from '@/components/DocumentValidationResult';
import type { ValidationResult, PipelineStatus } from '@/types/validation';
import { toast } from '@/hooks/use-toast';

interface UploadedFile {
  id: string;
  file: File;
  status: 'validating' | 'validated' | 'uploading' | 'processing' | 'completed' | 'error' | 'rejected';
  progress: number;
  stageLabel?: string;
  error?: string;
  validationResult?: ValidationResult;
  analysis?: {
    score: number;
    breakdown: {
      environmental: number;
      social: number;
      governance: number;
    };
    risks: string[];
    opportunities: string[];
    analysis: string[];
  };
}

// Map real pipeline states onto the card's existing visual states
const toCardStatus = (s: PipelineStatus['status']): UploadedFile['status'] => {
  switch (s) {
    case 'UPLOADING':
    case 'UPLOADED':
    case 'EXTRACTING':
    case 'VALIDATING':
      return 'uploading';
    case 'VALIDATED':
      return 'validated';
    case 'REJECTED':
      return 'rejected';
    case 'ANALYZING':
    case 'GENERATING_REPORT':
      return 'processing';
    case 'COMPLETED':
      return 'completed';
    default:
      return 'error';
  }
};

export const ProfessionalFileUpload = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [pendingValidation, setPendingValidation] = useState<UploadedFile | null>(null);
  const { fetchReports } = useReports();
  const { uploadAndValidate, runAnalysis, discard, isProcessing } = useDocumentUpload();

  const patch = (id: string, updates: Partial<UploadedFile>) =>
    setUploadedFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Process files one by one: upload → verify → extract → validate
    for (const file of acceptedFiles) {
      const tempId = crypto.randomUUID();
      setUploadedFiles(prev => [...prev, { id: tempId, file, status: 'uploading', progress: 0, stageLabel: 'Preparing…' }]);

      const { id, validation } = await uploadAndValidate(file, (s) =>
        patch(tempId, { status: toCardStatus(s.status), progress: s.progress, stageLabel: s.label, error: s.error })
      );

      if (!id) {
        // Rejected before upload (type/size) — toast already shown by the hook
        setUploadedFiles(prev => prev.filter(f => f.id !== tempId));
        continue;
      }

      // Re-key the card to the pipeline id so analysis can be resumed on it
      setUploadedFiles(prev => prev.map(f => f.id === tempId ? { ...f, id } : f));

      if (validation) {
        const rejected = validation.classification === 'INVALID' || validation.final_validation_status === 'Rejected: Not an ESG report';
        patch(id, { status: rejected ? 'rejected' : 'validated', validationResult: validation, error: rejected ? validation.rejection_reason : undefined });

        if (!rejected) {
          setPendingValidation({ id, file, status: 'validated', progress: 0, validationResult: validation });
        } else {
          toast({
            title: 'Document Rejected',
            description: validation.rejection_reason || 'This file does not appear to be an ESG/Sustainability report.',
            variant: 'destructive',
          });
        }
      }
      // else: the hook already marked the card as error with the real failure reason
    }
  }, [uploadAndValidate]);

  // Handler for when user approves validation and wants to proceed
  const handleProceedWithAnalysis = useCallback(async (fileData: UploadedFile) => {
    setPendingValidation(null);
    patch(fileData.id, { status: 'processing', progress: 0, stageLabel: 'Starting analysis…', error: undefined });

    if (fileData.file.size > 10 * 1024 * 1024) {
      toast({ title: 'Processing Large File', description: `Analyzing ${fileData.file.name} - this may take a few minutes.` });
    }

    try {
      const { analysis, warnings } = await runAnalysis(fileData.id, {
        onStatus: (s) => patch(fileData.id, { status: toCardStatus(s.status), progress: s.progress, stageLabel: s.label, error: s.error }),
      });

      patch(fileData.id, {
        status: 'completed',
        progress: 100,
        analysis: {
          score: Number(analysis?.score ?? 0),
          breakdown: {
            environmental: Number(analysis?.breakdown?.environmental ?? 0),
            social: Number(analysis?.breakdown?.social ?? 0),
            governance: Number(analysis?.breakdown?.governance ?? 0),
          },
          risks: analysis?.risks ?? [],
          opportunities: analysis?.opportunities ?? [],
          analysis: analysis?.analysis ?? [],
        },
      });

      await fetchReports();

      const companyName = analysis?.metadata?.company_name || fileData.validationResult?.company_name || fileData.file.name;
      const score = Number(analysis?.score ?? 0);
      const scoreRating = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Needs Improvement';
      toast({
        title: 'Analysis Complete',
        description: `${companyName} - ESG Score: ${score.toFixed(1)}/100 (${scoreRating})${warnings.length ? `. Note: ${warnings[0]}` : ''}`,
      });
    } catch (error: any) {
      console.error('File processing error:', error);
      const errorMessage = error?.message || 'Analysis failed. Please try again.';
      patch(fileData.id, { status: 'error', error: errorMessage });
      toast({ title: 'Analysis Failed', description: `${fileData.file.name}: ${errorMessage}`, variant: 'destructive' });
    }
  }, [runAnalysis, fetchReports]);

  // Handler for when user rejects/cancels validation
  const handleRejectValidation = useCallback((fileId: string) => {
    setPendingValidation(null);
    void discard(fileId);
    patch(fileId, { status: 'rejected', error: 'Analysis declined by user.' });
  }, [discard]);

  const removeFile = (id: string) => {
    void discard(id);
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  // Retry re-runs the whole pipeline from upload so nothing stale is reused
  const retryFile = (id: string) => {
    const entry = uploadedFiles.find(f => f.id === id);
    if (!entry) return;
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
    void onDrop([entry.file]);
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
    },
    maxSize: MAX_FILE_SIZE,
    multiple: true,
    onDropRejected: (fileRejections) => {
      setIsDragActive(false);

      const typeErrors = fileRejections.filter(r => r.errors.some(e => e.code === 'file-invalid-type'));
      if (typeErrors.length > 0) {
        const fileNames = typeErrors.map(r => r.file.name).join(', ');
        toast({
          title: 'Unsupported File Type',
          description: `Unsupported files: ${fileNames}. Please upload PDF, DOCX, TXT or CSV documents.`,
          variant: 'destructive',
        });
      }

      const sizeErrors = fileRejections.filter(r => r.errors.some(e => e.code === 'file-too-large'));
      if (sizeErrors.length > 0) {
        toast({
          title: 'File Too Large',
          description: `Maximum file size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`,
          variant: 'destructive',
        });
      }

      const otherErrors = fileRejections.filter(r =>
        !r.errors.some(e => ['file-too-large', 'file-invalid-type'].includes(e.code))
      );
      if (otherErrors.length > 0) {
        const reasons = otherErrors.flatMap(r => r.errors.map(e => e.message)).join('; ');
        toast({
          title: 'Upload Error',
          description: reasons || 'Some files could not be processed. Please try again.',
          variant: 'destructive',
        });
      }
    },
  });

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
      case 'doc':
      case 'docx':
      case 'txt':
      case 'csv':
      case 'xls':
      case 'xlsx':
        return FileText;
      default:
        return FileText;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Validation Modal */}
      <AnimatePresence>
        {pendingValidation && pendingValidation.validationResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          >
            <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <DocumentValidationResult
                result={pendingValidation.validationResult}
                fileName={pendingValidation.file.name}
                onProceed={() => handleProceedWithAnalysis(pendingValidation)}
                onReject={() => handleRejectValidation(pendingValidation.id)}
                onRetry={() => {
                  handleRejectValidation(pendingValidation.id);
                  removeFile(pendingValidation.id);
                }}
                isLoading={isProcessing}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Upload Documents</h2>
            <p className="text-muted-foreground">
              description="Advanced AI-powered document analysis with PrakritiLens for comprehensive ESG insights"
            </p>
          </div>
          <Badge variant="secondary" className="hidden md:inline-flex">
            <Zap className="w-4 h-4 mr-1" />
            AI Powered
          </Badge>
        </div>
      </motion.div>

      {/* Upload Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="border-2 border-dashed border-gray-300 hover:border-primary/70 transition-all duration-300 bg-white hover:bg-gray-50/50">
          <CardContent className="p-8">
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300
                ${isDragActive 
                  ? "border-primary bg-primary/5 scale-[1.02]" 
                  : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/25"
                }
              `}
            >
              <input {...getInputProps()} />
              
              <motion.div
                animate={{ 
                  scale: isDragActive ? 1.1 : 1,
                  rotate: isDragActive ? 5 : 0 
                }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Upload className="w-16 h-16 text-primary mx-auto mb-4" />
              </motion.div>
              
              <h3 className="text-xl font-semibold mb-2">
                {isDragActive ? 'Drop files here' : 'Upload ESG Documents'}
              </h3>
              
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Drag and drop your files here, or click to browse. 
                Supports PDF, DOCX, TXT, CSV, and Excel files up to 50MB each.
                Perfect for comprehensive ESG reports and large documents.
              </p>
              
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {['PDF', 'DOCX', 'TXT', 'CSV', 'XLSX'].map(format => (
                  <Badge key={format} variant="outline" className="text-xs">
                    {format}
                  </Badge>
                ))}
              </div>

              {!isDragActive && (
                <Button className="shadow-elegant">
                  <Upload className="w-4 h-4 mr-2" />
                  Choose Files
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      {uploadedFiles.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="gradient-card border-0 shadow-card hover:shadow-elegant transition-smooth cursor-pointer">
              <CardHeader className="text-center">
                <BarChart3 className="w-8 h-8 text-primary mx-auto mb-2" />
                <CardTitle className="text-lg">ESG Analysis</CardTitle>
                <CardDescription>
                  Get comprehensive ESG scores and insights
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="gradient-card border-0 shadow-card hover:shadow-elegant transition-smooth cursor-pointer">
              <CardHeader className="text-center">
                <TrendingUp className="w-8 h-8 text-primary mx-auto mb-2" />
                <CardTitle className="text-lg">Trend Analysis</CardTitle>
                <CardDescription>
                  Track performance over time
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="gradient-card border-0 shadow-card hover:shadow-elegant transition-smooth cursor-pointer">
              <CardHeader className="text-center">
                <PieChart className="w-8 h-8 text-primary mx-auto mb-2" />
                <CardTitle className="text-lg">Benchmarking</CardTitle>
                <CardDescription>
                  Compare against industry standards
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </motion.div>
      )}

      {/* Uploaded Files */}
      <AnimatePresence>
        {uploadedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="gradient-card border-0 shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Processing Files</CardTitle>
                    <CardDescription>
                      {uploadedFiles.length} file(s) uploaded
                    </CardDescription>
                  </div>
                  <Badge variant="outline">
                    {uploadedFiles.filter(f => f.status === 'completed').length} / {uploadedFiles.length} Complete
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {uploadedFiles.map((fileData, index) => {
                    const FileIcon = getFileIcon(fileData.file.name);
                    
                    return (
                      <motion.div
                        key={fileData.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="p-4 border border-border rounded-lg hover:bg-muted/25 transition-smooth"
                      >
                        <div className="flex items-start space-x-4">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileIcon className="w-5 h-5 text-primary" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <h4 className="font-semibold text-foreground truncate">
                                  {fileData.file.name}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {formatFileSize(fileData.file.size)}
                                </p>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                {fileData.status === 'completed' && fileData.analysis && (
                                  <>
                                    <Badge variant={getScoreBadgeVariant(fileData.analysis.score)}>
                                      {fileData.analysis.score.toFixed(1)}
                                    </Badge>
                                    <Button variant="ghost" size="sm">
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm">
                                      <Download className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                                
                                {fileData.status === 'error' && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => retryFile(fileData.id)}
                                  >
                                    <RefreshCw className="w-4 h-4" />
                                  </Button>
                                )}
                                
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => removeFile(fileData.id)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            
                            {/* Status and Progress */}
                            <div className="space-y-2">
                              {fileData.status === 'uploading' && (
                                <div>
                                  <div className="flex justify-between text-sm mb-1">
                                    <span className="text-muted-foreground">{fileData.stageLabel || 'Uploading...'}</span>
                                    <span className="text-muted-foreground">{fileData.progress}%</span>
                                  </div>
                                  <Progress value={fileData.progress} className="h-2" />
                                </div>
                              )}
                              
                              {fileData.status === 'processing' && (
                                <div>
                                  <div className="flex justify-between text-sm mb-1">
                                    <span className="text-primary">{fileData.stageLabel || 'Analyzing with AI...'}</span>
                                    <span className="text-primary">{fileData.progress}%</span>
                                  </div>
                                  <Progress value={fileData.progress} className="h-2" />
                                </div>
                              )}
                              
                              {fileData.status === 'completed' && (
                                <div className="flex items-center text-sm text-green-600">
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                  Analysis completed successfully
                                </div>
                              )}
                              
                              {fileData.status === 'error' && (
                                <Alert variant="destructive">
                                  <AlertCircle className="h-4 w-4" />
                                  <AlertDescription>
                                    {fileData.error}
                                  </AlertDescription>
                                </Alert>
                              )}
                            </div>
                            
                            {/* Analysis Results */}
                            {fileData.status === 'completed' && fileData.analysis && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                transition={{ duration: 0.3 }}
                                className="mt-4"
                              >
                                <Separator className="mb-4" />
                                <div className="grid md:grid-cols-3 gap-4">
                                  <div className="text-center">
                                    <div className={`text-2xl font-bold ${getScoreColor(fileData.analysis.breakdown.environmental)}`}>
                                      {fileData.analysis.breakdown.environmental.toFixed(1)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Environmental</div>
                                  </div>
                                  <div className="text-center">
                                    <div className={`text-2xl font-bold ${getScoreColor(fileData.analysis.breakdown.social)}`}>
                                      {fileData.analysis.breakdown.social.toFixed(1)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Social</div>
                                  </div>
                                  <div className="text-center">
                                    <div className={`text-2xl font-bold ${getScoreColor(fileData.analysis.breakdown.governance)}`}>
                                      {fileData.analysis.breakdown.governance.toFixed(1)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Governance</div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};