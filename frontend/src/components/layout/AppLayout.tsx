import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

export default function AppLayout() {
  return (
    <div className="flex flex-col min-h-dvh">
      <main className="flex-1 bottom-safe">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
