import { MantineProvider, Paper, Text } from "@mantine/core";
import { json } from "@remix-run/node";

export function loader() {
  return json(null, { status: 404 });
}

export default function FallbackRoute() {
  return (
    <MantineProvider>
      <Paper p="md" shadow="xs">
        <Text ta="center" size="xl">
          404 - Page Not Found
        </Text>
      </Paper>
    </MantineProvider>
  );
}
