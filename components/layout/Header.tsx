"use client";

import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { cn } from "@/lib/utils";
import { LogIn, Shield } from "lucide-react";
import Link from "next/link";

const navLinks = [
    { href: "#", label: "Docs", active: true },
    { href: "#", label: "API Reference" },
    { href: "#", label: "Cookbook" },
    { href: "#", label: "Console" },
];

interface HeaderProps {
    onMenuToggle?: () => void;
    isSidebarOpen?: boolean;
}

function HamburgerIcon({ isOpen }: { isOpen: boolean }) {
    return (
        <div className="w-5 h-5 flex flex-col justify-center items-center gap-[5px]">
            <span
                className={cn(
                    "block w-5 h-0.5 bg-current transition-all duration-300 origin-center",
                    isOpen && "rotate-45 translate-y-[7px]"
                )}
            />
            <span
                className={cn(
                    "block w-5 h-0.5 bg-current transition-all duration-300",
                    isOpen && "opacity-0 scale-0"
                )}
            />
            <span
                className={cn(
                    "block w-5 h-0.5 bg-current transition-all duration-300 origin-center",
                    isOpen && "-rotate-45 -translate-y-[7px]"
                )}
            />
        </div>
    );
}

export function Header({ onMenuToggle, isSidebarOpen }: HeaderProps) {
    return (
        <header className="h-[60px] bg-background border-b border-border flex items-center justify-between px-4 sm:px-6 lg:px-8 flex-shrink-0 z-50 sticky top-0">
            {/* Left section */}
            <div className="flex items-center gap-3">
                {/* Mobile menu button */}
                <button
                    onClick={onMenuToggle}
                    className="lg:hidden p-2 -ml-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors border-none bg-transparent cursor-pointer"
                    aria-label="Toggle menu"
                >
                    <HamburgerIcon isOpen={isSidebarOpen || false} />
                </button>

                <Link href="/" className="text-lg font-semibold tracking-tight text-foreground no-underline">
                    LUNABY
                    <span className="bg-gradient-to-r from-muted-foreground to-muted-foreground/50 bg-clip-text text-transparent ml-1">
                        DOCS
                    </span>
                </Link>
            </div>

            {/* Center nav - hidden on mobile */}
            <nav className="hidden md:flex items-center gap-6">
                {navLinks.map((link) => (
                    <Link
                        key={link.label}
                        href={link.href}
                        className={`text-sm font-medium transition-colors no-underline ${link.active
                                ? "text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        {link.label}
                    </Link>
                ))}
            </nav>

            {/* Right section */}
            <div className="flex items-center gap-2">
                <ThemeToggle />
                <a
                    href="/admin"
                    className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-muted-foreground text-sm font-medium hover:text-foreground transition-all no-underline"
                >
                    <Shield className="w-4 h-4" />
                    <span className="hidden lg:inline">Admin</span>
                </a>
                <a
                    href="https://dashboard.lunie.dev/"
                    className="hidden sm:flex items-center gap-2 px-4 py-1.5 bg-primary text-primary-foreground text-sm font-semibold rounded-full hover:bg-primary/90 transition-all no-underline"
                >
                    <LogIn className="w-4 h-4" />
                    <span className="hidden lg:inline">Login</span>
                </a>
            </div>
        </header>
    );
}
