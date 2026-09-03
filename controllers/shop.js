const fs = require("fs");
const path = require("path");
const Product = require('../models/product');
const Order = require('../models/order');
const pdfkit = require('pdfkit')

const ITENS_PER_PAGE = 2;

exports.getProducts = async (req, res, next) => {
  const page = Number(req.query.page) || 1;
  const totalItems = await Product.find().countDocuments();

  Product.find()
  .skip((page - 1) * ITENS_PER_PAGE)
  .limit(ITENS_PER_PAGE)
    .then(products => {
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'All Products',
        path: '/products',
        currentPage: page,
        hasNextPage: ITENS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITENS_PER_PAGE)
      });
    })
    .catch(err => {
      console.log(err);
      next(err)
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products'
      });
    })
    .catch(err => console.log(err));
};

exports.getIndex = async (req, res, next) => {
  const page = Number(req.query.page) || 1;
  const totalItems = await Product.find().countDocuments();

  Product.find()
  .skip((page - 1) * ITENS_PER_PAGE)
  .limit(ITENS_PER_PAGE)
    .then(products => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/',
        currentPage: page,
        hasNextPage: ITENS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITENS_PER_PAGE)
      });
    })
    .catch(err => {
      console.log(err);
    });
};

exports.getCart = async (req, res, next) => {
  try {
    const cartItems = req.user.cart.items;
    const items = cartItems.map(item => item.productId);
    const products = await Product.find({ _id: { $in: items } });

    const cartProducts = products.map(product => {
      let quantity = 0;
      cartItems.map(item => {
        if (item.productId.toString() === product._id.toString()) {
          quantity = item.quantity;
        }
      });
      return {
        ...product._doc,
        quantity: quantity
      };
    });

    res.render('shop/cart', {
      path: '/cart',
      pageTitle: 'Your Cart',
      products: cartProducts,
      isAuthenticated: req.session.isLoggedIn
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then(product => {
      return req.user.addToCart(product);
    })
    .then(result => {
      res.redirect('/cart');
    }); 
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then(result => {
      res.redirect('/cart');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postOrder = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .then(user => {
      const products = user.cart.items.map(i => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user
        },
        products: products
      });
      return order.save();
    })
    .then(result => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect('/orders');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getCheckout = async (req, res, next) => {
  try {
    const cartItems = req.user.cart.items;
    const items = cartItems.map(item => item.productId);
    const products = await Product.find({ _id: { $in: items } });

    const cartProducts = products.map(product => {
      let quantity = 0;
      cartItems.map(item => {
        if (item.productId.toString() === product._id.toString()) {
          quantity = item.quantity;
        }
      });
      return {
        ...product._doc,
        quantity: quantity
      };
    });
    let total = 0;
    cartProducts.forEach(p => {
      total += p.quantity * p.price
    })

    console.log(total);

    res.render('shop/checkout', {
      path: '/checkout',
      pageTitle: 'Checkout',
      products: cartProducts,
      total: total
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
}

exports.getOrders = (req, res, next) => {
  const userId = (req.user && req.user._id) || (req.session && req.session.user && req.session.user._id);
  if (!userId) {
    return res.redirect('/login');
  }
  Order.find({ 'user.userId': userId })
    .then(orders => {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders,
        isAuthenticated: req.session.isLoggedIn
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getInvoice = async (req, res, next) => {
  try{
    const orderId = req.params.orderId;
    const order = await Order.findById(orderId)
    if(!order){
      console.log(1)
      return next(new Error('No order Found '));
    }
    if(order.user.userId.toString() !== req.user._id.toString()){
      console.log(3)
      return next(new Error('Unauthorized'));
    }
    const invoiceName = "invoice-" + orderId + '.pdf';
    const invoicePath = path.join('data', 'invoices', invoiceName);

    const pdfDoc = new pdfkit();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"');

    const writeStream = fs.createWriteStream(invoicePath);
    pdfDoc.pipe(writeStream);
    pdfDoc.pipe(res);

    pdfDoc.fontSize(26).text('Invoice', {
      underline: true
    });
    pdfDoc.text('---------------------------');
    let totalPrice = 0;
    order.products.forEach(prod => {
      totalPrice += prod.quantity * prod.product.price;
      pdfDoc.fontSize(14).text(prod.product.title + ' - ' + prod.quantity + ' x ' + '$' + prod.product.price)
    });

    pdfDoc.text('---------------------------');
    pdfDoc.fontSize(20).text('Total Price: $' + totalPrice);

    pdfDoc.end();
  }catch(err){
    console.log(err)
    next(err)
  }
  
}
