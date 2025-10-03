import { independentView } from 'fluid-framework/alpha';
import { TreeViewConfiguration } from '@fluidframework/tree';
import {
  Root,
  Heading,
  Paragraph,
  Text,
  PhrasingContent,
  BlockContent,
  List,
  ListItem,
  ListChildren,
  ListItemChildren,
  Strong,
  StrongChildren,
  Emphasis,
  EmphasisChildren,
  InlineCode,
  Link,
  LinkChildren,
  ThematicBreak,
  CodeBlock,
  Blockquote,
  BreakNode,
  DeleteNode,
  DeleteChildren,
} from './mdastSchema';

// Build an initial sandwich-themed document that exercises most schema node types.
export function createInitialView() {
  const view = independentView(new TreeViewConfiguration({ schema: Root }), {});

  const doc = new Root({
    children: new BlockContent([
      // Title
      new Heading({ depth: 1, children: new PhrasingContent([ new Text({ value: 'The Definitive Guide to Sandwiches' }) ]) }),

      // Intro paragraph with mixed inline formatting.
      new Paragraph({
        children: new PhrasingContent([
          new Text({ value: 'A ' }),
          new Strong({ children: new StrongChildren([ new Text({ value: 'sandwich' }) ]) }),
          new Text({ value: ' is a beautifully adaptable meal: from humble PB&J to towering gourmet constructions. This guide explores structure, technique, and creativity.' }),
        ]),
      }),

      // Thematic break
      new ThematicBreak({}),

      // History section
      new Heading({ depth: 2, children: new PhrasingContent([ new Text({ value: '1. Origins & Definition' }) ]) }),
      new Paragraph({
        children: new PhrasingContent([
          new Text({ value: 'Legend credits John Montagu, the 4th Earl of Sandwich, with popularizing the form: meat between bread enabling continued play at the gaming table.' }),
          new BreakNode({}),
          new Emphasis({ children: new EmphasisChildren([ new Text({ value: 'But:' }) ]) }),
          new Text({ value: ' variations existed globally far earlier.' }),
        ]),
      }),

      // Blockquote containing a paragraph + list
      new Blockquote({
        children: new BlockContent([
          new Paragraph({ children: new PhrasingContent([ new Text({ value: '“Two slices of bread may conceal infinite possibility.”' }) ]) }),
          new List({
            ordered: false,
            children: new ListChildren([
              new ListItem({ children: new ListItemChildren([
                new Paragraph({ children: new PhrasingContent([ new Text({ value: 'Texture contrast matters.' }) ]) }),
              ]) }),
              new ListItem({ children: new ListItemChildren([
                new Paragraph({ children: new PhrasingContent([ new Text({ value: 'Balance salt, fat, acid, and crunch.' }) ]) }),
              ]) }),
            ])
          }),
        ])
      }),

      // Bread section with unordered list + nested list & task list items
      new Heading({ depth: 2, children: new PhrasingContent([ new Text({ value: '2. Bread Selection' }) ]) }),
      new Paragraph({ children: new PhrasingContent([
        new Text({ value: 'Bread is both vessel and ingredient. It should ' }),
        new Emphasis({ children: new EmphasisChildren([ new Text({ value: 'support' }) ]) }),
        new Text({ value: ' fillings without dominating.' }),
      ]) }),
      new List({ ordered: false, children: new ListChildren([
        new ListItem({ checked: true, children: new ListItemChildren([
          new Paragraph({ children: new PhrasingContent([ new Text({ value: 'Sourdough (structure + tang)' }) ]) })
        ]) }),
        new ListItem({ checked: false, children: new ListItemChildren([
          new Paragraph({ children: new PhrasingContent([ new Text({ value: 'Ciabatta (airy crumb, crisp exterior)' }) ]) })
        ]) }),
        new ListItem({ children: new ListItemChildren([
          new Paragraph({ children: new PhrasingContent([ new Text({ value: 'Brioche (soft, subtly sweet)' }) ]) }),
          // Nested ordered list for toasting guidance
          new List({ ordered: true, start: 1, children: new ListChildren([
            new ListItem({ children: new ListItemChildren([
              new Paragraph({ children: new PhrasingContent([ new Text({ value: 'Light toast: preserves tenderness' }) ]) })
            ]) }),
            new ListItem({ children: new ListItemChildren([
              new Paragraph({ children: new PhrasingContent([ new Text({ value: 'Medium toast: adds structure' }) ]) })
            ]) }),
            new ListItem({ children: new ListItemChildren([
              new Paragraph({ children: new PhrasingContent([ new Text({ value: 'Dark toast: risks bitterness' }) ]) })
            ]) }),
          ]) })
        ]) }),
      ]) }),

      // Fillings section
      new Heading({ depth: 2, children: new PhrasingContent([ new Text({ value: '3. Core Components' }) ]) }),
      new Paragraph({ children: new PhrasingContent([
        new Text({ value: 'A balanced sandwich layers: ' }),
        new InlineCode({ value: 'foundation -> moisture barrier -> protein -> accents -> greens -> lid' }),
        new Text({ value: '.' }),
      ]) }),
      new List({ ordered: true, start: 1, children: new ListChildren([
        new ListItem({ children: new ListItemChildren([
          new Paragraph({ children: new PhrasingContent([
            new Strong({ children: new StrongChildren([ new Text({ value: 'Moisture Control:' }) ]) }),
            new Text({ value: ' butter, aioli, or dried greens can prevent soggy bread.' }),
          ]) })
        ]) }),
        new ListItem({ children: new ListItemChildren([
          new Paragraph({ children: new PhrasingContent([
            new Strong({ children: new StrongChildren([ new Text({ value: 'Protein:' }) ]) }),
            new Text({ value: ' from roasted vegetables to seared halloumi or classic deli meats.' }),
          ]) })
        ]) }),
        new ListItem({ children: new ListItemChildren([
          new Paragraph({ children: new PhrasingContent([
            new Strong({ children: new StrongChildren([ new Text({ value: 'Crunch:' }) ]) }),
            new Text({ value: ' pickled onions, shredded cabbage, crisp lettuce.' }),
          ]) })
        ]) }),
      ]) }),

      // Code example (shows recipe object modeling)
      new CodeBlock({ lang: 'json', value: '{\n  "name": "Grilled Halloumi Stack",\n  "components": ["ciabatta", "halloumi", "harissa yogurt", "roasted peppers", "mint"],\n  "toasting": "medium"\n}' }),

      // Link usage paragraph (image removed per user request)
      new Paragraph({ children: new PhrasingContent([
        new Text({ value: 'For deeper sandwich taxonomy explore the ' }),
        new Link({ url: 'https://en.wikipedia.org/wiki/Sandwich', title: 'Wikipedia Sandwich Entry', children: new LinkChildren([ new Text({ value: 'Sandwich encyclopedia entry' }) ]) }),
        new Text({ value: '.' }),
      ]) }),

      // Strikethrough + emphasis + delete node usage
      new Paragraph({ children: new PhrasingContent([
        new Text({ value: 'Avoid ' }),
  new DeleteNode({ children: new DeleteChildren([ new Text({ value: 'excessive sogginess' }) ]) }),
        new Text({ value: '; strive for ' }),
        new Emphasis({ children: new EmphasisChildren([ new Text({ value: 'structural integrity' }) ]) }),
        new Text({ value: ' with flavor contrast.' }),
      ]) }),

      // Closing
      new Heading({ depth: 3, children: new PhrasingContent([ new Text({ value: 'Final Thought' }) ]) }),
      new Paragraph({ children: new PhrasingContent([
        new Text({ value: 'Great sandwiches are iterative: taste, adjust, refine.' }),
      ]) }),
    ])
  });

  view.initialize(doc);
  return view;
}
