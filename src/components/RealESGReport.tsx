import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Download, FileText, AlertTriangle, Target, Lightbulb,
  BarChart3, Globe, Users, Shield, BookOpen, TrendingUp, CheckCircle2, XCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Evidence {
  category: string;
  metric: string;
  value: string;
  year?: number;
  snippet: string;
  page: number;
  confidence: number;
  impact: string;
  trend?: string;
}

interface KeyMetrics {
  environmental?: {
    carbon_emissions?: string;
    renewable_energy?: string;
    water_usage?: string;
    waste_recycled?: string;
  };
  social?: {
    workforce_size?: string;
    female_leadership?: string;
    safety_incidents?: string;
    training_hours?: string;
  };
  governance?: {
    board_independence?: string;
    board_diversity?: string;
    ethics_training?: string;
    whistleblower_cases?: string;
  };
}

interface Risk {
  title: string;
  description: string;
  severity: string;
  category: string;
  evidence?: string;
  page: number;
  is_disclosed?: boolean;
  mitigation?: string;
}

interface Target {
  target: string;
  category: string;
  timeline: string;
  baseline?: string;
  page: number;
  status?: string;
}

interface RealESGReportProps {
  isOpen: boolean;
  onClose: () => void;
  reportData: {
    metadata?: {
      company_name: string;
      report_year: number;
      report_type: string;
    };
    scores: {
      overall: number;
      environmental: number;
      social: number;
      governance: number;
      confidence_level: string;
    };
    evidence: Evidence[];
    key_metrics?: KeyMetrics;
    risks: Risk[];
    opportunities: Array<{ title: string; description: string; category: string; priority: string }>;
    executive_summary: string;
    targets_and_commitments?: Target[];
    missing_disclosures?: string[];
  };
  fileName: string;
}

export const RealESGReport: React.FC<RealESGReportProps> = ({ isOpen, onClose, reportData, fileName }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const categoryIcons = {
    environmental: <Globe className="h-4 w-4" />,
    social: <Users className="h-4 w-4" />,
    governance: <Shield className="h-4 w-4" />
  };

  const formatMetricDisplay = (value: string | undefined) => {
    if (!value) return <span className="text-muted-foreground">Not disclosed</span>;
    if (value.toLowerCase().includes('not disclosed')) {
      return <span className="text-muted-foreground">{value}</span>;
    }
    return <span className="font-semibold">{value}</span>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            ESG Analysis Report - {reportData.metadata?.company_name || 'Company Report'}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {fileName} • {reportData.metadata?.report_type} • {reportData.metadata?.report_year}
          </p>
        </DialogHeader>

        <ScrollArea className="h-full pr-4">
          {/* Executive Summary */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Executive Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {reportData.executive_summary}
              </p>
            </CardContent>
          </Card>

          {/* Scores Overview */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${getScoreColor(reportData.scores.overall)}`}>
                  {reportData.scores.overall}
                </div>
                <Badge variant="outline" className="mt-2">
                  {getScoreLabel(reportData.scores.overall)}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Globe className="h-4 w-4 text-green-600" />
                  Environmental
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${getScoreColor(reportData.scores.environmental)}`}>
                  {reportData.scores.environmental}
                </div>
                <Progress value={reportData.scores.environmental} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  Social
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${getScoreColor(reportData.scores.social)}`}>
                  {reportData.scores.social}
                </div>
                <Progress value={reportData.scores.social} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4 text-purple-600" />
                  Governance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${getScoreColor(reportData.scores.governance)}`}>
                  {reportData.scores.governance}
                </div>
                <Progress value={reportData.scores.governance} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="metrics" className="mb-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="metrics">Key Metrics</TabsTrigger>
              <TabsTrigger value="evidence">Evidence ({reportData.evidence.length})</TabsTrigger>
              <TabsTrigger value="risks">Risks ({reportData.risks.length})</TabsTrigger>
              <TabsTrigger value="targets">Targets ({reportData.targets_and_commitments?.length || 0})</TabsTrigger>
              <TabsTrigger value="gaps">Gaps ({reportData.missing_disclosures?.length || 0})</TabsTrigger>
            </TabsList>

            {/* Key Metrics Tab */}
            <TabsContent value="metrics" className="space-y-4">
              {reportData.key_metrics && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-green-600" />
                        Environmental Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium">Carbon Emissions</TableCell>
                            <TableCell>{formatMetricDisplay(reportData.key_metrics.environmental?.carbon_emissions)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Renewable Energy</TableCell>
                            <TableCell>{formatMetricDisplay(reportData.key_metrics.environmental?.renewable_energy)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Water Usage</TableCell>
                            <TableCell>{formatMetricDisplay(reportData.key_metrics.environmental?.water_usage)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Waste Recycled</TableCell>
                            <TableCell>{formatMetricDisplay(reportData.key_metrics.environmental?.waste_recycled)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-600" />
                        Social Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium">Workforce Size</TableCell>
                            <TableCell>{formatMetricDisplay(reportData.key_metrics.social?.workforce_size)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Female Leadership</TableCell>
                            <TableCell>{formatMetricDisplay(reportData.key_metrics.social?.female_leadership)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Safety Incidents</TableCell>
                            <TableCell>{formatMetricDisplay(reportData.key_metrics.social?.safety_incidents)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Training Hours</TableCell>
                            <TableCell>{formatMetricDisplay(reportData.key_metrics.social?.training_hours)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-purple-600" />
                        Governance Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium">Board Independence</TableCell>
                            <TableCell>{formatMetricDisplay(reportData.key_metrics.governance?.board_independence)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Board Diversity</TableCell>
                            <TableCell>{formatMetricDisplay(reportData.key_metrics.governance?.board_diversity)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Ethics Training</TableCell>
                            <TableCell>{formatMetricDisplay(reportData.key_metrics.governance?.ethics_training)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Whistleblower Cases</TableCell>
                            <TableCell>{formatMetricDisplay(reportData.key_metrics.governance?.whistleblower_cases)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* Evidence Tab with Page Citations */}
            <TabsContent value="evidence">
              <Card>
                <CardHeader>
                  <CardTitle>Extracted Evidence</CardTitle>
                  <CardDescription>Real data points extracted from the report with page citations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reportData.evidence.map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {categoryIcons[item.category as keyof typeof categoryIcons]}
                              <Badge variant="outline">{item.category}</Badge>
                              <Badge variant="secondary">Page {item.page}</Badge>
                              {item.year && <Badge variant="outline">{item.year}</Badge>}
                            </div>
                            <h4 className="font-semibold mb-1">{item.metric}</h4>
                            <p className="text-lg font-bold text-primary mb-2">{item.value}</p>
                            <p className="text-sm text-muted-foreground italic">"{item.snippet}"</p>
                            {item.trend && (
                              <p className="text-sm text-muted-foreground mt-1">Trend: {item.trend}</p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge variant={item.impact === 'positive' ? 'default' : item.impact === 'negative' ? 'destructive' : 'secondary'}>
                              {item.impact}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{item.confidence}% confidence</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Risks Tab */}
            <TabsContent value="risks">
              <div className="space-y-4">
                {reportData.risks.map((risk, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5" />
                          {risk.title}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant={getSeverityColor(risk.severity)}>{risk.severity}</Badge>
                          <Badge variant="outline">Page {risk.page}</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm">{risk.description}</p>
                      {risk.evidence && (
                        <p className="text-sm text-muted-foreground italic">"{risk.evidence}"</p>
                      )}
                      {risk.mitigation && (
                        <div className="mt-2 p-2 bg-green-50 dark:bg-green-950 rounded">
                          <p className="text-sm"><strong>Mitigation:</strong> {risk.mitigation}</p>
                        </div>
                      )}
                      <Badge variant="outline">{risk.is_disclosed ? 'Company Disclosed' : 'Identified by Analysis'}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Targets Tab */}
            <TabsContent value="targets">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Targets & Commitments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {reportData.targets_and_commitments?.map((target, index) => (
                      <div key={index} className="border-l-4 border-primary pl-4 py-2">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold">{target.target}</h4>
                          <Badge variant="outline">Page {target.page}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Timeline: {target.timeline}</span>
                          {target.baseline && <span>Baseline: {target.baseline}</span>}
                          {target.status && <span>Status: {target.status}</span>}
                        </div>
                        <Badge variant="outline" className="mt-1">{target.category}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Missing Disclosures Tab */}
            <TabsContent value="gaps">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-orange-600" />
                    Missing Disclosures
                  </CardTitle>
                  <CardDescription>Important ESG metrics not found in this report</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {reportData.missing_disclosures?.map((item, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <XCircle className="h-4 w-4 text-orange-600" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Opportunities */}
          {reportData.opportunities && reportData.opportunities.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reportData.opportunities.map((opp, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold">{opp.title}</h4>
                        <Badge>{opp.priority} priority</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{opp.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </ScrollArea>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
