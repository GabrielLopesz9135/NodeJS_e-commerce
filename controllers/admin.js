const Product = require('../models/product');

exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    edit: false
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const imageUrl = req.body.imageUrl;
  const price = req.body.price;
  const description = req.body.description;
  console.log(req.user)
  req.user.createProduct({
    title: title,
    imageUrl: imageUrl,
    price: price,
    description: description,
  })
  .then(result => {
    //console.log(result);
    res.redirect('/admin/products')
  }).catch(err => console.log(err))
};

exports.getEditProduct = (req, res, next) => {
  const productId = req.params.productId;
  Product.findOne({where: {id: productId}})
    .then(product => {
      res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',
        product: product,
        edit: true
      })
    })
    .catch(err => console.log(err))
};

exports.postEditProduct = (req, res, next) => {
  const productId = req.body.productId;
  const title = req.body.title;
  const imageUrl = req.body.imageUrl;
  const description = req.body.description;
  const price = req.body.price;

  Product.findByPk(productId)
    .then(product => {
      product.title = title
      product.imageUrl = imageUrl
      product.description = description
      product.price = price
      return product.save();
    })
    .then(result => {
      console.log('UPDATED PRODUCT')
      res.redirect('/admin/products')
    })
    .catch(err => console.log(err))
}

exports.postDeleteProduct = (req, res, next) => {
  const productId = req.params.productId;
  Product.findByPk(productId)
    .then(product => {
      return product.destroy();
    })
    .then(result => {
      res.redirect('/admin/products')
    })
    .catch(err => console.log(err));
}

exports.getProducts = (req, res, next) => {
  req.user.getProducts()
    .then(products => {
      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products'
      });
    })
    .catch(err => console.log(err));
};
