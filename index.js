const express = require('express');
const app = express();
const port = 5000;
const fs = require('fs');
const cors = require('cors');
const formData = require('express-form-data');
const fileupload = require('express-fileupload');
app.use(fileupload());
var bodyParser = require('body-parser');
app.use(express.static("public"));

app.listen(port, () => {
  console.log(`app listening at http://localhost:${port}`);
});

var AWS = require('aws-sdk');
const { title } = require('process');

app.use(cors({ credentials: true, origin: 'http://localhost:3000' }));
let awsConfig = {
  region: 'ap-south-1',
  endpont: 'http://localhost:5000',
  accessKeyId: 'AKIA2HFJ2UPFSZ7X7WF5',
  secretAccessKey: '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',
};

AWS.config.update(awsConfig);

var dynamodb = new AWS.DynamoDB();
var docClient = new AWS.DynamoDB.DocumentClient();

//Upload post Api

app.post('/UploadPostContent',async (req, res) => {
  console.log('called', req.files);
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }
  var sampleFile = req.files.file.name;
  console.log('pppppppp', sampleFile);
  // var path = './public/post_images' + '/' + sampleFile;
  var buf = Buffer.from(req.files.file.data, 'base64');
  // fs.writeFile(path, buf, function (err) {
  //   console.log(err);
  // });
  
  //s3

const region = "ap-south-1"
const bucketName = "productimage12"
const accessKeyId = "AKIA2HFJ2UPFZA4I7KDO"
const secretAccessKey ='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'

const s3 = new AWS.S3({
  region,
  accessKeyId,
  secretAccessKey,
  signatureVersion: 'v4'
})

// const fileStream = fs.createReadStream(buf)

const uploadParams = {
  Bucket: bucketName,
  Body: buf,
  Key: req.files.file.name
}

s3.upload(uploadParams).promise()


// get image from s3
const url = await s3.getSignedUrlPromise('getObject', {
  Bucket:bucketName ,
  Key: req.files.file.name,
  ResponseContentType: "image/png",
  Expires:604800
})

console.log('tis',url)

  //dynmobd

  var params = {
    TableName: 'Products',
    Item: {
      id:`${req.body.price}${req.body.title}${req.body.decription}`,
      image: url,
      title: req.body.title,
      decription: req.body.decription,
      price: req.body.price,
    },
  };
  docClient.put(params, function (err, data) {
    if (err) {
      console.log(err);
    } else {
      console.log('PutItem succeeded:');
    }
  });



});





// Get data from Dynmo db API


app.get('/getProduct', (req, res) => {

  var arr1 = new Array();

  var params = {
    TableName: 'Products',
  };

  docClient.scan(params, onScan);
  function onScan(err, data) {
    if (err) {
      console.error(
        'Unable to scan the table. Error JSON:',
        JSON.stringify(err, null, 2)
      );
    } else {
      // print all the movies
      console.log('Scan succeeded.');
      data.Items.forEach(function (movie) {
        console.log(movie);
        // res.send(movie)
        arr1.push(movie)
        console.log(arr1)
      });
      res.send(arr1);
      if (typeof data.LastEvaluatedKey != 'undefined') {
        console.log('Scanning for more...');
        params.ExclusiveStartKey = data.LastEvaluatedKey;
        docClient.scan(params, onScan);
      }
    }
  }
 
});


// Api for preticular products

app.post('/getsingleitem',(req,res)=>{

  console.log('ggg',req.query.id)

  var params = {
    TableName: 'Products',
    Key:{
       "id":req.query.id
    }
  };

  docClient.get(params, function(err, data) {
    if (err) {
        console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
        res.send(data)
    }
});

})




// // API for fiter Data ------------




// // Tried with and without this. Since s3 is not region-specific, I don't
// // think it should be necessary.
// // AWS.config.update({region: 'us-west-2'})
// const getURL=async()=>{
// const imageName = 'IMG_20191111_222819.jpg'

//   const params = ({
//     Bucket: bucketName,
//     Key: imageName,
//     Expires: 60*10
//   })
  
//   const uploadURL =  await s3.getSignedUrlPromise('putObject', params)
//   console.log(uploadURL)

    

// }
// getURL()