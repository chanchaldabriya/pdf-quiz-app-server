const express = require('express');
const cors = require('cors');
const multer = require('multer');
const url = require('url');

const { getQuestionsFromPdf, getAnswersFromPdf } = require('./pdfParser');
const { deleteFile } = require('./common');

// const upload = multer({});
const upload = multer({ dest: './uploads' });

const app = express();
const port = 4000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// app.get('/', (req, res) => {
//     res.send('Hello World!');
// });

// app.get('/parsePdf', (req, res) => {
//     getQuestionsFromPdf((parsedQuestions) => {
//         console.log(parsedQuestions.length);
//         res.send(parsedQuestions);
//     });
// });

// app.get('/parsePdf', async (req, res) => {
//     const parsedQuestions = await getQuestionsFromPdf();
//     console.log(parsedQuestions.length);
//     res.send(parsedQuestions);
// });

app.post('/parseQuestions', upload.any(), async (req, res) => {
  const file = req.files[0];

  const queryObject = url.parse(req.url, true).query;

  const parsedQuestions = await getQuestionsFromPdf(file.path, queryObject);
  // console.log(parsedQuestions.length);
  res.send(parsedQuestions);

  // delete file create by multer
  deleteFile(file.path);
});

app.post('/parseAnswers', upload.any(), async (req, res) => {
  const file = req.files[0];
  
  const queryObject = url.parse(req.url, true).query;

  const parsedQuestions = await getAnswersFromPdf(file.path, queryObject);
  // console.log(parsedQuestions.length);
  res.send(parsedQuestions);

  // delete file create by multer
  deleteFile(file.path);
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});