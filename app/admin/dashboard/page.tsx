"use client";

import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { cn } from "@/lib/utils";
import {
    AlertCircle,
    Check,
    ChevronDown,
    ChevronUp,
    Code,
    Copy,
    Edit,
    ExternalLink,
    Eye,
    FileText,
    LayoutDashboard,
    LogOut,
    Menu,
    Plus,
    Save,
    Settings,
    Trash2,
    X
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Types
interface Section {
    id: number;
    title: string;
    slug: string;
    content: string | null;
    description: string | null;
    order_index: number;
    group_name: string;
    is_sub_item: boolean;
    is_published: boolean;
}

type TabType = "dashboard" | "sections" | "settings";

// Components
function NavItem({ icon, label, active, onClick }: {
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    onClick?: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "group relative w-full text-left flex items-center gap-2 py-2 px-3 text-[13px] rounded-md transition-colors duration-150 cursor-pointer border-none",
                active
                    ? "text-foreground font-medium bg-secondary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50 bg-transparent"
            )}
        >
            {/* Active indicator line */}
            <span
                className={cn(
                    "absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full transition-all duration-150",
                    active ? "bg-primary" : "bg-transparent"
                )}
            />
            {icon}
            <span className="truncate">{label}</span>
        </button>
    );
}

function StatCard({ label, value, icon }: { label: string; value: number | string; icon?: React.ReactNode }) {
    return (
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">{label}</p>
                    <p className="text-xl sm:text-2xl font-bold mt-1">{value}</p>
                </div>
                {icon && <div className="text-muted-foreground">{icon}</div>}
            </div>
        </div>
    );
}

// Code snippets for quick insert
const CODE_SNIPPETS = [
    {
        name: "CodeBlock - Single",
        code: `<CodeBlock
  title="Example"
  tabs={[{ id: "example", label: "Example", language: "bash", code: "echo 'Hello World'" }]}
/>`,
    },
    {
        name: "CodeBlock - Multi",
        code: `<CodeBlock
  tabs={[
    { id: "python", label: "Python", language: "python", code: "print('Hello')" },
    { id: "js", label: "JavaScript", language: "javascript", code: "console.log('Hello')" },
  ]}
/>`,
    },
    {
        name: "DataTable",
        code: `<DataTable
  headers={["Column 1", "Column 2"]}
  rows={[
    [{ code: "value1" }, { value: "Description 1" }],
    [{ code: "value2" }, { value: "Description 2" }],
  ]}
/>`,
    },
    {
        name: "ModelGrid",
        code: `<ModelGrid
  models={[
    { title: "Model Name", description: "Model description", gradient: "lunaby" },
  ]}
/>`,
    },
];

export default function AdminDashboard() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>("dashboard");
    const [sections, setSections] = useState<Section[]>([]);
    const [editingSection, setEditingSection] = useState<Partial<Section> | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [showSnippets, setShowSnippets] = useState(false);

    // Settings state
    const [settings, setSettings] = useState({
        siteTitle: "Lunaby API Reference",
        baseUrl: "https://api.lunie.dev",
        version: "1.0.0",
    });

    useEffect(() => {
        fetchSections();
    }, []);

    const fetchSections = async () => {
        try {
            const res = await fetch("/api/admin/sections");
            if (res.ok) {
                const data = await res.json();
                setSections(data.sections || []);
            }
        } catch (error) {
            console.error("Failed to fetch sections:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        router.push("/admin");
    };

    const showMessage = (type: "success" | "error", text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    const handleSaveSection = async () => {
        if (!editingSection?.title || !editingSection?.slug) {
            showMessage("error", "Title and slug are required");
            return;
        }

        setSaving(true);
        try {
            const isNew = !editingSection.id;
            const url = isNew ? "/api/admin/sections" : `/api/admin/sections/${editingSection.id}`;
            const method = isNew ? "POST" : "PUT";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editingSection),
            });

            if (res.ok) {
                showMessage("success", isNew ? "Section created!" : "Section updated!");
                await fetchSections();
                setEditingSection(null);
                setIsCreating(false);
            } else {
                showMessage("error", "Failed to save section");
            }
        } catch {
            showMessage("error", "An error occurred");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteSection = async (id: number) => {
        if (!confirm("Are you sure you want to delete this section?")) return;

        try {
            const res = await fetch(`/api/admin/sections/${id}`, { method: "DELETE" });
            if (res.ok) {
                showMessage("success", "Section deleted!");
                await fetchSections();
            } else {
                showMessage("error", "Failed to delete section");
            }
        } catch {
            showMessage("error", "An error occurred");
        }
    };

    const togglePublish = async (section: Section) => {
        try {
            await fetch(`/api/admin/sections/${section.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_published: !section.is_published }),
            });
            await fetchSections();
            showMessage("success", section.is_published ? "Section unpublished" : "Section published");
        } catch {
            showMessage("error", "Failed to update section");
        }
    };

    const moveSection = async (section: Section, direction: "up" | "down") => {
        const currentIndex = sections.findIndex((s) => s.id === section.id);
        const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

        if (newIndex < 0 || newIndex >= sections.length) return;

        const otherSection = sections[newIndex];

        try {
            await Promise.all([
                fetch(`/api/admin/sections/${section.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ order_index: otherSection.order_index }),
                }),
                fetch(`/api/admin/sections/${otherSection.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ order_index: section.order_index }),
                }),
            ]);
            await fetchSections();
        } catch {
            showMessage("error", "Failed to reorder sections");
        }
    };

    const openCreateModal = () => {
        setIsCreating(true);
        setEditingSection({
            title: "",
            slug: "",
            content: "",
            description: "",
            group_name: "General",
            is_sub_item: false,
            is_published: true,
        });
    };

    const insertSnippet = (code: string) => {
        const currentContent = editingSection?.content || "";
        setEditingSection({
            ...editingSection,
            content: currentContent + (currentContent ? "\n\n" : "") + code,
        });
        setShowSnippets(false);
    };

    const generateSlug = (title: string) => {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");
    };

    return (
        <div className="flex h-screen bg-background">
            {/* Mobile overlay */}
            <div
                className={cn(
                    "fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity",
                    sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={() => setSidebarOpen(false)}
            />

            {/* Sidebar */}
            <aside className={cn(
                "w-[260px] bg-background border-r border-border flex flex-col h-full z-50",
                "fixed lg:relative transition-transform duration-200",
                "lg:translate-x-0",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto pt-6">
                    <NavItem icon={<LayoutDashboard className="w-5 h-5" />} label="Dashboard" active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} />
                    <NavItem icon={<FileText className="w-5 h-5" />} label="Sections" active={activeTab === "sections"} onClick={() => setActiveTab("sections")} />
                    <NavItem icon={<Settings className="w-5 h-5" />} label="Settings" active={activeTab === "settings"} onClick={() => setActiveTab("settings")} />
                </nav>

                <div className="p-4 border-t border-border flex-shrink-0">
                    <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer bg-transparent border-none text-sm font-medium">
                        <LogOut className="w-5 h-5" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                {/* Header - Same as docs page */}
                <header className="h-[60px] bg-background border-b border-border flex items-center justify-between px-4 sm:px-6 lg:px-8 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 -ml-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors border-none bg-transparent cursor-pointer"
                            aria-label="Toggle menu"
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        <Link href="/admin/dashboard" className="text-lg font-semibold tracking-tight text-foreground no-underline">
                            LUNABY
                            <span className="bg-gradient-to-r from-muted-foreground to-muted-foreground/50 bg-clip-text text-transparent ml-1">
                                DOCS
                            </span>
                        </Link>
                    </div>

                    <div className="flex items-center gap-2">
                        <a
                            href="/"
                            target="_blank"
                            className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-muted-foreground text-sm font-medium hover:text-foreground transition-all no-underline"
                        >
                            <ExternalLink className="w-4 h-4" />
                            <span className="hidden lg:inline">View Docs</span>
                        </a>
                        <ThemeToggle />
                    </div>
                </header>

                {/* Toast */}
                {message && (
                    <div className={cn(
                        "fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg",
                        message.type === "success" ? "bg-green-500/10 border border-green-500/20 text-green-500" : "bg-destructive/10 border border-destructive/20 text-destructive"
                    )}>
                        {message.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        <span className="text-sm font-medium">{message.text}</span>
                    </div>
                )}

                {/* Content */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-6">
                    {/* Dashboard Tab */}
                    {activeTab === "dashboard" && (
                        <>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                <StatCard label="Total Sections" value={sections.length} icon={<FileText className="w-5 h-5" />} />
                                <StatCard label="Published" value={sections.filter((s) => Boolean(s.is_published)).length} icon={<Eye className="w-5 h-5" />} />
                                <StatCard label="Draft" value={sections.filter((s) => !Boolean(s.is_published)).length} icon={<Edit className="w-5 h-5" />} />
                                <StatCard label="Groups" value={new Set(sections.map((s) => s.group_name)).size} icon={<LayoutDashboard className="w-5 h-5" />} />
                            </div>

                            <div className="bg-card border border-border rounded-xl p-6">
                                <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    <button onClick={() => { setActiveTab("sections"); openCreateModal(); }} className="flex items-center gap-3 p-4 bg-secondary/50 hover:bg-secondary rounded-lg transition-colors cursor-pointer border-none text-left">
                                        <Plus className="w-5 h-5 text-primary" />
                                        <span className="font-medium">Add New Section</span>
                                    </button>
                                    <button onClick={() => setActiveTab("sections")} className="flex items-center gap-3 p-4 bg-secondary/50 hover:bg-secondary rounded-lg transition-colors cursor-pointer border-none text-left">
                                        <FileText className="w-5 h-5 text-primary" />
                                        <span className="font-medium">Manage Sections</span>
                                    </button>
                                    <a href="/" target="_blank" className="flex items-center gap-3 p-4 bg-secondary/50 hover:bg-secondary rounded-lg transition-colors text-left no-underline text-foreground">
                                        <Eye className="w-5 h-5 text-primary" />
                                        <span className="font-medium">Preview Documentation</span>
                                    </a>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Sections Tab */}
                    {activeTab === "sections" && (
                        <div className="bg-card border border-border rounded-xl overflow-hidden">
                            <div className="p-4 lg:p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <h2 className="text-lg font-semibold">All Sections</h2>
                                <button onClick={openCreateModal} className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors cursor-pointer border-none">
                                    <Plus className="w-4 h-4" />
                                    Add Section
                                </button>
                            </div>

                            {loading ? (
                                <div className="p-8 text-center text-muted-foreground">Loading...</div>
                            ) : sections.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground">
                                    <p>No sections yet.</p>
                                    <button onClick={openCreateModal} className="mt-4 text-primary hover:underline cursor-pointer bg-transparent border-none">
                                        Create your first section
                                    </button>
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {sections.map((section, idx) => (
                                        <div key={section.id} className="p-4 lg:px-6 flex items-center gap-4 hover:bg-secondary/20">
                                            <div className="flex flex-col gap-1">
                                                <button onClick={() => moveSection(section, "up")} disabled={idx === 0} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer bg-transparent border-none disabled:cursor-not-allowed" aria-label="Move up">
                                                    <ChevronUp className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => moveSection(section, "down")} disabled={idx === sections.length - 1} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer bg-transparent border-none disabled:cursor-not-allowed" aria-label="Move down">
                                                    <ChevronDown className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-medium">{section.title}</span>
                                                    <span className="text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">{section.group_name}</span>
                                                    {Boolean(section.is_sub_item) && <span className="text-xs text-muted-foreground">• Sub-item</span>}
                                                </div>
                                                <p className="text-sm text-muted-foreground truncate">/{section.slug}</p>
                                            </div>

                                            <button onClick={() => togglePublish(section)} className={cn("px-2 py-1 text-xs rounded-full cursor-pointer border-none whitespace-nowrap", Boolean(section.is_published) ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500")}>
                                                {Boolean(section.is_published) ? "Published" : "Draft"}
                                            </button>

                                            <div className="flex items-center gap-1">
                                                <button onClick={() => setEditingSection(section)} className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg cursor-pointer bg-transparent border-none" aria-label="Edit">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDeleteSection(section.id)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer bg-transparent border-none" aria-label="Delete">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Settings Tab */}
                    {activeTab === "settings" && (
                        <div className="space-y-6 max-w-2xl">
                            {/* Theme Colors */}
                            <div className="bg-card border border-border rounded-xl p-6">
                                <h2 className="text-lg font-semibold mb-6">Theme Colors</h2>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Customize the color scheme of your documentation. Changes are applied in real-time.
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Primary</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                defaultValue="#7F00FF"
                                                onChange={(e) => {
                                                    document.documentElement.style.setProperty('--color-primary', e.target.value);
                                                    document.documentElement.style.setProperty('--color-ring', e.target.value);
                                                }}
                                                className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                defaultValue="#7F00FF"
                                                onChange={(e) => {
                                                    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                                                        document.documentElement.style.setProperty('--color-primary', e.target.value);
                                                        document.documentElement.style.setProperty('--color-ring', e.target.value);
                                                    }
                                                }}
                                                className="flex-1 px-3 py-2 bg-secondary border border-border rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                placeholder="#7F00FF"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Background</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                defaultValue="#000000"
                                                onChange={(e) => {
                                                    document.documentElement.style.setProperty('--color-background', e.target.value);
                                                }}
                                                className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                defaultValue="#000000"
                                                onChange={(e) => {
                                                    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                                                        document.documentElement.style.setProperty('--color-background', e.target.value);
                                                    }
                                                }}
                                                className="flex-1 px-3 py-2 bg-secondary border border-border rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                placeholder="#000000"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Card</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                defaultValue="#0a0a0a"
                                                onChange={(e) => {
                                                    document.documentElement.style.setProperty('--color-card', e.target.value);
                                                }}
                                                className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                defaultValue="#0a0a0a"
                                                onChange={(e) => {
                                                    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                                                        document.documentElement.style.setProperty('--color-card', e.target.value);
                                                    }
                                                }}
                                                className="flex-1 px-3 py-2 bg-secondary border border-border rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                placeholder="#0a0a0a"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Border</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                defaultValue="#212121"
                                                onChange={(e) => {
                                                    document.documentElement.style.setProperty('--color-border', e.target.value);
                                                }}
                                                className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                defaultValue="#212121"
                                                onChange={(e) => {
                                                    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                                                        document.documentElement.style.setProperty('--color-border', e.target.value);
                                                    }
                                                }}
                                                className="flex-1 px-3 py-2 bg-secondary border border-border rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                placeholder="#212121"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Destructive</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                defaultValue="#ef4444"
                                                onChange={(e) => {
                                                    document.documentElement.style.setProperty('--color-destructive', e.target.value);
                                                }}
                                                className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                defaultValue="#ef4444"
                                                onChange={(e) => {
                                                    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                                                        document.documentElement.style.setProperty('--color-destructive', e.target.value);
                                                    }
                                                }}
                                                className="flex-1 px-3 py-2 bg-secondary border border-border rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                placeholder="#ef4444"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Secondary</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                defaultValue="#171717"
                                                onChange={(e) => {
                                                    document.documentElement.style.setProperty('--color-secondary', e.target.value);
                                                }}
                                                className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                defaultValue="#171717"
                                                onChange={(e) => {
                                                    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                                                        document.documentElement.style.setProperty('--color-secondary', e.target.value);
                                                    }
                                                }}
                                                className="flex-1 px-3 py-2 bg-secondary border border-border rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                placeholder="#171717"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <p className="mt-4 text-xs text-muted-foreground">
                                    Note: Colors are previewed in real-time but not persisted. To save permanently, update the CSS variables in <code className="bg-secondary px-1 py-0.5 rounded">globals.css</code>.
                                </p>
                            </div>

                            {/* Site Settings */}
                            <div className="bg-card border border-border rounded-xl p-6">
                                <h2 className="text-lg font-semibold mb-6">Site Settings</h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2" htmlFor="siteTitle">Site Title</label>
                                        <input id="siteTitle" type="text" value={settings.siteTitle} onChange={(e) => setSettings({ ...settings, siteTitle: e.target.value })} className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Site title" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2" htmlFor="baseUrl">Base URL</label>
                                        <input id="baseUrl" type="text" value={settings.baseUrl} onChange={(e) => setSettings({ ...settings, baseUrl: e.target.value })} className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="https://api.example.com" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2" htmlFor="version">Version</label>
                                        <input id="version" type="text" value={settings.version} onChange={(e) => setSettings({ ...settings, version: e.target.value })} className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="1.0.0" />
                                    </div>
                                    <button onClick={() => showMessage("success", "Settings saved!")} className="mt-4 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors cursor-pointer border-none">
                                        Save Changes
                                    </button>
                                </div>
                            </div>

                            {/* Export/Import */}
                            <div className="bg-card border border-border rounded-xl p-6">
                                <h2 className="text-lg font-semibold mb-6">Data Management</h2>
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-sm font-medium mb-2">Export Data</h3>
                                        <p className="text-sm text-muted-foreground mb-3">Download all sections as a JSON file for backup or migration.</p>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const res = await fetch("/api/admin/export");
                                                    const blob = await res.blob();
                                                    const url = URL.createObjectURL(blob);
                                                    const a = document.createElement("a");
                                                    a.href = url;
                                                    a.download = `lunaby-docs-${Date.now()}.json`;
                                                    a.click();
                                                    URL.revokeObjectURL(url);
                                                    showMessage("success", "Data exported successfully!");
                                                } catch {
                                                    showMessage("error", "Export failed");
                                                }
                                            }}
                                            className="px-4 py-2 bg-secondary text-foreground text-sm font-medium rounded-lg hover:bg-secondary/80 transition-colors cursor-pointer border border-border"
                                        >
                                            Export JSON
                                        </button>
                                    </div>

                                    <hr className="border-border" />

                                    <div>
                                        <h3 className="text-sm font-medium mb-2">Import Data</h3>
                                        <p className="text-sm text-muted-foreground mb-3">Upload a JSON file to import sections. You can choose to replace all existing sections or append.</p>
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <input
                                                type="file"
                                                accept=".json"
                                                id="importFile"
                                                className="hidden"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;

                                                    try {
                                                        const text = await file.text();
                                                        const data = JSON.parse(text);

                                                        const replaceAll = confirm("Replace all existing sections? Click OK to replace, Cancel to append.");

                                                        const res = await fetch("/api/admin/import", {
                                                            method: "POST",
                                                            headers: { "Content-Type": "application/json" },
                                                            body: JSON.stringify({ sections: data.sections, replaceAll }),
                                                        });

                                                        const result = await res.json();
                                                        if (res.ok) {
                                                            showMessage("success", result.message || "Import successful!");
                                                            await fetchSections();
                                                        } else {
                                                            showMessage("error", result.error || "Import failed");
                                                        }
                                                    } catch (err) {
                                                        showMessage("error", "Invalid JSON file");
                                                    }
                                                    e.target.value = "";
                                                }}
                                            />
                                            <label
                                                htmlFor="importFile"
                                                className="px-4 py-2 bg-secondary text-foreground text-sm font-medium rounded-lg hover:bg-secondary/80 transition-colors cursor-pointer border border-border text-center"
                                            >
                                                Choose File & Import
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Edit Modal */}
            {(editingSection || isCreating) && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-2 sm:p-4">
                    <div className="bg-card border border-border rounded-xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="p-4 sm:p-6 border-b border-border flex items-center justify-between flex-shrink-0">
                            <h2 className="text-lg font-semibold">{isCreating ? "New Section" : "Edit Section"}</h2>
                            <button onClick={() => { setEditingSection(null); setIsCreating(false); }} className="p-2 text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-none" aria-label="Close">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Title *</label>
                                    <input
                                        type="text"
                                        value={editingSection?.title || ""}
                                        onChange={(e) => {
                                            const title = e.target.value;
                                            setEditingSection({
                                                ...editingSection,
                                                title,
                                                slug: editingSection?.slug || generateSlug(title),
                                            });
                                        }}
                                        className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        placeholder="Section title"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Slug *</label>
                                    <input
                                        type="text"
                                        value={editingSection?.slug || ""}
                                        onChange={(e) => setEditingSection({ ...editingSection, slug: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        placeholder="section-slug"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Group</label>
                                    <select
                                        value={editingSection?.group_name || "General"}
                                        onChange={(e) => setEditingSection({ ...editingSection, group_name: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                                        aria-label="Group"
                                    >
                                        <option value="General">General</option>
                                        <option value="Guides">Guides</option>
                                        <option value="API">API</option>
                                        <option value="Examples">Examples</option>
                                    </select>
                                </div>
                                <div className="flex items-end">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={editingSection?.is_sub_item || false} onChange={(e) => setEditingSection({ ...editingSection, is_sub_item: e.target.checked })} className="w-4 h-4 rounded" />
                                        <span className="text-sm">Sub-item</span>
                                    </label>
                                </div>
                                <div className="flex items-end">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={editingSection?.is_published !== false} onChange={(e) => setEditingSection({ ...editingSection, is_published: e.target.checked })} className="w-4 h-4 rounded" />
                                        <span className="text-sm">Published</span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Description</label>
                                <input
                                    type="text"
                                    value={editingSection?.description || ""}
                                    onChange={(e) => setEditingSection({ ...editingSection, description: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder="Short description for SEO"
                                />
                            </div>

                            {/* Content Editor */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium">Content (MDX)</label>
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowSnippets(!showSnippets)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-secondary rounded-lg cursor-pointer border-none"
                                        >
                                            <Code className="w-3 h-3" />
                                            Insert Component
                                        </button>
                                        {showSnippets && (
                                            <div className="absolute right-0 top-full mt-1 w-64 bg-card border border-border rounded-lg shadow-xl z-10 overflow-hidden">
                                                {CODE_SNIPPETS.map((snippet) => (
                                                    <button
                                                        key={snippet.name}
                                                        onClick={() => insertSnippet(snippet.code)}
                                                        className="flex items-center justify-between w-full px-3 py-2.5 text-sm text-left hover:bg-secondary cursor-pointer border-none bg-transparent"
                                                    >
                                                        <span>{snippet.name}</span>
                                                        <Copy className="w-3 h-3 text-muted-foreground" />
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <textarea
                                    value={editingSection?.content || ""}
                                    onChange={(e) => setEditingSection({ ...editingSection, content: e.target.value })}
                                    rows={15}
                                    className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none font-mono text-sm leading-relaxed"
                                    placeholder="# Section Title

Your content here...

<CodeBlock ... />"
                                />
                                <p className="mt-2 text-xs text-muted-foreground">
                                    Use Markdown for text. Insert components like CodeBlock, DataTable, ModelGrid using the button above.
                                </p>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 sm:p-6 border-t border-border flex flex-col sm:flex-row justify-end gap-3 flex-shrink-0">
                            <button onClick={() => { setEditingSection(null); setIsCreating(false); }} className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer bg-transparent border border-border rounded-lg">
                                Cancel
                            </button>
                            <button onClick={handleSaveSection} disabled={saving} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors cursor-pointer border-none">
                                <Save className="w-4 h-4" />
                                {saving ? "Saving..." : "Save Section"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
