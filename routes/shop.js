const path = require('path');

const express = require('express');

const shopController = require('../controllers/shop');

const router = express.Router();

router.get('/', shopController.getIndex);

router.get('/products', shopController.getProducts);

router.get('/cart', shopController.getCart);
router.post('/cart', shopController.saveCart);

router.get('/orders', shopController.getOrders);

router.get('/checkout', shopController.getCheckout);

router.get('/product/:productId', shopController.getProduct)

router.post('/cart-delete-item', shopController.deleteItemCart)

module.exports = router;
