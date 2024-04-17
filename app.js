require('dotenv').config();

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const shopRouter = require('./routes/shop');
const authRouter = require('./routes/auth');
const flash = require('connect-flash');
const app = express();
const MongoDBStore = require('connect-mongodb-session')(session);
const Cart = require('./models/cart');
const Product = require('./models/product');
const compression = require('compression');
const productCategory = require('./models/productCategory');
const Label = require('./models/label');

app.use(compression());
mongoose.set('useCreateIndex', true);

const urlConnect = process.env.DB;

// Connect to database
mongoose.connect('mongodb://127.0.0.1:27017/HetCuu', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Kết nối thành công");
  })
  .catch((err) => {
    console.error("Lỗi kết nối:", err);
  });

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(flash());
app.use(
  session({
    secret: 'notsecret',
    saveUninitialized: true,
    resave: false,
    store: new MongoDBStore({ uri: process.env.DB, collection: 'sessions' }),
    cookie: { maxAge: 180 * 60 * 1000 }
  })
);

app.use((req, res, next) => {
  var cart = new Cart(req.session.cart ? req.session.cart : {});
  req.session.cart = cart;
  res.locals.session = req.session;
  next();
});
app.use(passport.initialize());
app.use(passport.session());

app.use(shopRouter);
app.use(authRouter);

// pass passport for configuration
require('./config/passport')(passport);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  var cartProduct;
  if (!req.session.cart) {
    cartProduct = null;
  } else {
    var cart = new Cart(req.session.cart);
    cartProduct = cart.generateArray();
  }
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error', { cartProduct: cartProduct });
});
async function generateDummyData() {
  try {
    // Tạo danh mục sản phẩm cứng
    // const categories = await productCategory.create([
    //   { name: 'Áo thun', childName: ['Nam', 'Nữ'] },
    //   { name: 'Áo hoodie', childName: ['Nam', 'Nữ'] },
    //   Thêm các danh mục khác nếu cần
    // ]);

    // Tạo nhãn cứng
    const labels = await Label.create({ list: ['Shiro', 'Label2', 'Label3'] });

    // Tạo sản phẩm cứng
    const products = await Product.create([
      {
        name: 'Áo thun nam màu đen',
        description: 'Mô tả cho sản phẩm áo thun nam màu đen',
        stock: 50,
        price: 100000,
        size: ['S', 'M', 'L'],
        productType: { main: 'Áo thun', sub: 'Nam' },
        color: ['Đen'],
        ofSellers: {
          userId: "661fb8eb9614b72b80e6ad2f",
          name: 'Toi'
        },
        images: ['product-01-01.jpg', 'product-01-02.jpg'],
        materials: ['Cotton'],
        labels: 'Shiro'
        // Thêm các thông tin khác nếu cần
      },
      {
        name: 'Áo hoodie nữ màu hồng',
        description: 'Mô tả cho sản phẩm áo hoodie nữ màu hồng',
        stock: 30,
        price: 150000,
        size: ['S', 'M', 'L'],
        productType: { main: 'Áo hoodie', sub: 'Nữ' },
        ofSellers: {
          userId: "661fb8eb9614b72b80e6ad2f",
          name: 'Toi'
        },
        color: ['Hồng'],
        images: ['product-42-01.jpg', 'product-42-02.jpg'],
        materials: ['Polyester'],
        labels: 'Shiro'
        // Thêm các thông tin khác nếu cần
      },
      // Thêm các sản phẩm khác nếu cần
    ]);

    console.log('Dữ liệu cứng đã được tạo thành công.');
  } catch (error) {
    console.error('Đã xảy ra lỗi khi tạo dữ liệu cứng:', error);
  }
}

// Gọi hàm để tạo dữ liệu cứng
// generateDummyData();

module.exports = app;
