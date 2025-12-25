import fs from "fs";
import path from "path";
import matter from "gray-matter";

const CONTENT_DIR = path.join(process.cwd(), "content", "docs");

export interface DocSection {
    slug: string;
    title: string;
    order: number;
    group: string;
    isSubItem?: boolean;
    content: string;
}

export interface DocNavItem {
    id: string;
    label: string;
    isSubItem?: boolean;
}

export interface DocNavGroup {
    title: string;
    items: DocNavItem[];
}

export function getAllDocs(): DocSection[] {
    if (!fs.existsSync(CONTENT_DIR)) {
        return [];
    }

    const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".mdx"));

    const docs = files.map((file) => {
        const filePath = path.join(CONTENT_DIR, file);
        const fileContent = fs.readFileSync(filePath, "utf-8");
        const { data, content } = matter(fileContent);

        return {
            slug: data.slug || file.replace(".mdx", ""),
            title: data.title || "Untitled",
            order: data.order || 99,
            group: data.group || "General",
            isSubItem: data.isSubItem || false,
            content,
        };
    });

    return docs.sort((a, b) => a.order - b.order);
}

export function getDocBySlug(slug: string): DocSection | null {
    const docs = getAllDocs();
    return docs.find((d) => d.slug === slug) || null;
}

export function getNavigation(): DocNavGroup[] {
    const docs = getAllDocs();
    const groups: Record<string, DocNavItem[]> = {};

    for (const doc of docs) {
        if (!groups[doc.group]) {
            groups[doc.group] = [];
        }
        groups[doc.group].push({
            id: doc.slug,
            label: doc.title,
            isSubItem: doc.isSubItem,
        });
    }

    // Sort groups - General first, then Guides
    const groupOrder = ["General", "Guides", "API", "Examples"];
    const sortedGroups = Object.entries(groups).sort(([a], [b]) => {
        const aIndex = groupOrder.indexOf(a);
        const bIndex = groupOrder.indexOf(b);
        if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
    });

    return sortedGroups.map(([title, items]) => ({ title, items }));
}

export function getSectionIds(): string[] {
    return getAllDocs().map((d) => d.slug);
}
