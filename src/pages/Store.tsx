import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ShoppingCart, 
  Search, 
  Plus, 
  Minus,
  Star,
  Filter
} from "lucide-react";
import { mockProducts } from "@/data/mockData";

interface CartItem {
  id: string;
  quantity: number;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(price);
};

export default function Store() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = ["all", ...Array.from(new Set(mockProducts.map(p => p.category)))];

  const filteredProducts = mockProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCartQuantity = (productId: string) => {
    return cart.find(item => item.id === productId)?.quantity || 0;
  };

  const addToCart = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === productId);
      if (existing) {
        return prev.map(item => 
          item.id === productId 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { id: productId, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map(item => 
          item.id === productId 
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
      return prev.filter(item => item.id !== productId);
    });
  };

  const cartTotal = cart.reduce((total, item) => {
    const product = mockProducts.find(p => p.id === item.id);
    return total + (product?.price || 0) * item.quantity;
  }, 0);

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold">Product Store</h1>
          <p className="text-muted-foreground mt-2">
            Premium salon products for professional results
          </p>
        </div>
        
        {/* Cart Summary */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Button variant="salon" className="relative">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Cart
              {cartItemCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {cartItemCount}
                </Badge>
              )}
            </Button>
          </div>
          {cartItemCount > 0 && (
            <div className="text-lg font-bold text-primary">
              {formatPrice(cartTotal)}
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-gradient-card border-border/50 shadow-card">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Category Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <div className="flex space-x-2">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="capitalize"
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => {
          const quantity = getCartQuantity(product.id);
          
          return (
            <Card key={product.id} className="bg-gradient-card border-border/50 shadow-card hover:shadow-glow transition-all duration-300 group overflow-hidden">
              {/* Product Image */}
              <div className="aspect-square overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg leading-tight">{product.name}</CardTitle>
                    <CardDescription className="text-sm">{product.brand}</CardDescription>
                  </div>
                  <Badge 
                    variant={product.stock > 10 ? "default" : product.stock > 0 ? "secondary" : "destructive"}
                    className="ml-2"
                  >
                    {product.stock > 0 ? `${product.stock} left` : 'Out of stock'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0 space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {product.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-primary">
                    {formatPrice(product.price)}
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                    <Star className="h-3 w-3 text-yellow-500" />
                    <span className="text-xs text-muted-foreground ml-1">4.2</span>
                  </div>
                </div>
                
                {/* Add to Cart Controls */}
                <div className="flex items-center justify-between">
                  {quantity === 0 ? (
                    <Button
                      onClick={() => addToCart(product.id)}
                      disabled={product.stock === 0}
                      className="w-full"
                      variant="salon"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center space-x-3">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => removeFromCart(product.id)}
                          className="h-8 w-8"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="font-medium text-lg min-w-[2rem] text-center">
                          {quantity}
                        </span>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => addToCart(product.id)}
                          disabled={quantity >= product.stock}
                          className="h-8 w-8"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="font-medium text-primary">
                        {formatPrice(product.price * quantity)}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <Card className="bg-gradient-card border-border/50 shadow-card">
          <CardContent className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No products found</p>
              <p className="text-sm">Try adjusting your search or filter criteria</p>
            </div>
            <Button onClick={() => {
              setSearchTerm("");
              setSelectedCategory("all");
            }}>
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Floating Cart (when items in cart) */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <Card className="bg-gradient-primary text-primary-foreground shadow-glow border-0">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <ShoppingCart className="h-5 w-5" />
                <div>
                  <div className="font-medium">{cartItemCount} items</div>
                  <div className="text-sm opacity-90">{formatPrice(cartTotal)}</div>
                </div>
                <Button size="sm" variant="secondary">
                  Checkout
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}