import { NextRequest, NextResponse } from "next/server";
import { getAllSections, createSection } from "@/lib/database";

export async function GET() {
    try {
        const sections = getAllSections();
        return NextResponse.json({ sections });
    } catch (error) {
        console.error("Get sections error:", error);
        return NextResponse.json(
            { error: "Failed to fetch sections" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, slug, content, description, group_name, is_sub_item, is_published } = body;

        if (!title || !slug) {
            return NextResponse.json(
                { error: "Title and slug are required" },
                { status: 400 }
            );
        }

        const result = createSection({
            title,
            slug,
            content,
            description,
            group_name,
            is_sub_item,
            is_published,
        });

        return NextResponse.json({ id: result.id }, { status: 201 });
    } catch (error) {
        console.error("Create section error:", error);
        return NextResponse.json(
            { error: "Failed to create section" },
            { status: 500 }
        );
    }
}
