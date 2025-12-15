import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle2, XCircle, AlertTriangle, Building2, Calendar, 
  FileText, Search, Shield, Leaf, Users, Scale, BookOpen,
  ChevronDown, ChevronUp, ArrowRight, RefreshCw
} from 'lucide-react';

export interface ValidationResult {
  company_name: string;
  detected_year: number | null;
  page_count?: number;
  document_type: 'Annual Report' | 'ESG Report' | 'CSR Report' | 'Sustainability Report' | 'Unknown';
  contains_esg_sections?: boolean;
  esg_keywords_detected: number;
  keyword_breakdown: {
    environmental: number;
    social: number;
    governance: number;
    frameworks: number;
  };
  detected_frameworks: string[];
  semantic_match_score: number;
  section_headers_found: string[];
  final_validation_status: 'Accepted: ESG/Sustainability Report' | 'Maybe: Needs manual confirmation' | 'Rejected: Not an ESG report';
  confidence_level: 'High' | 'Medium' | 'Low';
  rejection_reason?: string;
  extracted_preview: string;
  validation_details?: {
    keyword_score: number;
    structure_score: number;
    semantic_score: number;
    total_score: number;
  };
}

interface DocumentValidationResultProps {
  result: ValidationResult;
  fileName: string;
  onProceed: () => void;
  onReject: () => void;
  onRetry?: () => void;
  isLoading?: boolean;
}

export const DocumentValidationResult: React.FC<DocumentValidationResultProps> = ({
  result,
  fileName,
  onProceed,
  onReject,
  onRetry,
  isLoading = false
}) => {
  const [showDetails, setShowDetails] = React.useState(false);

  const getStatusConfig = () => {
    switch (result.final_validation_status) {
      case 'Accepted: ESG/Sustainability Report':
        return {
          icon: CheckCircle2,
          color: 'text-green-500',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/30',
          badgeVariant: 'default' as const,
          title: 'Document Validated',
          subtitle: 'This document is recognized as a valid ESG/Sustainability report'
        };
      case 'Maybe: Needs manual confirmation':
        return {
          icon: AlertTriangle,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/30',
          badgeVariant: 'secondary' as const,
          title: 'Manual Review Recommended',
          subtitle: 'This document may contain ESG content but requires confirmation'
        };
      case 'Rejected: Not an ESG report':
        return {
          icon: XCircle,
          color: 'text-red-500',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/30',
          badgeVariant: 'destructive' as const,
          title: 'Document Not Recognized',
          subtitle: 'This file does not appear to be an ESG/Sustainability report'
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  const totalKeywords = result.esg_keywords_detected;
  const maxExpectedKeywords = 200; // For normalization
  const keywordPercentage = Math.min(100, (totalKeywords / maxExpectedKeywords) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`border-2 ${statusConfig.borderColor} ${statusConfig.bgColor}`}>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-full ${statusConfig.bgColor}`}>
                <StatusIcon className={`w-8 h-8 ${statusConfig.color}`} />
              </div>
              <div>
                <CardTitle className="text-xl">{statusConfig.title}</CardTitle>
                <CardDescription className="mt-1">{statusConfig.subtitle}</CardDescription>
              </div>
            </div>
            <Badge variant={statusConfig.badgeVariant} className="text-sm px-3 py-1">
              {result.confidence_level} Confidence
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* File Info */}
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <FileText className="w-10 h-10 text-primary" />
            <div className="flex-1">
              <p className="font-semibold text-foreground truncate">{fileName}</p>
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Building2 className="w-4 h-4" />
                  {result.company_name}
                </span>
                {result.detected_year && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {result.detected_year}
                  </span>
                )}
                <Badge variant="outline">{result.document_type}</Badge>
              </div>
            </div>
          </div>

          {/* Scores Overview */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-background rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Semantic Match</span>
                <span className={`text-lg font-bold ${
                  result.semantic_match_score >= 70 ? 'text-green-500' :
                  result.semantic_match_score >= 40 ? 'text-yellow-500' : 'text-red-500'
                }`}>
                  {result.semantic_match_score}%
                </span>
              </div>
              <Progress 
                value={result.semantic_match_score} 
                className="h-2"
              />
            </div>
            
            <div className="p-4 bg-background rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">ESG Keywords</span>
                <span className={`text-lg font-bold ${
                  totalKeywords >= 40 ? 'text-green-500' :
                  totalKeywords >= 15 ? 'text-yellow-500' : 'text-red-500'
                }`}>
                  {totalKeywords}
                </span>
              </div>
              <Progress 
                value={keywordPercentage} 
                className="h-2"
              />
            </div>
          </div>

          {/* Keyword Breakdown */}
          <div className="grid grid-cols-4 gap-3">
            <div className="p-3 bg-green-500/10 rounded-lg text-center">
              <Leaf className="w-5 h-5 text-green-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-green-600">{result.keyword_breakdown.environmental}</p>
              <p className="text-xs text-muted-foreground">Environmental</p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-lg text-center">
              <Users className="w-5 h-5 text-blue-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-blue-600">{result.keyword_breakdown.social}</p>
              <p className="text-xs text-muted-foreground">Social</p>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-lg text-center">
              <Scale className="w-5 h-5 text-purple-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-purple-600">{result.keyword_breakdown.governance}</p>
              <p className="text-xs text-muted-foreground">Governance</p>
            </div>
            <div className="p-3 bg-orange-500/10 rounded-lg text-center">
              <BookOpen className="w-5 h-5 text-orange-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-orange-600">{result.keyword_breakdown.frameworks}</p>
              <p className="text-xs text-muted-foreground">Frameworks</p>
            </div>
          </div>

          {/* Detected Frameworks */}
          {result.detected_frameworks.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Detected Reporting Frameworks</p>
              <div className="flex flex-wrap gap-2">
                {result.detected_frameworks.map((framework) => (
                  <Badge key={framework} variant="outline" className="bg-primary/10">
                    <Shield className="w-3 h-3 mr-1" />
                    {framework}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Rejection Reason */}
          {result.rejection_reason && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">
                {result.rejection_reason}
              </p>
            </div>
          )}

          {/* Expandable Details */}
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="w-full justify-between"
            >
              <span className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                View Detailed Analysis
              </span>
              {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
            
            {showDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-4"
              >
                {result.section_headers_found.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">ESG Sections Detected</p>
                    <div className="flex flex-wrap gap-2">
                      {result.section_headers_found.map((header, index) => (
                        <Badge key={index} variant="secondary" className="text-xs capitalize">
                          {header}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div>
                  <p className="text-sm font-medium mb-2">Document Preview</p>
                  <div className="p-3 bg-muted/50 rounded-lg max-h-32 overflow-y-auto">
                    <p className="text-xs text-muted-foreground font-mono whitespace-pre-wrap">
                      {result.extracted_preview}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            {onRetry && result.final_validation_status === 'Rejected: Not an ESG report' && (
              <Button variant="outline" onClick={onRetry} disabled={isLoading}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Different File
              </Button>
            )}
            
            {result.final_validation_status === 'Rejected: Not an ESG report' ? (
              <Button variant="destructive" onClick={onReject} disabled={isLoading}>
                <XCircle className="w-4 h-4 mr-2" />
                Dismiss
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={onReject} disabled={isLoading}>
                  Cancel
                </Button>
                <Button onClick={onProceed} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Proceed to Analysis
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
