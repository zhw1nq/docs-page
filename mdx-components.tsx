import type { MDXComponents } from "mdx/types";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { DataTable } from "@/components/docs/DataTable";
import { ModelGrid } from "@/components/docs/ModelCard";

export function useMDXComponents(components: MDXComponents): MDXComponents {
    return {
        h1: ({ children }) => (
            <h1 className="text-3xl lg:text-4xl font-bold mb-4 lg:mb-6 tracking-tight">
                {children}
            </h1>
        ),
        h2: ({ children }) => (
            <h2 className="text-xl lg:text-2xl font-semibold mb-4 lg:mb-6 mt-12">
                {children}
            </h2>
        ),
        h3: ({ children }) => (
            <h3 className="text-base lg:text-lg font-semibold mt-8 mb-4">{children}</h3>
        ),
        p: ({ children }) => (
            <p className="text-muted-foreground text-sm lg:text-base leading-relaxed mb-4">
                {children}
            </p>
        ),
        code: ({ children, className }) => {
            const isInline = !className;
            if (isInline) {
                return (
                    <code className="bg-secondary px-1.5 py-0.5 rounded text-sm font-mono">
                        {children}
                    </code>
                );
            }
            return <code className={className}>{children}</code>;
        },
        pre: ({ children }) => <div className="my-4">{children}</div>,
        ul: ({ children }) => (
            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
                {children}
            </ul>
        ),
        ol: ({ children }) => (
            <ol className="list-decimal list-inside text-muted-foreground mb-4 space-y-1">
                {children}
            </ol>
        ),
        a: ({ href, children }) => (
            <a
                href={href}
                className="text-primary hover:underline"
                target={href?.startsWith("http") ? "_blank" : undefined}
                rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
            >
                {children}
            </a>
        ),
        // Custom components
        CodeBlock,
        DataTable,
        ModelGrid,
        ...components,
    };
}
