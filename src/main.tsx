import "@mantine/core/styles.css";
import "@mantine/charts/styles.css";
import "@mantine/dates/styles.css";
import "mantine-react-table/styles.css";
import { ModalsProvider } from "@mantine/modals";
import { createRoot } from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <MantineProvider defaultColorScheme="light">
    <ModalsProvider>
      <App />
    </ModalsProvider>
  </MantineProvider>
);
