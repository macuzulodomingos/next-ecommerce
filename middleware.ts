import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// 🔓 Define as rotas públicas
const isPublicRoute = createRouteMatcher([
  "/", // home pública
  "/sign-in(.*)", // página de login pública
  "/sign-up(.*)", // página de cadastro pública
]);

// 🚀 Cria o middleware
export default clerkMiddleware((auth, req) => {
  // Se a rota não for pública → protege
  if (!isPublicRoute(req)) {
    auth().protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
