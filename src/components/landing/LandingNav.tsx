// YOL: src/components/landing/LandingNav.tsx

"use client";

import { useState } from "react";
import { Home, Compass, Briefcase, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { id: "home", icon: Home },
  { id: "explore", icon: Compass },
  { id: "services", icon: Briefcase },
  { id: "profile", icon: User },
];

export default function LandingNav() {
  const [activeTab, setActiveTab] = useState("home");

  return (
    // DÜZELTME: Kendi arkaplan stilleri kaldırıldı, sadece ikonları düzenliyor.
    <nav className="landing-nav">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveTab(item.id)}
          className={cn(
            "group relative w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300",
            {
              "active": activeTab === item.id,
            }
          )}
        >
          <item.icon
            className={cn(
              "w-6 h-6 text-white transition-all duration-300",
              activeTab === item.id ? "icon-glow-red" : "icon-glow-blue"
            )}
          />
        </button>
      ))}
    </nav>
  );
}