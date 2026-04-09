import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useListGuests, useLogout } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Plus, LogOut, Users, Search, DoorClosed, Loader2, Eye, EyeOff, Hash, KeyRound } from "lucide-react";
import { GuestProLogo } from "@/components/GuestProLogo";
import { isStaffRole, roleLabel } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export default function ManagerDashboard() {
  const { user, isAuthenticated, logoutAuth } = useAuth();
  const [, setLocation] = useLocation();
  const logoutMutation = useLogout();
  
  const { data: guests, isLoading } = useListGuests({
    query: {
      enabled: isAuthenticated && user?.role === "manager"
    }
  });

  const [search, setSearch] = useState("");
  const [revealedKeys, setRevealedKeys] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/");
    } else if (user && !isStaffRole(user.role)) {
      // Guests should go to the guest interface, not the staff dashboard
      setLocation("/guest");
    }
  }, [isAuthenticated, user, setLocation]);

  const handleLogout = () => {
    logoutAuth();
    logoutMutation.mutate(undefined);
    toast.success("Logged out successfully");
  };

  const toggleKey = (id: number) => {
    setRevealedKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredGuests = guests?.filter(g => 
    g.firstName.toLowerCase().includes(search.toLowerCase()) || 
    g.lastName.toLowerCase().includes(search.toLowerCase()) ||
    g.roomNumber.toLowerCase().includes(search.toLowerCase())
  );

  if (!isAuthenticated || !isStaffRole(user?.role)) return null;

  return (
    <div className="min-h-[100dvh] bg-zinc-50/50 pb-20">
      <header className="bg-white border-b border-zinc-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white border border-zinc-100 shadow-sm flex items-center justify-center shrink-0">
              <GuestProLogo variant="header" className="w-[22px] h-[22px]" />
            </div>
            <div>
              <h1 className="font-serif text-xl font-medium text-zinc-900">
                {user.role === "manager" ? "Manager Dashboard" : "Staff Dashboard"}
              </h1>
              <p className="text-xs text-zinc-500 font-medium">
                {roleLabel(user.role)} · {user.firstName} {user.lastName}
              </p>
            </div>
          </div>
          <Button 
            data-testid="button-logout"
            variant="ghost" 
            size="icon" 
            onClick={handleLogout}
            className="text-zinc-500 hover:text-zinc-900 rounded-xl"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-8">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <Input
              data-testid="input-search"
              placeholder="Search guests or rooms..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-14 rounded-2xl bg-white border-zinc-200 focus-visible:ring-zinc-900 text-base"
            />
          </div>
          
          <Button 
            data-testid="button-create-guest"
            onClick={() => setLocation("/manager/guests/new")}
            className="w-full md:w-auto h-14 px-8 rounded-2xl text-base font-medium shadow-lg shadow-zinc-900/10"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create New Guest
          </Button>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-2xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
                <Skeleton className="h-10 w-32 rounded-xl" />
              </div>
            ))
          ) : filteredGuests?.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-zinc-100 shadow-sm">
              <Users className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-zinc-900 mb-1">No guests found</h3>
              <p className="text-zinc-500">Create a new guest to get started.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredGuests?.map(guest => (
                <div 
                  key={guest.id} 
                  data-testid={`card-guest-${guest.id}`}
                  className="bg-white rounded-3xl p-5 md:p-6 border border-zinc-100 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-zinc-50 flex items-center justify-center border border-zinc-100 shrink-0">
                      <span className="text-xl font-serif text-zinc-900">{guest.firstName[0]}{guest.lastName[0]}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-zinc-900">{guest.firstName} {guest.lastName}</h3>
                      <div className="flex items-center gap-3 text-sm text-zinc-500 mt-1">
                        <span className="flex items-center gap-1.5"><DoorClosed className="w-4 h-4" /> Room {guest.roomNumber}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 bg-zinc-50 p-3 rounded-2xl border border-zinc-100 shrink-0">
                    <KeyRound className="w-4 h-4 text-zinc-400" />
                    <div className="font-mono tracking-wider font-medium text-zinc-700 w-24">
                      {revealedKeys[guest.id] ? guest.guestKey : "••••••••"}
                    </div>
                    <Button 
                      data-testid={`button-toggle-key-${guest.id}`}
                      variant="ghost" 
                      size="icon"
                      className="w-8 h-8 rounded-xl hover:bg-zinc-200"
                      onClick={() => toggleKey(guest.id)}
                    >
                      {revealedKeys[guest.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
