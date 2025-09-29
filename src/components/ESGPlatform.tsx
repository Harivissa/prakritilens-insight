import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useReports } from '@/hooks/useReports';
import { useESGScoring, generateContentHash } from '@/hooks/useESGScoring';
import { downloadPDF } from '@/utils/pdfGenerator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ESGReportCard } from '@/components/ESGReportCard';
import { Upload, FileText, Download, LogOut, BarChart3, Shield, Leaf, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export const ESGPlatform = () => {
  const { user, signOut } = useAuth();
  const { reports, loading: reportsLoading, saveReport, uploadFile } = useReports();
  const { analyzeDocument, isAnalyzing } = useESGScoring();
  const [currentAnalysis, setCurrentAnalysis] = useState<any>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileUpload = async (file: File) => {
    if (!file || !file.type.includes('pdf') && !file.type.includes('document')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF or document file.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Analyze the document
      const analysis = await analyzeDocument(file);
      setCurrentAnalysis({ ...analysis, fileName: file.name });

      // Upload file to storage
      const fileUrl = await uploadFile(file);

      // Save report to database
      const analysisHash = generateContentHash(analysis.extractedText);
      
      await saveReport({
        score: analysis.score,
        company_name: file.name.split('.')[0],
        file_name: file.name,
        file_url: fileUrl,
        hash: analysisHash,
        analysis_data: {
          breakdown: analysis.breakdown,
          analysis: analysis.analysis,
          risks: analysis.risks,
          opportunities: analysis.opportunities,
          extractedText: analysis.extractedText,
          fileUrl
        }
      });

      toast({
        title: "Analysis complete",
        description: "Your ESG assessment has been completed and saved.",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
    e.target.value = '';
  };

  const generateReport = async (analysis: any) => {
    try {
      await downloadPDF({
        companyName: analysis.fileName.split('.')[0],
        score: analysis.score,
        breakdown: analysis.breakdown,
        analysis: analysis.analysis,
        risks: analysis.risks,
        opportunities: analysis.opportunities,
        fileName: analysis.fileName,
        generatedAt: new Date().toISOString()
      });

      toast({
        title: "Report downloaded",
        description: "Your ESG report has been generated and downloaded.",
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to generate PDF report.",
        variant: "destructive",
      });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Leaf className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
              PrakritiLens
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {user?.email}
            </span>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">ESG Analysis</TabsTrigger>
            <TabsTrigger value="reports">My Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            {/* File Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="h-5 w-5" />
                  <span>Upload ESG Document</span>
                </CardTitle>
                <CardDescription>
                  Upload your ESG report or sustainability document for deterministic analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                >
                  {isAnalyzing ? (
                    <div className="flex flex-col items-center space-y-4">
                      <LoadingSpinner size="lg" />
                      <p className="text-lg font-medium">Analyzing document...</p>
                      <p className="text-sm text-muted-foreground">
                        Extracting text and calculating ESG score
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                      <div>
                        <p className="text-lg font-medium">
                          Drop your ESG document here or click to browse
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Supports PDF and document files
                        </p>
                      </div>
                      <label>
                        <Button asChild>
                          <span>
                            Choose File
                            <input
                              type="file"
                              className="hidden"
                              accept=".pdf,.doc,.docx"
                              onChange={handleFileInput}
                              disabled={isAnalyzing}
                            />
                          </span>
                        </Button>
                      </label>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Current Analysis Results */}
            {currentAnalysis && (
              <ESGReportCard
                result={{
                  score: currentAnalysis.score,
                  breakdown: currentAnalysis.breakdown,
                  analysis: currentAnalysis.analysis,
                  risks: currentAnalysis.risks,
                  opportunities: currentAnalysis.opportunities,
                  companyName: currentAnalysis.fileName.split('.')[0],
                  fileName: currentAnalysis.fileName,
                  generatedAt: new Date().toISOString()
                }}
                onDownload={() => generateReport(currentAnalysis)}
              />
            )}
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Saved Reports</CardTitle>
                <CardDescription>
                  View and download your previously generated ESG assessment reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reportsLoading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : reports.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No reports found. Upload a document to generate your first ESG assessment.
                  </div>
                ) : (
                  <ScrollArea className="h-96">
                    <div className="space-y-4">
                      {reports.map((report) => (
                        <Card key={report.id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <h4 className="font-medium">{report.company_name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {report.file_name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(report.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex items-center space-x-4">
                                <div className="text-center">
                                  <div className="text-2xl font-bold" style={{ color: getScoreColor(report.score).replace('bg-', '') }}>
                                    {report.score}
                                  </div>
                                  <Badge variant="secondary" className="text-xs">
                                    {getScoreLabel(report.score)}
                                  </Badge>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => generateReport({
                                    ...report.analysis_data,
                                    fileName: report.file_name,
                                    score: report.score
                                  })}
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};