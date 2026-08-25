export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  sizes: string[];
  image: string;
  description: string;
  tags: string[];
}

export interface CartItem {
  product: Product;
  size: string;
  quantity: number;
}
