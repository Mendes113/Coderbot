import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LearningAnalyticsDashboard } from "@/components/analytics/LearningAnalyticsDashboard";
import { LearningMetrics as LearningMetricsComponent } from "@/components/metrics/LearningMetrics";

const LearningMetrics = () => {
  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Learning Metrics</h1>
          <p className="text-muted-foreground">
            Comprehensive analytics and performance insights
          </p>
        </div>

        <Tabs defaultValue="analytics" className="space-y-4">
          <TabsList>
            <TabsTrigger value="analytics">AI Analytics</TabsTrigger>
            <TabsTrigger value="basic">Basic Metrics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="analytics">
            <LearningAnalyticsDashboard />
          </TabsContent>
          
          <TabsContent value="basic">
            <LearningMetricsComponent />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LearningMetrics;
