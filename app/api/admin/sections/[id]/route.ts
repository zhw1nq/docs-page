import { NextRequest, NextResponse } from "next/server";
import { getSectionBySlug, updateSection, deleteSection } from "@/lib/database";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const section = getSectionBySlug(id);

        if (!section) {
            return NextResponse.json(
                { error: "Section not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ section });
    } catch (error) {
        console.error("Get section error:", error);
        return NextResponse.json(
            { error: "Failed to fetch section" },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        const sectionId = parseInt(id, 10);
        if (isNaN(sectionId)) {
            return NextResponse.json(
                { error: "Invalid section ID" },
                { status: 400 }
            );
        }

        updateSection(sectionId, body);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Update section error:", error);
        return NextResponse.json(
            { error: "Failed to update section" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const sectionId = parseInt(id, 10);

        if (isNaN(sectionId)) {
            return NextResponse.json(
                { error: "Invalid section ID" },
                { status: 400 }
            );
        }

        deleteSection(sectionId);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete section error:", error);
        return NextResponse.json(
            { error: "Failed to delete section" },
            { status: 500 }
        );
    }
}
