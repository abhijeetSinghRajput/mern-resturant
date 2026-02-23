import React from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { ModeToggle } from "@/components/ModeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  UserIcon,
  SettingsIcon,
  BellIcon,
  LogOutIcon,
  CreditCardIcon,
  User2Icon,
  Loader2,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const AppHeader = () => {
  return (
    <header className="sticky top-0 left-0 w-full border-b bg-background/90 backdrop-blur-sm z-50">
      <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between h-16">
        <div className="flex items-center gap-2">
          <span className="text-[22px]">✦</span>
          <span className="font-[Fraunces] text-[20px] font-semibold tracking-[-0.02em]">
            Cloud Kitchen 247
          </span>
        </div>

        <div className="flex items-center gap-3">
          <AuthUserDropdown />

          <Button className="relative h-[38px] px-4 rounded-full bg-foreground text-background text-[13px] font-medium gap-2">
            <ShoppingCart />
            <span>Cart</span>
          </Button>

          <ModeToggle />
        </div>
      </div>
    </header>
  );
};

const AuthUserDropdown = () => {
  const { authUser, isCheckingAuth, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const initials = (authUser?.name || "U")
    .split(" ")
    .map((value) => value[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (isCheckingAuth) {
    return (
      <div className="size-9 rounded-full bg-muted flex items-center justify-center">
        <Loader2 className="animate-spin text-muted-foreground size-5" />
      </div>
    );
  }

  if (!authUser) {
    return <Button onClick={() => navigate("/login")}>Login</Button>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="overflow-hidden rounded-full p-0"
        >
          <Avatar className="size-9">
            <AvatarImage
              src={authUser?.avatar?.url}
              alt={authUser?.name || "User avatar"}
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
            />
            <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Avatar className="size-9">
            <AvatarImage
              src={authUser?.avatar?.url}
              alt={authUser?.name || "User avatar"}
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
            />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col">
            <span className="text-popover-foreground">
              {authUser?.name || "Guest User"}
            </span>
            <span className="text-muted-foreground text-xs">
              {authUser?.email || ""}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <User2Icon />
            <span className="text-popover-foreground">Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <SettingsIcon />
            <span className="text-popover-foreground">Settings</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={isLoggingOut}
            onSelect={async () => {
              setIsLoggingOut(true);
              try {
                await logout();
                navigate("/login");
              } finally {
                setIsLoggingOut(false);
              }
            }}
          >
            {isLoggingOut ? (
              <Loader2 className="animate-spin" />
            ) : (
              <LogOutIcon />
            )}
            <span className="text-popover-foreground">
              {isLoggingOut ? "Signing Out..." : "Sign Out"}
            </span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AppHeader;
