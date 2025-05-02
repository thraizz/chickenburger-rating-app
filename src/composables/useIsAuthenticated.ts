import { computed } from 'vue';
import { useCurrentUser } from 'vuefire';

export function useIsAuthenticated() {
  const currentUser = useCurrentUser();
  return computed(() => !!currentUser.value);
}
