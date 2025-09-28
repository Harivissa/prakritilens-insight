import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Search, Filter, X } from 'lucide-react';

interface FilterState {
  search: string;
  industry: string;
  riskLevel: string;
  esgScore: number[];
  reportDate: string;
}

export function SearchFilters() {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    industry: '',
    riskLevel: '',
    esgScore: [0],
    reportDate: ''
  });

  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    
    // Add to active filters if not already present
    if (value && !activeFilters.includes(key)) {
      setActiveFilters(prev => [...prev, key]);
    } else if (!value) {
      setActiveFilters(prev => prev.filter(f => f !== key));
    }
  };

  const clearFilter = (key: string) => {
    const defaultValues: { [key: string]: any } = {
      search: '',
      industry: '',
      riskLevel: '',
      esgScore: [0],
      reportDate: ''
    };
    
    setFilters(prev => ({ ...prev, [key]: defaultValues[key] }));
    setActiveFilters(prev => prev.filter(f => f !== key));
  };

  const clearAllFilters = () => {
    setFilters({
      search: '',
      industry: '',
      riskLevel: '',
      esgScore: [0],
      reportDate: ''
    });
    setActiveFilters([]);
  };

  const getFilterLabel = (key: string, value: any) => {
    switch (key) {
      case 'search':
        return `Search: "${value}"`;
      case 'industry':
        return `Industry: ${value}`;
      case 'riskLevel':
        return `Risk: ${value}`;
      case 'esgScore':
        return `ESG Score: ${value[0]}+`;
      case 'reportDate':
        return `Period: ${value}`;
      default:
        return '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Search & Filter Companies
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by company name, sector, or keywords..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Industry</label>
            <Select value={filters.industry} onValueChange={(value) => handleFilterChange('industry', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Industries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Industries</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="automotive">Automotive</SelectItem>
                <SelectItem value="energy">Energy</SelectItem>
                <SelectItem value="financial">Financial Services</SelectItem>
                <SelectItem value="healthcare">Healthcare</SelectItem>
                <SelectItem value="consumer">Consumer Goods</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Risk Level</label>
            <Select value={filters.riskLevel} onValueChange={(value) => handleFilterChange('riskLevel', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Risk Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Risk Levels</SelectItem>
                <SelectItem value="low">Low Risk</SelectItem>
                <SelectItem value="medium">Medium Risk</SelectItem>
                <SelectItem value="high">High Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Report Period</label>
            <Select value={filters.reportDate} onValueChange={(value) => handleFilterChange('reportDate', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Periods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Periods</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
                <SelectItem value="last-quarter">Last Quarter</SelectItem>
                <SelectItem value="last-year">Last Year</SelectItem>
                <SelectItem value="last-2-years">Last 2 Years</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Min ESG Score: {filters.esgScore[0]}</label>
            <Slider
              value={filters.esgScore}
              onValueChange={(value) => handleFilterChange('esgScore', value)}
              max={10}
              min={0}
              step={0.5}
              className="pt-2"
            />
          </div>
        </div>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Active Filters:</h4>
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                Clear All
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeFilters.map((filterKey) => {
                const value = filters[filterKey as keyof FilterState];
                if (!value || (Array.isArray(value) && value[0] === 0)) return null;
                
                return (
                  <Badge key={filterKey} variant="secondary" className="gap-1">
                    {getFilterLabel(filterKey, value)}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 hover:bg-transparent"
                      onClick={() => clearFilter(filterKey)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Filters */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Quick Filters:</h4>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => handleFilterChange('esgScore', [8])}>
              Top ESG Performers (8.0+)
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleFilterChange('riskLevel', 'high')}>
              High Risk Companies
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleFilterChange('industry', 'technology')}>
              Technology Sector
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleFilterChange('reportDate', 'last-quarter')}>
              Recent Reports
            </Button>
          </div>
        </div>

        {/* Search Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button variant="premium" className="flex-1">
            Apply Filters
          </Button>
          <Button variant="outline">
            Export Results
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}