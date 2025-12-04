import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle2, AlertCircle, XCircle, Info, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

interface FrameworkCompliance {
  framework: string;
  fullName: string;
  description: string;
  score: number;
  disclosedMetrics: number;
  totalMetrics: number;
  status: 'compliant' | 'partial' | 'non-compliant';
  keyIndicators: {
    name: string;
    disclosed: boolean;
    value?: string;
    page?: number;
  }[];
  url: string;
}

interface ESGStandardsComplianceProps {
  evidence: Array<{
    category: string;
    metric: string;
    value: string;
    page: number;
    impact: string;
  }>;
  companyName: string;
}

// Framework requirements mapping
const FRAMEWORK_REQUIREMENTS = {
  GRI: {
    fullName: 'Global Reporting Initiative',
    description: 'Universal standards for sustainability reporting',
    url: 'https://www.globalreporting.org/',
    indicators: [
      { name: 'GHG Emissions (Scope 1)', keywords: ['scope 1', 'direct emissions', 'ghg emissions'] },
      { name: 'GHG Emissions (Scope 2)', keywords: ['scope 2', 'indirect emissions', 'electricity emissions'] },
      { name: 'Energy Consumption', keywords: ['energy consumption', 'energy use', 'mwh', 'kwh'] },
      { name: 'Water Withdrawal', keywords: ['water withdrawal', 'water consumption', 'water use'] },
      { name: 'Waste Generated', keywords: ['waste generated', 'waste disposal', 'waste management'] },
      { name: 'Employee Diversity', keywords: ['diversity', 'gender', 'female', 'minority'] },
      { name: 'Occupational Health & Safety', keywords: ['safety', 'incident', 'injury', 'ltifr', 'trifr'] },
      { name: 'Board Composition', keywords: ['board', 'directors', 'independent'] },
      { name: 'Anti-corruption', keywords: ['corruption', 'ethics', 'bribery', 'compliance'] },
      { name: 'Stakeholder Engagement', keywords: ['stakeholder', 'engagement', 'materiality'] }
    ]
  },
  SASB: {
    fullName: 'Sustainability Accounting Standards Board',
    description: 'Industry-specific sustainability disclosure standards',
    url: 'https://www.sasb.org/',
    indicators: [
      { name: 'Greenhouse Gas Emissions', keywords: ['ghg', 'carbon', 'co2', 'emissions'] },
      { name: 'Air Quality', keywords: ['air quality', 'pollution', 'nox', 'sox', 'particulate'] },
      { name: 'Energy Management', keywords: ['energy', 'renewable', 'electricity'] },
      { name: 'Water Management', keywords: ['water', 'withdrawal', 'discharge'] },
      { name: 'Waste Management', keywords: ['waste', 'recycling', 'circular'] },
      { name: 'Employee Health & Safety', keywords: ['safety', 'health', 'incident', 'injury'] },
      { name: 'Labor Practices', keywords: ['labor', 'workforce', 'employee', 'union'] },
      { name: 'Business Ethics', keywords: ['ethics', 'corruption', 'compliance', 'legal'] }
    ]
  },
  TCFD: {
    fullName: 'Task Force on Climate-related Financial Disclosures',
    description: 'Climate risk and opportunity disclosures',
    url: 'https://www.fsb-tcfd.org/',
    indicators: [
      { name: 'Governance - Board Oversight', keywords: ['board', 'oversight', 'climate governance'] },
      { name: 'Governance - Management Role', keywords: ['management', 'climate risk', 'executive'] },
      { name: 'Strategy - Climate Risks', keywords: ['climate risk', 'physical risk', 'transition risk'] },
      { name: 'Strategy - Climate Opportunities', keywords: ['climate opportunity', 'low-carbon', 'clean energy'] },
      { name: 'Risk Management - Processes', keywords: ['risk management', 'risk assessment', 'climate scenario'] },
      { name: 'Metrics - GHG Emissions', keywords: ['scope 1', 'scope 2', 'scope 3', 'emissions'] },
      { name: 'Metrics - Climate Targets', keywords: ['net zero', 'carbon neutral', 'science-based target', 'sbti'] }
    ]
  },
  CDP: {
    fullName: 'Carbon Disclosure Project',
    description: 'Environmental impact disclosure system',
    url: 'https://www.cdp.net/',
    indicators: [
      { name: 'Climate Change Response', keywords: ['climate', 'carbon', 'ghg', 'emissions'] },
      { name: 'Emissions Data', keywords: ['scope 1', 'scope 2', 'scope 3', 'tonnes co2'] },
      { name: 'Emissions Targets', keywords: ['target', 'reduction', 'net zero', 'sbti'] },
      { name: 'Water Security', keywords: ['water', 'withdrawal', 'discharge', 'stress'] },
      { name: 'Deforestation', keywords: ['deforestation', 'forest', 'land use', 'biodiversity'] },
      { name: 'Supply Chain Engagement', keywords: ['supply chain', 'supplier', 'scope 3'] }
    ]
  },
  CSRD: {
    fullName: 'Corporate Sustainability Reporting Directive',
    description: 'EU mandatory sustainability reporting standard',
    url: 'https://finance.ec.europa.eu/capital-markets-union-and-financial-markets/company-reporting-and-auditing/company-reporting/corporate-sustainability-reporting_en',
    indicators: [
      { name: 'Double Materiality Assessment', keywords: ['materiality', 'double materiality', 'impact'] },
      { name: 'Climate Change Mitigation', keywords: ['climate', 'mitigation', 'emissions', 'net zero'] },
      { name: 'Climate Change Adaptation', keywords: ['adaptation', 'resilience', 'physical risk'] },
      { name: 'Water & Marine Resources', keywords: ['water', 'marine', 'ocean', 'aquatic'] },
      { name: 'Circular Economy', keywords: ['circular', 'recycling', 'waste', 'resource efficiency'] },
      { name: 'Biodiversity & Ecosystems', keywords: ['biodiversity', 'ecosystem', 'nature', 'habitat'] },
      { name: 'Own Workforce', keywords: ['workforce', 'employee', 'labor', 'working conditions'] },
      { name: 'Workers in Value Chain', keywords: ['supply chain', 'supplier', 'value chain'] },
      { name: 'Affected Communities', keywords: ['community', 'local', 'indigenous', 'human rights'] },
      { name: 'Business Conduct', keywords: ['ethics', 'corruption', 'governance', 'compliance'] }
    ]
  }
};

export function ESGStandardsCompliance({ evidence, companyName }: ESGStandardsComplianceProps) {
  // Calculate compliance for each framework
  const calculateCompliance = (framework: keyof typeof FRAMEWORK_REQUIREMENTS): FrameworkCompliance => {
    const config = FRAMEWORK_REQUIREMENTS[framework];
    const evidenceText = evidence.map(e => `${e.metric} ${e.value}`.toLowerCase()).join(' ');
    
    const keyIndicators = config.indicators.map(indicator => {
      const isDisclosed = indicator.keywords.some(keyword => {
        // Check if any evidence contains this keyword
        return evidence.some(e => {
          const text = `${e.metric} ${e.value}`.toLowerCase();
          return text.includes(keyword);
        });
      });
      
      // Find the relevant evidence if disclosed
      const relevantEvidence = isDisclosed ? evidence.find(e => {
        const text = `${e.metric} ${e.value}`.toLowerCase();
        return indicator.keywords.some(k => text.includes(k));
      }) : null;
      
      return {
        name: indicator.name,
        disclosed: isDisclosed,
        value: relevantEvidence?.value,
        page: relevantEvidence?.page
      };
    });
    
    const disclosedMetrics = keyIndicators.filter(i => i.disclosed).length;
    const totalMetrics = keyIndicators.length;
    const score = Math.round((disclosedMetrics / totalMetrics) * 100);
    
    const status: 'compliant' | 'partial' | 'non-compliant' = 
      score >= 70 ? 'compliant' : score >= 40 ? 'partial' : 'non-compliant';
    
    return {
      framework,
      fullName: config.fullName,
      description: config.description,
      score,
      disclosedMetrics,
      totalMetrics,
      status,
      keyIndicators,
      url: config.url
    };
  };

  const frameworkCompliance = Object.keys(FRAMEWORK_REQUIREMENTS).map(
    fw => calculateCompliance(fw as keyof typeof FRAMEWORK_REQUIREMENTS)
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'partial': return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default: return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'compliant': return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Compliant</Badge>;
      case 'partial': return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Partial</Badge>;
      default: return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Non-compliant</Badge>;
    }
  };

  return (
    <Card className="shadow-elegant">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Standards Alignment
            </CardTitle>
            <CardDescription>
              Compliance with major ESG reporting frameworks for {companyName}
            </CardDescription>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-5 w-5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Compliance is calculated based on the presence of key indicators required by each framework in the analyzed report.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Summary Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {frameworkCompliance.map((fw, index) => (
            <motion.div
              key={fw.framework}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="text-center p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="text-2xl font-bold text-primary">{fw.score}%</div>
              <div className="text-sm font-medium">{fw.framework}</div>
              <div className="mt-1">{getStatusBadge(fw.status)}</div>
            </motion.div>
          ))}
        </div>

        {/* Detailed Framework Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {frameworkCompliance.map((fw, index) => (
            <motion.div
              key={fw.framework}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.15 }}
            >
              <Card className="h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(fw.status)}
                      <div>
                        <CardTitle className="text-base">{fw.framework}</CardTitle>
                        <CardDescription className="text-xs">{fw.fullName}</CardDescription>
                      </div>
                    </div>
                    <a 
                      href={fw.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Disclosure Coverage</span>
                      <span className="font-medium">{fw.disclosedMetrics}/{fw.totalMetrics} indicators</span>
                    </div>
                    <Progress value={fw.score} className="h-2" />
                  </div>
                  
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {fw.keyIndicators.slice(0, 5).map((indicator, i) => (
                      <div 
                        key={i} 
                        className="flex items-center justify-between text-xs py-1 border-b border-border/50 last:border-0"
                      >
                        <span className={indicator.disclosed ? 'text-foreground' : 'text-muted-foreground'}>
                          {indicator.name}
                        </span>
                        {indicator.disclosed ? (
                          <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-600">
                            p.{indicator.page}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground">
                            Missing
                          </Badge>
                        )}
                      </div>
                    ))}
                    {fw.keyIndicators.length > 5 && (
                      <div className="text-xs text-muted-foreground text-center pt-1">
                        +{fw.keyIndicators.length - 5} more indicators
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}