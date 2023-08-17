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
    const html = node.outerHTML;
    document.body.removeChild(node);
    return html;
  }
};

const toDataUrl = (bytes: string, type = 'image/svg+xml') =>
  new Promise<string | ArrayBuffer | null>((resolve, reject) => {
    Object.assign(new FileReader(), {
      onload: (e) => resolve(e.target.result),
      onerror: (e) => reject(e.target.error),
    }).readAsDataURL(new File([bytes], '', { type }));
  });

export const renderSvgToDataUrl = async (node: React.ReactElement<any, 'svg'>) => {
  const { renderToString } = await import('react-dom/server');
  return await toDataUrl(applyComputedStyles(renderToString(node))!);
};
