import { HashRouter as Router } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AuthProvider } from "./context/authContext";
import UserRoutes from "./Routes/UserRoutes";
import PublicRoutes from "./Routes/PublicRoutes";
function App() {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools />
      <Router>
        <AuthProvider>
          <UserRoutes />
        </AuthProvider>
        <PublicRoutes />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
