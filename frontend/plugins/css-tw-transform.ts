import type { Plugin } from 'vite';

/**
 * Vite plugin that transforms `css` and `tw` props into `className` with clsx
 *
 * Examples:
 * - <div css={styles.button} /> -> <div className={styles.button} />
 * - <div tw="p-4" /> -> <div className="p-4" />
 * - <div css={styles.button} tw="p-4" /> -> <div className={clsx(styles.button, "p-4")} />
 * - <div css={[styles.a, styles.b]} tw="p-4" /> -> <div className={clsx(styles.a, styles.b, "p-4")} />
 * - <div className="existing" css={styles.button} /> -> <div className={clsx("existing", styles.button)} />
 */
export function cssTwTransformPlugin(): Plugin {
  return {
    name: 'vite-plugin-css-tw-transform',
    enforce: 'pre', // Run before other plugins

    transform(code: string, id: string) {
      // Only process TypeScript/JavaScript React files
      if (!id.endsWith('.tsx') && !id.endsWith('.jsx')) {
        return null;
      }

      // Check if file uses css or tw props
      if (
        !code.includes(' css=') &&
        !code.includes(' tw=') &&
        !code.includes('css=') &&
        !code.includes('tw=')
      ) {
        return null;
      }

      let transformed = code;
      let needsClsx = false;

      // Helper to extract balanced braces content
      function extractBracedContent(str: string, startIdx: number): string | null {
        let depth = 0;
        let content = '';
        for (let i = startIdx; i < str.length; i++) {
          const char = str[i];
          if (char === '{') {
            if (depth > 0) content += char;
            depth++;
          } else if (char === '}') {
            depth--;
            if (depth === 0) {
              return content;
            }
            content += char;
          } else if (depth > 0) {
            content += char;
          }
        }
        return null;
      }

      // Helper to extract quoted string (double or single quotes)
      function extractQuotedString(
        str: string,
        startIdx: number
      ): { value: string; endIdx: number } | null {
        const quote = str[startIdx];
        if (quote !== '"' && quote !== "'") return null;

        let content = '';
        for (let i = startIdx + 1; i < str.length; i++) {
          const char = str[i];
          if (char === quote && str[i - 1] !== '\\') {
            return { value: content, endIdx: i };
          }
          content += char;
        }
        return null;
      }

      // Helper to find the end of a JSX opening tag, handling nested braces
      function findTagEnd(str: string, startIdx: number): number {
        let depth = 0;
        let inString: string | null = null;
        let escaped = false;

        for (let i = startIdx; i < str.length; i++) {
          const char = str[i];

          // Handle string literals
          if (!escaped && (char === '"' || char === "'" || char === '`')) {
            if (inString === char) {
              inString = null;
            } else if (inString === null) {
              inString = char;
            }
          }

          // Track escape sequences
          if (char === '\\' && !escaped) {
            escaped = true;
            continue;
          }
          escaped = false;

          // Skip everything inside strings
          if (inString) continue;

          // Track JSX expression depth
          if (char === '{') {
            depth++;
          } else if (char === '}') {
            depth--;
          } else if (char === '>' && depth === 0) {
            return i;
          }
        }

        return -1;
      }

      // Process JSX tags by finding them properly
      let cursor = 0;
      const replacements: Array<{ start: number; end: number; replacement: string }> = [];

      while (cursor < transformed.length) {
        // Find next opening tag
        const tagStart = transformed.indexOf('<', cursor);
        if (tagStart === -1) break;

        // Check if it's a closing tag or comment
        if (transformed[tagStart + 1] === '/' || transformed[tagStart + 1] === '!') {
          cursor = tagStart + 1;
          continue;
        }

        // Extract tag name
        const tagNameMatch = transformed.slice(tagStart + 1).match(/^(\w+)/);
        if (!tagNameMatch) {
          cursor = tagStart + 1;
          continue;
        }

        const tagName = tagNameMatch[1];
        const propsStart = tagStart + 1 + tagName.length;

        // Find the end of this tag
        const tagEnd = findTagEnd(transformed, propsStart);
        if (tagEnd === -1) {
          cursor = tagStart + 1;
          continue;
        }

        let propsString = transformed.slice(propsStart, tagEnd);

        // Check if this is a self-closing tag and strip the / from propsString
        let selfClosing = '';
        if (propsString.trimEnd().endsWith('/')) {
          selfClosing = '/';
          propsString = propsString.trimEnd().slice(0, -1);
        }

        // Check if this tag has css, tw, or className props
        const hasCssProp = /\s+css=/.test(propsString);
        const hasTwProp = /\s+tw=/.test(propsString);
        const hasClassNameProp = /\s+className=/.test(propsString);

        if (!hasCssProp && !hasTwProp) {
          cursor = tagEnd + 1;
          continue;
        }

        let cssValue: string | null = null;
        let twValue: string | null = null;
        let existingClassName: string | null = null;
        let cleanedProps = propsString;

        // Extract existing className prop value
        if (hasClassNameProp) {
          const classNameMatch = propsString.match(/\s+className=(['"{])/);
          if (classNameMatch) {
            const classNameIdx = propsString.indexOf(classNameMatch[0]);
            const valueStart = classNameIdx + classNameMatch[0].length;
            const firstChar = classNameMatch[1];

            if (firstChar === '{') {
              // className={expression}
              const extracted = extractBracedContent(propsString, valueStart - 1);
              if (extracted !== null) {
                existingClassName = extracted.trim();
                const endIdx = valueStart + extracted.length + 1;
                cleanedProps = propsString.slice(0, classNameIdx) + propsString.slice(endIdx);
              }
            } else {
              // className="string" or className='string'
              const extracted = extractQuotedString(propsString, valueStart - 1);
              if (extracted) {
                existingClassName = `"${extracted.value}"`;
                cleanedProps =
                  propsString.slice(0, classNameIdx) + propsString.slice(extracted.endIdx + 1);
              }
            }
          }
        }

        // Extract css prop value
        if (hasCssProp) {
          const cssMatch = cleanedProps.match(/\s+css=/);
          if (cssMatch) {
            const cssIdx = cleanedProps.indexOf(cssMatch[0]);
            const cssStartIdx = cssIdx + cssMatch[0].length + 1; // after " css={"
            cssValue = extractBracedContent(cleanedProps, cssStartIdx - 1);
            if (cssValue !== null) {
              const cssEndIdx = cssStartIdx + cssValue.length + 1;
              cleanedProps = cleanedProps.slice(0, cssIdx) + cleanedProps.slice(cssEndIdx);
            }
          }
        }

        // Extract tw prop value (handle both double and single quotes)
        if (hasTwProp) {
          const twMatch = cleanedProps.match(/\s+tw=(['"])(.+?)\1/);
          if (twMatch) {
            const extractedTwValue = twMatch[2];

            // Validate: enforce maximum number of utility classes
            const classCount = extractedTwValue.trim().split(/\s+/).filter(Boolean).length;
            const MAX_TW_CLASSES = 4;

            if (classCount > MAX_TW_CLASSES) {
              const location = id.replace(process.cwd(), '');
              throw new Error(
                `\n❌ Too many Tailwind classes in tw prop!\n\n` +
                  `   Found: ${classCount} classes (max allowed: ${MAX_TW_CLASSES})\n` +
                  `   Location: ${location}\n` +
                  `   Classes: "${extractedTwValue}"\n\n` +
                  `   💡 Move these to a vanilla-extract style definition instead:\n` +
                  `      export const myStyle = style({ ... });\n` +
                  `      <div css={styles.myStyle} tw="..." />\n`
              );
            }

            twValue = extractedTwValue;
            // Remove tw prop from props string
            cleanedProps = cleanedProps.replace(/\s+tw=['"][^'"]*['"]/, '');
          }
        }

        // Build className expression
        let classNameExpr: string;
        const parts: string[] = [];

        if (existingClassName) {
          parts.push(existingClassName);
        }
        if (cssValue !== null) {
          parts.push(cssValue.trim());
        }
        if (twValue !== null) {
          parts.push(`"${twValue}"`);
        }

        if (parts.length === 0) {
          cursor = tagEnd + 1;
          continue;
        }

        if (parts.length === 1 && twValue !== null && !existingClassName && !cssValue) {
          // Only tw, no existing className, no css: tw="..." → className="..."
          classNameExpr = `"${twValue}"`;
        } else {
          // Multiple values or has css: use clsx
          needsClsx = true;
          classNameExpr = `{clsx(${parts.join(', ')})}`;
        }

        // Reconstruct tag
        const replacement = `<${tagName}${cleanedProps} className=${classNameExpr}${selfClosing}>`;

        replacements.push({
          start: tagStart,
          end: tagEnd + 1,
          replacement,
        });

        cursor = tagEnd + 1;
      }

      // Apply replacements in reverse order to maintain correct indices
      for (let i = replacements.length - 1; i >= 0; i--) {
        const { start, end, replacement } = replacements[i];
        transformed = transformed.slice(0, start) + replacement + transformed.slice(end);
      }

      // If we used clsx, ensure it's imported
      if (needsClsx && transformed !== code) {
        // Check for any existing clsx import (named, default, or aliased)
        const hasClsxImport = /import\s+.*\bclsx\b.*from\s+['"]clsx['"]/.test(transformed);
        if (!hasClsxImport) {
          transformed = `import { clsx } from 'clsx';\n${transformed}`;
        }
      }

      return {
        code: transformed,
        map: null,
      };
    },
  };
}
