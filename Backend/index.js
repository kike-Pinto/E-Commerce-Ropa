const port = 4000
const express = require('express')
const app = express()
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const multer = require('multer')
const path = require('path')
const cors = require('cors')

require('dotenv').config()

app.use(express.json())
app.use(cors())

// Database Connection With MongoDB
// mongoose.connect(
//   'mongodb+srv://cripintort:gGDu1cx4LpiezW9G@cluster0.rifehae.mongodb.net/E-commerce-Ropa'
// )

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB')
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error)
  })

// API Creation
app.get('/', (req, res) => {
  res.send('Express App is Running')
})

app.listen(port, (error) => {
  if (!error) {
    console.log('Server Running on PORT ' + port)
  } else {
    console.log('Error: ' + error)
  }
})

// Image Storage Engine
const storage = multer.diskStorage({
  destination: './upload/images',
  filename: (req, file, cb) => {
    return cb(
      null,
      `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`
    )
  },
})

const upload = multer({ storage: storage })

// Creating Upload Endpoint for images
app.use('/images', express.static('upload/images'))

app.post('/upload', upload.single('product'), (req, res) => {
  res.json({
    success: 1,
    image_url: `http://localhost:${port}/images/${req.file.filename}`,
  })
})

// Schema for Creating Products
const Product = mongoose.model('Product', {
  id: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  new_price: {
    type: Number,
    required: true,
  },
  old_price: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  available: {
    type: Boolean,
    default: true,
  },
})

app.post('/addproduct', async (req, res) => {
  let products = await Product.find({})
  let id
  if (products.length > 0) {
    let last_product_array = products.slice(-1)
    let last_product = last_product_array[0]
    id = last_product.id + 1
  } else {
    id = 1
  }

  const product = new Product({
    id: id,
    name: req.body.name,
    image: req.body.image,
    category: req.body.category,
    new_price: req.body.new_price,
    old_price: req.body.old_price,
  })
  console.log(product)
  await product.save()
  console.log('Saved')
  res.json({
    success: true,
    name: req.body.name,
  })
})

// Creating API for Deleting Products
app.post('/removeproduct', async (req, res) => {
  await Product.findOneAndDelete({ id: req.body.id })
  console.log('Removed')
  res.json({
    success: true,
    name: req.body.name,
  })
})

// Creating API for get all Products
app.get('/allproducts', async (req, res) => {
  let products = await Product.find({})
  console.log('All Products Fetched')
  res.send(products)
})

// Schema Creating for user model
const Users = mongoose.model('Users', {
  name: {
    type: String,
  },
  email: {
    type: String,
    unique: true,
  },
  password: {
    type: String,
  },
  cartData: {
    type: Object,
  },
  date: {
    type: Date,
    default: Date.now,
  },
})

// Creating Endpoint for registering the user
app.post('/signup', async (req, res) => {
  let check = await Users.findOne({ email: req.body.email })
  if (check) {
    return res.status(400).json({
      success: false,
      errors: 'existing user found with same email address',
    })
  }
  let cart = {}
  for (let i = 0; i < 300; i++) {
    cart[i] = 0
  }
  const user = new Users({
    name: req.body.username,
    email: req.body.email,
    password: req.body.password,
    cartData: cart,
  })
  await user.save()

  const data = {
    user: {
      id: user.id,
    },
  }
  const token = jwt.sign(data, 'secret_ecom')
  res.json({ success: true, token })
})

// Creating Endpoint for user login
app.post('/login', async (req, res) => {
  let user = await Users.findOne({ email: req.body.email })
  if (user) {
    const passCompare = req.body.password === user.password
    if (passCompare) {
      const data = {
        user: {
          id: user.id,
        },
      }
      const token = jwt.sign(data, 'secret_ecom')
      res.json({ success: true, token })
    } else {
      res.json({ success: false, errors: 'Wrong password' })
    }
  } else {
    res.json({ success: false, errors: 'Wrong email Id' })
  }
})

// Creating Endpoint for newCollection data
app.get('/newcollections', async (req, res) => {
  let products = await Product.find({})
  let newCollection = products.slice(1).slice(-8)
  console.log('NewCollection Fetched')
  res.send(newCollection)
})

// Creating endpoint for popular in women section
app.get('/popularwomen', async (req, res) => {
  let products = await Product.find({ category: 'women' })
  let popular_women = products.slice(0, 4)
  console.log('Popular Women fetched')
  res.send(popular_women)
})

// Creating middleware to fetch user
const fetchUser = async (req, res, next) => {
  const token = req.header('auth-token')
  if (!token) {
    res.status(401).send({ errors: 'Please authenticate using valid token' })
  } else {
    try {
      const data = jwt.verify(token, 'secret_ecom')
      req.user = data.user
      next()
    } catch (error) {
      res
        .status(401)
        .send({ errors: 'Please authenticate using a valid token' })
    }
  }
}

app.post('/addtocart', fetchUser, async (req, res) => {
  console.log('Added', req.body.itemId)
  try {
    let userData = await Users.findOne({ _id: req.user.id })

    if (!userData) {
      return res.status(404).send('User not found')
    }

    // Check if cartData exists, if not initialize it
    if (!userData.cartData) {
      userData.cartData = {}
    }

    // Check if the itemId exists in cartData, if not initialize it to 0
    if (!userData.cartData[req.body.itemId]) {
      userData.cartData[req.body.itemId] = 0
    }

    // Increment the item count
    userData.cartData[req.body.itemId] += 1

    // Update user data in the database
    await Users.findOneAndUpdate(
      { _id: req.user.id },
      { cartData: userData.cartData }
    )

    // Send response
    res.send('Added')
  } catch (error) {
    console.error(error)
    res.status(500).send('Server Error')
  }
})

// Creating Endpoint to remove product from cartData
app.post('/removefromcart', fetchUser, async (req, res) => {
  try {
    console.log('Remove', req.body.itemId)
    let userData = await Users.findOne({ _id: req.user.id })

    if (!userData) {
      return res.status(404).send('User not found')
    }

    if (userData.cartData[req.body.itemId] > 0) {
      userData.cartData[req.body.itemId] -= 1
    }

    await Users.findOneAndUpdate(
      { _id: req.user.id },
      { cartData: userData.cartData }
    )
    res.send('Removed')
  } catch (error) {
    res.status(500).send('Internal Server Error')
  }
})

// Creating endpoint to get cartData
app.post('/getcart', fetchUser, async (req, res) => {
  console.log('GetCart')
  let userData = await Users.findOne({ _id: req.user.id })
  res.json(userData.cartData)
})

// mongodb+srv://cripintort:gGDu1cx4LpiezW9G@cluster0.rifehae.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
