import { NextResponse } from "next/server";
import { getPublishedSections } from "@/lib/database";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const sections = getPublishedSections();
        return NextResponse.json({ sections });
    } catch (error) {
        console.error("Get docs error:", error);
        return NextResponse.json({ sections: [] });
    }
}
