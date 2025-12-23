import type { Plugin } from 'vite';

/**
 * Vite plugin that transforms `css` and `tw` props into `className` with clsx
 *
 * Examples:
 * - <div css={styles.button} /> -> <div className={styles.button} />
 * - <div tw="p-4" /> -> <div className="p-4" />
 * - <div css={styles.button} tw="p-4" /> -> <div className={clsx(styles.button, "p-4")} />
 * - <div css={[styles.a, styles.b]} tw="p-4" /> -> <div className={clsx(styles.a, styles.b, "p-4")} />
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
      if (!code.includes(' css=') && !code.includes(' tw=')) {
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

      // Process each JSX tag
      // Match opening tags like <div ... > or <Component ... >
      const tagPattern = /<(\w+)((?:\s+[^>]*?)?)>/g;

      transformed = code.replace(tagPattern, (fullMatch, tagName, propsString) => {
        // Check if this tag has css or tw props
        const hasCssProp = propsString.includes(' css=');
        const hasTwProp = propsString.includes(' tw=');

        if (!hasCssProp && !hasTwProp) {
          return fullMatch;
        }

        let cssValue: string | null = null;
        let twValue: string | null = null;
        let cleanedProps = propsString;

        // Extract css prop value
        if (hasCssProp) {
          const cssIdx = propsString.indexOf(' css={');
          if (cssIdx !== -1) {
            const cssStartIdx = cssIdx + 6; // after " css={"
            cssValue = extractBracedContent(propsString, cssStartIdx - 1); // -1 to include the opening {
            if (cssValue !== null) {
              // Remove css prop from props string - need to find the full extent
              const cssEndIdx = cssStartIdx + cssValue.length + 1; // +1 for closing }
              cleanedProps = propsString.slice(0, cssIdx) + propsString.slice(cssEndIdx);
            }
          }
        }

        // Extract tw prop value
        if (hasTwProp) {
          const twMatch = propsString.match(/\s+tw="([^"]*)"/);
          if (twMatch) {
            const extractedTwValue = twMatch[1];

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
            cleanedProps = cleanedProps.replace(/\s+tw="[^"]*"/, '');
          }
        }

        // Build className expression
        let classNameExpr: string;

        if (cssValue !== null && twValue !== null) {
          // Both css and tw: css={x} tw="y" → className={clsx(x, "y")}
          needsClsx = true;
          classNameExpr = `{clsx(${cssValue.trim()}, "${twValue}")}`;
        } else if (cssValue !== null) {
          // Only css: css={x} → className={clsx(x)}
          needsClsx = true;
          classNameExpr = `{clsx(${cssValue.trim()})}`;
        } else if (twValue !== null) {
          // Only tw: tw="..." → className="..."
          classNameExpr = `"${twValue}"`;
        } else {
          return fullMatch;
        }

        // Reconstruct tag
        return `<${tagName}${cleanedProps} className=${classNameExpr}>`;
      });

      // If we used clsx, ensure it's imported
      if (needsClsx && transformed !== code) {
        if (!transformed.includes("from 'clsx'") && !transformed.includes('from "clsx"')) {
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
