import "@mantine/core/styles.css";
import "@mantine/charts/styles.css";
import "@mantine/dates/styles.css";
import "mantine-react-table/styles.css";
import "@mantine/notifications/styles.css";
import { ModalsProvider } from "@mantine/modals";
import { createRoot } from "react-dom/client";
import { createTheme, MantineProvider } from "@mantine/core";
import App from "./App.tsx";
import { DateInput } from "@mantine/dates";
import "dayjs/locale/vi";

const theme = createTheme({
  components: {
    DateInput: DateInput.extend({
      defaultProps: {
        locale: "vi",
        valueFormat: "DD [Tháng] MM, YYYY",
      },
    }),
  },
});

createRoot(document.getElementById("root")!).render(
  <MantineProvider defaultColorScheme="light" theme={theme}>
    <ModalsProvider>
      <App />
    </ModalsProvider>
  </MantineProvider>
);
