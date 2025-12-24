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

      // Process each JSX tag (including self-closing)
      // Match opening tags like <div ... > or <Component ... /> or multiline
      const tagPattern = /<(\w+)((?:\s+[^>]*?)?)(\/?)\s*>/gs;

      transformed = code.replace(tagPattern, (fullMatch, tagName, propsString, selfClosing) => {
        // Check if this tag has css, tw, or className props
        const hasCssProp = /\s+css=/.test(propsString);
        const hasTwProp = /\s+tw=/.test(propsString);
        const hasClassNameProp = /\s+className=/.test(propsString);

        if (!hasCssProp && !hasTwProp) {
          return fullMatch;
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
          return fullMatch;
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
        return `<${tagName}${cleanedProps} className=${classNameExpr}${selfClosing}>`;
      });

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
