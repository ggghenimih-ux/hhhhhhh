import { describe, expect, it } from 'vitest';
import { ProductSchema, ProductUpdateSchema, safeUrl } from '../server/validators/schemas';

describe('product image validation', () => {
  it('accepts legacy relative, uploaded, and long product image paths', () => {
    expect(ProductUpdateSchema.safeParse({ image: 'uploads/product.jpg' }).success).toBe(true);
    expect(ProductUpdateSchema.safeParse({ images: ['/uploads/product.jpg', 'uploads/old-product.jpg'] }).success).toBe(
      true,
    );
    expect(ProductUpdateSchema.safeParse({ image: `https://${'a'.repeat(600)}.example/image.jpg` }).success).toBe(
      true,
    );
  });

  it('allows empty images on update and an empty main image', () => {
    expect(ProductUpdateSchema.safeParse({ image: '', images: [] }).success).toBe(true);
  });

  it('accepts supported base64 image data and rejects unsafe schemes and markup', () => {
    expect(ProductUpdateSchema.safeParse({ image: 'data:image/png;base64,aGVsbG8=' }).success).toBe(true);
    expect(ProductUpdateSchema.safeParse({ image: 'javascript:alert(1)' }).success).toBe(false);
    expect(ProductUpdateSchema.safeParse({ image: 'vbscript:alert(1)' }).success).toBe(false);
    expect(ProductUpdateSchema.safeParse({ image: 'data:text/html;base64,PGgxPg==' }).success).toBe(false);
    expect(ProductUpdateSchema.safeParse({ image: '/images/<script>.jpg' }).success).toBe(false);
  });

  it('keeps the stricter shared URL validator and requires an image on creation', () => {
    expect(safeUrl.safeParse('uploads/product.jpg').success).toBe(false);
    expect(ProductSchema.safeParse({
      name: 'Valid Product',
      description: 'A sufficiently long description',
      priceTND: 10,
      category: 'tools',
      image: '',
    }).success).toBe(false);
  });
});
