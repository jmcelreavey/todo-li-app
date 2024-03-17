import { Text, Flex, Tabs, ActionIcon, Stack } from "@mantine/core";
import { type LoaderFunctionArgs } from "@remix-run/node";
import { NavLink, Outlet, useLocation, useNavigate } from "@remix-run/react";

import { authenticator } from "../lib/auth.server";
import { CreateIcon } from "../components/icons";
import { CommonErrorBoundary } from "../components/error-boundary";

export default function Todos() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Stack gap="xs">
      <Flex align="center" gap="sm">
        <Text>Todo List</Text>
        <ActionIcon
          variant="light"
          renderRoot={(props) => (
            <NavLink to={`${location.pathname}/new`} {...props} replace />
          )}
        >
          <CreateIcon />
        </ActionIcon>
      </Flex>

      <Tabs
        value={location.pathname}
        onChange={(newPath) => navigate(newPath || "/todos/incomplete")}
      >
        <Tabs.List>
          <Tabs.Tab value="/todos/incomplete">Incomplete</Tabs.Tab>
          <Tabs.Tab value="/todos/inprogress">In Progress</Tabs.Tab>
          <Tabs.Tab value="/todos/complete">Complete</Tabs.Tab>
        </Tabs.List>
      </Tabs>

      <Outlet />
    </Stack>
  );
}

export function ErrorBoundary() {
  return <CommonErrorBoundary />;
}

export async function loader({ request }: LoaderFunctionArgs) {
  return await authenticator.isAuthenticated(request, {
    failureRedirect: "/auth/sign-in",
  });
}
