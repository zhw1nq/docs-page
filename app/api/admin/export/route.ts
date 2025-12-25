import { NextResponse } from "next/server";
import { getAllSections } from "@/lib/database";

export async function GET() {
    try {
        const sections = getAllSections();

        const exportData = {
            version: "1.0",
            exportedAt: new Date().toISOString(),
            sections: sections.map((s) => ({
                title: s.title,
                slug: s.slug,
                content: s.content,
                description: s.description,
                group_name: s.group_name,
                order_index: s.order_index,
                is_sub_item: Boolean(s.is_sub_item),
                is_published: Boolean(s.is_published),
            })),
        };

        return new NextResponse(JSON.stringify(exportData, null, 2), {
            headers: {
                "Content-Type": "application/json",
                "Content-Disposition": `attachment; filename="lunaby-docs-export-${Date.now()}.json"`,
            },
        });
    } catch (error) {
        console.error("Export error:", error);
        return NextResponse.json({ error: "Export failed" }, { status: 500 });
    }
}
