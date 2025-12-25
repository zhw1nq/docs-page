import { NextRequest, NextResponse } from "next/server";
import { createSection, getAllSections, deleteSection } from "@/lib/database";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { sections, replaceAll } = body;

        if (!sections || !Array.isArray(sections)) {
            return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
        }

        // If replaceAll, delete existing sections first
        if (replaceAll) {
            const existing = getAllSections();
            for (const section of existing) {
                deleteSection(section.id);
            }
        }

        // Import sections
        let imported = 0;
        for (const section of sections) {
            try {
                createSection({
                    title: section.title,
                    slug: section.slug,
                    content: section.content,
                    description: section.description,
                    group_name: section.group_name || "General",
                    is_sub_item: section.is_sub_item,
                    is_published: section.is_published !== false,
                });
                imported++;
            } catch (e) {
                console.error("Failed to import section:", section.title, e);
            }
        }

        return NextResponse.json({
            success: true,
            imported,
            message: `Successfully imported ${imported} sections`
        });
    } catch (error) {
        console.error("Import error:", error);
        return NextResponse.json({ error: "Import failed" }, { status: 500 });
    }
}
