"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Check, Copy, ChevronDown } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

// Language icons from Simple Icons CDN
const LANGUAGE_ICONS: Record<string, string> = {
    python: "https://cdn.simpleicons.org/python",
    javascript: "https://cdn.simpleicons.org/javascript",
    typescript: "https://cdn.simpleicons.org/typescript",
    bash: "https://cdn.simpleicons.org/gnubash",
    shell: "https://cdn.simpleicons.org/gnubash",
    curl: "https://cdn.simpleicons.org/curl",
    json: "https://cdn.simpleicons.org/json",
    go: "https://cdn.simpleicons.org/go",
    rust: "https://cdn.simpleicons.org/rust",
    java: "https://cdn.simpleicons.org/openjdk",
    csharp: "https://cdn.simpleicons.org/csharp",
    php: "https://cdn.simpleicons.org/php",
    ruby: "https://cdn.simpleicons.org/ruby",
    swift: "https://cdn.simpleicons.org/swift",
    kotlin: "https://cdn.simpleicons.org/kotlin",
};

interface CodeTab {
    id: string;
    label: string;
    language: string;
    code: string;
}

interface CodeBlockProps {
    tabs: CodeTab[];
    title?: string;
    dropdownTabs?: CodeTab[];
}

export function CodeBlock({ tabs, title, dropdownTabs = [] }: CodeBlockProps) {
    const allTabs = [...tabs, ...dropdownTabs];
    const [activeTab, setActiveTab] = useState(allTabs[0]?.id);
    const [copied, setCopied] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const activeContent = allTabs.find((t) => t.id === activeTab);
    const syntaxStyle = mounted && theme === "light" ? oneLight : oneDark;

    const copyToClipboard = useCallback(async () => {
        if (activeContent) {
            try {
                await navigator.clipboard.writeText(activeContent.code);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                // Fallback for mobile
                const textArea = document.createElement("textarea");
                textArea.value = activeContent.code;
                textArea.style.position = "fixed";
                textArea.style.left = "-9999px";
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand("copy");
                document.body.removeChild(textArea);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        }
    }, [activeContent]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const getLanguageIcon = (language: string) => {
        const iconUrl = LANGUAGE_ICONS[language.toLowerCase()];
        if (iconUrl) {
            return (
                <img
                    src={iconUrl}
                    alt={language}
                    className="w-4 h-4"
                    loading="lazy"
                />
            );
        }
        return null;
    };

    // Title-only block (like "Base URL")
    if (title && allTabs.length === 1) {
        return (
            <div className="my-4 sm:my-6 border border-border rounded-lg overflow-hidden bg-card">
                <div className="flex items-center justify-between bg-secondary/50 border-b border-border px-3 sm:px-4 min-h-[44px]">
                    <span className="text-muted-foreground text-xs sm:text-sm font-medium truncate">
                        {title}
                    </span>
                    <button
                        onClick={copyToClipboard}
                        className="flex-shrink-0 p-2 text-muted-foreground hover:text-foreground active:scale-95 transition-all cursor-pointer border-none bg-transparent"
                        aria-label="Copy code"
                    >
                        {copied ? (
                            <Check className="w-4 h-4 text-green-500" />
                        ) : (
                            <Copy className="w-4 h-4" />
                        )}
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <SyntaxHighlighter
                        language={activeContent?.language || "text"}
                        style={syntaxStyle}
                        customStyle={{
                            margin: 0,
                            padding: "0.875rem 1rem",
                            background: "transparent",
                            fontSize: "0.8125rem",
                        }}
                        codeTagProps={{
                            style: { fontFamily: "'JetBrains Mono', monospace" },
                        }}
                    >
                        {activeContent?.code || ""}
                    </SyntaxHighlighter>
                </div>
            </div>
        );
    }

    // Multi-language block
    return (
        <div className="my-4 sm:my-6 border border-border rounded-lg overflow-hidden bg-card">
            <div className="flex items-center bg-secondary/50 border-b border-border min-h-[44px]">
                {/* Mobile: Single dropdown */}
                <div className="sm:hidden flex-1" ref={dropdownRef}>
                    <div className="relative">
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-foreground cursor-pointer border-none bg-transparent"
                        >
                            {getLanguageIcon(activeContent?.language || "")}
                            <span>{activeContent?.label}</span>
                            <ChevronDown className={cn(
                                "w-4 h-4 ml-auto text-muted-foreground transition-transform",
                                dropdownOpen && "rotate-180"
                            )} />
                        </button>

                        {dropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-1 mx-2 bg-card border border-border rounded-lg shadow-xl z-50 overflow-hidden">
                                {allTabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => {
                                            setActiveTab(tab.id);
                                            setDropdownOpen(false);
                                        }}
                                        className={cn(
                                            "flex items-center gap-2 w-full px-3 py-2.5 text-sm transition-colors cursor-pointer border-none text-left",
                                            activeTab === tab.id
                                                ? "bg-primary/10 text-primary"
                                                : "text-muted-foreground hover:text-foreground hover:bg-secondary bg-transparent"
                                        )}
                                    >
                                        {getLanguageIcon(tab.language)}
                                        <span>{tab.label}</span>
                                        {activeTab === tab.id && (
                                            <Check className="w-4 h-4 ml-auto" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Desktop: Tab buttons */}
                <div className="hidden sm:flex items-center flex-1 px-2 overflow-x-auto scrollbar-hide">
                    {allTabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer border-none whitespace-nowrap",
                                activeTab === tab.id
                                    ? "bg-secondary text-foreground"
                                    : "bg-transparent text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {getLanguageIcon(tab.language)}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Copy button */}
                <button
                    onClick={copyToClipboard}
                    className="flex-shrink-0 p-2.5 sm:p-2 mr-1 text-muted-foreground hover:text-foreground active:scale-95 transition-all cursor-pointer border-none bg-transparent"
                    aria-label="Copy code"
                >
                    {copied ? (
                        <Check className="w-4 h-4 text-green-500" />
                    ) : (
                        <Copy className="w-4 h-4" />
                    )}
                </button>
            </div>

            {/* Code content */}
            <div className="overflow-x-auto">
                {activeContent && (
                    <SyntaxHighlighter
                        language={activeContent.language}
                        style={syntaxStyle}
                        customStyle={{
                            margin: 0,
                            padding: "0.875rem 1rem",
                            background: "transparent",
                            fontSize: "0.8125rem",
                        }}
                        codeTagProps={{
                            style: { fontFamily: "'JetBrains Mono', monospace" },
                        }}
                        wrapLongLines={false}
                    >
                        {activeContent.code}
                    </SyntaxHighlighter>
                )}
            </div>
        </div>
    );
}
