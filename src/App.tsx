import { HashRouter as Router } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AuthProvider } from "./context/authContext";
import { Notifications } from "@mantine/notifications";
import PublicRoutes from "./Routes/PublicRoutes";
import AdminRoutes from "./Routes/AdminRoutes";
import "dayjs/locale/vi";

function App() {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools />
      <Notifications position="top-right" />
      <Router>
        <AuthProvider>
          <AdminRoutes />
        </AuthProvider>
        <PublicRoutes />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
