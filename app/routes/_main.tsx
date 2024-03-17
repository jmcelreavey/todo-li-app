import { AppShell, Burger, Button, Flex, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { type LoaderFunctionArgs } from "@remix-run/node";
import { Form, NavLink, Outlet, useLocation } from "@remix-run/react";

import { CommonErrorBoundary } from "../components/error-boundary";
import { BookmarkIcon, LogoutIcon, TodosIcon } from "../components/icons";
import { authenticator } from "../lib/auth.server";

export default function Todos() {
  const [opened, { toggle }] = useDisclosure();

  return (
    <AppShell
      header={{ height: 40 }}
      navbar={{
        width: 300,
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header px="sm">
        <Flex align="center" h="100%" gap="sm">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <Text size="lg">Todo App</Text>
        </Flex>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Stack h="100%" justify="space-between">
          <NavLinks />

          {/* _main.tsx is treated as a route and cannot define actions. */}
          {/* Therefore, define the logout action in _main.logout.tsx and call that action. */}
          <Form method="post" action="logout">
            <Button
              type="submit"
              variant="transparent"
              color="gray"
              justify="start"
              fullWidth
              leftSection={<LogoutIcon />}
            >
              Logout
            </Button>
          </Form>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}

function NavLinks() {
  const location = useLocation();
  const currentPath = location.pathname;

  const links = [
    {
      label: "Todo List",
      to: "todos/incomplete",
      active: [
        "/todos/incomplete",
        "/todos/inprogress",
        "/todos/complete",
      ].some((path) => currentPath === path),
      icon: <TodosIcon />,
    },
    {
      label: "Bookmarked",
      to: "bookmarks",
      active: currentPath === "/bookmarks",
      icon: <BookmarkIcon />,
    },
  ];

  return (
    <div>
      {links.map((link) => (
        <Button
          key={link.to}
          justify="start"
          variant={link.active ? "light" : "transparent"}
          color={link.active ? "blue" : "gray"}
          leftSection={link.icon}
          renderRoot={(props) => <NavLink to={link.to} {...props} />}
          fullWidth
        >
          {link.label}
        </Button>
      ))}
    </div>
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
