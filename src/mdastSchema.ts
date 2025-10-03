import { SchemaFactoryAlpha } from "@fluidframework/tree/alpha";

// MDAST-inspired schema implemented using SharedTree SchemaFactoryAlpha.
// This covers a practical subset of Markdown AST node types with bidirectional-friendly granular nodes.
// Each node implements toMarkdown() for straightforward serialization.

const sf = new SchemaFactoryAlpha("com.microsoft.fluid.tree-agent.text2.mdast");

export interface ToMarkdown {
  toMarkdown(): string;
}

// Utility: escape inline text for basic markdown punctuation when it could alter structure.
function escapeInline(text: string): string {
  // This is intentionally minimal; consumers can extend.
  return text
    .replace(/([*_`~\\])/g, "\\$1")
    .replace(/^(\s*#[#\s]*)/gm, (m) => m.replace(/#/g, "\\#"));
}

// Text node
export class Text extends sf.objectAlpha(
  "Text",
  {
    value: sf.required(sf.string, {
      metadata: { description: "Raw text content (unformatted)." },
    }),
  },
  { metadata: { description: "MDAST Text node." } }
) implements ToMarkdown {
  public toMarkdown(): string {
    return escapeInline(this.value);
  }
}

// Forward declarations (via recursive arrays) require function references.
// Hard line break (two trailing spaces + newline in markdown)
export class BreakNode extends sf.objectAlpha(
  "Break",
  {},
  { metadata: { description: "Hard line break (markdown two-space break)." } }
) implements ToMarkdown {
  public toMarkdown(): string {
    return "  \n"; // two spaces + newline
  }
}

export class InlineCode extends sf.objectAlpha(
  "InlineCode",
  {
    value: sf.required(sf.string, { metadata: { description: "Inline code snippet." } }),
  }
) implements ToMarkdown {
  public toMarkdown(): string {
    const v = this.value;
    // Choose fence length > max backtick run inside.
    const longestBacktickRun = (v.match(/`+/g) || []).reduce((m, s) => Math.max(m, s.length), 0);
    const fence = "`".repeat(Math.max(1, longestBacktickRun + 1));
    return fence + v + fence;
  }
}

// Emphasis / Strong / Delete wrappers are recursive phrasing containers.
export const EmphasisChildren = sf.arrayRecursive("EmphasisChildren", [
  () => Text,
  () => Emphasis,
  () => Strong,
  () => DeleteNode,
  () => InlineCode,
  () => Link,
  () => Image,
  () => BreakNode,
]);

export class Emphasis extends sf.objectRecursive("Emphasis", {
  children: EmphasisChildren,
}) implements ToMarkdown {
  public toMarkdown(): string {
    return `*${this.children.map((c: ToMarkdown) => c.toMarkdown()).join("")}*`;
  }
}

export const StrongChildren = sf.arrayRecursive("StrongChildren", [
  () => Text,
  () => Emphasis,
  () => Strong,
  () => DeleteNode,
  () => InlineCode,
  () => Link,
  () => Image,
  () => BreakNode,
]);

export class Strong extends sf.objectRecursive("Strong", {
  children: StrongChildren,
}) implements ToMarkdown {
  public toMarkdown(): string {
    return `**${this.children.map((c: ToMarkdown) => c.toMarkdown()).join("")}**`;
  }
}

export const DeleteChildren = sf.arrayRecursive("DeleteChildren", [
  () => Text,
  () => Emphasis,
  () => Strong,
  () => DeleteNode,
  () => InlineCode,
  () => Link,
  () => Image,
  () => BreakNode,
]);

export class DeleteNode extends sf.objectRecursive("Delete", {
  children: DeleteChildren,
}) implements ToMarkdown {
  public toMarkdown(): string {
    return `~~${this.children.map((c: ToMarkdown) => c.toMarkdown()).join("")}~~`;
  }
}

export const LinkChildren = sf.arrayRecursive("LinkChildren", [
  () => Text,
  () => Emphasis,
  () => Strong,
  () => DeleteNode,
  () => InlineCode,
  () => Image, // images can be nested in links in mdast
  () => BreakNode,
]);

export class Link extends sf.objectRecursive("Link", {
  url: sf.required(sf.string),
  title: sf.optional(sf.string),
  children: LinkChildren,
}) implements ToMarkdown {
  public toMarkdown(): string {
    const text = this.children.map((c: ToMarkdown) => c.toMarkdown()).join("") || this.url;
    const title = this.title ? ` "${this.title.replace(/"/g, '\\"')}"` : "";
    return `[${text}](${this.url}${title})`;
  }
}

export class Image extends sf.objectAlpha(
  "Image",
  {
    url: sf.required(sf.string),
    alt: sf.optional(sf.string),
    title: sf.optional(sf.string),
  }
) implements ToMarkdown {
  public toMarkdown(): string {
    const alt = this.alt ? escapeInline(this.alt) : "";
    const title = this.title ? ` "${this.title.replace(/"/g, '\\"')}"` : "";
    return `![${alt}](${this.url}${title})`;
  }
}

// Phrasing content (inline) aggregate (for convenience in consumer code).
export const PhrasingContent = sf.arrayRecursive("PhrasingContent", [
  () => Text,
  () => Emphasis,
  () => Strong,
  () => DeleteNode,
  () => InlineCode,
  () => Link,
  () => Image,
  () => BreakNode,
]);

// Paragraph
export class Paragraph extends sf.objectRecursive("Paragraph", {
  children: PhrasingContent,
}) implements ToMarkdown {
  public toMarkdown(): string {
    // Collapse consecutive hard breaks properly.
    return this.children.map((c: ToMarkdown) => c.toMarkdown()).join("").replace(/\n{2,}/g, "\n");
  }
}

// Heading (depth 1-6)
export class Heading extends sf.objectRecursive("Heading", {
  depth: sf.required(sf.number),
  children: PhrasingContent,
}) implements ToMarkdown {
  public toMarkdown(): string {
    const d = Math.min(6, Math.max(1, this.depth ?? 1));
    const text = this.children.map((c: ToMarkdown) => c.toMarkdown()).join("");
    return `${"#".repeat(d)} ${text}`.trimEnd();
  }
}

// Thematic break (horizontal rule)
export class ThematicBreak extends sf.objectAlpha(
  "ThematicBreak",
  {},
  { metadata: { description: "Horizontal rule (---)." } }
) implements ToMarkdown {
  public toMarkdown(): string {
    return "---";
  }
}

// Code block
export class CodeBlock extends sf.objectAlpha(
  "CodeBlock",
  {
    lang: sf.optional(sf.string),
    meta: sf.optional(sf.string),
    value: sf.required(sf.string, { metadata: { description: "Full code block text." } }),
  }
) implements ToMarkdown {
  public toMarkdown(): string {
    const v = this.value.replace(/\n$/, ""); // avoid extra blank line
    const longestFence = (v.match(/```+/g) || []).reduce((m, s) => Math.max(m, s.length), 0);
    const fence = "`".repeat(Math.max(3, longestFence + 1));
    const info = [this.lang, this.meta].filter(Boolean).join(" ");
    return `${fence}${info ? " " + info : ""}\n${v}\n${fence}`;
  }
}

// Forward recursive block content declarations used by Blockquote and ListItem.
export const BlockContent = sf.arrayRecursive("BlockContent", [
  () => Paragraph,
  () => Heading,
  () => ThematicBreak,
  () => Blockquote,
  () => List,
  () => CodeBlock,
]);

// Blockquote
export class Blockquote extends sf.objectRecursive("Blockquote", {
  children: BlockContent,
}) implements ToMarkdown {
  public toMarkdown(): string {
    const inner = this.children
      .map((c: ToMarkdown) => c.toMarkdown())
      .join("\n\n")
      .split(/\n/)
      .map((l) => `> ${l}`)
      .join("\n");
    return inner;
  }
}

// Export array schema types for external construction (must precede class definitions for usage elsewhere)
export const ListItemChildren = sf.arrayRecursive("ListItemChildren", [
  () => Paragraph,
  () => Blockquote,
  () => List,
  () => CodeBlock,
]);
export const ListChildren = sf.arrayRecursive("ListChildren", [() => ListItem]);

// List Item
export class ListItem extends sf.objectRecursive("ListItem", {
  checked: sf.optional(sf.boolean), // task list support
  children: ListItemChildren,
}) implements ToMarkdown {
  public toMarkdown(): string {
    return this.render("", 0, false, 1);
  }
  public render(prefix: string, index: number, ordered: boolean, start: number): string {
    const taskBox = this.checked === undefined ? "" : this.checked ? "[x] " : "[ ] ";
    const bullet = ordered ? `${start + index}.` : "-";
    const firstParagraph = this.children[0] as ToMarkdown | undefined;
    const rest = this.children.slice(1) as unknown as ToMarkdown[];
    let content = firstParagraph ? firstParagraph.toMarkdown() : "";
    if (taskBox) content = taskBox + content;
    const bulletLine = `${prefix}${bullet} ${content}`.replace(/\s+$/g, "");
    if (rest.length === 0) return bulletLine;
    const subsequent = rest
      .map((c) => c.toMarkdown())
      .join("\n\n")
      .split(/\n/)
      .map((l) => `${prefix}    ${l}`)
      .join("\n");
    return `${bulletLine}\n${subsequent}`;
  }
}

// List
export class List extends sf.objectRecursive("List", {
  ordered: sf.required(sf.boolean),
  start: sf.optional(sf.number),
  spread: sf.optional(sf.boolean),
  children: ListChildren,
}) implements ToMarkdown {
  public toMarkdown(): string {
    const start = this.start ?? 1;
    const ordered = this.ordered === true;
    const spread = this.spread === true;
    const lines: string[] = [];
    this.children.forEach((item: ListItem, i: number) => {
      lines.push(item.render("", i, ordered, start));
    });
    return lines.join(spread ? "\n\n" : "\n");
  }
}

// Root document
export class Root extends sf.objectRecursive("Root", {
  children: BlockContent,
}) implements ToMarkdown {
  public toMarkdown(): string {
    // Separate block nodes with a single blank line (except thematic breaks & tight list adjacency rules handled individually).
    const parts: string[] = [];
    for (const node of (this.children as unknown as Array<unknown>)) {
      const md = (node as ToMarkdown).toMarkdown().trimEnd();
      if (md.length === 0) continue;
      if (parts.length > 0) {
        // Avoid duplicate blank lines.
        const prev = parts[parts.length - 1];
        if (!/\n\n$/.test(prev)) {
          parts[parts.length - 1] = prev.replace(/\n*$/g, "");
          parts.push("\n\n" + md);
          continue;
        }
      }
      parts.push(md);
    }
    return parts.join("\n\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n"; // end with newline
  }
}

// Convenience export of unions for consumer typing (non-schema):
// Inline node union type (approximate)
export type InlineNode = Text | Emphasis | Strong | DeleteNode | InlineCode | Link | Image | BreakNode;
export type BlockNode = Paragraph | Heading | ThematicBreak | Blockquote | List | CodeBlock;
export type AnyNode = InlineNode | BlockNode | Root | ListItem;
