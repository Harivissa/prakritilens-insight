import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Leaf, Users, Building } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ESGScores {
  environmental: number;
  social: number;
  governance: number;
}

interface ESGScoreCardProps {
  scores: ESGScores;
  compact?: boolean;
  className?: string;
}

export function ESGScoreCard({ scores, compact = false, className }: ESGScoreCardProps) {
  const overallScore = ((scores.environmental + scores.social + scores.governance) / 3);
  const starRating = Math.round(overallScore / 2);

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-3 h-3 rounded-full",
                i < starRating ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
        <span className="text-sm font-semibold">{overallScore.toFixed(1)}</span>
      </div>
    );
  }

  return (
    <Card className={cn("gradient-card", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>ESG Score</span>
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-4 h-4 rounded-full",
                  i < starRating ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-4xl font-bold gradient-primary bg-clip-text text-transparent">
            {overallScore.toFixed(1)}
          </div>
          <p className="text-sm text-muted-foreground">Overall ESG Score</p>
        </div>

        <div className="space-y-3">
          <ScoreItem
            icon={Leaf}
            label="Environmental"
            score={scores.environmental}
            color="text-success"
          />
          <ScoreItem
            icon={Users}
            label="Social"
            score={scores.social}
            color="text-primary"
          />
          <ScoreItem
            icon={Building}
            label="Governance"
            score={scores.governance}
            color="text-accent"
          />
        </div>

        <div className="pt-4 border-t">
          <Badge 
            variant={overallScore >= 8 ? "default" : overallScore >= 6 ? "secondary" : "destructive"}
            className="w-full justify-center py-2"
          >
            {overallScore >= 8 ? "Excellent" : overallScore >= 6 ? "Good" : "Needs Improvement"} Performance
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function ScoreItem({ 
  icon: Icon, 
  label, 
  score, 
  color 
}: { 
  icon: any; 
  label: string; 
  score: number; 
  color: string; 
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className={cn("h-4 w-4", color)} />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className={cn("h-full transition-all duration-500", color.replace('text-', 'bg-'))}
            style={{ width: `${(score / 10) * 100}%` }}
          />
        </div>
        <span className="text-sm font-semibold w-8 text-right">{score.toFixed(1)}</span>
      </div>
    </div>
  );
}