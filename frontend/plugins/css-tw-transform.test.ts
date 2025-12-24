import { describe, it, expect } from 'vitest';
import { cssTwTransformPlugin } from './css-tw-transform';

describe('cssTwTransformPlugin', () => {
  const plugin = cssTwTransformPlugin();
  const transform = plugin.transform as (code: string, id: string) => { code: string } | null;

  describe('basic transformations', () => {
    it('should transform css prop to className', () => {
      const input = `<div css={styles.button}>Click me</div>`;
      const result = transform(input, 'test.tsx');
      expect(result?.code).toContain('className={clsx(styles.button)}');
      expect(result?.code).toContain("import { clsx } from 'clsx'");
    });

    it('should transform tw prop to className', () => {
      const input = `<div tw="p-4">Content</div>`;
      const result = transform(input, 'test.tsx');
      expect(result?.code).toContain('className="p-4"');
    });

    it('should transform both css and tw props', () => {
      const input = `<div css={styles.button} tw="p-4">Click me</div>`;
      const result = transform(input, 'test.tsx');
      expect(result?.code).toContain('className={clsx(styles.button, "p-4")}');
    });

    it('should transform array css prop', () => {
      const input = `<div css={[styles.a, styles.b]}>Content</div>`;
      const result = transform(input, 'test.tsx');
      expect(result?.code).toContain('className={clsx([styles.a, styles.b])}');
    });
  });

  describe('self-closing tags', () => {
    it('should transform self-closing div with css prop', () => {
      const input = `<div css={styles.button} />`;
      const result = transform(input, 'test.tsx');
      expect(result?.code).toContain('className={clsx(styles.button)}');
    });

    it('should transform self-closing component with tw prop', () => {
      const input = `<Component tw="p-4" />`;
      const result = transform(input, 'test.tsx');
      expect(result?.code).toContain('className="p-4"');
    });

    it('should transform self-closing tag with both props', () => {
      const input = `<Button css={styles.primary} tw="mx-2" />`;
      const result = transform(input, 'test.tsx');
      expect(result?.code).toContain('className={clsx(styles.primary, "mx-2")}');
    });
  });

  describe('quote variations', () => {
    it('should handle single quotes in tw prop', () => {
      const input = `<div tw='p-4'>Content</div>`;
      const result = transform(input, 'test.tsx');
      expect(result?.code).toContain('className="p-4"');
    });

    it('should handle template literals in tw prop', () => {
      const input = '<div tw={`p-4`}>Content</div>';
      const result = transform(input, 'test.tsx');
      // Should handle or at least not crash
      expect(result).toBeTruthy();
    });
  });

  describe('multiline attributes', () => {
    it('should handle multiline css prop', () => {
      const input = `<div
  css={styles.button}
  onClick={handler}
>
  Click me
</div>`;
      const result = transform(input, 'test.tsx');
      expect(result?.code).toContain('className={clsx(styles.button)}');
    });

    it('should handle multiline with both props', () => {
      const input = `<div
  css={styles.button}
  tw="p-4"
  onClick={handler}
>
  Click me
</div>`;
      const result = transform(input, 'test.tsx');
      expect(result?.code).toContain('className={clsx(styles.button, "p-4")}');
    });
  });

  describe('nested JSX', () => {
    it('should handle nested elements with > in content', () => {
      const input = `<div css={styles.outer}>
  <p>Value is {x > 5 ? 'big' : 'small'}</p>
  <span css={styles.inner}>More</span>
</div>`;
      const result = transform(input, 'test.tsx');
      expect(result?.code).toContain('className={clsx(styles.outer)}');
      expect(result?.code).toContain('className={clsx(styles.inner)}');
    });
  });

  describe('existing className prop', () => {
    it('should merge with existing className', () => {
      const input = `<div className="existing" css={styles.button}>Click me</div>`;
      const result = transform(input, 'test.tsx');
      expect(result?.code).toContain('className={clsx("existing", styles.button)}');
    });

    it('should merge existing className with tw prop', () => {
      const input = `<div className="existing" tw="p-4">Content</div>`;
      const result = transform(input, 'test.tsx');
      expect(result?.code).toContain('className={clsx("existing", "p-4")}');
    });

    it('should merge all three: existing className, css, and tw', () => {
      const input = `<div className="existing" css={styles.button} tw="p-4">Click me</div>`;
      const result = transform(input, 'test.tsx');
      expect(result?.code).toContain('className={clsx("existing", styles.button, "p-4")}');
    });
  });

  describe('clsx import detection', () => {
    it('should not add import if clsx is already imported', () => {
      const input = `import { clsx } from 'clsx';
<div css={styles.button}>Click me</div>`;
      const result = transform(input, 'test.tsx');
      const imports = result?.code.match(/import.*clsx/g) || [];
      expect(imports.length).toBe(1);
    });

    it('should handle default import of clsx', () => {
      const input = `import clsx from 'clsx';
<div css={styles.button}>Click me</div>`;
      const result = transform(input, 'test.tsx');
      const imports = result?.code.match(/import.*clsx/g) || [];
      expect(imports.length).toBe(1);
    });

    it('should handle aliased import', () => {
      const input = `import { clsx as cx } from 'clsx';
<div css={styles.button}>Click me</div>`;
      const result = transform(input, 'test.tsx');
      // Should detect existing clsx import and not duplicate
      const imports = result?.code.match(/import.*clsx/g) || [];
      expect(imports.length).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('should skip files without css or tw props', () => {
      const input = `<div className="normal">No transformation needed</div>`;
      const result = transform(input, 'test.tsx');
      expect(result).toBeNull();
    });

    it('should only process .tsx and .jsx files', () => {
      const input = `<div css={styles.button}>Click me</div>`;
      const result = transform(input, 'test.ts');
      expect(result).toBeNull();
    });

    it('should handle props without leading space', () => {
      const input = `<div css={styles.button}tw="p-4">Click me</div>`;
      const result = transform(input, 'test.tsx');
      // Should handle or at least not crash
      expect(result).toBeTruthy();
    });

    it('should enforce tw class limit', () => {
      const input = `<div tw="p-4 mx-2 bg-blue-500 text-white rounded-lg">Content</div>`;
      expect(() => transform(input, 'test.tsx')).toThrow(/Too many Tailwind classes/);
    });
  });

  describe('complex scenarios', () => {
    it('should handle multiple elements in one file', () => {
      const input = `
export function Component() {
  return (
    <div css={styles.container}>
      <h1 tw="text-2xl">Title</h1>
      <p css={styles.text} tw="mb-4">Paragraph</p>
    </div>
  );
}`;
      const result = transform(input, 'test.tsx');
      expect(result?.code).toContain('className={clsx(styles.container)}');
      expect(result?.code).toContain('className="text-2xl"');
      expect(result?.code).toContain('className={clsx(styles.text, "mb-4")}');
    });

    it('should preserve other attributes', () => {
      const input = `<button
  type="submit"
  css={styles.button}
  onClick={handleClick}
  disabled={isDisabled}
  tw="mt-2"
  aria-label="Submit form"
>
  Submit
</button>`;
      const result = transform(input, 'test.tsx');
      expect(result?.code).toContain('type="submit"');
      expect(result?.code).toContain('onClick={handleClick}');
      expect(result?.code).toContain('disabled={isDisabled}');
      expect(result?.code).toContain('aria-label="Submit form"');
      expect(result?.code).toContain('className={clsx(styles.button, "mt-2")}');
    });
  });
});
