"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronRight, ChevronDown } from "lucide-react";

interface NavItem {
    id: string;
    label: string;
    isSubItem?: boolean;
}

interface NavGroup {
    title: string;
    items: NavItem[];
}

interface SidebarProps {
    navigation: NavGroup[];
    activeSection: string;
    onNavigate: (id: string) => void;
    isOpen?: boolean;
    onClose?: () => void;
}

export function Sidebar({ navigation, activeSection, onNavigate, isOpen, onClose }: SidebarProps) {
    const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

    const toggleGroup = (groupTitle: string) => {
        setCollapsedGroups((prev) => ({
            ...prev,
            [groupTitle]: !prev[groupTitle],
        }));
    };

    const handleNavClick = (id: string) => {
        onNavigate(id);
        onClose?.();
    };

    return (
        <>
            {/* Overlay */}
            <div
                className={cn(
                    "fixed inset-0 bg-black/60 z-40 lg:hidden transition-opacity duration-200",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* Sidebar */}
            <aside
                className={cn(
                    "w-[260px] bg-card border-r border-border flex flex-col h-full overflow-hidden flex-shrink-0 z-50",
                    "fixed lg:relative transition-transform duration-200 ease-out",
                    "lg:translate-x-0",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <nav className="flex-1 overflow-y-auto py-4">
                    {navigation.map((group) => {
                        const isCollapsed = collapsedGroups[group.title];

                        return (
                            <div key={group.title} className="mb-2">
                                {/* Group Header - Collapsible */}
                                <button
                                    onClick={() => toggleGroup(group.title)}
                                    className="w-full flex items-center justify-between px-5 py-2 text-[11px] uppercase text-muted-foreground/60 font-bold tracking-widest hover:text-muted-foreground transition-colors cursor-pointer bg-transparent border-none"
                                >
                                    <span>{group.title}</span>
                                    {isCollapsed ? (
                                        <ChevronRight className="w-3 h-3" />
                                    ) : (
                                        <ChevronDown className="w-3 h-3" />
                                    )}
                                </button>

                                {/* Group Items */}
                                <div
                                    className={cn(
                                        "overflow-hidden transition-all duration-200",
                                        isCollapsed ? "max-h-0" : "max-h-[500px]"
                                    )}
                                >
                                    <div className="mt-1 space-y-0.5 px-3">
                                        {group.items.map((item) => {
                                            const isActive = activeSection === item.id;
                                            return (
                                                <button
                                                    key={item.id}
                                                    onClick={() => handleNavClick(item.id)}
                                                    className={cn(
                                                        "group relative w-full text-left flex items-center gap-2 py-2 px-3 text-[13px] rounded-md transition-colors duration-150 cursor-pointer border-none",
                                                        item.isSubItem && "pl-6",
                                                        isActive
                                                            ? "text-foreground font-medium bg-secondary"
                                                            : "text-muted-foreground hover:text-foreground hover:bg-secondary/50 bg-transparent"
                                                    )}
                                                >
                                                    {/* Active indicator line */}
                                                    <span
                                                        className={cn(
                                                            "absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full transition-all duration-150",
                                                            isActive ? "bg-primary" : "bg-transparent"
                                                        )}
                                                    />

                                                    {/* Sub-item dot */}
                                                    {item.isSubItem && (
                                                        <span
                                                            className={cn(
                                                                "w-1 h-1 rounded-full flex-shrink-0",
                                                                isActive ? "bg-primary" : "bg-muted-foreground/40"
                                                            )}
                                                        />
                                                    )}

                                                    <span className="truncate">{item.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </nav>

                {/* Version info */}
                <div className="flex-shrink-0 px-5 py-3 border-t border-border">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground/50">
                        <span>Lunaby API</span>
                        <span className="px-1.5 py-0.5 bg-secondary rounded text-[10px]">v1.0.0</span>
                    </div>
                </div>
            </aside>
        </>
    );
}
