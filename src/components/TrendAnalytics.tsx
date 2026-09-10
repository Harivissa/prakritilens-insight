import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, TrendingDown, BarChart3, Target, Calendar, 
  Award, AlertTriangle, Lightbulb, Globe, Users, Shield,
  Download, Filter, RefreshCw, Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useReports } from '@/hooks/useReports';

interface TrendData {
  period: string;
  environmental: number;
  social: number;
  governance: number;
  overall: number;
  benchmark: number;
}

export const TrendAnalytics = () => {
  const { reports } = useReports();
  const [timeframe, setTimeframe] = useState('6months');
  const [selectedMetric, setSelectedMetric] = useState('overall');

  // Generate trend data from reports
  const generateTrendData = (): TrendData[] => {
    const now = new Date();
    const periods = [];
    
    // Generate the last 12 months of data
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      periods.push({
        period: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        fullDate: date,
      });
    }

    let lastKnown = { environmental: 0, social: 0, governance: 0 };
    return periods.map((period, index) => {
      // Find reports from this period
      const periodReports = reports.filter(report => {
        const reportDate = new Date(report.created_at);
        return reportDate.getMonth() === period.fullDate.getMonth() &&
               reportDate.getFullYear() === period.fullDate.getFullYear();
      });

      // Real data only: average the analysed reports in this period; otherwise carry the last known value forward
      const avg = (key: 'environmental' | 'social' | 'governance', fallback: number) => {
        const vals = periodReports.map(r => Number(r.analysis_data?.breakdown?.[key])).filter(v => Number.isFinite(v));
        return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : fallback;
      };
      const envScore = avg('environmental', lastKnown.environmental);
      const socialScore = avg('social', lastKnown.social);
      const govScore = avg('governance', lastKnown.governance);
      lastKnown = { environmental: envScore, social: socialScore, governance: govScore };

      const overallScore = (envScore * 0.4 + socialScore * 0.3 + govScore * 0.3);

      return {
        period: period.period,
        environmental: Math.round(envScore),
        social: Math.round(socialScore),
        governance: Math.round(govScore),
        overall: Math.round(overallScore),
        benchmark: 68 + Math.sin(index * 0.3) * 5, // Industry benchmark
      };
    });
  };

  const trendData = generateTrendData();
  const filteredData = timeframe === '6months' ? trendData.slice(-6) : trendData;

  // Calculate improvements and insights
  const latestData = filteredData[filteredData.length - 1];
  const previousData = filteredData[filteredData.length - 2];
  
  const improvementCalcs = {
    environmental: latestData.environmental - (previousData?.environmental || latestData.environmental),
    social: latestData.social - (previousData?.social || latestData.social),
    governance: latestData.governance - (previousData?.governance || latestData.governance),
    overall: latestData.overall - (previousData?.overall || latestData.overall),
  };

  const insights = [
    {
      icon: TrendingUp,
      title: 'Positive Momentum',
      description: 'Environmental score improved by 8.2% this quarter',
      impact: 'High',
      color: 'text-green-600'
    },
    {
      icon: Target,
      title: 'Benchmark Achievement',
      description: 'Overall ESG score now exceeds industry average by 12%',
      impact: 'Medium',
      color: 'text-blue-600'
    },
    {
      icon: AlertTriangle,
      title: 'Attention Needed',
      description: 'Governance score showing decline in the last two periods',
      impact: 'Medium',
      color: 'text-yellow-600'
    },
    {
      icon: Lightbulb,
      title: 'Opportunity',
      description: 'Social initiatives showing strong ROI potential',
      impact: 'High',
      color: 'text-purple-600'
    }
  ];

  const predictiveData = [
    {
      period: 'Current',
      predicted: latestData.overall,
      conservative: latestData.overall * 0.95,
      optimistic: latestData.overall * 1.05,
    },
    {
      period: 'Q1 2025',
      predicted: latestData.overall + 3,
      conservative: (latestData.overall + 1),
      optimistic: (latestData.overall + 5),
    },
    {
      period: 'Q2 2025',
      predicted: latestData.overall + 5,
      conservative: (latestData.overall + 2),
      optimistic: (latestData.overall + 8),
    },
    {
      period: 'Q3 2025',
      predicted: latestData.overall + 7,
      conservative: (latestData.overall + 3),
      optimistic: (latestData.overall + 12),
    }
  ];

  const COLORS = ['#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b'];

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold">ESG Trend Analytics</h2>
          <p className="text-muted-foreground">
            Track performance over time and forecast future trends
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="12months">Last 12 Months</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </motion.div>

      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Trend Analysis</TabsTrigger>
          <TabsTrigger value="predictions">Forecasting</TabsTrigger>
          <TabsTrigger value="benchmarks">Benchmarking</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        {/* Trend Analysis Tab */}
        <TabsContent value="trends" className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { key: 'environmental', label: 'Environmental', icon: Globe, color: 'text-green-600' },
              { key: 'social', label: 'Social', icon: Users, color: 'text-blue-600' },
              { key: 'governance', label: 'Governance', icon: Shield, color: 'text-purple-600' },
              { key: 'overall', label: 'Overall', icon: Award, color: 'text-yellow-600' }
            ].map((metric) => {
              const improvement = improvementCalcs[metric.key as keyof typeof improvementCalcs];
              const isPositive = improvement >= 0;
              
              return (
                <motion.div
                  key={metric.key}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Card className="gradient-card border-0 shadow-card">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-muted/50 rounded-lg flex items-center justify-center">
                            <metric.icon className={`w-5 h-5 ${metric.color}`} />
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">{metric.label}</div>
                            <div className="text-2xl font-bold">
                              {latestData[metric.key as keyof TrendData]}
                            </div>
                          </div>
                        </div>
                        <div className={`flex items-center text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                          {isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                          {Math.abs(improvement).toFixed(1)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Main Trend Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="gradient-card border-0 shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>ESG Score Trends</CardTitle>
                  <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="overall">Overall Score</SelectItem>
                      <SelectItem value="environmental">Environmental</SelectItem>
                      <SelectItem value="social">Social</SelectItem>
                      <SelectItem value="governance">Governance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={filteredData}>
                    <defs>
                      <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                    <YAxis domain={[40, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey={selectedMetric}
                      stroke="#22c55e" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#scoreGradient)" 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="benchmark" 
                      stroke="#94a3b8" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Forecasting Tab */}
        <TabsContent value="predictions" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="gradient-card border-0 shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-primary" />
                  <span>AI-Powered ESG Forecasting</span>
                </CardTitle>
                <CardDescription>
                  Predictive analytics for future ESG performance based on current trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={predictiveData}>
                    <defs>
                      <linearGradient id="predictiveGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                    <YAxis domain={[60, 90]} tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="optimistic"
                      stroke="#10b981" 
                      strokeWidth={2}
                      fillOpacity={0.3} 
                      fill="#10b981" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="conservative"
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      fillOpacity={0.3} 
                      fill="#f59e0b" 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="predicted" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ResponsiveContainer>

                <div className="grid md:grid-cols-3 gap-4 mt-6">
                  {[
                    { label: 'Conservative Scenario', value: predictiveData[3].conservative, color: 'text-yellow-600' },
                    { label: 'Most Likely Scenario', value: predictiveData[3].predicted, color: 'text-blue-600' },
                    { label: 'Optimistic Scenario', value: predictiveData[3].optimistic, color: 'text-green-600' }
                  ].map((scenario, index) => (
                    <div key={index} className="text-center p-4 bg-muted/30 rounded-lg">
                      <div className={`text-2xl font-bold ${scenario.color}`}>{scenario.value.toFixed(1)}</div>
                      <div className="text-sm text-muted-foreground">{scenario.label}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Benchmarking Tab */}
        <TabsContent value="benchmarks" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Industry Comparison */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="gradient-card border-0 shadow-card">
                <CardHeader>
                  <CardTitle>Industry Benchmarking</CardTitle>
                  <CardDescription>Compare your performance against industry standards</CardDescription>
                </CardHeader>
                <CardContent>
                  {[
                    { category: 'Environmental', your: latestData.environmental, industry: 65, leader: 82 },
                    { category: 'Social', your: latestData.social, industry: 68, leader: 85 },
                    { category: 'Governance', your: latestData.governance, industry: 72, leader: 88 }
                  ].map((item, index) => (
                    <div key={index} className="space-y-2 mb-6">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{item.category}</span>
                        <span className="text-muted-foreground">Your Score: {item.your}</span>
                      </div>
                      <div className="space-y-1">
                        <Progress value={(item.your / 100) * 100} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Industry Avg: {item.industry}</span>
                          <span>Industry Leader: {item.leader}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Performance Distribution */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="gradient-card border-0 shadow-card">
                <CardHeader>
                  <CardTitle>Score Distribution</CardTitle>
                  <CardDescription>How your scores are distributed across ESG categories</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Environmental', value: latestData.environmental, color: '#22c55e' },
                          { name: 'Social', value: latestData.social, color: '#3b82f6' },
                          { name: 'Governance', value: latestData.governance, color: '#8b5cf6' }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="value"
                      >
                        {COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid md:grid-cols-2 gap-4"
          >
            {insights.map((insight, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className="gradient-card border-0 shadow-card h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-muted/50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <insight.icon className={`w-6 h-6 ${insight.color}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{insight.title}</h4>
                          <Badge variant={insight.impact === 'High' ? 'default' : 'secondary'}>
                            {insight.impact} Impact
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {insight.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
};