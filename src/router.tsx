import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  // Si la base de datos no responde, no reintentar 3 veces con espera (≈7 s de «Cargando…»): 1 reintento y listo.
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, retryDelay: 800, refetchOnWindowFocus: false } } });
  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });
  return router;
};
