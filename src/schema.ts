// DEPRECATED: This legacy schema (Span, Header, List, Page) has been replaced by the richer
// MDAST-inspired schema in `mdastSchema.ts`. New code should import from `mdastSchema.ts`.
// The file is retained temporarily for reference and potential migration utilities.
import { SchemaFactoryAlpha } from "@fluidframework/tree/alpha";

const sf = new SchemaFactoryAlpha("com.microsoft.fluid.tree-agent.text2");

export interface ToMarkdown {
    toMarkdown(): string;
}

export class Span extends sf.objectAlpha(
	"Span",
	{
		text: sf.required(sf.string, {metadata: {description: "This is plain text only - readable characters and whitespace. This property should include any spaces or newlines to delimit the text - adjacent spans will not otherwise have any whitespace between them. No styling should be attempted here (e.g. do not surround bold text with asterisks, instead, use the appropriate formatting properties on this Span object)."}}),
		bold: sf.optional(sf.boolean),
		italic: sf.optional(sf.boolean),
		strikethrough: sf.optional(sf.boolean),
		// author: sf.optional(sf.string),
		// comments: sf.optional(sf.array(sf.string)),
	},
	{
		metadata: {
			description:
				"A run of text with optional formatting. They are of arbitrary size - they might contain a single character or a whole sentence/paragraph. When spans are granular - e.g. corresponding to a single word or punctuation mark - they improve merge outcomes during collaborative editing. Spans do not imply any specific relationship between adjacent spans - e.g. two adjacent spans should not be assumed to have a space or a newline placed between them. For example, a paragraph containing 'Hello world!' might be represented as [Span{text:'Hello '}, Span{text:'world!\n'}] - note the trailing whitespace characters.",
		},
	},
) implements ToMarkdown {
	public toMarkdown(): string {
		let text = this.text;
		if (text.length === 0) {
			return "";
		}
		if (this.strikethrough === true) {
			text = `~~${text}~~`;
		}
		if (this.bold === true) {
			text = `**${text}**`;
		}
		if (this.italic === true) {
			text = `_${text}_`;
		}
		return text;
	}
}

export class Header extends sf.object("Header", {
	spans: sf.array(Span),
	level: sf.required(sf.number, {
		metadata: {
			description:
				"The precedence of the header. A value of 1 is the highest level (e.g. a document title). A value of 2 is a section header, a value of 3 is a subsection, and so on.",
		},
	}),
}) implements ToMarkdown {
	public toMarkdown(): string {
		const level = this.level ?? 1;
		const prefix = "#".repeat(Math.max(1, Math.min(6, level)));
		const text = this.spans
			.map((s) => s.toMarkdown())
			.filter((s) => s.length > 0)
			.join("");

		return `${prefix} ${text}`.trimEnd();
	}
}

export class ListItems extends sf.arrayRecursive("ListItems", [() => List, Span]) {}
export class List extends sf.objectRecursive("List", {
	items: ListItems,
	ordered: sf.required(sf.boolean, {
		metadata: {
			description:
				"Whether the list is ordered (e.g. item 1, 2, 3, ...) or unordered (e.g. bullet points).",
		},
	}),
}) implements ToMarkdown {
	public toMarkdown(depth: number = 0): string {
		const result: string[] = [];
		for (let i = 0; i < this.items.length; i++) {
			const item = this.items[i] as List | Span;
			if (item instanceof List) {
				result.push(...item.toMarkdown(depth + 1));
			} else if (item instanceof Span) {
				const bulletBase = this.ordered ? `${i + 1}.` : "-";
				const indent = "  ".repeat(depth);
				result.push(`${indent}${bulletBase} ${item.toMarkdown()}`.trimEnd());
			}
		}
		return result.join("\n");
	}
}

export class Page extends sf.object("Page", {
	contents: sf.array([Header, List, Span]),
}) implements ToMarkdown {
	public toMarkdown(): string {
		let markdown = "";

		function appendBlock(text: string): void {
			// Ensure block starts on a new line if prior content does not already end with one.
			if (markdown.length > 0 && !markdown.endsWith("\n")) {
				markdown += "\n";
			}
			markdown += text;
			if (!markdown.endsWith("\n")) {
				markdown += "\n";
			}
		}

		for (const node of this.contents) {
			if (node instanceof Header) {
				appendBlock(node.toMarkdown());
			} else if (node instanceof List) {
				appendBlock(node.toMarkdown(0));
			} else if (node instanceof Span) {
				markdown += node.toMarkdown();
			}
		}
		return markdown;
	}
}
