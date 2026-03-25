import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiFilter, FiSearch, FiX, FiShoppingCart, FiStar, FiSliders } from 'react-icons/fi';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, total: 0 });
  const { addToCart } = useCart();

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    vehicleBrand: searchParams.get('brand') || '',
    vehicleType: searchParams.get('type') || '',
    sortBy: searchParams.get('sortBy') || 'newest',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
  });

  useEffect(() => {
    fetchFiltersData();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [searchParams]);

  const fetchFiltersData = async () => {
    try {
      const [catRes, brandRes] = await Promise.all([
        api.get('/products/categories'),
        api.get('/products/brands')
      ]);
      setCategories(catRes.data);
      setBrands(brandRes.data);
    } catch (error) {
      console.error('Error fetching filter data:', error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(searchParams);
      const response = await api.get('/products', { params });
      setProducts(response.data.products);
      setPagination({
        currentPage: response.data.currentPage,
        totalPages: response.data.totalPages,
        total: response.data.total
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    setSearchParams(params);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      vehicleBrand: '',
      vehicleType: '',
      sortBy: 'newest',
      minPrice: '',
      maxPrice: '',
    });
    setSearchParams({});
  };

  const handleAddToCart = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    toast.success('Added to cart');
  };

  const vehicleTypes = ['Car', 'Motorcycle', 'Truck', 'Van', 'SUV', 'Bus', 'Universal'];
  const getDiscountPercentage = (price, discountPrice) => {
    if (!price || !discountPrice || price <= discountPrice) return null;
    const discount = ((price - discountPrice) / price) * 100;
    const rounded = Math.round(discount * 10) / 10;
    return Number.isInteger(rounded) ? `${rounded}` : `${rounded.toFixed(1)}`;
  };

  return (
    <div
      className="min-h-screen relative bg-cover bg-center bg-fixed"
      style={{
        backgroundImage: "url('https://images.stockcake.com/public/0/1/d/01da16e4-e37c-417c-beb7-d3f303b1956c_large/garage-workshop-scene-stockcake.jpg')"
      }}
    >
      <div className="absolute inset-0 bg-dark-950/80"></div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Spare Parts</h1>
            <p className="text-gray-400 mt-1">{pagination.total} products found</p>
          </div>

          {/* Search & Filter */}
          <div className="flex items-center space-x-3">
            <div className="relative flex-1 md:w-80">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search products..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
                className="input-field pl-12"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-secondary inline-flex items-center ${showFilters ? 'bg-primary-500/20 border-primary-500/50 text-primary-400' : ''}`}
            >
              <FiSliders className="mr-2" /> Filters
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="card p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-lg text-white">Filters</h3>
              <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-white transition-colors">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="input-field"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Vehicle Type</label>
                <select
                  value={filters.vehicleType}
                  onChange={(e) => handleFilterChange('vehicleType', e.target.value)}
                  className="input-field"
                >
                  <option value="">All Types</option>
                  {vehicleTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Brand</label>
                <select
                  value={filters.vehicleBrand}
                  onChange={(e) => handleFilterChange('vehicleBrand', e.target.value)}
                  className="input-field"
                >
                  <option value="">All Brands</option>
                  {brands.map((brand) => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Min Price</label>
                <input
                  type="number"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  placeholder="Min"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Max Price</label>
                <input
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  placeholder="Max"
                  className="input-field"
                />
              </div>
            </div>
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-dark-600/50">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="input-field w-48"
                >
                  <option value="newest">Newest First</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                </select>
              </div>
              <div className="space-x-3">
                <button onClick={clearFilters} className="btn-secondary">Clear All</button>
                <button onClick={applyFilters} className="btn-primary">Apply Filters</button>
              </div>
            </div>
          </div>
        )}

        {/* Products Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-2 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-dark-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiSearch className="w-8 h-8 text-gray-500" />
            </div>
            <p className="text-gray-400 text-lg">No products found</p>
            <button onClick={clearFilters} className="text-primary-400 hover:text-primary-300 mt-2 font-medium">
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <Link key={product._id} to={`/products/${product._id}`} className="card-hover group">
                  <div className="aspect-square bg-dark-700/50 relative overflow-hidden rounded-t-2xl">
                    <img
                      src={product.images?.[0] || 'https://via.placeholder.com/300'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {product.discountPrice && (
                      <span className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                        {getDiscountPercentage(product.price, product.discountPrice)}% OFF
                      </span>
                    )}
                    {product.stockQuantity === 0 && (
                      <div className="absolute inset-0 bg-dark-950/60 backdrop-blur-[2px] flex items-center justify-center z-10">
                        <span className="bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                          Sold Out
                        </span>
                      </div>
                    )}
                    {product.stockQuantity <= 5 && product.stockQuantity > 0 && (
                      <span className="absolute top-3 right-3 bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-md z-10">
                        Only {product.stockQuantity} Left
                      </span>
                    )}
                    {/* Quick Add Button */}
                    <button
                      onClick={(e) => handleAddToCart(e, product)}
                      disabled={product.stockQuantity === 0}
                      className="absolute bottom-3 right-3 w-10 h-10 bg-primary-500 hover:bg-primary-400 disabled:bg-dark-600 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-lg"
                    >
                      <FiShoppingCart className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-primary-400 font-medium mb-1">{product.category}</p>
                    <h3 className="font-medium text-gray-200 line-clamp-2 mb-3 group-hover:text-white transition-colors">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <div>
                        {product.discountPrice ? (
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-primary-400">Rs. {product.discountPrice.toLocaleString()}</span>
                            <span className="text-sm text-gray-500 line-through">Rs. {product.price.toLocaleString()}</span>
                          </div>
                        ) : (
                          <span className="font-bold text-white">Rs. {product.price.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center mt-2">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <FiStar key={i} className={`w-3.5 h-3.5 ${i < Math.round(product.averageRating) ? 'fill-current' : ''}`} />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500 ml-2">({product.totalReviews})</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center mt-12 space-x-2">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => {
                      const params = new URLSearchParams(searchParams);
                      params.set('page', page);
                      setSearchParams(params);
                    }}
                    className={`w-10 h-10 rounded-xl font-medium transition-all duration-200 ${pagination.currentPage === page
                        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                        : 'bg-dark-700/50 text-gray-400 hover:bg-dark-600 hover:text-white border border-dark-600/50'
                      }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Products;
