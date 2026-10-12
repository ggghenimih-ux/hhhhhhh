export const setMetaContent = (
  selector: string,
  attribute: 'name' | 'property',
  key: string,
  content: string,
) => {
  let meta = document.querySelector<HTMLMetaElement>(selector);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attribute, key);
    document.head.appendChild(meta);
  }
  meta.content = content;
};

export const setProductStructuredData = (product: Record<string, unknown> | null) => {
  const existingScript = document.querySelector<HTMLScriptElement>('#product-json-ld');
  if (!product) {
    existingScript?.remove();
    return;
  }
  const script = existingScript || document.createElement('script');
  script.id = 'product-json-ld';
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(product);
  if (!existingScript) document.head.appendChild(script);
};
