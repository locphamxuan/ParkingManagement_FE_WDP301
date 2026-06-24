import { AppRouter } from '@/routes/AppRouter';
import { ToastContainer } from '@/components/common/ToastNotification';

export default function App() {
  return (
    <>
      <AppRouter />
      <ToastContainer />
    </>
  );
}
