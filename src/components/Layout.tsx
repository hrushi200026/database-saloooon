"use client";

import { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Store, 
  LayoutDashboard, 
  Users, 
  Clock,
  Menu,
  X,
  Receipt,
  Sun
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { ThemeToggle } from "./theme-toggle";

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Customers",
    href: "/customers",
    icon: Users,
  },
  {
    name: "Tally",
    href: "/tally",
    icon: Receipt,
  },
  {
    name: "Booking",
    href: "/booking",
    icon: Calendar,
  },
  {
    name: "Schedule",
    href: "/schedule",
    icon: Clock,
  },
  {
    name: "Store",
    href: "/store",
    icon: Store,
  },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform bg-gradient-card border-r border-border/50 shadow-card transition-transform duration-300 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="w-full border-b border-border/50 bg-black">
            <div className="w-full py-1 bg-black">
              <div className="relative overflow-hidden">
                <style dangerouslySetInnerHTML={{
                  __html: `
                    @keyframes logoCycle {
                      /* Initial drop from top */
                      0% { 
                        transform: translateY(-100%); 
                        opacity: 0;
                        animation-timing-function: ease-out;
                      }
                      /* Stay steady */
                      10%, 20% { 
                        transform: translateY(0); 
                        opacity: 1;
                        animation-timing-function: ease-in-out;
                      }
                      /* Fade in/out */
                      30%, 35% { opacity: 0.3; }
                      40%, 45% { opacity: 1; }
                      50%, 55% { opacity: 0.3; }
                      60% { 
                        opacity: 1;
                        transform: translateY(0);
                      }
                      /* Drop down and reset to top */
                      70% { 
                        transform: translateY(100%);
                        opacity: 1;
                      }
                      /* Reset to top */
                      71% { 
                        transform: translateY(-100%);
                        opacity: 0;
                      }
                      /* Drop from top again */
                      72% { 
                        transform: translateY(-100%);
                        opacity: 0;
                      }
                      80% { 
                        transform: translateY(0);
                        opacity: 1;
                      }
                      /* Stay steady */
                      81%, 90% { 
                        transform: translateY(0);
                        opacity: 1;
                      }
                      /* Fade in/out */
                      91%, 93% { opacity: 0.3; }
                      94%, 96% { opacity: 1; }
                      97%, 100% { opacity: 0.3; }
                    }
                    .logo-animation {
                      animation: logoCycle 20s infinite;
                      animation-timing-function: ease-in-out;
                    }
                  `
                }} />
                <img 
                  src={`${import.meta.env.BASE_URL}logo1.png`} 
                  alt="Logo" 
                  className="w-full h-[160px] object-contain mx-auto drop-shadow-[0_0_15px_rgba(59,130,246,0.7)] hover:drop-shadow-[0_0_20px_rgba(59,130,246,1)] transition-all duration-300 logo-animation"
                  onError={(e) => {
                    console.error('Failed to load logo:', e);
                    const img = e.target as HTMLImageElement;
                    img.style.border = '1px solid red';
                    img.alt = 'Logo not found';
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden absolute top-2 right-2"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                    isActive
                      ? "bg-gradient-primary text-primary-foreground shadow-glow"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50 hover:shadow-soft"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={cn(
                    "h-5 w-5 transition-transform duration-200",
                    "group-hover:scale-110"
                  )} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border/50">
            <div className="text-xs text-muted-foreground text-center">
              SalonPro v1.0
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="bg-background/80 backdrop-blur-sm border-b border-border/50 px-4 py-3 sticky top-0 z-40">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold text-primary">
                {navigation.find(nav => nav.href === location.pathname)?.name || 'Dashboard'}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
              <Button variant="outline" size="sm">
                <Clock className="h-4 w-4 mr-2" />
                {new Date().toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: true 
                })}
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}