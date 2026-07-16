"use client";

import {
  Button,
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
  DropdownTrigger,
} from "@qr-platform/ui";
import { Bell } from "lucide-react";

import type { MockNotification } from "@/fixtures/notifications.fixture";

export interface NotificationBellProps {
  notifications: MockNotification[];
}

export function NotificationBell({ notifications }: NotificationBellProps) {
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Bildirimler">
          <Bell className="h-5 w-5" aria-hidden="true" />
          {unreadCount > 0 ? (
            <span
              className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-destructive"
              aria-hidden="true"
            />
          ) : null}
        </Button>
      </DropdownTrigger>
      <DropdownContent align="end" className="w-80">
        <DropdownLabel>Bildirimler</DropdownLabel>
        <DropdownSeparator />
        {notifications.length === 0 ? (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">Yeni bildirim yok.</p>
        ) : (
          notifications.map((notification) => (
            <DropdownItem key={notification.id} className="flex-col items-start gap-0.5">
              <div className="flex w-full items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground">{notification.title}</span>
                {!notification.read ? (
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                ) : null}
              </div>
              <span className="text-xs text-muted-foreground">{notification.description}</span>
              <span className="text-[11px] text-muted-foreground">{notification.time}</span>
            </DropdownItem>
          ))
        )}
      </DropdownContent>
    </Dropdown>
  );
}
