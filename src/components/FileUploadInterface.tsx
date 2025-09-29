import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  FileText, 
  File, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Download,
  Eye,
  FileCheck,
  Zap
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface UploadedFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  preview?: string;
  analysis?: {
    score: number;
    breakdown: {
      environmental: number;
      social: number;
      governance: number;
    };
    risks: string[];
    opportunities: string[];
    summary: string;
  };
}

export const FileUploadInterface = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      progress: 0,
      status: 'uploading' as const,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Simulate file processing
    newFiles.forEach((uploadedFile) => {
      simulateFileProcessing(uploadedFile.id);
    });

    toast({
      title: 'Files uploaded',
      description: `${acceptedFiles.length} file(s) uploaded successfully and are being processed.`,
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive: dropzoneActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv']
    },
    maxSize: 20 * 1024 * 1024, // 20MB
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    onDropAccepted: () => setIsDragActive(false),
    onDropRejected: (rejectedFiles) => {
      setIsDragActive(false);
      toast({
        title: 'Upload failed',
        description: `Some files were rejected. Please check file type and size limits.`,
        variant: 'destructive'
      });
    }
  });

  const simulateFileProcessing = (fileId: string) => {
    // Simulate upload progress
    let progress = 0;
    const uploadInterval = setInterval(() => {
      progress += Math.random() * 20;
      if (progress >= 100) {
        progress = 100;
        clearInterval(uploadInterval);
        
        // Update to processing
        setUploadedFiles(prev => prev.map(file => 
          file.id === fileId 
            ? { ...file, progress: 100, status: 'processing' }
            : file
        ));

        // Simulate processing delay
        setTimeout(() => {
          const mockAnalysis = {
            score: Math.round((Math.random() * 4 + 6) * 10) / 10, // Score between 6-10
            breakdown: {
              environmental: Math.round((Math.random() * 4 + 6) * 10) / 10,
              social: Math.round((Math.random() * 4 + 6) * 10) / 10,
              governance: Math.round((Math.random() * 4 + 6) * 10) / 10,
            },
            risks: [
              'Carbon emission levels require monitoring',
              'Supply chain transparency needs improvement',
              'Board diversity metrics below industry average'
            ],
            opportunities: [
              'Implement renewable energy solutions',
              'Enhance employee wellness programs',
              'Strengthen stakeholder engagement'
            ],
            summary: 'Overall ESG performance shows strong potential with specific areas for improvement identified. The analysis reveals good governance practices while highlighting opportunities in environmental and social dimensions.'
          };

          setUploadedFiles(prev => prev.map(file => 
            file.id === fileId 
              ? { ...file, status: 'completed', analysis: mockAnalysis }
              : file
          ));

          toast({
            title: 'Analysis completed',
            description: 'ESG analysis has been completed successfully.',
          });
        }, 2000 + Math.random() * 3000);
      } else {
        setUploadedFiles(prev => prev.map(file => 
          file.id === fileId 
            ? { ...file, progress }
            : file
        ));
      }
    }, 200);
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => {
      const file = prev.find(f => f.id === fileId);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== fileId);
    });
  };

  const getFileIcon = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FileText className="w-6 h-6 text-red-500" />;
      case 'doc':
      case 'docx':
        return <File className="w-6 h-6 text-blue-500" />;
      case 'txt':
        return <FileText className="w-6 h-6 text-gray-500" />;
      case 'csv':
        return <FileCheck className="w-6 h-6 text-green-500" />;
      default:
        return <File className="w-6 h-6 text-muted-foreground" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" => {
    if (score >= 8) return 'default';
    if (score >= 6) return 'secondary';
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
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Upload & Analyze ESG Reports</h1>
        <p className="text-muted-foreground">
          Upload your sustainability documents for AI-powered ESG analysis and scoring
        </p>
      </div>

      {/* Upload Area */}
      <Card>
        <CardContent className="p-6">
          <motion.div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
              isDragActive || dropzoneActive
                ? "border-primary bg-primary/5 scale-105"
                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/25"
            )}
            whileHover={{ scale: isDragActive ? 1.05 : 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <input {...getInputProps()} />
            
            <motion.div
              animate={{ y: isDragActive ? -5 : 0 }}
              className="space-y-4"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Upload className={cn(
                  "w-8 h-8",
                  isDragActive ? "text-primary animate-pulse" : "text-primary"
                )} />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  {isDragActive ? 'Drop files here' : 'Upload ESG Documents'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  Drag and drop your files here, or click to select
                </p>
                
                <div className="flex flex-wrap gap-2 justify-center text-xs text-muted-foreground">
                  <Badge variant="outline">PDF</Badge>
                  <Badge variant="outline">DOCX</Badge>
                  <Badge variant="outline">DOC</Badge>
                  <Badge variant="outline">TXT</Badge>
                  <Badge variant="outline">CSV</Badge>
                </div>
                
                <p className="text-xs text-muted-foreground mt-2">
                  Maximum file size: 20MB
                </p>
              </div>

              {!isDragActive && (
                <Button className="gradient-primary">
                  <Upload className="w-4 h-4 mr-2" />
                  Choose Files
                </Button>
              )}
            </motion.div>
          </motion.div>
        </CardContent>
      </Card>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Uploaded Files ({uploadedFiles.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <AnimatePresence>
              {uploadedFiles.map((uploadedFile) => (
                <motion.div
                  key={uploadedFile.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="border rounded-lg p-4 relative"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 mt-1">
                        {getFileIcon(uploadedFile.file)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{uploadedFile.file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(uploadedFile.file.size)}
                        </p>
                        
                        {/* Progress Bar */}
                        {uploadedFile.status === 'uploading' && (
                          <div className="mt-2">
                            <Progress value={uploadedFile.progress} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-1">
                              Uploading... {Math.round(uploadedFile.progress)}%
                            </p>
                          </div>
                        )}
                        
                        {/* Processing Status */}
                        {uploadedFile.status === 'processing' && (
                          <div className="flex items-center gap-2 mt-2 text-sm">
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                            <span className="text-primary">Analyzing ESG content...</span>
                          </div>
                        )}
                        
                        {/* Analysis Results */}
                        {uploadedFile.status === 'completed' && uploadedFile.analysis && (
                          <div className="mt-3 space-y-3">
                            <div className="flex items-center gap-2">
                              <Badge variant={getScoreBadgeVariant(uploadedFile.analysis.score)}>
                                ESG Score: {uploadedFile.analysis.score}/10
                              </Badge>
                              <Badge variant="outline">
                                <Zap className="w-3 h-3 mr-1" />
                                Analysis Complete
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div className="text-center p-2 bg-muted/50 rounded">
                                <p className="font-medium">Environmental</p>
                                <p className={getScoreColor(uploadedFile.analysis.breakdown.environmental)}>
                                  {uploadedFile.analysis.breakdown.environmental}/10
                                </p>
                              </div>
                              <div className="text-center p-2 bg-muted/50 rounded">
                                <p className="font-medium">Social</p>
                                <p className={getScoreColor(uploadedFile.analysis.breakdown.social)}>
                                  {uploadedFile.analysis.breakdown.social}/10
                                </p>
                              </div>
                              <div className="text-center p-2 bg-muted/50 rounded">
                                <p className="font-medium">Governance</p>
                                <p className={getScoreColor(uploadedFile.analysis.breakdown.governance)}>
                                  {uploadedFile.analysis.breakdown.governance}/10
                                </p>
                              </div>
                            </div>
                            
                            <div className="text-xs text-muted-foreground">
                              <p className="line-clamp-2">{uploadedFile.analysis.summary}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {uploadedFile.status === 'completed' && (
                        <>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(uploadedFile.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Status Icon */}
                  <div className="absolute top-2 right-2">
                    {uploadedFile.status === 'completed' && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    {uploadedFile.status === 'error' && (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      {uploadedFiles.length === 0 && (
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <FileText className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Sample ESG Report</h3>
              <p className="text-sm text-muted-foreground">
                Try our platform with a sample ESG document
              </p>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <Zap className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Quick Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Get instant ESG insights from your documents
              </p>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <Eye className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">View Examples</h3>
              <p className="text-sm text-muted-foreground">
                See examples of completed ESG analyses
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};