const express = require('express');
const app = express();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

app.use(express.static(path.join(__dirname, 'assets')));
app.use('/rental-catalogue', express.static(path.join(__dirname, 'assets')));
app.use(express.urlencoded({ extended: true }));

//******************************************
//Express-handlebars config
//******************************************
const exphbs = require('express-handlebars');

app.engine(
  '.hbs',
  exphbs.engine({
    extname: '.hbs',
    helpers: {
      json: (context) => {
        return JSON.stringify(context);
      },
    },
  })
);

app.set('view engine', '.hbs');

//******************************************
//PORT
//******************************************
const HTTP_PORT = process.env.PORT || 8080;

//******************************************
//Database
//******************************************

const itemsList = [
  {
    itemId: uuidv4(),
    name: 'Acer A4581 Laptop',
    img: 'img/acer-notebook.jpg',
    minRental: 14,
    isRented: false,
  },
  {
    itemId: uuidv4(),
    name: 'Apple iPhone 14 Plus',
    img: 'img/apple-iphone14plus.jpg',
    minRental: 7,
    isRented: false,
  },
  {
    itemId: uuidv4(),
    name: 'Google Pixel Phone',
    img: 'img/google-pixel.jpg',
    minRental: 30,
    isRented: false,
  },
  {
    itemId: uuidv4(),
    name: 'JBL Headphone',
    img: 'img/jbl-headphone.jpg',
    minRental: 2,
    isRented: false,
  },
  {
    itemId: uuidv4(),
    name: 'Apple MacBook Pro 13"',
    img: 'img/macbook-pro-13inch.jpg',
    minRental: 2,
    isRented: false,
  },
  {
    itemId: uuidv4(),
    name: 'Samsung Flip Phone',
    img: 'img/samsung-flip.jpg',
    minRental: 2,
    isRented: false,
  },
];

//******************************************
//Endpoints
//******************************************

//--- GET ---*/
app.get('/', (req, res) => {
  res.render('home', {
    layout: 'primary',
    items: generateRandomItems(itemsList, 3),
  });
});

app.get('/rental-catalogue', (req, res) => {
  res.render('rental-catalogue', { layout: 'primary', items: itemsList });
});

/*--- POST ---*/
app.post('/search', (req, res) => {
  const keyword = req.body.keyword;
  // split each word from entered keyword using split(' ')
  const keywordArr = keyword.split(' ');
  let matchedResults = [];

  for (let i = 0; i < keywordArr.length; i++) {
    for (let j = 0; j < itemsList.length; j++) {
      const itemName = itemsList[j].name.toLowerCase();
      if (itemName.includes(keywordArr[i].toLowerCase())) {
        matchedResults.push(itemsList[j]);
      }
    }
  }

  if (matchedResults[0]) {
    return res.render('rental-catalogue', {
      layout: 'primary',
      items: matchedResults,
    });
  } else {
    return res.render('error', { layout: 'primary', err: 'No items found!' });
  }
});

app.post('/rental-catalogue/:id', (req, res) => {
  const id = req.params.id;
  const numDays = parseInt(req.body.numDays);

  // 1. SERARCH for the item
  let position = -1;
  for (let i = 0; i < itemsList.length; i++) {
    if (itemsList[i].itemId === id) {
      // this means you found the item
      position = i;
      // found the item so no need to keep searching
      break;
    }
  }
  // 2. Logic for updating the items & handling errors
  if (position === -1) {
    return res.render('error', {
      layout: 'primary',
      err: 'This item can not be found!',
    });
  } else {
    // updating the item status
    if (numDays >= itemsList[position].minRental) {
      itemsList[position].isRented = true;
      // generating a list of rented items
      let rentedItems = [];
      for (let i = 0; i < itemsList.length; i++) {
        if (itemsList[i].isRented === true) {
          rentedItems.push(itemsList[i]);
        }
      }
      // output to the screen
      return res.render('rental-catalogue', {
        layout: 'primary',
        items: rentedItems,
      });
    } else {
      return res.render('error', {
        layout: 'primary',
        err: 'You did not meet the minimum requirement!',
      });
    }
  }
});

app.post('/filter', (req, res) => {
  let results = [];
  const filter = req.body.results;

  switch (filter) {
    case 'rented-items':
      results = getRentedItems(itemsList);
      if (results[0]) {
        return res.render('rental-catalogue', {
          layout: 'primary',
          items: results,
        });
      } else {
        return res.render('error', {
          layout: 'primary',
          err: 'Your rental list is empty!',
        });
      }
      break;
    case 'available-items':
      results = getAvailableItems(itemsList);
      if (results[0]) {
        return res.render('rental-catalogue', {
          layout: 'primary',
          items: results,
        });
      } else {
        return res.render('error', {
          layout: 'primary',
          err: "There's no more item to rent!",
        });
      }
      break;
    default:
      return res.render('rental-catalogue', {
        layout: 'primary',
        items: itemsList,
      });
  }
});

app.post('/return', (req, res) => {
  let isRentedEmpty = checkRentedItems(itemsList);

  if (!isRentedEmpty) {
    itemsList.forEach((item) => {
      item.isRented = false;
    });
    return res.render('rental-catalogue', {
      layout: 'primary',
      items: itemsList,
    });
  } else {
    return res.render('error', {
      layout: 'primary',
      err: 'You do not have any item to return!',
    });
  }
});

//******************************************
//Helper functions
//******************************************

const generateRandomItems = (listOfItems, numOfItems) => {
  let newList = [];
  for (let i = 0; i < numOfItems; i++) {
    newList[i] = listOfItems[Math.floor(Math.random() * listOfItems.length)];
  }
  return newList;
};

const checkRentedItems = (itemsList) => {
  let isEmpty = true;
  for (let i = 0; i < itemsList.length && isEmpty; i++) {
    if (itemsList[i].isRented) isEmpty = false;
  }
  return isEmpty;
};

const getRentedItems = (itemsList) => {
  let rentedItems = [];
  for (let i = 0; i < itemsList.length; i++) {
    if (itemsList[i].isRented) {
      rentedItems.push(itemsList[i]);
    }
  }
  return rentedItems;
};

const getAvailableItems = (itemsList) => {
  let availItems = [];
  for (let i = 0; i < itemsList.length; i++) {
    if (!itemsList[i].isRented) {
      availItems.push(itemsList[i]);
    }
  }
  return availItems;
};

const httpOnStart = () => {
  console.log(`Server is starting on port ${HTTP_PORT}...`);
  console.log('Press Ctrl+C to cancel');
};

app.listen(HTTP_PORT, httpOnStart);
