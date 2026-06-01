import type { Handlers, Join, Options } from 'mdast-util-to-markdown';

import type { DefinitionsRecord, UnsupportedTagsStrategy } from '../types.js';
import { handleBlockquote, handleHtml, handleList, handleListItem, handleTable, handleThematicBreak } from './blocks.js';
import { handleDelete, handleEmphasis, handleHeading, handleStrong } from './formatting.js';
import { handleImage, handleImageReference, handleLink, handleLinkReference } from './links.js';
import { handleCode, handleInlineCode, handleText } from './text.js';

/**
 * Creates custom `mdast-util-to-markdown` handlers that tailor the output for
 * Telegram Markdown V2.
 */
function createHandlers(
  definitions: DefinitionsRecord,
  unsupportedTagsStrategy: UnsupportedTagsStrategy,
  sourceMarkdown: string
): Partial<Handlers> {
  return {
    heading: handleHeading,
    strong: handleStrong,
    delete: handleDelete,
    emphasis: handleEmphasis,
    list: handleList(sourceMarkdown),
    listItem: handleListItem,
    inlineCode: handleInlineCode,
    code: handleCode,
    link: handleLink,
    linkReference: handleLinkReference(definitions),
    image: handleImage,
    imageReference: handleImageReference(definitions),
    text: handleText,
    blockquote: handleBlockquote(unsupportedTagsStrategy),
    html: handleHtml(unsupportedTagsStrategy),
    table: handleTable(unsupportedTagsStrategy),
    thematicBreak: handleThematicBreak,
  };
}

/**
 * Creates options to be passed into a `remark-stringify` processor that tailor
 * the output for Telegram Markdown V2.
 */
export function createMarkdownOptions(
  definitions: DefinitionsRecord,
  unsupportedTagsStrategy: UnsupportedTagsStrategy = 'keep',
  sourceMarkdown: string = ''
): Options {
  const join: Join[] = [
    (left, right) => {
      if (left.type === 'list' && right.type === 'list' && !('ordered' in left && left.ordered) && !('ordered' in right && right.ordered)) {
        const leftEnd = left.position?.end.offset;
        const rightStart = right.position?.start.offset;
        if (leftEnd != null && rightStart != null) {
          const between = sourceMarkdown.slice(leftEnd, rightStart);
          if (between.includes('\n\n')) return 1;
        }
        return 0;
      }
      return undefined as unknown as number;
    },
  ];

  return {
    bullet: '*',
    bulletOrdered: '.',
    bulletOther: '+',
    tightDefinitions: true,
    listItemIndent: 'one',
    handlers: createHandlers(definitions, unsupportedTagsStrategy, sourceMarkdown) as Handlers,
    join,
  };
}