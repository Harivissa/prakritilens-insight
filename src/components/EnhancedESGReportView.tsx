import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Leaf, Users, Shield, Download, FileText, AlertTriangle, TrendingUp, 
  CheckCircle, XCircle, ChevronDown, ChevronRight, Target, Clock,
  BarChart3, BookOpen, Lightbulb, Building2, FileBarChart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ESGVisualizationSuite } from './ESGVisualizationSuite';
import { ESGStandardsCompliance } from './ESGStandardsCompliance';
import { ESGWeightsCustomizer } from './ESGWeightsCustomizer';
import { ESGChatbot } from './ESGChatbot';

interface ESGAnalysisData {
  score: number;
  breakdown: {
    environmental: number;
    social: number;
    governance: number;
  };
  confidence_level: string;
  evidence: Array<{
    category: string;
    metric: string;
    value: string;
    page: number;
    snippet: string;
    impact: 'positive' | 'negative' | 'neutral' | 'not_disclosed';
    confidence: number;
    trend?: string;
  }>;
  risks: Array<{
    title: string;
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    category: string;
    evidence?: string;
    page?: number;
    mitigation?: string;
  }>;
  opportunities: Array<{
    title: string;
    description: string;
    category: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  recommendations: Array<{
    title: string;
    description: string;
    category: string;
    timeframe?: string;
  }>;
  executive_summary: string;
  metadata: {
    company_name: string;
    report_year: number;
    report_type: string;
    page_count: number;
  };
  key_metrics?: {
    environmental: {
      carbon_emissions: string;
      renewable_energy: string;
      water_usage: string;
      waste_recycled: string;
    };
    social: {
      workforce_size: string;
      female_leadership: string;
      safety_incidents: string;
      training_hours: string;
    };
    governance: {
      board_independence: string;
      board_diversity: string;
      ethics_training: string;
      whistleblower_cases: string;
    };
  };
  targets_and_commitments?: Array<{
    target: string;
    category: string;
    timeline: string;
    status?: string;
    page?: number;
  }>;
  missing_disclosures?: string[];
  reportId?: string;
}

interface EnhancedESGReportViewProps {
  analysisData: ESGAnalysisData;
  onDownloadPDF: () => void;
  onDownloadExcel: () => void;
}

const CATEGORY_CONFIG = {
  environmental: { icon: Leaf, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
  social: { icon: Users, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  governance: { icon: Shield, color: 'text-purple-500', bgColor: 'bg-purple-500/10' }
};

const SEVERITY_COLORS = {
  critical: 'bg-red-500/10 text-red-600 border-red-500/20',
  high: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  medium: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  low: 'bg-green-500/10 text-green-600 border-green-500/20'
};

export function EnhancedESGReportView({ 
  analysisData, 
  onDownloadPDF, 
  onDownloadExcel 
}: EnhancedESGReportViewProps) {
  const [activeSection, setActiveSection] = useState('overview');
  const [expandedEvidence, setExpandedEvidence] = useState<string[]>([]);
  const [esgWeights, setEsgWeights] = useState({
    environmental: 34,
    social: 33,
    governance: 33
  });
  const reportRef = useRef<HTMLDivElement>(null);

  const { metadata, breakdown, evidence, risks, opportunities, recommendations, 
          executive_summary, key_metrics, targets_and_commitments, missing_disclosures } = analysisData;

  // Calculate weighted score based on user weights
  const calculateWeightedScore = () => {
    const envWeight = esgWeights.environmental / 100;
    const socWeight = esgWeights.social / 100;
    const govWeight = esgWeights.governance / 100;
    return Math.round(
      breakdown.environmental * envWeight +
      breakdown.social * socWeight +
      breakdown.governance * govWeight
    );
  };

  const weightedScore = calculateWeightedScore();

  const getScoreRating = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: 'text-emerald-500' };
    if (score >= 60) return { label: 'Good', color: 'text-blue-500' };
    if (score >= 40) return { label: 'Fair', color: 'text-yellow-500' };
    return { label: 'Needs Improvement', color: 'text-red-500' };
  };

  const toggleEvidence = (category: string) => {
    setExpandedEvidence(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const scoreRating = getScoreRating(weightedScore);

  return (
    <div ref={reportRef} className="space-y-6 pb-20">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="flex items-center justify-center gap-2">
          <Leaf className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">PrakritiLens ESG Report</h1>
        </div>
        <div className="flex items-center justify-center gap-4 text-muted-foreground">
          <Badge variant="outline" className="flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            {metadata.company_name}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <FileBarChart className="h-3 w-3" />
            {metadata.report_type}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {metadata.report_year}
          </Badge>
        </div>
        
        {/* Download Buttons */}
        <div className="flex items-center justify-center gap-3">
          <Button onClick={onDownloadPDF} className="gradient-primary">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button variant="outline" onClick={onDownloadExcel}>
            <FileText className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </motion.div>

      {/* Main Score Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="shadow-elegant overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <div className={`text-7xl font-bold ${scoreRating.color}`}>
                  {weightedScore}
                </div>
                <div className="text-lg text-muted-foreground">Overall ESG Score</div>
                <Badge className="mt-2" variant="secondary">
                  {scoreRating.label}
                </Badge>
                <div className="text-xs text-muted-foreground mt-1">
                  Confidence: {analysisData.confidence_level}
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
                  const Icon = config.icon;
                  const score = breakdown[key as keyof typeof breakdown];
                  return (
                    <div 
                      key={key} 
                      className={`text-center p-4 rounded-xl ${config.bgColor}`}
                    >
                      <Icon className={`h-6 w-6 mx-auto ${config.color}`} />
                      <div className={`text-3xl font-bold mt-2 ${config.color}`}>{score}</div>
                      <div className="text-xs text-muted-foreground capitalize">{key}</div>
                      <div className="text-[10px] text-muted-foreground">
                        Weight: {esgWeights[key as keyof typeof esgWeights]}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Navigation Tabs */}
      <Tabs value={activeSection} onValueChange={setActiveSection} className="space-y-6">
        <TabsList className="grid grid-cols-4 md:grid-cols-8 w-full h-auto p-1 gap-1">
          <TabsTrigger value="overview" className="flex items-center gap-1 text-xs">
            <BarChart3 className="h-3 w-3" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="executive" className="flex items-center gap-1 text-xs">
            <BookOpen className="h-3 w-3" />
            <span className="hidden sm:inline">Summary</span>
          </TabsTrigger>
          <TabsTrigger value="evidence" className="flex items-center gap-1 text-xs">
            <FileText className="h-3 w-3" />
            <span className="hidden sm:inline">Evidence</span>
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex items-center gap-1 text-xs">
            <Target className="h-3 w-3" />
            <span className="hidden sm:inline">Metrics</span>
          </TabsTrigger>
          <TabsTrigger value="risks" className="flex items-center gap-1 text-xs">
            <AlertTriangle className="h-3 w-3" />
            <span className="hidden sm:inline">Risks</span>
          </TabsTrigger>
          <TabsTrigger value="standards" className="flex items-center gap-1 text-xs">
            <CheckCircle className="h-3 w-3" />
            <span className="hidden sm:inline">Standards</span>
          </TabsTrigger>
          <TabsTrigger value="weights" className="flex items-center gap-1 text-xs">
            <Lightbulb className="h-3 w-3" />
            <span className="hidden sm:inline">Weights</span>
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-1 text-xs">
            <Lightbulb className="h-3 w-3" />
            <span className="hidden sm:inline">AI Chat</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <ESGVisualizationSuite
            scores={{
              overall: weightedScore,
              environmental: breakdown.environmental,
              social: breakdown.social,
              governance: breakdown.governance
            }}
            evidence={evidence}
            risks={risks}
            companyName={metadata.company_name}
          />
        </TabsContent>

        {/* Executive Summary Tab */}
        <TabsContent value="executive">
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Executive Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <p className="text-base leading-relaxed">{executive_summary}</p>
              </div>

              {/* Targets and Commitments */}
              {targets_and_commitments && targets_and_commitments.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Forward-Looking Commitments
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {targets_and_commitments.map((target, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${CATEGORY_CONFIG[target.category as keyof typeof CATEGORY_CONFIG]?.bgColor || 'bg-muted'}`}>
                            {(() => {
                              const config = CATEGORY_CONFIG[target.category as keyof typeof CATEGORY_CONFIG];
                              const Icon = config?.icon || Target;
                              return <Icon className={`h-4 w-4 ${config?.color || 'text-muted-foreground'}`} />;
                            })()}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{target.target}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">{target.timeline}</Badge>
                              {target.status && (
                                <Badge variant="secondary" className="text-xs">{target.status}</Badge>
                              )}
                              {target.page && (
                                <Badge variant="outline" className="text-[10px]">p.{target.page}</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing Disclosures */}
              {missing_disclosures && missing_disclosures.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2 text-muted-foreground">
                    <XCircle className="h-4 w-4" />
                    Missing Disclosures
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {missing_disclosures.map((disclosure, index) => (
                      <Badge key={index} variant="outline" className="bg-muted/50">
                        {disclosure}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Evidence Tab */}
        <TabsContent value="evidence">
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Extracted Evidence
              </CardTitle>
              <CardDescription>
                {evidence.length} metrics extracted from the report with page citations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(['environmental', 'social', 'governance'] as const).map((category) => {
                  const categoryEvidence = evidence.filter(e => e.category === category);
                  const config = CATEGORY_CONFIG[category];
                  const Icon = config.icon;
                  const isExpanded = expandedEvidence.includes(category);

                  return (
                    <Collapsible key={category} open={isExpanded}>
                      <CollapsibleTrigger 
                        onClick={() => toggleEvidence(category)}
                        className="w-full"
                      >
                        <div className={`flex items-center justify-between p-4 rounded-lg ${config.bgColor} hover:opacity-90 transition-opacity`}>
                          <div className="flex items-center gap-3">
                            <Icon className={`h-5 w-5 ${config.color}`} />
                            <span className="font-medium capitalize">{category}</span>
                            <Badge variant="secondary">{categoryEvidence.length} metrics</Badge>
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5" />
                          ) : (
                            <ChevronRight className="h-5 w-5" />
                          )}
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-2 space-y-2"
                            >
                              {categoryEvidence.map((ev, index) => (
                                <Card key={index} className="p-4">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className="font-medium">{ev.metric}</span>
                                        <Badge 
                                          variant="outline" 
                                          className={
                                            ev.impact === 'positive' ? 'bg-green-500/10 text-green-600' :
                                            ev.impact === 'negative' ? 'bg-red-500/10 text-red-600' :
                                            ev.impact === 'not_disclosed' ? 'bg-yellow-500/10 text-yellow-600' :
                                            'bg-gray-500/10 text-gray-600'
                                          }
                                        >
                                          {ev.impact.replace('_', ' ')}
                                        </Badge>
                                      </div>
                                      <p className="text-lg font-semibold text-primary">{ev.value}</p>
                                      {ev.snippet && (
                                        <p className="text-sm text-muted-foreground mt-2 italic">
                                          "{ev.snippet}"
                                        </p>
                                      )}
                                      {ev.trend && (
                                        <div className="flex items-center gap-1 mt-2 text-sm">
                                          <TrendingUp className="h-3 w-3" />
                                          <span>{ev.trend}</span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      <Badge variant="outline">Page {ev.page}</Badge>
                                      <div className="text-xs text-muted-foreground mt-1">
                                        {ev.confidence}% confident
                                      </div>
                                    </div>
                                  </div>
                                </Card>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Key Metrics Tab */}
        <TabsContent value="metrics">
          {key_metrics ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(key_metrics).map(([category, metrics]) => {
                const config = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG];
                const Icon = config.icon;
                
                return (
                  <Card key={category} className="shadow-elegant">
                    <CardHeader className={`${config.bgColor} rounded-t-lg`}>
                      <CardTitle className={`flex items-center gap-2 ${config.color}`}>
                        <Icon className="h-5 w-5" />
                        <span className="capitalize">{category}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      {Object.entries(metrics).map(([key, value]) => (
                        <div key={key} className="space-y-1">
                          <div className="text-xs text-muted-foreground capitalize">
                            {key.replace(/_/g, ' ')}
                          </div>
                          <div className="font-medium">
                            {value === 'Not disclosed' ? (
                              <span className="text-muted-foreground italic">{value}</span>
                            ) : (
                              value
                            )}
                          </div>
                          <Separator />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No key metrics extracted</p>
            </Card>
          )}
        </TabsContent>

        {/* Risks Tab */}
        <TabsContent value="risks">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Risks */}
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-500">
                  <AlertTriangle className="h-5 w-5" />
                  Identified Risks ({risks.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {risks.map((risk, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-start gap-3">
                          <Badge className={SEVERITY_COLORS[risk.severity]}>
                            {risk.severity}
                          </Badge>
                          <div className="flex-1">
                            <h4 className="font-medium">{risk.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {risk.description}
                            </p>
                            {risk.evidence && (
                              <p className="text-xs text-muted-foreground mt-2 italic">
                                "{risk.evidence}"
                              </p>
                            )}
                            {risk.mitigation && (
                              <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                                <span className="font-medium">Mitigation: </span>
                                {risk.mitigation}
                              </div>
                            )}
                            <div className="flex gap-2 mt-2">
                              <Badge variant="outline" className="text-xs capitalize">
                                {risk.category}
                              </Badge>
                              {risk.page && (
                                <Badge variant="outline" className="text-xs">
                                  p.{risk.page}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Opportunities */}
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-500">
                  <TrendingUp className="h-5 w-5" />
                  Opportunities ({opportunities.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {opportunities.map((opp, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-start gap-3">
                          <Badge 
                            className={
                              opp.priority === 'high' ? 'bg-green-500/10 text-green-600' :
                              opp.priority === 'medium' ? 'bg-blue-500/10 text-blue-600' :
                              'bg-gray-500/10 text-gray-600'
                            }
                          >
                            {opp.priority}
                          </Badge>
                          <div className="flex-1">
                            <h4 className="font-medium">{opp.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {opp.description}
                            </p>
                            <Badge variant="outline" className="text-xs capitalize mt-2">
                              {opp.category}
                            </Badge>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <Card className="shadow-elegant mt-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recommendations.map((rec, index) => (
                    <Card key={index} className="p-4">
                      <h4 className="font-medium">{rec.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="text-xs capitalize">{rec.category}</Badge>
                        {rec.timeframe && (
                          <Badge variant="secondary" className="text-xs">{rec.timeframe}</Badge>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Standards Tab */}
        <TabsContent value="standards">
          <ESGStandardsCompliance 
            evidence={evidence}
            companyName={metadata.company_name}
          />
        </TabsContent>

        {/* Weights Tab */}
        <TabsContent value="weights">
          <ESGWeightsCustomizer 
            weights={esgWeights}
            onWeightsChange={setEsgWeights}
          />
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat">
          {analysisData.reportId ? (
            <ESGChatbot 
              reportId={analysisData.reportId}
              companyName={metadata.company_name}
            />
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Chat not available for this report</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground pt-8 border-t">
        <p>Generated by PrakritiLens | Built by Hari Vissa & Michelle</p>
        <p className="mt-1 text-xs">
          This analysis is based on AI extraction from the uploaded document. 
          Always verify critical data with the original source.
        </p>
      </div>
    </div>
  );
}