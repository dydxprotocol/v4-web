const applyComputedStyles = (html: string) => {
  const template = globalThis.document.createElement('template');
  template.innerHTML = html;
  const node = template.content.firstElementChild?.cloneNode(true) as HTMLElement;
  if (node) {
    document.body.appendChild(node);
    const computedStyle = getComputedStyle(node);
    Array.from(computedStyle).forEach((key) =>
      node.style.setProperty(
        key,
        computedStyle.getPropertyValue(key),
        computedStyle.getPropertyPriority(key)
      )
    );
    const newHtml = node.outerHTML;
    document.body.removeChild(node);
    return newHtml;
  }
  return undefined;
};

const toDataUrl = (bytes: string, type = 'image/svg+xml') =>
  new Promise<string | ArrayBuffer | null>((resolve, reject) => {
    Object.assign(new FileReader(), {
      onload: (e: ProgressEvent<FileReader>) => resolve(e.target?.result ?? null),
      onerror: (e: ProgressEvent<FileReader>) => reject(e.target?.error),
    }).readAsDataURL(new File([bytes], '', { type }));
  });

export const renderSvgToDataUrl = async (node: React.ReactElement<any, 'svg'>) => {
  const { renderToString } = await import('react-dom/server');
  return toDataUrl(applyComputedStyles(renderToString(node))!);
};
