import { useAuth } from '#imports';
import { useToast } from '@/components/ui/toast/use-toast';

let interval: ReturnType<typeof setInterval> | null = null;

export function useRemoteSessionCheck() {
  const { data, signOut, status }: any = useAuth();
  const { toast } = useToast();

  // Limpa o intervalo anterior ao iniciar
  if (interval) clearInterval(interval);

  // Só ativa polling se estiver autenticado e tiver id
  if (status.value === 'authenticated' && data.value?.user?.id) {
    interval = setInterval(
      async () => {
        try {
          const res: any = await $fetch(`/api/auth/accounts?id=${data?.value?.user?.id}`);
          if (!res.isLoggedIn) {
            toast({
              title: 'Sessão encerrada',
              description: 'Sua sessão foi encerrada remotamente.',
              variant: 'destructive',
            });
            await signOut();
          }
        } catch (err) {
          // Apenas loga, não mostra toast para erros de rede
          console.error('Erro ao checar sessão remota', err);
        }
      },
      5 * 60 * 1000,
    ); // 5 minutos
  }
}
