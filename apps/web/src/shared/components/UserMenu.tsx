"use client";

import {
  Avatar,
  AvatarFallback,
  Button,
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
  DropdownTrigger,
} from "@qr-platform/ui";
import { LogOut, Settings, User } from "lucide-react";
import { useRouter } from "next/navigation";

import { ROUTES } from "@/config/routes";
import { logout } from "@/services/auth.service";
import type { AuthUser } from "@/types/auth";

export interface UserMenuProps {
  user: AuthUser;
}

function initialsOf(user: AuthUser): string {
  return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
}

export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter();
  const fullName = `${user.firstName} ${user.lastName}`;

  const handleLogout = async (): Promise<void> => {
    await logout();
    router.push(ROUTES.login);
    router.refresh();
  };

  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <Button variant="ghost" className="h-10 gap-2 px-2">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-xs">{initialsOf(user)}</AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium sm:inline">{fullName}</span>
        </Button>
      </DropdownTrigger>
      <DropdownContent align="end" className="w-64">
        <DropdownLabel className="flex flex-col gap-0.5 font-normal">
          <span className="text-sm font-medium text-foreground">{fullName}</span>
          <span className="text-xs text-muted-foreground">{user.email}</span>
        </DropdownLabel>
        <DropdownSeparator />
        <DropdownItem>
          <User className="h-4 w-4" aria-hidden="true" />
          Profil
        </DropdownItem>
        <DropdownItem>
          <Settings className="h-4 w-4" aria-hidden="true" />
          Ayarlar
        </DropdownItem>
        <DropdownSeparator />
        <DropdownItem
          className="text-destructive focus:text-destructive"
          onSelect={() => void handleLogout()}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Çıkış Yap
        </DropdownItem>
      </DropdownContent>
    </Dropdown>
  );
}
