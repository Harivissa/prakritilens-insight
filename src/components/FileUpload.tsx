import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, X, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DetailedReport } from './DetailedReport';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  analysis?: {
    company: string;
    overallScore: number;
    risks: string[];
    opportunities: string[];
  };
}

export function FileUpload() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedReport, setSelectedReport] = useState<UploadedFile | null>(null);
  const [showDetailedReport, setShowDetailedReport] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      handleFiles(selectedFiles);
    }
  }, []);

  const handleFiles = (fileList: File[]) => {
    const newFiles: UploadedFile[] = fileList.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      status: 'uploading',
      progress: 0,
    }));

    setFiles(prev => [...prev, ...newFiles]);

    // Simulate upload and processing
    newFiles.forEach(file => {
      simulateFileProcessing(file.id);
    });
  };

  const simulateFileProcessing = (fileId: string) => {
    // Simulate upload progress
    const uploadInterval = setInterval(() => {
      setFiles(prev => prev.map(file => {
        if (file.id === fileId && file.status === 'uploading') {
          const newProgress = file.progress + Math.random() * 30;
          if (newProgress >= 100) {
            clearInterval(uploadInterval);
            setTimeout(() => {
              setFiles(prev => prev.map(f => 
                f.id === fileId 
                  ? { ...f, status: 'processing', progress: 0 }
                  : f
              ));
              simulateProcessing(fileId);
            }, 500);
            return { ...file, progress: 100, status: 'uploading' };
          }
          return { ...file, progress: newProgress };
        }
        return file;
      }));
    }, 300);
  };

  const simulateProcessing = (fileId: string) => {
    const processingInterval = setInterval(() => {
      setFiles(prev => prev.map(file => {
        if (file.id === fileId && file.status === 'processing') {
          const newProgress = file.progress + Math.random() * 20;
          if (newProgress >= 100) {
            clearInterval(processingInterval);
            setTimeout(() => {
              setFiles(prev => prev.map(f => 
                f.id === fileId 
                  ? { 
                      ...f, 
                      status: 'completed', 
                      progress: 100,
                      analysis: {
                        company: 'Demo Company Inc.',
                        overallScore: 7.2 + Math.random() * 2,
                        risks: ['Carbon emissions disclosure gaps', 'Supply chain transparency'],
                        opportunities: ['Renewable energy adoption', 'ESG reporting enhancement']
                      }
                    }
                  : f
              ));
            }, 1000);
            return { ...file, progress: 100 };
          }
          return { ...file, progress: newProgress };
        }
        return file;
      }));
    }, 400);
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const viewDetailedReport = (file: UploadedFile) => {
    if (file.analysis) {
      setSelectedReport(file);
      setShowDetailedReport(true);
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Detailed Report Modal */}
      {selectedReport && selectedReport.analysis && (
        <DetailedReport
          isOpen={showDetailedReport}
          onClose={() => setShowDetailedReport(false)}
          fileName={selectedReport.name}
          data={selectedReport.analysis}
        />
      )}
      
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload ESG Reports</CardTitle>
          <CardDescription>
            Upload PDF or DOCX files for comprehensive ESG analysis. Supports multiple files.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            className={cn(
              "border-2 border-dashed rounded-lg p-12 text-center transition-colors",
              isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25",
              "hover:border-primary hover:bg-primary/5"
            )}
          >
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Drop files here or click to upload</h3>
            <p className="text-muted-foreground mb-4">
              Supports PDF and DOCX files up to 50MB each
            </p>
            <input
              type="file"
              multiple
              accept=".pdf,.docx"
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
            />
            <Button asChild variant="premium">
              <label htmlFor="file-upload" className="cursor-pointer">
                Select Files
              </label>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Processing Queue</CardTitle>
            <CardDescription>Track your ESG report analysis progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-primary" />
                      <div>
                        <h4 className="font-medium">{file.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileStatusBadge status={file.status} />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.id)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {file.status !== 'completed' && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>
                          {file.status === 'uploading' ? 'Uploading...' : 'Processing...'}
                        </span>
                        <span>{Math.round(file.progress)}%</span>
                      </div>
                      <Progress value={file.progress} className="h-2" />
                    </div>
                  )}

                  {file.status === 'completed' && file.analysis && (
                    <div className="pt-3 border-t space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Analysis Complete</span>
                        <div className="text-right">
                          <div className="text-lg font-bold gradient-primary bg-clip-text text-transparent">
                            {file.analysis.overallScore.toFixed(1)}
                          </div>
                          <div className="text-xs text-muted-foreground">ESG Score</div>
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <h5 className="font-medium text-destructive mb-1">Key Risks:</h5>
                          <ul className="text-muted-foreground space-y-1">
                            {file.analysis.risks.map((risk, index) => (
                              <li key={index}>• {risk}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-medium text-success mb-1">Opportunities:</h5>
                          <ul className="text-muted-foreground space-y-1">
                            {file.analysis.opportunities.map((opportunity, index) => (
                              <li key={index}>• {opportunity}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => viewDetailedReport(file)}
                      >
                        View Detailed Report
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FileStatusBadge({ status }: { status: UploadedFile['status'] }) {
  const config = {
    uploading: { icon: Clock, variant: 'secondary' as const, text: 'Uploading' },
    processing: { icon: Clock, variant: 'secondary' as const, text: 'Processing' },
    completed: { icon: CheckCircle, variant: 'default' as const, text: 'Complete' },
    error: { icon: AlertCircle, variant: 'destructive' as const, text: 'Error' },
  };

  const { icon: Icon, variant, text } = config[status];

  return (
    <Badge variant={variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {text}
    </Badge>
  );
}