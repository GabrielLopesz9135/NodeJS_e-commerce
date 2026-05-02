const Product = require('../models/product');
const Cart = require('../models/cart');

exports.getProducts = (req, res, next) => {
  Product.findAll()
    .then(products => {
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'All Products',
        path: '/products'
      });
    })
    .catch(err => console.log(err))
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findByPk(prodId)
  .then(product => {
    res.render('shop/product-detail', {
      product: product,
      pageTitle: "Product Details",
      path: 'products'
    })
  }).catch(err => console.log(err))
}

exports.getIndex = (req, res, next) => {
  Product.findAll()
    .then(products => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/'
      });
    })
    .catch(err => console.log(err))
};

exports.getCart = (req, res, next) => {
  req.user.getCart()
    .then(cart => {
      cart.getProducts()
        .then(Products => {
            res.render('shop/cart', {
              path: '/cart',
              pageTitle: 'Your Cart',
              products: Products
            })
        })
        .catch(err => console.log(err))
    })
    .catch(err => console.log(err))
};

exports.deleteItemCart = async (req, res, next) => {
  const prodId = req.params.productId;
  const cart = await req.user.getCart();
  const products = await cart.getProducts();
  const product = products[0];
  await product.cartItem.destroy();
  res.redirect('/cart');
}

exports.saveCart = async (req, res, next) => {
  try {
    const prodId = req.body.productId;
    const cart = await req.user.getCart();
    const cartProducts = await cart.getProducts({where: {id: prodId}});
    let product = {};
    let newQuantity = 1;
    
    if(cartProducts.length > 0){
      product = cartProducts[0];

      if(product){
        const oldQuantity = product.cartItem.quantity;
        newQuantity = oldQuantity + 1;
      }
    }else{
      product = await Product.findByPk(prodId);
    }

    await cart.addProduct(product, { through: {quantity: newQuantity} })
    res.redirect('/cart')
  } catch (error) {
    console.log(error)
  }
}

exports.postOrder = async(req, res, next) => {
  const cart = await req.user.getCart();
  const products = await cart.getProducts();
  console.log(products);
  const order = await req.user.createOrder();

  order.addProducts(
    products.map(product => {
      product.orderItem = {quantity: product.cartItem.quantity}
      return product;
    })
  )
  res.redirect('/orders')
}

exports.getOrders = (req, res, next) => {
  res.render('shop/orders', {
    path: '/orders',
    pageTitle: 'Your Orders'
  });
};

exports.getCheckout = (req, res, next) => {
  res.render('shop/checkout', {
    path: '/checkout',
    pageTitle: 'Checkout'
  });
};
