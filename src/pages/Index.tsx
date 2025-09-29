import { useAuth } from '@/hooks/useAuth';
import { ModernLandingPage } from '@/components/ModernLandingPage';
import { ModernDashboard } from '@/components/ModernDashboard';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return user ? <ModernDashboard /> : <ModernLandingPage />;
};

export default Index;
