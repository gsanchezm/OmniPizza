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

  const handleAddToCart = (pizza) => addItem(pizza);

  const getCartQuantity = (pizzaId) => {
    const item = cartItems.find((item) => item.pizza_id === pizzaId);
    return item ? item.quantity : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-xl font-bold text-brand-secondary">Cargando pizzas...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-xl font-extrabold text-brand-primary">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 bg-surface-card border border-brand-secondary rounded-2xl p-6">
        <h1 className="text-4xl font-extrabold text-brand-primary mb-2" data-testid="catalog-title">
          🍕 Catálogo de Pizzas
        </h1>
        <p className="text-brand-secondary font-semibold">
          Usuario: <span className="font-black text-text">{username}</span> |{' '}
          País: <span className="font-black text-text">{countryCode}</span> |{' '}
          Moneda: <span className="font-black text-text">{countryInfo?.currency_symbol || '$'}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pizzas.map((pizza) => {
          const quantity = getCartQuantity(pizza.id);

          return (
            <div
              key={pizza.id}
              className="bg-surface-card rounded-2xl border border-brand-secondary shadow-lg overflow-hidden
                         hover:shadow-2xl transition duration-300"
              data-testid={`pizza-card-${pizza.id}`}
            >
              <div className="h-48 overflow-hidden bg-surface">
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
                <h3 className="text-xl font-extrabold text-text mb-2" data-testid={`pizza-name-${pizza.id}`}>
                  {pizza.name}
                </h3>

                <p className="text-brand-secondary font-semibold text-sm mb-4" data-testid={`pizza-description-${pizza.id}`}>
                  {pizza.description}
                </p>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-extrabold text-brand-primary" data-testid={`pizza-price-${pizza.id}`}>
                      {pizza.currency_symbol} {pizza.price.toFixed(countryInfo?.decimal_places || 2)}
                    </span>
                    <span className="text-sm text-brand-secondary font-semibold ml-2">{pizza.currency}</span>
                  </div>

                  {quantity > 0 && (
                    <span className="bg-brand-accent text-text px-3 py-1 rounded-full text-sm font-extrabold">
                      {quantity} en carrito
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleAddToCart(pizza)}
                  className="w-full mt-4 bg-brand-primary text-surface font-extrabold py-3 px-4 rounded-lg
                             transition hover:opacity-90"
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
          <p className="text-brand-secondary font-semibold text-xl">No hay pizzas disponibles</p>
        </div>
      )}
    </div>
  );
};

export default Catalog;
