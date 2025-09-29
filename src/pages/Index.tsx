import { useAuth } from '@/hooks/useAuth';
import { LandingPage } from '@/components/LandingPage';
import ProfessionalESGPlatform from '@/components/ProfessionalESGPlatform';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return user ? <ProfessionalESGPlatform /> : <LandingPage />;
};

export default Index;
