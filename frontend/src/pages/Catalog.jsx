import React, { useState, useEffect } from 'react';
import { pizzaAPI } from '../api';
import { useCartStore, useCountryStore, useAuthStore } from '../store';

const Catalog = () => {
  const [pizzas, setPizzas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const addItem = useCartStore((state) => state.addItem);
  const cartItems = useCartStore((state) => state.items);
  const countryCode = useCountryStore((state) => state.countryCode);
  const countryInfo = useCountryStore((state) => state.countryInfo);
  const username = useAuthStore((state) => state.username);

  useEffect(() => {
    loadPizzas();
  }, [countryCode]);

  const loadPizzas = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await pizzaAPI.getPizzas();
      setPizzas(response.data.pizzas);
    } catch (err) {
      setError('Error al cargar el catálogo');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (pizza) => {
    addItem(pizza);
  };

  const getCartQuantity = (pizzaId) => {
    const item = cartItems.find((item) => item.pizza_id === pizzaId);
    return item ? item.quantity : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl text-gray-600">Cargando pizzas...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2" data-testid="catalog-title">
          🍕 Catálogo de Pizzas
        </h1>
        <p className="text-gray-600">
          Usuario: <span className="font-semibold">{username}</span> | 
          País: <span className="font-semibold">{countryCode}</span> | 
          Moneda: <span className="font-semibold">{countryInfo?.currency_symbol || '$'}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pizzas.map((pizza) => {
          const quantity = getCartQuantity(pizza.id);
          
          return (
            <div
              key={pizza.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition duration-300"
              data-testid={`pizza-card-${pizza.id}`}
            >
              <div className="h-48 overflow-hidden bg-gray-200">
                <img
                  src={pizza.image}
                  alt={pizza.name}
                  className="w-full h-full object-cover"
                  data-testid={`pizza-image-${pizza.id}`}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
                  }}
                />
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2" data-testid={`pizza-name-${pizza.id}`}>
                  {pizza.name}
                </h3>
                <p className="text-gray-600 text-sm mb-4" data-testid={`pizza-description-${pizza.id}`}>
                  {pizza.description}
                </p>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-pizza-red" data-testid={`pizza-price-${pizza.id}`}>
                      {pizza.currency_symbol} {pizza.price.toFixed(countryInfo?.decimal_places || 2)}
                    </span>
                    <span className="text-sm text-gray-500 ml-2">{pizza.currency}</span>
                  </div>

                  {quantity > 0 && (
                    <span className="bg-pizza-red text-white px-3 py-1 rounded-full text-sm font-semibold">
                      {quantity} en carrito
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleAddToCart(pizza)}
                  className="w-full mt-4 bg-pizza-red hover:bg-pizza-red/90 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
                  data-testid={`add-to-cart-${pizza.id}`}
                >
                  Agregar al Carrito
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {pizzas.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 text-xl">No hay pizzas disponibles</p>
        </div>
      )}
    </div>
  );
};

export default Catalog;
