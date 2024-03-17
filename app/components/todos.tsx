import { Badge } from "@mantine/core";

const statusOptions = {
  incomplete: { color: "red", label: "Incomplete" },
  inprogress: { color: "yellow", label: "In Progress" },
  complete: { color: "green", label: "Complete" },
};

interface TodoProgressBadgeProps {
  progress: keyof typeof statusOptions;
}

export function TodoProgressBadge({ progress }: TodoProgressBadgeProps) {
  const { color, label } = statusOptions[progress];

  return (
    <Badge variant="dot" color={color}>
      {label}
    </Badge>
  );
}
