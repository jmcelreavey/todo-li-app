import { Stack, Text } from "@mantine/core";
import { LoaderFunctionArgs } from "@remix-run/node";
import { Outlet } from "@remix-run/react";

import { CommonErrorBoundary } from "../components/error-boundary";
import { authenticator } from "../lib/auth.server";

export default function Bookmarks() {
  return (
    <Stack gap="xs">
      <Text>Bookmarked</Text>
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
