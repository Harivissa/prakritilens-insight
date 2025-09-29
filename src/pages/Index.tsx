import { useAuth } from '@/hooks/useAuth';
import { ProfessionalLanding } from '@/components/ProfessionalLanding';
import { ProfessionalDashboard } from '@/components/ProfessionalDashboard';
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

  return user ? <ProfessionalDashboard /> : <ProfessionalLanding />;
};

export default Index;
