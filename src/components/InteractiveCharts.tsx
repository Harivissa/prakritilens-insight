import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, BarChart3, PieChart as PieChartIcon, Activity, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

interface ChartData {
  name: string;
  environmental: number;
  social: number;
  governance: number;
  overall: number;
}

interface InteractiveChartsProps {
  data?: ChartData[];
  companyName?: string;
  score?: number;
}

export const InteractiveCharts = ({ 
  data = [], 
  companyName = "Your Company", 
  score = 75 
}: InteractiveChartsProps) => {
  // Generate sample data if none provided
  const chartData = data.length > 0 ? data : [
    { name: 'Environmental', environmental: score + 5, social: score - 3, governance: score + 2, overall: score },
    { name: 'Social', environmental: score - 2, social: score + 8, governance: score - 1, overall: score },
    { name: 'Governance', environmental: score + 1, social: score - 5, governance: score + 7, overall: score },
    { name: 'Industry Avg', environmental: 65, social: 68, governance: 72, overall: 68 }
  ];

  const pieData = [
    { name: 'Environmental', value: score + 5, color: '#22c55e' },
    { name: 'Social', value: score + 8, color: '#3b82f6' },
    { name: 'Governance', value: score + 7, color: '#8b5cf6' }
  ];

  const trendData = [
    { month: 'Jan', score: score - 15 },
    { month: 'Feb', score: score - 12 },
    { month: 'Mar', score: score - 8 },
    { month: 'Apr', score: score - 5 },
    { month: 'May', score: score - 2 },
    { month: 'Jun', score: score }
  ];

  const benchmarkData = [
    { category: 'Carbon Footprint', yourCompany: score + 3, industryAvg: 65, topPerformer: 85 },
    { category: 'Employee Satisfaction', yourCompany: score + 8, industryAvg: 68, topPerformer: 90 },
    { category: 'Board Diversity', yourCompany: score + 5, industryAvg: 62, topPerformer: 88 },
    { category: 'Waste Management', yourCompany: score - 2, industryAvg: 70, topPerformer: 92 },
    { category: 'Community Impact', yourCompany: score + 6, industryAvg: 64, topPerformer: 87 }
  ];

  const COLORS = ['#22c55e', '#3b82f6', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* ESG Score Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="gradient-card border-0 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <span>ESG Performance Analysis</span>
            </CardTitle>
            <CardDescription>
              Detailed breakdown of {companyName}'s ESG performance vs industry benchmarks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="environmental" fill="#22c55e" name="Environmental" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="social" fill="#3b82f6" name="Social" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="governance" fill="#8b5cf6" name="Governance" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="gradient-card border-0 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PieChartIcon className="w-5 h-5 text-primary" />
                <span>ESG Distribution</span>
              </CardTitle>
              <CardDescription>
                Score distribution across ESG categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Trend Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="gradient-card border-0 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-primary" />
                <span>Performance Trend</span>
                <Badge variant="secondary" className="ml-auto">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +{(score - (score - 15)).toFixed(1)}
                </Badge>
              </CardTitle>
              <CardDescription>
                ESG score improvement over the last 6 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[score - 20, score + 5]} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="score" 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary))"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Benchmark Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="gradient-card border-0 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="w-5 h-5 text-primary" />
              <span>Industry Benchmark Comparison</span>
            </CardTitle>
            <CardDescription>
              How {companyName} compares to industry averages and top performers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={benchmarkData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis type="category" dataKey="category" width={120} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="yourCompany" fill="hsl(var(--primary))" name="Your Company" />
                  <Bar dataKey="industryAvg" fill="hsl(var(--muted-foreground))" name="Industry Average" />
                  <Bar dataKey="topPerformer" fill="hsl(var(--accent))" name="Top Performer" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};