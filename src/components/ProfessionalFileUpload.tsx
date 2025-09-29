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
  TrendingUp, TrendingDown, Activity, PieChart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReports } from '@/hooks/useReports';
import { useESGScoring } from '@/hooks/useESGScoring';
import { toast } from '@/hooks/use-toast';

interface UploadedFile {
  id: string;
  file: File;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
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

export const ProfessionalFileUpload = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const { saveReport } = useReports();
  const { analyzeDocument, isAnalyzing } = useESGScoring();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      status: 'uploading',
      progress: 0
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Process each file
    newFiles.forEach(fileData => {
      simulateFileProcessing(fileData);
    });
  }, []);

  const simulateFileProcessing = async (fileData: UploadedFile) => {
    try {
      // Simulate upload progress
      setUploadedFiles(prev => 
        prev.map(f => f.id === fileData.id ? { ...f, status: 'uploading' } : f)
      );

      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 50));
        setUploadedFiles(prev => 
          prev.map(f => f.id === fileData.id ? { ...f, progress } : f)
        );
      }

      // Start analysis
      setUploadedFiles(prev => 
        prev.map(f => f.id === fileData.id ? { ...f, status: 'processing', progress: 0 } : f)
      );

      // Perform ESG analysis
      const analysis = await analyzeDocument(fileData.file);

      // Simulate processing progress
      for (let progress = 0; progress <= 100; progress += 20) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setUploadedFiles(prev => 
          prev.map(f => f.id === fileData.id ? { ...f, progress } : f)
        );
      }

      // Complete processing
      setUploadedFiles(prev => 
        prev.map(f => f.id === fileData.id ? { 
          ...f, 
          status: 'completed', 
          progress: 100,
          analysis 
        } : f)
      );

      // Save to database
      await saveReport({
        score: analysis.score,
        company_name: `Company_${Date.now()}`,
        file_name: fileData.file.name,
        file_url: URL.createObjectURL(fileData.file),
        hash: `hash_${Date.now()}`,
        analysis_data: analysis
      });

      toast({
        title: "Analysis Complete",
        description: `${fileData.file.name} has been analyzed successfully.`,
      });

    } catch (error) {
      setUploadedFiles(prev => 
        prev.map(f => f.id === fileData.id ? { 
          ...f, 
          status: 'error', 
          error: 'Analysis failed. Please try again.' 
        } : f)
      );

      toast({
        title: "Analysis Failed",
        description: `Failed to analyze ${fileData.file.name}. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const retryFile = (id: string) => {
    const file = uploadedFiles.find(f => f.id === id);
    if (file) {
      setUploadedFiles(prev => 
        prev.map(f => f.id === id ? { ...f, status: 'uploading', progress: 0, error: undefined } : f)
      );
      simulateFileProcessing(file);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true
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
              Upload your ESG documents for AI-powered analysis and insights
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
        <Card className="gradient-card border-0 shadow-card">
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
                Supports PDF, DOCX, TXT, CSV, and Excel files up to 10MB.
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
                                    <span className="text-muted-foreground">Uploading...</span>
                                    <span className="text-muted-foreground">{fileData.progress}%</span>
                                  </div>
                                  <Progress value={fileData.progress} className="h-2" />
                                </div>
                              )}
                              
                              {fileData.status === 'processing' && (
                                <div>
                                  <div className="flex justify-between text-sm mb-1">
                                    <span className="text-primary">Analyzing with AI...</span>
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