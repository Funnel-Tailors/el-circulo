import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDown, Users, MousePointerClick, FileText, TrendingUp } from "lucide-react";

interface JourneyFunnelData {
  vsl_views: number;
  quiz_starts: number;
  form_views: number;
  form_submissions: number;
}

interface JourneyFunnelChartProps {
  data: JourneyFunnelData | null;
}

const JourneyFunnelChart = ({ data }: JourneyFunnelChartProps) => {
  if (!data || data.vsl_views === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            User Journey Funnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No journey data available</p>
        </CardContent>
      </Card>
    );
  }

  const quizRate = data.vsl_views > 0 
    ? ((data.quiz_starts / data.vsl_views) * 100).toFixed(1) 
    : '0.0';
  
  const formViewRate = data.quiz_starts > 0 
    ? ((data.form_views / data.quiz_starts) * 100).toFixed(1) 
    : '0.0';
  
  const formSubmitRate = data.form_views > 0 
    ? ((data.form_submissions / data.form_views) * 100).toFixed(1) 
    : '0.0';
  
  const overallRate = data.vsl_views > 0 
    ? ((data.form_submissions / data.vsl_views) * 100).toFixed(1) 
    : '0.0';

  const stages = [
    {
      icon: Users,
      label: "VSL Views",
      value: data.vsl_views,
      percentage: "100%",
      width: 100,
      color: "bg-primary/20 border-primary/40"
    },
    {
      icon: MousePointerClick,
      label: "Quiz Started",
      value: data.quiz_starts,
      percentage: `${quizRate}%`,
      width: Math.max(parseFloat(quizRate), 10),
      color: "bg-blue-500/20 border-blue-500/40",
      dropOff: data.vsl_views - data.quiz_starts
    },
    {
      icon: FileText,
      label: "Form Viewed",
      value: data.form_views,
      percentage: `${formViewRate}%`,
      width: Math.max((parseFloat(quizRate) * parseFloat(formViewRate)) / 100, 10),
      color: "bg-green-500/20 border-green-500/40",
      dropOff: data.quiz_starts - data.form_views
    },
    {
      icon: TrendingUp,
      label: "Form Submitted",
      value: data.form_submissions,
      percentage: `${formSubmitRate}%`,
      width: Math.max((parseFloat(quizRate) * parseFloat(formViewRate) * parseFloat(formSubmitRate)) / 10000, 10),
      color: "bg-emerald-500/20 border-emerald-500/40",
      dropOff: data.form_views - data.form_submissions
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          User Journey Funnel
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Complete user journey tracked by user_journey_id
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{stage.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{stage.value.toLocaleString()}</span>
                  <span className={`text-xs ${parseFloat(stage.percentage) > 20 ? 'text-green-500' : parseFloat(stage.percentage) > 10 ? 'text-yellow-500' : 'text-red-500'}`}>
                    {stage.percentage}
                  </span>
                </div>
              </div>
              
              <div className="relative">
                <div 
                  className={`h-12 border-2 rounded-lg ${stage.color} transition-all duration-500 flex items-center justify-center`}
                  style={{ width: `${stage.width}%` }}
                >
                  <span className="text-xs font-medium">{stage.percentage}</span>
                </div>
              </div>

              {stage.dropOff !== undefined && stage.dropOff > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground ml-2">
                  <ArrowDown className="h-3 w-3 text-red-500" />
                  <span>Drop-off: {stage.dropOff.toLocaleString()} users</span>
                </div>
              )}

              {index < stages.length - 1 && (
                <div className="flex justify-center py-2">
                  <ArrowDown className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
          );
        })}

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Conversion</span>
            <span className={`text-lg font-bold ${parseFloat(overallRate) > 2 ? 'text-green-500' : parseFloat(overallRate) > 1 ? 'text-yellow-500' : 'text-red-500'}`}>
              {overallRate}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            VSL View → Form Submission
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default JourneyFunnelChart;
