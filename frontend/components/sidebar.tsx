"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Brain, Database, Activity, Settings, MessageSquare } from "lucide-react";

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Models", href: "/models", icon: Brain },
  { name: "Data", href: "/datasets", icon: Database },
  { name: "Playground", href: "/playground", icon: MessageSquare },
  { name: "Monitor", href: "/monitoring", icon: Activity },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-20 border-r border-border bg-white flex flex-col">
      {/* Logo */}
      <div className="py-6 flex items-center justify-center">
        <Link href="/" className="block">
          <p className="text-lg font-bold text-black">BGK</p>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-3 rounded-[12px] text-[10px] font-normal transition-colors",
                isActive
                  ? "text-black"
                  : "text-neutral-400 hover:text-neutral-600"
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
