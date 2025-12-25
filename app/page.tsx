"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Footer } from "@/components/layout/Footer";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { ModelGrid } from "@/components/docs/ModelCard";
import { DataTable } from "@/components/docs/DataTable";

interface NavItem {
  id: string;
  label: string;
  isSubItem?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

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

export default function DocsPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [navigation, setNavigation] = useState<NavGroup[]>([]);
  const [sectionIds, setSectionIds] = useState<string[]>([]);
  const [activeSection, setActiveSection] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const mainRef = useRef<HTMLDivElement>(null);

  // Fetch sections from API
  useEffect(() => {
    async function fetchDocs() {
      try {
        const res = await fetch("/api/docs");
        const data = await res.json();
        const docs = data.sections || [];

        setSections(docs);
        setSectionIds(docs.map((s: Section) => s.slug));

        // Build navigation
        const groups: Record<string, NavItem[]> = {};
        for (const doc of docs) {
          if (!groups[doc.group_name]) {
            groups[doc.group_name] = [];
          }
          groups[doc.group_name].push({
            id: doc.slug,
            label: doc.title,
            isSubItem: Boolean(doc.is_sub_item),
          });
        }

        const groupOrder = ["General", "Guides", "API", "Examples"];
        const sortedGroups = Object.entries(groups).sort(([a], [b]) => {
          const aIdx = groupOrder.indexOf(a);
          const bIdx = groupOrder.indexOf(b);
          if (aIdx === -1 && bIdx === -1) return a.localeCompare(b);
          if (aIdx === -1) return 1;
          if (bIdx === -1) return -1;
          return aIdx - bIdx;
        });

        setNavigation(sortedGroups.map(([title, items]) => ({ title, items })));

        if (docs.length > 0) {
          setActiveSection(docs[0].slug);
        }
      } catch (error) {
        console.error("Failed to fetch docs:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDocs();
  }, []);

  const handleNavigate = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element && mainRef.current) {
      const offset = element.offsetTop - 100;
      mainRef.current.scrollTo({ top: offset, behavior: "smooth" });
    }
  }, []);

  // Scroll detection
  useEffect(() => {
    const mainElement = mainRef.current;
    if (!mainElement || sectionIds.length === 0) return;

    const observerOptions = {
      root: mainElement,
      rootMargin: "-20% 0px -60% 0px",
      threshold: 0,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, observerOptions);

    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [sectionIds]);

  // Close sidebar on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        isSidebarOpen={sidebarOpen}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          navigation={navigation}
          activeSection={activeSection}
          onNavigate={handleNavigate}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main ref={mainRef} className="flex-1 overflow-y-auto bg-background">
          <div className="max-w-[800px] mx-auto px-4 sm:px-6 lg:px-12 py-8 lg:py-12">
            {sections.map((section) => (
              <section
                key={section.slug}
                id={section.slug}
                className="mb-16 lg:mb-20 scroll-mt-24"
              >
                <DocContent content={section.content || `# ${section.title}\n\n${section.description || ""}`} />
              </section>
            ))}

            {sections.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p>No documentation sections available.</p>
                <p className="text-sm mt-2">Add sections from the admin panel.</p>
              </div>
            )}
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}

// Content renderer
function DocContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    // Headers
    if (line.startsWith("# ")) {
      elements.push(
        <h1 key={key++} className="text-3xl lg:text-4xl font-bold mb-4 lg:mb-6 tracking-tight">
          {line.slice(2)}
        </h1>
      );
      i++;
      continue;
    }

    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={key++} className="text-xl lg:text-2xl font-semibold mb-4 lg:mb-6 mt-8">
          {line.slice(3)}
        </h2>
      );
      i++;
      continue;
    }

    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={key++} className="text-base lg:text-lg font-semibold mt-8 mb-4">
          {line.slice(4)}
        </h3>
      );
      i++;
      continue;
    }

    // Component blocks
    if (line.trim().startsWith("<CodeBlock") ||
      line.trim().startsWith("<DataTable") ||
      line.trim().startsWith("<ModelGrid")) {

      let componentStr = line;
      let depth = 1;

      if (!line.includes("/>") && !line.includes("</")) {
        i++;
        while (i < lines.length && depth > 0) {
          componentStr += "\n" + lines[i];
          if (lines[i].includes("<CodeBlock") || lines[i].includes("<DataTable") || lines[i].includes("<ModelGrid")) {
            depth++;
          }
          if (lines[i].includes("/>") || lines[i].includes("</")) {
            depth--;
          }
          i++;
        }
      } else {
        i++;
      }

      try {
        const parsed = parseComponent(componentStr);
        if (parsed) {
          elements.push(<div key={key++}>{parsed}</div>);
        }
      } catch (e) {
        console.error("Failed to parse:", e);
      }
      continue;
    }

    // Paragraph
    if (line.trim() && !line.startsWith("<")) {
      elements.push(
        <p key={key++} className="text-muted-foreground text-sm lg:text-base leading-relaxed mb-4">
          {line}
        </p>
      );
    }

    i++;
  }

  return <>{elements}</>;
}

function parseComponent(str: string): React.ReactNode | null {
  try {
    const nameMatch = str.match(/<(\w+)/);
    if (!nameMatch) return null;
    const componentName = nameMatch[1];

    if (componentName === "CodeBlock") {
      const titleMatch = str.match(/title=["']([^"']+)["']/);
      const title = titleMatch ? titleMatch[1] : undefined;
      const tabsMatch = str.match(/tabs=\{(\[[\s\S]*?\])\}/);
      const tabs = tabsMatch ? eval(tabsMatch[1]) : [];
      const dropdownMatch = str.match(/dropdownTabs=\{(\[[\s\S]*?\])\}/);
      const dropdownTabs = dropdownMatch ? eval(dropdownMatch[1]) : [];
      return <CodeBlock tabs={tabs} title={title} dropdownTabs={dropdownTabs} />;
    }

    if (componentName === "DataTable") {
      const headersMatch = str.match(/headers=\{(\[[\s\S]*?\])\}/);
      const headers = headersMatch ? eval(headersMatch[1]) : [];
      const rowsMatch = str.match(/rows=\{(\[[\s\S]*?\])\}/);
      const rows = rowsMatch ? eval(rowsMatch[1]) : [];
      return <DataTable headers={headers} rows={rows} />;
    }

    if (componentName === "ModelGrid") {
      const modelsMatch = str.match(/models=\{(\[[\s\S]*?\])\}/);
      const models = modelsMatch ? eval(modelsMatch[1]) : [];
      return <ModelGrid models={models} />;
    }

    return null;
  } catch (e) {
    console.error("Parse error:", e);
    return null;
  }
}
