import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Newspaper, ExternalLink, Clock, TrendingUp, Globe, 
  Leaf, Users, Shield, Factory, Lightbulb, Target
} from 'lucide-react';
import { motion } from 'framer-motion';

interface NewsItem {
  id: string;
  title: string;
  description: string;
  category: 'Environmental' | 'Social' | 'Governance' | 'Regulation' | 'Innovation';
  source: string;
  publishedAt: string;
  url: string;
  trending?: boolean;
}

export const ESGNewsFeed = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock news data - in production, this would come from an API
  const mockNews: NewsItem[] = [
    {
      id: '1',
      title: 'EU Corporate Sustainability Reporting Directive (CSRD) Takes Effect',
      description: 'New mandatory ESG reporting requirements for European companies now in force, affecting over 50,000 organizations.',
      category: 'Regulation',
      source: 'ESG Today',
      publishedAt: '2024-01-08T10:00:00Z',
      url: '#',
      trending: true
    },
    {
      id: '2',
      title: 'AI-Powered Carbon Footprint Tracking Sees 300% Adoption Increase',
      description: 'Companies are increasingly leveraging artificial intelligence to monitor and reduce their environmental impact.',
      category: 'Innovation',
      source: 'Sustainability Weekly',
      publishedAt: '2024-01-07T14:30:00Z',
      url: '#',
      trending: true
    },
    {
      id: '3',
      title: 'Global Supply Chain Transparency Initiative Launched',
      description: 'Major corporations commit to blockchain-based supply chain tracking to improve social and environmental standards.',
      category: 'Social',
      source: 'Corporate Responsibility Magazine',
      publishedAt: '2024-01-06T09:15:00Z',
      url: '#'
    },
    {
      id: '4',
      title: 'SEC Proposes Enhanced Climate Risk Disclosure Rules',
      description: 'U.S. Securities and Exchange Commission unveils new requirements for climate-related financial disclosures.',
      category: 'Governance',
      source: 'Financial Times',
      publishedAt: '2024-01-05T16:45:00Z',
      url: '#'
    },
    {
      id: '5',
      title: 'Renewable Energy Investment Hits Record High in 2024',
      description: 'Corporate renewable energy procurement reaches $50 billion globally, signaling strong commitment to clean energy.',
      category: 'Environmental',
      source: 'Bloomberg Green',
      publishedAt: '2024-01-04T11:20:00Z',
      url: '#'
    },
    {
      id: '6',
      title: 'Diversity & Inclusion: 75% of Fortune 500 Set New Targets',
      description: 'Major companies establish measurable goals for workplace diversity and inclusive leadership development.',
      category: 'Social',
      source: 'Harvard Business Review',
      publishedAt: '2024-01-03T13:00:00Z',
      url: '#'
    },
    {
      id: '7',
      title: 'Green Bonds Market Surpasses $1 Trillion Milestone',
      description: 'Sustainable finance instruments continue to gain traction as organizations seek climate-aligned funding.',
      category: 'Environmental',
      source: 'Reuters',
      publishedAt: '2024-01-02T08:30:00Z',
      url: '#'
    },
    {
      id: '8',
      title: 'Board Diversity Regulations Expand to Mid-Cap Companies',
      description: 'New governance requirements extend beyond large corporations to include medium-sized enterprises.',
      category: 'Governance',
      source: 'Governance Today',
      publishedAt: '2024-01-01T12:00:00Z',
      url: '#'
    }
  ];

  useEffect(() => {
    // Simulate API call
    const fetchNews = async () => {
      setLoading(true);
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setNews(mockNews);
      setLoading(false);
    };

    fetchNews();
  }, []);

  const getCategoryIcon = (category: NewsItem['category']) => {
    switch (category) {
      case 'Environmental': return Leaf;
      case 'Social': return Users;
      case 'Governance': return Shield;
      case 'Regulation': return Target;
      case 'Innovation': return Lightbulb;
      default: return Newspaper;
    }
  };

  const getCategoryColor = (category: NewsItem['category']) => {
    switch (category) {
      case 'Environmental': return 'bg-green-100 text-green-800 border-green-200';
      case 'Social': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Governance': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Regulation': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Innovation': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  const trendingNews = news.filter(item => item.trending);
  const regularNews = news.filter(item => !item.trending);

  return (
    <Card className="gradient-card border-0 shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="flex items-center space-x-2">
                <span>ESG News & Insights</span>
                <Badge variant="secondary" className="text-xs">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Live Feed
                </Badge>
              </CardTitle>
              <CardDescription>
                Latest updates on sustainability, governance, and ESG trends
              </CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm">
            <ExternalLink className="w-4 h-4 mr-2" />
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex space-x-4">
                  <div className="w-12 h-12 bg-muted rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                    <div className="h-3 bg-muted rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ScrollArea className="h-[600px]">
            <div className="space-y-6">
              {/* Trending News */}
              {trendingNews.length > 0 && (
                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <h4 className="font-semibold text-sm text-primary">Trending Now</h4>
                  </div>
                  <div className="space-y-4">
                    {trendingNews.map((item, index) => {
                      const CategoryIcon = getCategoryIcon(item.category);
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className="flex space-x-4 p-4 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg border border-primary/20 hover:shadow-md transition-smooth cursor-pointer"
                        >
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <CategoryIcon className="w-6 h-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge 
                                variant="outline" 
                                className={`text-xs border ${getCategoryColor(item.category)}`}
                              >
                                {item.category}
                              </Badge>
                              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {formatTimeAgo(item.publishedAt)}
                              </div>
                            </div>
                            <h5 className="font-semibold text-sm mb-2 line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                              {item.title}
                            </h5>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {item.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground font-medium">
                                {item.source}
                              </span>
                              <Button variant="ghost" size="sm" className="text-xs h-6 px-2">
                                Read More
                                <ExternalLink className="w-3 h-3 ml-1" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Regular News */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Newspaper className="w-4 h-4 text-muted-foreground" />
                  <h4 className="font-semibold text-sm text-muted-foreground">Recent Updates</h4>
                </div>
                <div className="space-y-3">
                  {regularNews.map((item, index) => {
                    const CategoryIcon = getCategoryIcon(item.category);
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="flex space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-smooth cursor-pointer group"
                      >
                        <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                          <CategoryIcon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge 
                              variant="outline" 
                              className={`text-xs border ${getCategoryColor(item.category)}`}
                            >
                              {item.category}
                            </Badge>
                            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {formatTimeAgo(item.publishedAt)}
                            </div>
                          </div>
                          <h6 className="font-medium text-sm mb-1 line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                            {item.title}
                          </h6>
                          <p className="text-xs text-muted-foreground line-clamp-1 mb-1">
                            {item.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {item.source}
                            </span>
                            <Button variant="ghost" size="sm" className="text-xs h-5 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};