import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, Area, AreaChart, Treemap
} from 'recharts';
import { 
  BarChart3, PieChart as PieChartIcon, TrendingUp, Grid3X3, 
  Leaf, Users, Shield, AlertTriangle, Target
} from 'lucide-react';
import { motion } from 'framer-motion';

interface ESGScores {
  overall: number;
  environmental: number;
  social: number;
  governance: number;
}

interface ESGEvidence {
  category: string;
  metric: string;
  value: string;
  page: number;
  impact: 'positive' | 'negative' | 'neutral' | 'not_disclosed';
  confidence: number;
}

interface ESGRisk {
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  page?: number;
}

interface Benchmark {
  name: string;
  environmental: number;
  social: number;
  governance: number;
  overall: number;
}

interface ESGVisualizationSuiteProps {
  scores: ESGScores;
  evidence: ESGEvidence[];
  risks: ESGRisk[];
  companyName: string;
  benchmarks?: Benchmark[];
  historicalData?: { year: number; scores: ESGScores }[];
}

const COLORS = {
  environmental: '#10b981',
  social: '#3b82f6',
  governance: '#8b5cf6',
  positive: '#22c55e',
  negative: '#ef4444',
  neutral: '#6b7280',
  not_disclosed: '#f59e0b'
};

const RISK_COLORS = {
  critical: '#dc2626',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e'
};

export function ESGVisualizationSuite({ 
  scores, 
  evidence, 
  risks, 
  companyName,
  benchmarks = [],
  historicalData = []
}: ESGVisualizationSuiteProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // Data for ESG breakdown chart
  const breakdownData = [
    { name: 'Environmental', score: scores.environmental, fill: COLORS.environmental },
    { name: 'Social', score: scores.social, fill: COLORS.social },
    { name: 'Governance', score: scores.governance, fill: COLORS.governance }
  ];

  // Data for impact distribution pie chart
  const impactCounts = evidence.reduce((acc, ev) => {
    acc[ev.impact] = (acc[ev.impact] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const impactData = Object.entries(impactCounts).map(([impact, count]) => ({
    name: impact.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: count,
    fill: COLORS[impact as keyof typeof COLORS] || '#6b7280'
  }));

  // Data for radar chart (benchmark comparison)
  const radarData = [
    { category: 'Environmental', current: scores.environmental, benchmark: 65 },
    { category: 'Social', current: scores.social, benchmark: 60 },
    { category: 'Governance', current: scores.governance, benchmark: 70 }
  ];

  // Data for risk heatmap
  const riskHeatmapData = risks.map((risk, index) => ({
    name: risk.title.substring(0, 20) + '...',
    size: risk.severity === 'critical' ? 4 : risk.severity === 'high' ? 3 : risk.severity === 'medium' ? 2 : 1,
    fill: RISK_COLORS[risk.severity],
    category: risk.category
  }));

  // Category breakdown for treemap
  const categoryBreakdown = evidence.reduce((acc, ev) => {
    const cat = ev.category;
    if (!acc[cat]) {
      acc[cat] = { positive: 0, negative: 0, neutral: 0, not_disclosed: 0 };
    }
    acc[cat][ev.impact]++;
    return acc;
  }, {} as Record<string, Record<string, number>>);

  const treemapData = Object.entries(categoryBreakdown).flatMap(([category, impacts]) => 
    Object.entries(impacts)
      .filter(([_, count]) => count > 0)
      .map(([impact, count]) => ({
        name: `${category} - ${impact}`,
        size: count,
        category,
        impact
      }))
  );

  return (
    <Card className="shadow-elegant">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <CardTitle>ESG Analytics Dashboard</CardTitle>
          </div>
          <Badge variant="outline">{companyName}</Badge>
        </div>
        <CardDescription>
          Interactive visualizations of ESG performance metrics and risk analysis
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="overview" className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="breakdown" className="flex items-center gap-1">
              <PieChartIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Breakdown</span>
            </TabsTrigger>
            <TabsTrigger value="benchmark" className="flex items-center gap-1">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Benchmark</span>
            </TabsTrigger>
            <TabsTrigger value="risks" className="flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Risks</span>
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Trends</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Score Cards */}
              <motion.div 
                className="space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="text-center p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl">
                  <div className="text-5xl font-bold text-primary">{scores.overall}</div>
                  <div className="text-sm text-muted-foreground mt-1">Overall ESG Score</div>
                  <Badge className="mt-2" variant={scores.overall >= 70 ? 'default' : scores.overall >= 50 ? 'secondary' : 'destructive'}>
                    {scores.overall >= 80 ? 'Excellent' : scores.overall >= 60 ? 'Good' : scores.overall >= 40 ? 'Fair' : 'Needs Improvement'}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {breakdownData.map((item) => (
                    <div 
                      key={item.name} 
                      className="text-center p-3 rounded-lg"
                      style={{ backgroundColor: `${item.fill}15` }}
                    >
                      <div className="text-2xl font-bold" style={{ color: item.fill }}>{item.score}</div>
                      <div className="text-xs text-muted-foreground">{item.name.charAt(0)}</div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Bar Chart */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={breakdownData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                      {breakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            </div>
          </TabsContent>

          {/* Breakdown Tab */}
          <TabsContent value="breakdown" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Impact Distribution Pie */}
              <Card className="p-4">
                <h4 className="font-medium mb-4 flex items-center gap-2">
                  <PieChartIcon className="h-4 w-4" />
                  Evidence Impact Distribution
                </h4>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={impactData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {impactData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Card>

              {/* Evidence by Category */}
              <Card className="p-4">
                <h4 className="font-medium mb-4">Metrics by Category</h4>
                <div className="space-y-4">
                  {['environmental', 'social', 'governance'].map((cat) => {
                    const catEvidence = evidence.filter(e => e.category === cat);
                    const positive = catEvidence.filter(e => e.impact === 'positive').length;
                    const negative = catEvidence.filter(e => e.impact === 'negative').length;
                    const Icon = cat === 'environmental' ? Leaf : cat === 'social' ? Users : Shield;
                    
                    return (
                      <div key={cat} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" style={{ color: COLORS[cat as keyof typeof COLORS] }} />
                            <span className="capitalize font-medium">{cat}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">{catEvidence.length} metrics</span>
                        </div>
                        <div className="flex gap-1 h-2">
                          <div 
                            className="rounded-l bg-green-500" 
                            style={{ width: `${(positive / catEvidence.length) * 100 || 0}%` }} 
                          />
                          <div 
                            className="bg-red-500" 
                            style={{ width: `${(negative / catEvidence.length) * 100 || 0}%` }} 
                          />
                          <div 
                            className="rounded-r bg-gray-400 flex-1" 
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Benchmark Tab */}
          <TabsContent value="benchmark" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Radar Chart */}
              <Card className="p-4">
                <h4 className="font-medium mb-4 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  vs Industry Benchmark
                </h4>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="category" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar 
                      name="Your Score" 
                      dataKey="current" 
                      stroke={COLORS.environmental} 
                      fill={COLORS.environmental} 
                      fillOpacity={0.5} 
                    />
                    <Radar 
                      name="Industry Avg" 
                      dataKey="benchmark" 
                      stroke="#94a3b8" 
                      fill="#94a3b8" 
                      fillOpacity={0.3} 
                    />
                    <Legend />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </Card>

              {/* Benchmark Comparison Table */}
              <Card className="p-4">
                <h4 className="font-medium mb-4">Score Comparison</h4>
                <div className="space-y-3">
                  {radarData.map((item) => (
                    <div key={item.category} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{item.category}</span>
                        <span className={item.current >= item.benchmark ? 'text-green-500' : 'text-red-500'}>
                          {item.current >= item.benchmark ? '+' : ''}{item.current - item.benchmark} vs benchmark
                        </span>
                      </div>
                      <div className="relative h-6 bg-muted rounded overflow-hidden">
                        <div 
                          className="absolute inset-y-0 left-0 bg-primary/20 rounded"
                          style={{ width: `${item.benchmark}%` }}
                        />
                        <div 
                          className="absolute inset-y-0 left-0 bg-primary rounded flex items-center justify-end pr-2"
                          style={{ width: `${item.current}%` }}
                        >
                          <span className="text-xs text-primary-foreground font-medium">{item.current}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Risks Tab */}
          <TabsContent value="risks" className="space-y-4">
            <Card className="p-4">
              <h4 className="font-medium mb-4 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Risk Heatmap ({risks.length} identified)
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {risks.slice(0, 8).map((risk, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-3 rounded-lg text-white"
                    style={{ backgroundColor: RISK_COLORS[risk.severity] }}
                  >
                    <div className="text-xs font-medium truncate">{risk.title}</div>
                    <div className="text-[10px] opacity-80 capitalize mt-1">{risk.category}</div>
                    <Badge 
                      variant="outline" 
                      className="mt-2 text-[10px] bg-white/20 border-white/30 text-white"
                    >
                      {risk.severity}
                    </Badge>
                  </motion.div>
                ))}
              </div>

              {/* Risk Summary */}
              <div className="mt-6 grid grid-cols-4 gap-4">
                {(['critical', 'high', 'medium', 'low'] as const).map((severity) => {
                  const count = risks.filter(r => r.severity === severity).length;
                  return (
                    <div key={severity} className="text-center">
                      <div 
                        className="text-2xl font-bold"
                        style={{ color: RISK_COLORS[severity] }}
                      >
                        {count}
                      </div>
                      <div className="text-xs text-muted-foreground capitalize">{severity}</div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-4">
            <Card className="p-4">
              <h4 className="font-medium mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Historical Performance
              </h4>
              {historicalData.length > 1 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="year" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="scores.environmental" 
                      name="Environmental"
                      stroke={COLORS.environmental} 
                      fill={COLORS.environmental}
                      fillOpacity={0.3}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="scores.social" 
                      name="Social"
                      stroke={COLORS.social} 
                      fill={COLORS.social}
                      fillOpacity={0.3}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="scores.governance" 
                      name="Governance"
                      stroke={COLORS.governance} 
                      fill={COLORS.governance}
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <TrendingUp className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="font-medium">No Historical Data</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload multiple years of reports to see trends over time
                  </p>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}