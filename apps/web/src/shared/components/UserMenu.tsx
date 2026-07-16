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

import type { MockUser } from "@/types/user";

export interface UserMenuProps {
  user: MockUser;
}

export function UserMenu({ user }: UserMenuProps) {
  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <Button variant="ghost" className="h-10 gap-2 px-2">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-xs">{user.initials}</AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium sm:inline">{user.name}</span>
        </Button>
      </DropdownTrigger>
      <DropdownContent align="end" className="w-64">
        <DropdownLabel className="flex flex-col gap-0.5 font-normal">
          <span className="text-sm font-medium text-foreground">{user.name}</span>
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
        <DropdownItem className="text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Çıkış Yap
        </DropdownItem>
      </DropdownContent>
    </Dropdown>
  );
}
