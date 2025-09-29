import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Settings, RotateCcw, Save, Globe, Users, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/hooks/use-toast';

interface ESGWeights {
  environmental: number;
  social: number;
  governance: number;
}

interface ESGWeightsCustomizerProps {
  weights: ESGWeights;
  onWeightsChange: (weights: ESGWeights) => void;
}

export const ESGWeightsCustomizer = ({ weights, onWeightsChange }: ESGWeightsCustomizerProps) => {
  const [localWeights, setLocalWeights] = useState<ESGWeights>(weights);
  const [hasChanges, setHasChanges] = useState(false);

  const handleWeightChange = (category: keyof ESGWeights, value: number[]) => {
    const newWeight = value[0];
    const otherCategories = Object.keys(localWeights).filter(k => k !== category) as (keyof ESGWeights)[];
    
    // Redistribute remaining weight proportionally
    const remainingWeight = 100 - newWeight;
    const currentOtherTotal = otherCategories.reduce((sum, cat) => sum + localWeights[cat], 0);
    
    const newWeights = { ...localWeights };
    newWeights[category] = newWeight;
    
    if (currentOtherTotal > 0) {
      otherCategories.forEach(cat => {
        newWeights[cat] = Math.round((localWeights[cat] / currentOtherTotal) * remainingWeight);
      });
    } else {
      // Equal distribution if other weights are zero
      const equalWeight = Math.round(remainingWeight / otherCategories.length);
      otherCategories.forEach(cat => {
        newWeights[cat] = equalWeight;
      });
    }
    
    // Ensure total is exactly 100
    const total = Object.values(newWeights).reduce((sum, w) => sum + w, 0);
    if (total !== 100) {
      const diff = 100 - total;
      newWeights[otherCategories[0]] += diff;
    }
    
    setLocalWeights(newWeights);
    setHasChanges(true);
  };

  const handleSave = () => {
    onWeightsChange(localWeights);
    setHasChanges(false);
    toast({
      title: "ESG Weights Updated",
      description: "Your custom ESG scoring weights have been saved.",
    });
  };

  const handleReset = () => {
    const defaultWeights = { environmental: 40, social: 35, governance: 25 };
    setLocalWeights(defaultWeights);
    setHasChanges(true);
    toast({
      title: "Weights Reset",
      description: "ESG weights have been reset to default values.",
    });
  };

  const presets = [
    {
      name: "Climate Focused",
      description: "Emphasis on environmental impact",
      weights: { environmental: 60, social: 25, governance: 15 }
    },
    {
      name: "Social Impact",
      description: "Focus on social responsibility",
      weights: { environmental: 25, social: 60, governance: 15 }
    },
    {
      name: "Governance Priority",
      description: "Strong governance emphasis",
      weights: { environmental: 20, social: 25, governance: 55 }
    },
    {
      name: "Balanced",
      description: "Equal weight distribution",
      weights: { environmental: 33, social: 33, governance: 34 }
    }
  ];

  const categories = [
    {
      key: 'environmental' as keyof ESGWeights,
      name: 'Environmental',
      icon: Globe,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
      description: 'Climate impact, resource use, pollution'
    },
    {
      key: 'social' as keyof ESGWeights,
      name: 'Social',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      description: 'Employee relations, community impact, diversity'
    },
    {
      key: 'governance' as keyof ESGWeights,
      name: 'Governance',
      icon: Shield,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20',
      description: 'Board oversight, transparency, compliance'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <Card className="gradient-card border-0 shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle>ESG Scoring Weights</CardTitle>
                <CardDescription>
                  Customize how PrakritiLens calculates ESG scores for your analysis
                </CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="text-sm">
              Total: {Object.values(localWeights).reduce((sum, w) => sum + w, 0)}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Weight Sliders */}
          <div className="space-y-6">
            {categories.map((category) => (
              <motion.div
                key={category.key}
                className="space-y-4"
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 ${category.bgColor} rounded-lg flex items-center justify-center`}>
                      <category.icon className={`w-5 h-5 ${category.color}`} />
                    </div>
                    <div>
                      <div className="font-semibold">{category.name}</div>
                      <div className="text-sm text-muted-foreground">{category.description}</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="font-mono text-lg min-w-[4rem]">
                    {localWeights[category.key]}%
                  </Badge>
                </div>
                <Slider
                  value={[localWeights[category.key]]}
                  onValueChange={(value) => handleWeightChange(category.key, value)}
                  max={80}
                  min={5}
                  step={5}
                  className="w-full"
                />
              </motion.div>
            ))}
          </div>

          <Separator />

          {/* Preset Options */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Quick Presets</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {presets.map((preset, index) => (
                <motion.button
                  key={index}
                  onClick={() => {
                    setLocalWeights(preset.weights);
                    setHasChanges(true);
                  }}
                  className="p-4 text-left bg-gradient-to-br from-muted/50 to-muted rounded-lg border border-border hover:border-primary/30 hover:shadow-md transition-all duration-200 group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="font-medium text-sm mb-1">{preset.name}</div>
                  <div className="text-xs text-muted-foreground mb-2">{preset.description}</div>
                  <div className="flex space-x-1 text-xs">
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded">
                      E: {preset.weights.environmental}%
                    </span>
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded">
                      S: {preset.weights.social}%
                    </span>
                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded">
                      G: {preset.weights.governance}%
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Default
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!hasChanges}
              className="shadow-elegant"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};