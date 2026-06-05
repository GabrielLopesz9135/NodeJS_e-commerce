const Product = require('../models/product');

exports.getProducts = (req, res, next) => {
  Product.find()
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
  Product.findById(prodId)
    .then(product => {
      console.log('product', product)
      res.render('shop/product-detail', {
        product: product,
        pageTitle: "Product Details",
        path: 'products'
      })
    }).catch(err => console.log(err))
}

exports.getIndex = (req, res, next) => {
  Product.find()
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
    .then(Products => {
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: Products
      })
    })
    .catch(err => console.log(err))
};

exports.deleteItemCart = async (req, res, next) => {
  const prodId = req.body.productId;
  const result = await req.user.deleteItemCart(prodId);
  res.redirect('/cart');
}

exports.saveCart = async (req, res, next) => {
  try {
    const prodId = req.body.productId;
    const product = await Product.findById(prodId);
    const result = await req.user.addToCart(product);
    return res.redirect('/cart')
  } catch (error) {
    console.log(error)
  }
}

exports.postOrder = async (req, res, next) => {
  try{
    const result = await req.user.createOrder();
    res.redirect('/orders')
  }catch(err){
    console.log(err)
  }
}

exports.getOrders = async (req, res, next) => {
  const orders = await req.user.getOrders();
  console.log('orders', orders);
  res.render('shop/orders', {
    orders: orders,
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
