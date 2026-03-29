import { useEffect } from 'react';
import { useRouter } from 'next/router';

// Questo route viene mantenuto per retrocompatibilità: reindirizza alla pagina Settings
export default function DelegatesRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/settings');
  }, [router]);

  return null;
}
