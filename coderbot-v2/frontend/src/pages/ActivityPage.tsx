import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ActivityPlayer } from '@/components/activities/ActivityPlayer';
import { ActivityAttemptRecord } from '@/integrations/pocketbase/client';

const ActivityPage = () => {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();

  if (!activityId) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-destructive">ID da atividade não fornecido</p>
      </div>
    );
  }

  const handleComplete = (attempt: ActivityAttemptRecord) => {
    console.log('Atividade concluída:', attempt);
    // Optionally redirect or show success message
    // Could navigate back to class forum after a delay
    setTimeout(() => {
      // navigate(-1); // Go back to previous page
    }, 3000);
  };

  const handleError = (error: Error) => {
    console.error('Erro na atividade:', error);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto py-8 px-4 max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>

        {/* Activity Player */}
        <ActivityPlayer
          activityId={activityId}
          onComplete={handleComplete}
          onError={handleError}
        />
      </div>
    </div>
  );
};

export default ActivityPage;
