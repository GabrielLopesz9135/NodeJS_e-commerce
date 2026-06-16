
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrderSchema = Schema({
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    items: [{
      product: {
        type: Object,
        required: true
      },
      quantity: {
        type: Number,
        required: true
      }
    }]
})

OrderSchema.statics.createOrder = async function (userId, items) {
  console.log('createOrder', userId, items);
  const orderItems = items.map(item => ({
    product: item.product.toObject(),
    quantity: item.quantity
  }));

  console.log('orderItems', orderItems);

  return this.create({
    userId: new mongoose.Types.ObjectId(userId),
    items: orderItems
  });
}

module.exports = mongoose.model('Order', OrderSchema)