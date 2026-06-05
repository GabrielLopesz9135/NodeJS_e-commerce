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
  const product = new Product({ title: title, price: price, description: description, imageUrl: imageUrl, userId: req.user });
  product.save()
    .then(result => {
      res.redirect('/admin/products')
    }).catch(err => console.log(err))
};

exports.getEditProduct = (req, res, next) => {
  const productId = req.params.productId;
  Product.findById(productId)
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

exports.postEditProduct = async (req, res, next) => {
  const productId = req.body.productId;
  const title = req.body.title;
  const imageUrl = req.body.imageUrl;
  const description = req.body.description;
  const price = req.body.price;

  try {
    const result = await Product.updateOne(
      { _id: productId },
      {
        $set: {
          title: title,
          price: price,
          description: description,
          imageUrl: imageUrl
        }
      }
    );
    res.redirect('/admin/products');
  } catch (err) {
    console.log(err);
  }
}

exports.postDeleteProduct = (req, res, next) => {
  const productId = req.params.productId;
  Product.findByIdAndDelete(productId)
    .then(() => {
      res.redirect('/admin/products')
    })
    .catch(err => console.log(err));
}

exports.getProducts = (req, res, next) => {
  Product.find()
    .then(products => {
      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products'
      });
    })
    .catch(err => console.log(err));
};